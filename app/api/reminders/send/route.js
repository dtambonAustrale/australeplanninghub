import { supabaseAdmin } from '../../../../lib/supabase/admin.js';
import { sendReminderEmail } from '../../../../lib/services/email-service.js';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const body = await request.json();
    const { reminderId, createdBy = 'Australe Formation' } = body;

    if (!reminderId) {
      return Response.json({ success: false, error: 'reminderId est requis' }, { status: 400 });
    }

    // Fetch reminder
    const { data: reminder, error: fetchError } = await supabaseAdmin
      .from('signature_reminders')
      .select('*')
      .eq('id', reminderId)
      .single();

    if (fetchError || !reminder) {
      return Response.json({ success: false, error: 'Relance introuvable' }, { status: 404 });
    }

    if (!reminder.email) {
      return Response.json(
        { success: false, error: `Pas d'adresse email pour ${reminder.full_name}` },
        { status: 422 }
      );
    }

    // Send via Resend
    const result = await sendReminderEmail(reminder);

    // Log to reminder_history
    await supabaseAdmin.from('reminder_history').insert({
      reminder_id: reminderId,
      session_id: reminder.session_id,
      trainee_id: reminder.trainee_id,
      slot_id: reminder.slot_id,
      action_type: 'email_sent',
      channel: 'email',
      message: reminder.email_message,
      created_by: createdBy,
    });

    return Response.json({ success: true, emailId: result.id, sentTo: result.email });
  } catch (err) {
    console.error('[API /reminders/send]', err.message);
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
