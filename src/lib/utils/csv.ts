/**
 * Convert an array of objects to CSV string
 */
export function toCSV<T extends Record<string, unknown>>(data: T[], columns: { key: keyof T; label: string }[]): string {
  const header = columns.map(c => `"${String(c.label)}"`).join(',');
  const rows = data.map(row =>
    columns.map(c => {
      const val = row[c.key];
      if (val === null || val === undefined) return '""';
      return `"${String(val).replace(/"/g, '""')}"`;
    }).join(',')
  );
  return [header, ...rows].join('\n');
}
