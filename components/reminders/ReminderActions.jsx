'use client';

import { useState } from 'react';
import { Copy, ExternalLink, CheckCircle, Mail, MessageCircle } from 'lucide-react';
import apiClient from '../../lib/axios';

export default function ReminderActions({ reminder, historySummary = {}, onMarked }) {
  const [copied, setCopied] = useState(null);
  const [marking, setMarking] = useState(false);

  const copyToClipboard = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // fallback
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
    <div className="flex items-center gap-1.5 flex-wrap">
      {/* Copy email */}
      {reminder.email_message && (
        <button
          onClick={() => copyToClipboard(reminder.email_message, 'email')}
          title="Copier message email"
          className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-500 hover:text-[#0d6efd] transition-colors"
        >
          {copied === 'email' ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Mail className="w-4 h-4" />}
        </button>
      )}

      {/* Copy WhatsApp */}
      {reminder.whatsapp_message && (
        <button
          onClick={() => copyToClipboard(reminder.whatsapp_message, 'whatsapp')}
          title="Copier message WhatsApp"
          className="p-1.5 rounded-lg hover:bg-green-50 text-gray-500 hover:text-green-600 transition-colors"
        >
          {copied === 'whatsapp' ? <CheckCircle className="w-4 h-4 text-green-500" /> : <MessageCircle className="w-4 h-4" />}
        </button>
      )}

      {/* Extranet link */}
      {reminder.extranet_url && (
        <a
          href={reminder.extranet_url}
          target="_blank"
          rel="noopener noreferrer"
          title="Ouvrir espace apprenant"
          className="p-1.5 rounded-lg hover:bg-purple-50 text-gray-500 hover:text-purple-600 transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
      )}

      {/* Mark as reminded */}
      <button
        onClick={() => markAsReminded('email')}
        disabled={marking}
        title="Marquer comme relancé"
        className="p-1.5 rounded-lg hover:bg-green-50 text-gray-500 hover:text-green-600 transition-colors disabled:opacity-50"
      >
        <CheckCircle className="w-4 h-4" />
      </button>

      {/* Reminder count */}
      {count > 0 && (
        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
          {count}×
        </span>
      )}
    </div>
  );
}
