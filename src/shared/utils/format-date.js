/**
 * Formats an ISO date string or Date object into a readable Spanish (Peru) format.
 * @param {string|Date|null} value
 * @returns {string}
 */
export function formatDate(value) {
    if (!value) return '—';
    const date = new Date(value);
    if (isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('es-PE', {
        year:  'numeric',
        month: '2-digit',
        day:   '2-digit',
    });
}

/**
 * Formats an ISO datetime string into date + time.
 * @param {string|Date|null} value
 * @returns {string}
 */
export function formatDateTime(value) {
    if (!value) return '—';
    const date = new Date(value);
    if (isNaN(date.getTime())) return '—';
    return date.toLocaleString('es-PE', {
        year:   'numeric',
        month:  '2-digit',
        day:    '2-digit',
        hour:   '2-digit',
        minute: '2-digit',
    });
}