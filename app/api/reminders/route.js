import { getSignatureReminders } from '../../../lib/services/reminders-service.js';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const filters = {
      year: searchParams.get('year'),
      priority: searchParams.get('priority'),
      sessionStatus: searchParams.get('pipelineState'),
      search: searchParams.get('search'),
    };

    const data = await getSignatureReminders(filters);
    return Response.json({ success: true, data, total: data.length });
  } catch (err) {
    console.error('[API /reminders]', err.message);
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
