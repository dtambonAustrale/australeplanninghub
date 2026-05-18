/**
 * Normalize a string for search (lowercase, no accents, trimmed)
 */
export function normalizeForSearch(str) {
  if (!str) return '';
  return str
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim();
}

/**
 * Check if a string matches a search term
 */
export function matchesSearch(value, searchTerm) {
  if (!searchTerm) return true;
  return normalizeForSearch(value).includes(normalizeForSearch(searchTerm));
}

/**
 * Build a full name from firstname and lastname
 */
export function buildFullName(firstname, lastname) {
  return [firstname, lastname].filter(Boolean).join(' ').trim() || 'Inconnu';
}

/**
 * Truncate a string to max length
 */
export function truncate(str, maxLength = 50) {
  if (!str) return '';
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + '…';
}

/**
 * Generate a safe ID from parts
 */
export function buildCompositeId(...parts) {
  return parts.filter(Boolean).join('_');
}
