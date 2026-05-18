/**
 * Format a pipeline state to French label
 */
export function formatPipelineState(state) {
  const labels = {
    ongoing: 'En cours',
    finished: 'Terminée',
    cancelled: 'Annulée',
    draft: 'Brouillon',
    planned: 'Planifiée',
  };
  return labels[state] || state || '—';
}

/**
 * Format a status code to badge config
 */
export function getStatusBadgeConfig(statusCode) {
  const configs = {
    ok: { label: 'OK', color: 'success' },
    missing: { label: 'Manquant', color: 'danger' },
    warning: { label: 'Attention', color: 'warning' },
    missing_signature: { label: 'Non signé', color: 'danger' },
  };
  return configs[statusCode] || { label: statusCode || '—', color: 'default' };
}

/**
 * Format a priority to badge config
 */
export function getPriorityBadgeConfig(priority) {
  const configs = {
    critical: { label: 'Critique', color: 'danger' },
    high: { label: 'Élevée', color: 'warning' },
    normal: { label: 'Normale', color: 'default' },
  };
  return configs[priority] || { label: priority || '—', color: 'default' };
}

/**
 * Format a number with French locale
 */
export function formatNumber(num) {
  if (num === null || num === undefined) return '0';
  return Number(num).toLocaleString('fr-FR');
}

/**
 * Format sync status
 */
export function formatSyncStatus(status) {
  const labels = {
    running: 'En cours',
    completed: 'Terminé',
    error: 'Erreur',
    pending: 'En attente',
  };
  return labels[status] || status || '—';
}
