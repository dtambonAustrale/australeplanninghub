import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_NAME = process.env.RESEND_FROM_NAME || 'Australe Formation';
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

function formatSlotDate(slotDate) {
  if (!slotDate) return '—';
  try {
    return new Date(slotDate).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return String(slotDate);
  }
}

function formatTime(t) {
  if (!t) return '—';
  return String(t).slice(0, 5);
}

function buildEmailHTML(reminder) {
  const slotDateFR = formatSlotDate(reminder.slot_date);
  const startTime = formatTime(reminder.start_time);
  const endTime = formatTime(reminder.end_time);
  const firstname = reminder.firstname || reminder.full_name || 'apprenant(e)';

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Émargement en attente</title>
  <style>
    body{margin:0;padding:0;background:#f4f7fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif}
    .wrap{max-width:600px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)}
    .header{background:#071525;padding:28px 36px}
    .header-title{color:#ffffff;font-size:20px;font-weight:700;margin:0;letter-spacing:-0.3px}
    .header-sub{color:rgba(255,255,255,.5);font-size:13px;margin:6px 0 0}
    .body{padding:36px}
    p{color:#374151;font-size:15px;line-height:1.75;margin:0 0 16px}
    .badge{display:inline-block;background:#fee2e2;color:#dc2626;font-size:12px;font-weight:600;padding:4px 12px;border-radius:999px;margin-bottom:20px;letter-spacing:0.3px}
    .info-box{background:#f8fafc;border-left:4px solid #0d6efd;border-radius:0 10px 10px 0;padding:18px 22px;margin:24px 0}
    .info-row{margin:6px 0;color:#475569;font-size:14px;line-height:1.5}
    .info-row strong{color:#1e293b}
    .cta{text-align:center;margin:32px 0}
    .cta-btn{background:#0d6efd;color:#ffffff;padding:14px 36px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px;display:inline-block;letter-spacing:0.2px}
    .cta-btn:hover{background:#0b5ed7}
    .divider{border:none;border-top:1px solid #e2e8f0;margin:28px 0}
    .footer{background:#f8fafc;padding:22px 36px;border-top:1px solid #e2e8f0}
    .footer p{color:#94a3b8;font-size:12px;margin:0;line-height:1.7}
  </style>
</head>
<body>
  <div class="wrap">
    <div class="header">
      <p class="header-title">Australe Formation</p>
      <p class="header-sub">Assiduity — Suivi des émargements</p>
    </div>
    <div class="body">
      <span class="badge">⚠ Émargement en attente de signature</span>
      <p>Bonjour <strong>${firstname}</strong>,</p>
      <p>Sauf erreur de notre part, votre émargement n'a pas encore été signé pour la formation suivante :</p>

      <div class="info-box">
        <p class="info-row"><strong>Formation :</strong> ${reminder.session_name || '—'}</p>
        ${reminder.session_code ? `<p class="info-row"><strong>Code :</strong> ${reminder.session_code}</p>` : ''}
        <p class="info-row"><strong>Date du créneau :</strong> ${slotDateFR}</p>
        <p class="info-row"><strong>Horaires :</strong> ${startTime} – ${endTime}</p>
        ${reminder.subsession_name ? `<p class="info-row"><strong>Module :</strong> ${reminder.subsession_name}</p>` : ''}
      </div>

      <p>Pouvez-vous vous connecter à votre espace apprenant Digiforma afin de régulariser votre signature, s'il vous plaît ?</p>
      <p>Cette signature est importante car elle permet de justifier officiellement votre présence en formation et de valider votre parcours.</p>

      ${reminder.extranet_url ? `
      <div class="cta">
        <a href="${reminder.extranet_url}" class="cta-btn">Accéder à mon espace Digiforma</a>
      </div>
      <p style="text-align:center;font-size:13px;color:#94a3b8;margin-top:-12px">Ou copiez ce lien : ${reminder.extranet_url}</p>
      ` : ''}

      <hr class="divider">

      <p>Merci d'avance pour votre retour rapide.</p>
      <p>Cordialement,<br><strong>L'équipe Australe Formation</strong></p>
    </div>
    <div class="footer">
      <p>Cet email a été envoyé depuis <strong>Assiduity</strong>, l'outil interne de suivi des formations d'Australe Formation.</p>
      <p style="margin-top:6px">Si vous avez déjà signé votre émargement, veuillez ignorer ce message. Votre signature sera prise en compte lors de la prochaine synchronisation.</p>
    </div>
  </div>
</body>
</html>`;
}

function buildEmailSubject(reminder) {
  const slotDateFR = reminder.slot_date
    ? new Date(reminder.slot_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
    : '—';
  return `Action requise — Émargement du ${slotDateFR} · ${reminder.session_name || 'Formation'}`;
}

/**
 * Send a single reminder email via Resend
 */
export async function sendReminderEmail(reminder) {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY non configurée. Ajoutez-la dans vos variables d\'environnement.');
  }
  if (!reminder.email) {
    throw new Error(`Pas d'adresse email pour ${reminder.full_name || reminder.trainee_id}`);
  }

  const { data, error } = await resend.emails.send({
    from: `${FROM_NAME} <${FROM_EMAIL}>`,
    to: [reminder.email],
    subject: buildEmailSubject(reminder),
    html: buildEmailHTML(reminder),
    text: reminder.email_message || '',
    tags: [
      { name: 'session_id', value: String(reminder.session_id || '') },
      { name: 'trainee_id', value: String(reminder.trainee_id || '') },
      { name: 'type', value: 'signature_reminder' },
    ],
  });

  if (error) throw new Error(`Resend: ${error.message || JSON.stringify(error)}`);
  return { id: data?.id, email: reminder.email };
}

/**
 * Send multiple reminder emails via Resend batch API
 */
export async function sendBulkReminderEmails(reminders) {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY non configurée.');
  }

  const withEmail = reminders.filter((r) => r.email);
  const results = [];
  const errors = [];

  // Resend batch: max 100 per call
  for (let i = 0; i < withEmail.length; i += 100) {
    const chunk = withEmail.slice(i, i + 100);

    const emails = chunk.map((r) => ({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: [r.email],
      subject: buildEmailSubject(r),
      html: buildEmailHTML(r),
      text: r.email_message || '',
      tags: [
        { name: 'session_id', value: String(r.session_id || '') },
        { name: 'trainee_id', value: String(r.trainee_id || '') },
        { name: 'type', value: 'signature_reminder' },
      ],
    }));

    try {
      const { data, error } = await resend.batch.send(emails);
      if (error) {
        errors.push({ error: error.message || JSON.stringify(error), count: chunk.length });
      } else {
        results.push(...(data?.data || []));
      }
    } catch (err) {
      errors.push({ error: err.message, count: chunk.length });
    }
  }

  return {
    sent: results.length,
    skipped: reminders.length - withEmail.length,
    errors,
    ids: results.map((r) => r.id),
  };
}
