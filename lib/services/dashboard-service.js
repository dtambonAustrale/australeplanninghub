import { supabaseAdmin } from '../supabase/admin.js';

/**
 * Get dashboard summary stats from Supabase
 */
export async function getDashboardStats() {
  const [planningStats, reminderStats, lastSync] = await Promise.all([
    getPlanningStats(),
    getReminderStats(),
    getLastSync(),
  ]);

  return { planning: planningStats, reminders: reminderStats, lastSync };
}

async function getPlanningStats() {
  const { data, error } = await supabaseAdmin
    .from('planning_results')
    .select('status_code');

  if (error) throw new Error(`Planning stats error: ${error.message}`);

  const rows = data || [];
  return {
    totalLearners: rows.length,
    totalOk: rows.filter((r) => r.status_code === 'ok').length,
    totalMissing: rows.filter((r) => r.status_code === 'missing').length,
    totalWarning: rows.filter((r) => r.status_code === 'warning').length,
  };
}

async function getReminderStats() {
  const { data, error } = await supabaseAdmin
    .from('signature_reminders')
    .select('priority');

  if (error) throw new Error(`Reminder stats error: ${error.message}`);

  const rows = data || [];
  return {
    totalReminders: rows.length,
    totalCritical: rows.filter((r) => r.priority === 'critical').length,
    totalHigh: rows.filter((r) => r.priority === 'high').length,
    totalNormal: rows.filter((r) => r.priority === 'normal').length,
  };
}

async function getLastSync() {
  const { data } = await supabaseAdmin
    .from('sync_runs')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(1)
    .single();

  return data || null;
}
