/**
 * Convert an array of objects to CSV string
 */
export function objectsToCSV(data, columns) {
  if (!data || data.length === 0) return '';

  const headers = columns.map((c) => `"${c.label}"`).join(';');

  const rows = data.map((row) => {
    return columns
      .map((c) => {
        const value = row[c.key] ?? '';
        const str = String(value).replace(/"/g, '""');
        return `"${str}"`;
      })
      .join(';');
  });

  return [headers, ...rows].join('\n');
}

/**
 * Trigger a CSV file download in the browser
 */
export function downloadCSV(csvString, filename) {
  const bom = '﻿';
  const blob = new Blob([bom + csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export const PLANNING_CSV_COLUMNS = [
  { key: 'full_name', label: 'Apprenant' },
  { key: 'email', label: 'Email' },
  { key: 'session_name', label: 'Formation' },
  { key: 'session_status', label: 'Statut session' },
  { key: 'session_start_date', label: 'Début' },
  { key: 'session_end_date', label: 'Fin' },
  { key: 'slots_count', label: 'Créneaux apprenant' },
  { key: 'total_session_slots', label: 'Créneaux session' },
  { key: 'status_code', label: 'Code statut' },
  { key: 'status_label', label: 'Statut' },
  { key: 'recommended_action', label: 'Action recommandée' },
];

export const REMINDERS_CSV_COLUMNS = [
  { key: 'full_name', label: 'Apprenant' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Téléphone' },
  { key: 'session_name', label: 'Formation' },
  { key: 'session_code', label: 'Code formation' },
  { key: 'session_status', label: 'Statut session' },
  { key: 'slot_date', label: 'Date créneau' },
  { key: 'start_time', label: 'Début' },
  { key: 'end_time', label: 'Fin' },
  { key: 'subsession_name', label: 'Sous-session' },
  { key: 'days_late', label: 'Jours de retard' },
  { key: 'priority', label: 'Priorité' },
  { key: 'status_label', label: 'Statut' },
  { key: 'extranet_url', label: 'Lien extranet' },
];
