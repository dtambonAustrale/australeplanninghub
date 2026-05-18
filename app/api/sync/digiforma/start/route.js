import { startSync } from '../../../../../lib/services/sync-service.js';

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));

    const options = {
      targetYear: body.targetYear || parseInt(process.env.DIGIFORMA_TARGET_YEAR || '2026', 10),
      pipelineState: body.pipelineState || process.env.DIGIFORMA_ACTIVE_PIPELINE_STATE || 'ongoing',
      onlyActive: body.onlyActive !== undefined ? body.onlyActive : true,
      maxSessions: body.maxSessions || 50,
    };

    const result = await startSync(options);

    return Response.json({
      success: true,
      syncRunId: result.syncRunId,
      sessions: result.sessions,
      totalSessions: result.totalSessions,
    });
  } catch (err) {
    console.error('[API /sync/start]', err.message);
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
