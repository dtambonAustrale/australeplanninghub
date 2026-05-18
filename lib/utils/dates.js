/**
 * Format a date string or Date object to DD/MM/YYYY
 */
export function formatDateFR(dateInput) {
  if (!dateInput) return '—';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return String(dateInput);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/**
 * Format a time string HH:MM:SS or HH:MM to HH:MM
 */
export function formatTime(timeStr) {
  if (!timeStr) return '—';
  const parts = timeStr.split(':');
  if (parts.length >= 2) return `${parts[0]}:${parts[1]}`;
  return timeStr;
}

/**
 * Compute days between two dates (today - slotDate)
 */
export function computeDaysLate(slotDate) {
  if (!slotDate) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const slot = new Date(slotDate);
  slot.setHours(0, 0, 0, 0);
  const diff = today.getTime() - slot.getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

/**
 * Check if a slot date is in the past
 */
export function isSlotInPast(slotDate) {
  if (!slotDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const slot = new Date(slotDate);
  slot.setHours(0, 0, 0, 0);
  return slot < today;
}

/**
 * Get current year
 */
export function getCurrentYear() {
  return new Date().getFullYear();
}

/**
 * Build a human-readable date range
 */
export function formatDateRange(startDate, endDate) {
  const start = formatDateFR(startDate);
  const end = formatDateFR(endDate);
  if (start === end) return start;
  return `${start} → ${end}`;
}
