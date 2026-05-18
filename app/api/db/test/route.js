import { supabaseAdmin } from '../../../../lib/supabase/admin.js';

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin.rpc('now');

    if (error) {
      // Fallback: try a simple select
      const { data: d2, error: e2 } = await supabaseAdmin
        .from('sync_runs')
        .select('id')
        .limit(1);

      if (e2) {
        return Response.json({ success: false, error: e2.message }, { status: 500 });
      }

      return Response.json({
        success: true,
        database: 'connected',
        now: new Date().toISOString(),
      });
    }

    return Response.json({
      success: true,
      database: 'connected',
      now: data || new Date().toISOString(),
    });
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
