import { supabaseAdmin } from '../../../../../../lib/supabase/admin.js';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const { data, error } = await supabaseAdmin
      .from('sync_runs')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return Response.json({ success: false, error: 'Sync run not found' }, { status: 404 });
    }

    return Response.json({ success: true, syncRun: data });
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
