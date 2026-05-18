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
    query = query
      .gte('session_start_date', `${year}-01-01`)
      .lte('session_end_date', `${year}-12-31`);
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
