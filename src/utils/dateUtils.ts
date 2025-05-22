/**
 * Formate une date au format français
 * @param dateString - Date au format ISO
 * @returns Date au format français (ex: 22 mai 2025)
 */
export function formatDateToFrench(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

/**
 * Formate une date et heure au format français
 * @param dateString - Date au format ISO
 * @returns Date et heure au format français (ex: 22 mai 2025 à 14:30)
 */
export function formatDateTimeToFrench(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).replace(' à', ' à');
}
