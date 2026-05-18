import { supabaseAdmin } from '../../../../lib/supabase/admin.js';
import { sendBulkReminderEmails } from '../../../../lib/services/email-service.js';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function POST(request) {
  try {
    const body = await request.json();
    const { reminderIds, createdBy = 'Australe Formation' } = body;

    if (!Array.isArray(reminderIds) || reminderIds.length === 0) {
      return Response.json(
        { success: false, error: 'reminderIds (array) est requis' },
        { status: 400 }
      );
    }

    // Fetch all reminders
    const { data: reminders, error: fetchError } = await supabaseAdmin
      .from('signature_reminders')
      .select('*')
      .in('id', reminderIds);

    if (fetchError) throw new Error(fetchError.message);
    if (!reminders || reminders.length === 0) {
      return Response.json({ success: false, error: 'Aucune relance trouvée' }, { status: 404 });
    }

    const withEmail = reminders.filter((r) => r.email);
    if (withEmail.length === 0) {
      return Response.json(
        {
          success: false,
          error: 'Aucun apprenant avec adresse email dans la sélection',
          skipped: reminders.length,
        },
        { status: 422 }
      );
    }

    // Send bulk
    const result = await sendBulkReminderEmails(withEmail);

    // Log sent reminders to reminder_history
    if (result.sent > 0) {
      const historyRows = withEmail.map((r) => ({
        reminder_id: r.id,
        session_id: r.session_id,
        trainee_id: r.trainee_id,
        slot_id: r.slot_id,
        action_type: 'email_sent',
        channel: 'email',
        message: r.email_message,
        created_by: createdBy,
      }));
      await supabaseAdmin.from('reminder_history').insert(historyRows);
    }

    return Response.json({
      success: true,
      sent: result.sent,
      skipped: result.skipped + (reminders.length - withEmail.length),
      errors: result.errors,
    });
  } catch (err) {
    console.error('[API /reminders/send-bulk]', err.message);
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
