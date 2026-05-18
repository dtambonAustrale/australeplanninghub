import { getPlanningResults } from '../../../lib/services/planning-service.js';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const filters = {
      year: searchParams.get('year'),
      statusCode: searchParams.get('status'),
      sessionStatus: searchParams.get('pipelineState'),
      search: searchParams.get('search'),
    };

    const data = await getPlanningResults(filters);
    return Response.json({ success: true, data, total: data.length });
  } catch (err) {
    console.error('[API /planning]', err.message);
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
