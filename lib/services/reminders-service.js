import { supabaseAdmin } from '../supabase/admin.js';

/**
 * Get signature reminders with optional filters
 */
export async function getSignatureReminders(filters = {}) {
  let query = supabaseAdmin
    .from('signature_reminders')
    .select('*')
    .order('days_late', { ascending: false });

  if (filters.priority && filters.priority !== 'all') {
    query = query.eq('priority', filters.priority);
  }

  if (filters.sessionStatus && filters.sessionStatus !== 'all') {
    query = query.eq('session_status', filters.sessionStatus);
  }

  if (filters.year) {
    const year = parseInt(filters.year, 10);
    const start = `${year}-01-01`;
    const end = `${year}-12-31`;
    // Include rows where slot_date is NULL OR falls within the year
    query = query.or(`slot_date.is.null,and(slot_date.gte.${start},slot_date.lte.${end})`);
  }

  if (filters.search) {
    const search = filters.search.toLowerCase();
    query = query.or(
      `full_name.ilike.%${search}%,email.ilike.%${search}%,session_name.ilike.%${search}%`
    );
  }

  const { data, error } = await query;
  if (error) throw new Error(`Reminders query error: ${error.message}`);
  return data || [];
}

/**
 * Add a reminder history entry
 */
export async function addReminderHistory(payload) {
  const { data, error } = await supabaseAdmin
    .from('reminder_history')
    .insert({
      reminder_id: payload.reminderId,
      session_id: payload.sessionId || null,
      trainee_id: payload.traineeId || null,
      slot_id: payload.slotId || null,
      action_type: payload.actionType || 'manual_reminder',
      channel: payload.channel || null,
      message: payload.message || null,
      created_by: payload.createdBy || 'Australe Formation',
    })
    .select()
    .single();

  if (error) throw new Error(`Reminder history error: ${error.message}`);
  return data;
}

/**
 * Get reminder history summary (count per reminder_id)
 */
export async function getReminderHistorySummary() {
  const { data, error } = await supabaseAdmin
    .from('reminder_history')
    .select('reminder_id');

  if (error) throw new Error(`Reminder history summary error: ${error.message}`);

  const counts = {};
  for (const row of data || []) {
    counts[row.reminder_id] = (counts[row.reminder_id] || 0) + 1;
  }
  return counts;
}
