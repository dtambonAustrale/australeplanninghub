import { getDashboardStats } from '../../../lib/services/dashboard-service.js';

export async function GET() {
  try {
    const stats = await getDashboardStats();
    return Response.json({ success: true, ...stats });
  } catch (err) {
    console.error('[API /dashboard]', err.message);
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
