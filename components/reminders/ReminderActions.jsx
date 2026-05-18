'use client';

import { useState } from 'react';
import { Copy, ExternalLink, CheckCircle, Mail, MessageCircle, Send, Loader2 } from 'lucide-react';
import apiClient, { syncApiClient } from '../../lib/axios';

export default function ReminderActions({ reminder, historySummary = {}, onMarked }) {
  const [copied, setCopied] = useState(null);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState(null); // 'ok' | 'error'
  const [sendError, setSendError] = useState(null);
  const [marking, setMarking] = useState(false);

  const copyToClipboard = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // fallback silencieux
    }
  };

  const handleSendEmail = async () => {
    if (sending) return;
    setSending(true);
    setSendResult(null);
    setSendError(null);
    try {
      await apiClient.post('/reminders/send', {
        reminderId: reminder.id,
        createdBy: 'Australe Formation',
      });
      setSendResult('ok');
      if (onMarked) onMarked(reminder.id);
    } catch (err) {
      setSendResult('error');
      setSendError(err.message);
    } finally {
      setSending(false);
    }
  };

  const markAsReminded = async (channel) => {
    setMarking(true);
    try {
      await apiClient.post('/reminder-history', {
        reminderId: reminder.id,
        sessionId: reminder.session_id,
        traineeId: reminder.trainee_id,
        slotId: reminder.slot_id,
        channel,
        message: channel === 'email' ? reminder.email_message : reminder.whatsapp_message,
        createdBy: 'Australe Formation',
      });
      if (onMarked) onMarked(reminder.id);
    } catch (err) {
      console.error('Erreur marquage relance:', err.message);
    } finally {
      setMarking(false);
    }
  };

  const count = historySummary[reminder.id] || 0;

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {/* Send email via Resend */}
      {reminder.email && (
        <button
          onClick={handleSendEmail}
          disabled={sending || sendResult === 'ok'}
          title={
            sendResult === 'ok'
              ? 'Email envoyé !'
              : sendResult === 'error'
              ? `Erreur : ${sendError}`
              : `Envoyer par email à ${reminder.email}`
          }
          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors border ${
            sendResult === 'ok'
              ? 'bg-green-50 text-green-600 border-green-200 cursor-default'
              : sendResult === 'error'
              ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
              : 'bg-blue-50 text-[#0d6efd] border-blue-200 hover:bg-blue-100'
          } disabled:opacity-60`}
        >
          {sending ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : sendResult === 'ok' ? (
            <CheckCircle className="w-3.5 h-3.5" />
          ) : (
            <Send className="w-3.5 h-3.5" />
          )}
          {sendResult === 'ok' ? 'Envoyé' : 'Envoyer'}
        </button>
      )}

      {/* Copy email message */}
      {reminder.email_message && (
        <button
          onClick={() => copyToClipboard(reminder.email_message, 'email')}
          title="Copier le message email"
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
        >
          {copied === 'email' ? (
            <CheckCircle className="w-4 h-4 text-green-500" />
          ) : (
            <Mail className="w-4 h-4" />
          )}
        </button>
      )}

      {/* Copy WhatsApp message */}
      {reminder.whatsapp_message && (
        <button
          onClick={() => copyToClipboard(reminder.whatsapp_message, 'whatsapp')}
          title="Copier le message WhatsApp"
          className="p-1.5 rounded-lg hover:bg-green-50 text-gray-400 hover:text-green-600 transition-colors"
        >
          {copied === 'whatsapp' ? (
            <CheckCircle className="w-4 h-4 text-green-500" />
          ) : (
            <MessageCircle className="w-4 h-4" />
          )}
        </button>
      )}

      {/* Open extranet */}
      {reminder.extranet_url && (
        <a
          href={reminder.extranet_url}
          target="_blank"
          rel="noopener noreferrer"
          title="Ouvrir l'espace apprenant"
          className="p-1.5 rounded-lg hover:bg-purple-50 text-gray-400 hover:text-purple-600 transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
      )}

      {/* Mark as manually reminded */}
      <button
        onClick={() => markAsReminded('manual')}
        disabled={marking}
        title="Marquer comme relancé manuellement"
        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
      >
        <CheckCircle className="w-4 h-4" />
      </button>

      {/* Count badge */}
      {count > 0 && (
        <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full tabular-nums">
          {count}×
        </span>
      )}
    </div>
  );
}
