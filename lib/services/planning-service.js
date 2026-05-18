import { supabaseAdmin } from '../supabase/admin.js';

/**
 * Get planning results with optional filters
 */
export async function getPlanningResults(filters = {}) {
  let query = supabaseAdmin
    .from('planning_results')
    .select('*')
    .order('session_start_date', { ascending: true });

  if (filters.statusCode && filters.statusCode !== 'all') {
    query = query.eq('status_code', filters.statusCode);
  }

  if (filters.sessionStatus && filters.sessionStatus !== 'all') {
    query = query.eq('session_status', filters.sessionStatus);
  }

  if (filters.year) {
    const year = parseInt(filters.year, 10);
    const start = `${year}-01-01`;
    const end = `${year}-12-31`;
    // Filter by start_date only — sessions ending in a later year (ex. 2026/2027) must not be excluded.
    // Rows with null start_date are always included (data synced before date was available).
    query = query.or(
      `session_start_date.is.null,and(session_start_date.gte.${start},session_start_date.lte.${end})`
    );
  }

  if (filters.search) {
    const search = filters.search.toLowerCase();
    query = query.or(
      `full_name.ilike.%${search}%,email.ilike.%${search}%,session_name.ilike.%${search}%`
    );
  }

  const { data, error } = await query;
  if (error) throw new Error(`Planning query error: ${error.message}`);
  return data || [];
}
