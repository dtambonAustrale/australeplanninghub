import { finishSync } from '../../../../../lib/services/sync-service.js';

export async function POST(request) {
  try {
    const body = await request.json();

    if (!body.syncRunId) {
      return Response.json({ success: false, error: 'syncRunId is required' }, { status: 400 });
    }

    await finishSync(body.syncRunId);

    return Response.json({ success: true });
  } catch (err) {
    console.error('[API /sync/finish]', err.message);
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
