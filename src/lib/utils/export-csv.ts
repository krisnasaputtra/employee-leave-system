/**
 * Generate a CSV string from an array of objects.
 * @param headers - Array of { key, label } pairs
 * @param data - Array of data objects
 * @returns CSV string
 */
export function generateCsv<T extends object>(
  headers: { key: keyof T; label: string }[],
  data: T[],
): string {
  const headerRow = headers.map((h) => `"${h.label}"`).join(",");
  const rows = data.map((row) =>
    headers
      .map((h) => {
        const val = row[h.key];
        if (val === null || val === undefined) return '""';
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      })
      .join(","),
  );
  return [headerRow, ...rows].join("\n");
}

/**
 * Trigger a CSV file download in the browser.
 */
export function downloadCsv(csvContent: string, filename: string): void {
  const blob = new Blob([`\uFEFF${csvContent}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
