import { syncBatch } from '../../../../../lib/services/sync-service.js';

// Vercel: allow up to 300s (Pro plan) — on Hobby the cap is 60s
export const maxDuration = 300;
export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const body = await request.json();

    if (!body.syncRunId) {
      return Response.json({ success: false, error: 'syncRunId is required' }, { status: 400 });
    }
    if (!Array.isArray(body.sessionIds) || body.sessionIds.length === 0) {
      return Response.json({ success: false, error: 'sessionIds array is required' }, { status: 400 });
    }

    const result = await syncBatch(body.syncRunId, body.sessionIds, {
      targetYear: body.targetYear,
      pipelineState: body.pipelineState,
      concurrency: body.concurrency ?? 1,
      pauseMs: body.pauseMs ?? 500,
    });

    return Response.json({
      success: true,
      syncedSessions: result.syncedSessions,
      errors: result.errors,
    });
  } catch (err) {
    console.error('[API /sync/batch]', err.message);
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
