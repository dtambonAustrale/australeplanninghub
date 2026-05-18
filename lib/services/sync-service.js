import { supabaseAdmin } from '../supabase/admin.js';
import { fetchTrainingSessionsLight, fetchTrainingSessionDetails } from '../digiforma/digiforma-client.js';
import { mapSessionFull, mapTrainee, mapSlot, getSignedTraineeIds } from '../digiforma/mappers.js';
import { computeDaysLate, isSlotInPast } from '../utils/dates.js';
import { buildCompositeId, buildFullName } from '../utils/normalize.js';

/**
 * Start a sync run: fetch light sessions, create sync_run record
 */
export async function startSync(options = {}) {
  const targetYear = options.targetYear || parseInt(process.env.DIGIFORMA_TARGET_YEAR || '2026', 10);
  const pipelineState = options.pipelineState || process.env.DIGIFORMA_ACTIVE_PIPELINE_STATE || 'ongoing';
  const onlyActive = options.onlyActive !== undefined ? options.onlyActive : true;
  const maxSessions = options.maxSessions || 50;

  // Fetch light sessions from Digiforma
  const rawSessions = await fetchTrainingSessionsLight({ targetYear, maxSessions: maxSessions * 2 });

  // Filter server-side
  let sessions = rawSessions;
  if (onlyActive && pipelineState) {
    sessions = sessions.filter((s) => s.pipelineState === pipelineState);
  }
  sessions = sessions.slice(0, maxSessions);

  // Create sync_run record
  const { data: syncRun, error } = await supabaseAdmin
    .from('sync_runs')
    .insert({
      target_year: targetYear,
      pipeline_state: pipelineState,
      total_sessions_fetched: sessions.length,
      status: 'running',
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create sync run: ${error.message}`);

  return {
    syncRunId: syncRun.id,
    sessions: sessions.map((s) => ({ id: s.id, name: s.name })),
    totalSessions: sessions.length,
  };
}

/**
 * Sync a batch of sessions
 */
export async function syncBatch(syncRunId, sessionIds, options = {}) {
  const errors = [];
  let syncedSessions = 0;

  for (const sessionId of sessionIds) {
    try {
      const details = await fetchTrainingSessionDetails(sessionId);
      if (!details) {
        errors.push({ sessionId, error: 'Session details not found' });
        continue;
      }

      await syncTrainingSession(details);
      syncedSessions++;
    } catch (err) {
      console.error(`[SyncBatch] Error syncing session ${sessionId}:`, err.message);
      errors.push({ sessionId, error: err.message });
    }
  }

  // Update sync_run counters
  const { data: current } = await supabaseAdmin
    .from('sync_runs')
    .select('total_sessions_synced, total_errors')
    .eq('id', syncRunId)
    .single();

  await supabaseAdmin
    .from('sync_runs')
    .update({
      total_sessions_synced: (current?.total_sessions_synced || 0) + syncedSessions,
      total_errors: (current?.total_errors || 0) + errors.length,
    })
    .eq('id', syncRunId);

  return { syncedSessions, errors };
}

/**
 * Finish a sync run
 */
export async function finishSync(syncRunId) {
  const { error } = await supabaseAdmin
    .from('sync_runs')
    .update({
      finished_at: new Date().toISOString(),
      status: 'completed',
    })
    .eq('id', syncRunId);

  if (error) throw new Error(`Failed to finish sync run: ${error.message}`);
  return { success: true };
}

/**
 * Sync a single training session into Supabase
 */
export async function syncTrainingSession(sessionDetails) {
  const sessionData = mapSessionFull(sessionDetails);

  // Upsert session
  await supabaseAdmin.from('training_sessions').upsert(sessionData, { onConflict: 'id' });

  const trainees = sessionDetails.trainees || [];
  const slots = sessionDetails.trainingSessionSlots || [];

  // Upsert trainees
  if (trainees.length > 0) {
    const traineeRows = trainees.map(mapTrainee);
    await supabaseAdmin.from('trainees').upsert(traineeRows, { onConflict: 'id' });

    // Upsert session_trainees
    const sessionTraineeRows = traineeRows.map((t) => ({
      session_id: sessionData.id,
      trainee_id: t.id,
    }));
    await supabaseAdmin.from('session_trainees').upsert(sessionTraineeRows, { onConflict: 'session_id,trainee_id' });
  }

  // Upsert slots
  if (slots.length > 0) {
    const slotRows = slots.map((s) => mapSlot(s, sessionData.id));
    await supabaseAdmin.from('training_session_slots').upsert(slotRows, { onConflict: 'id' });

    // Upsert slot_trainees
    const slotTraineeRows = [];
    for (const slot of slots) {
      const signedIds = getSignedTraineeIds(slot);
      const ctList = slot.customerTrainees || [];

      if (ctList.length > 0) {
        for (const ct of ctList) {
          if (!ct.trainee?.id) continue;
          const traineeId = String(ct.trainee.id);

          // Upsert trainee if not already
          await supabaseAdmin.from('trainees').upsert(mapTrainee(ct.trainee), { onConflict: 'id' });

          slotTraineeRows.push({
            slot_id: String(slot.id),
            trainee_id: traineeId,
            customer_trainee_id: String(ct.id),
            extranet_url: ct.extranetUrl || null,
            attendance_proof_url: ct.attendanceProofUrl || null,
            has_signature: signedIds.has(traineeId),
          });
        }
      } else {
        for (const trainee of trainees) {
          const traineeId = String(trainee.id);
          slotTraineeRows.push({
            slot_id: String(slot.id),
            trainee_id: traineeId,
            customer_trainee_id: null,
            extranet_url: null,
            attendance_proof_url: null,
            has_signature: signedIds.has(traineeId),
          });
        }
      }
    }

    if (slotTraineeRows.length > 0) {
      await supabaseAdmin.from('slot_trainees').upsert(slotTraineeRows, { onConflict: 'slot_id,trainee_id' });
    }
  }

  // Compute and store planning results
  await computePlanningResults(sessionDetails);

  // Compute and store signature reminders
  await computeSignatureReminders(sessionDetails);
}

/**
 * Compute planning results for a session
 */
export async function computePlanningResults(sessionDetails) {
  const sessionId = String(sessionDetails.id);

  // Delete old results for this session
  await supabaseAdmin.from('planning_results').delete().eq('session_id', sessionId);

  const trainees = sessionDetails.trainees || [];
  const slots = sessionDetails.trainingSessionSlots || [];

  if (trainees.length === 0) return;

  const results = [];

  for (const trainee of trainees) {
    const traineeId = String(trainee.id);
    const fullName = buildFullName(trainee.firstname, trainee.lastname);
    const email = trainee.email || null;

    const slotsForTrainee = slots.filter((slot) => {
      const ctList = slot.customerTrainees || [];
      if (ctList.length > 0) {
        return ctList.some((ct) => ct.trainee?.id && String(ct.trainee.id) === traineeId);
      }
      return true;
    });

    const slotsCount = slotsForTrainee.length;
    const totalSessionSlots = slots.length;

    let statusCode = 'ok';
    let statusLabel = 'Planning OK';
    let recommendedAction = null;

    if (!email) {
      statusCode = 'warning';
      statusLabel = 'Email apprenant manquant';
      recommendedAction = 'Renseigner l\'email de l\'apprenant dans Digiforma';
    } else if (totalSessionSlots === 0) {
      statusCode = 'missing';
      statusLabel = 'Aucun créneau session';
      recommendedAction = 'Créer des créneaux de formation dans Digiforma';
    } else if (slotsCount === 0) {
      statusCode = 'missing';
      statusLabel = 'Planning manquant';
      recommendedAction = 'Ajouter l\'apprenant aux créneaux de formation';
    } else if (slotsCount < 3) {
      statusCode = 'warning';
      statusLabel = 'Planning possiblement incomplet';
      recommendedAction = 'Vérifier et compléter le planning de l\'apprenant';
    }

    results.push({
      session_id: sessionId,
      trainee_id: traineeId,
      full_name: fullName,
      email,
      session_name: sessionDetails.name || null,
      session_status: sessionDetails.pipelineState || null,
      session_start_date: sessionDetails.startDate || null,
      session_end_date: sessionDetails.endDate || null,
      slots_count: slotsCount,
      total_session_slots: totalSessionSlots,
      status_code: statusCode,
      status_label: statusLabel,
      recommended_action: recommendedAction,
    });
  }

  if (results.length > 0) {
    await supabaseAdmin
      .from('planning_results')
      .upsert(results, { onConflict: 'session_id,trainee_id' });
  }
}

/**
 * Compute signature reminders for a session
 */
export async function computeSignatureReminders(sessionDetails) {
  const sessionId = String(sessionDetails.id);

  // Delete old reminders for this session
  await supabaseAdmin.from('signature_reminders').delete().eq('session_id', sessionId);

  const trainees = sessionDetails.trainees || [];
  const slots = sessionDetails.trainingSessionSlots || [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const reminders = [];

  for (const slot of slots) {
    if (!isSlotInPast(slot.date)) continue;

    const slotId = String(slot.id);
    const signedIds = getSignedTraineeIds(slot);
    const ctList = slot.customerTrainees || [];

    const concernedTrainees = ctList.length > 0
      ? ctList.map((ct) => ({
          trainee: ct.trainee,
          customerTraineeId: String(ct.id),
          extranetUrl: ct.extranetUrl || null,
          attendanceProofUrl: ct.attendanceProofUrl || null,
        }))
      : trainees.map((t) => ({
          trainee: t,
          customerTraineeId: null,
          extranetUrl: null,
          attendanceProofUrl: null,
        }));

    for (const { trainee, customerTraineeId, extranetUrl, attendanceProofUrl } of concernedTrainees) {
      if (!trainee?.id) continue;
      const traineeId = String(trainee.id);

      if (signedIds.has(traineeId)) continue;

      const daysLate = computeDaysLate(slot.date);
      let priority = 'normal';
      if (daysLate >= 7) priority = 'critical';
      else if (daysLate >= 3) priority = 'high';

      const firstname = trainee.firstname || '';
      const lastname = trainee.lastname || '';
      const fullName = buildFullName(firstname, lastname);
      const slotDateFR = slot.date
        ? new Date(slot.date).toLocaleDateString('fr-FR')
        : '—';
      const startTime = (slot.startTime || '').slice(0, 5);
      const endTime = (slot.endTime || '').slice(0, 5);
      const sessionName = sessionDetails.name || '';
      const url = extranetUrl || '';

      const emailMessage = `Bonjour ${firstname},\n\nSauf erreur de notre part, votre émargement du ${slotDateFR} de ${startTime} à ${endTime} pour la formation "${sessionName}" n'a pas encore été signé.\n\nPouvez-vous vous connecter à votre espace apprenant Digiforma afin de régulariser votre signature, s'il vous plaît ?\n\nCette signature est importante, car elle permet de justifier officiellement votre présence en formation.\n\nLien utile : ${url}\n\nMerci d'avance pour votre retour.\n\nCordialement,\nAustrale Formation`;

      const whatsappMessage = `Bonjour ${firstname}, sauf erreur de notre part, votre émargement du ${slotDateFR} de ${startTime} à ${endTime} pour la formation "${sessionName}" n'a pas encore été signé. Pouvez-vous vous connecter à votre espace Digiforma pour le régulariser, s'il vous plaît ? Merci, Australe Formation. Lien : ${url}`;

      const reminderId = buildCompositeId(sessionId, traineeId, slotId);

      reminders.push({
        id: reminderId,
        session_id: sessionId,
        trainee_id: traineeId,
        slot_id: slotId,
        customer_trainee_id: customerTraineeId,
        full_name: fullName,
        firstname,
        lastname,
        email: trainee.email || null,
        phone: trainee.phone || null,
        session_name: sessionDetails.name || null,
        session_code: sessionDetails.code || null,
        session_status: sessionDetails.pipelineState || null,
        slot_date: slot.date || null,
        start_time: slot.startTime || null,
        end_time: slot.endTime || null,
        subsession_name: slot.subsession?.name || null,
        days_late: daysLate,
        priority,
        extranet_url: extranetUrl,
        attendance_proof_url: attendanceProofUrl,
        email_message: emailMessage,
        whatsapp_message: whatsappMessage,
        status_code: 'missing_signature',
        status_label: 'Émargement non signé',
      });
    }
  }

  if (reminders.length > 0) {
    await supabaseAdmin
      .from('signature_reminders')
      .upsert(reminders, { onConflict: 'session_id,trainee_id,slot_id' });
  }
}
