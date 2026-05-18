import { getReminderHistorySummary } from '../../../../lib/services/reminders-service.js';

export async function GET() {
  try {
    const summary = await getReminderHistorySummary();
    return Response.json({ success: true, summary });
  } catch (err) {
    console.error('[API /reminder-history/summary]', err.message);
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
