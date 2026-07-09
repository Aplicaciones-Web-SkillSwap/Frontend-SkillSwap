/**
 * Derives a readable university name from an institutional (.edu.pe) email address.
 * e.g. "juan@upc.edu.pe" -> "UPC", "maria@pucp.edu.pe" -> "PUCP"
 * @param {string|null} email
 * @returns {string}
 */
export function deriveUniversityFromEmail(email) {
    if (!email) return '—';
    const match = email.match(/@([^.]+)\.edu\.pe$/i);
    return match ? match[1].toUpperCase() : '—';
}
