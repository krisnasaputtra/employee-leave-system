/**
 * Format a date string (YYYY-MM-DD) to a human-readable format.
 * @example formatDate('2026-01-15') => 'Jan 15, 2026'
 */
export function formatDate(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
