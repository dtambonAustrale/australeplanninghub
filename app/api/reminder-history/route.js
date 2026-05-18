import { addReminderHistory } from '../../../lib/services/reminders-service.js';

export async function POST(request) {
  try {
    const body = await request.json();

    if (!body.reminderId) {
      return Response.json({ success: false, error: 'reminderId is required' }, { status: 400 });
    }

    const record = await addReminderHistory({
      reminderId: body.reminderId,
      sessionId: body.sessionId,
      traineeId: body.traineeId,
      slotId: body.slotId,
      actionType: body.actionType || 'manual_reminder',
      channel: body.channel,
      message: body.message,
      createdBy: body.createdBy || 'Australe Formation',
    });

    return Response.json({ success: true, record });
  } catch (err) {
    console.error('[API /reminder-history]', err.message);
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
