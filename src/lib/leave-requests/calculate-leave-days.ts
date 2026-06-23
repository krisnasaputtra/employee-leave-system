/**
 * Client-side leave day calculation for form previews.
 * The server (RPC `calculate_leave_days`) is authoritative.
 * This is only used for instant UI feedback before submission.
 */

export type PartialDay = "NONE" | "FIRST_HALF" | "SECOND_HALF";

/**
 * Calculate estimated working days between two dates.
 * Excludes weekends (Saturday, Sunday).
 * Excludes holidays from the provided list.
 * Supports half-day deduction.
 */
export function calculateLeaveDaysPreview(
  startDate: string,
  endDate: string,
  partialDay: PartialDay,
  holidays: string[],
): number {
  if (!startDate || !endDate) return 0;

  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);

  if (start > end) return 0;

  const holidaySet = new Set(holidays);
  let total = 0;
  const current = new Date(start);

  while (current <= end) {
    const dow = current.getDay(); // 0=Sunday, 6=Saturday
    if (dow !== 0 && dow !== 6) {
      // Format as YYYY-MM-DD for holiday matching (timezone-safe)
      const y = current.getFullYear();
      const m = String(current.getMonth() + 1).padStart(2, "0");
      const d = String(current.getDate()).padStart(2, "0");
      const dateStr = `${y}-${m}-${d}`;
      if (!holidaySet.has(dateStr)) {
        total += 1;
      }
    }
    current.setDate(current.getDate() + 1);
  }

  // Apply half-day
  if ((partialDay === "FIRST_HALF" || partialDay === "SECOND_HALF") && total > 0) {
    total -= 0.5;
  }

  return total;
}
