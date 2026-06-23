import { describe, expect, it } from "vitest";

import { calculateLeaveDaysPreview } from "../calculate-leave-days";

describe("calculateLeaveDaysPreview", () => {
  // ---- Basic working day tests ----
  describe("Basic working days", () => {
    it("returns 0 for empty inputs", () => {
      expect(calculateLeaveDaysPreview("", "", "NONE", [])).toBe(0);
    });

    it("returns 0 when start > end", () => {
      expect(calculateLeaveDaysPreview("2026-06-25", "2026-06-23", "NONE", [])).toBe(0);
    });

    it("counts a single weekday as 1 day", () => {
      // 2026-06-23 is Tuesday
      expect(calculateLeaveDaysPreview("2026-06-23", "2026-06-23", "NONE", [])).toBe(1);
    });

    it("counts Mon-Fri as 5 days", () => {
      // 2026-06-22 (Mon) to 2026-06-26 (Fri)
      expect(calculateLeaveDaysPreview("2026-06-22", "2026-06-26", "NONE", [])).toBe(5);
    });

    it("counts two full weeks as 10 days", () => {
      // 2026-06-22 (Mon) to 2026-07-03 (Fri)
      expect(calculateLeaveDaysPreview("2026-06-22", "2026-07-03", "NONE", [])).toBe(10);
    });
  });

  // ---- Weekend exclusion tests ----
  describe("Weekend exclusion", () => {
    it("excludes Saturday", () => {
      // 2026-06-27 is Saturday
      expect(calculateLeaveDaysPreview("2026-06-27", "2026-06-27", "NONE", [])).toBe(0);
    });

    it("excludes Sunday", () => {
      // 2026-06-28 is Sunday
      expect(calculateLeaveDaysPreview("2026-06-28", "2026-06-28", "NONE", [])).toBe(0);
    });

    it("excludes weekends in range", () => {
      // 2026-06-25 (Thu) to 2026-06-30 (Tue) = Thu, Fri, Mon, Tue = 4 days
      expect(calculateLeaveDaysPreview("2026-06-25", "2026-06-30", "NONE", [])).toBe(4);
    });

    it("full weekend (Sat-Sun) returns 0", () => {
      expect(calculateLeaveDaysPreview("2026-06-27", "2026-06-28", "NONE", [])).toBe(0);
    });
  });

  // ---- Holiday exclusion tests ----
  describe("Holiday exclusion", () => {
    it("excludes a weekday holiday", () => {
      // 2026-06-22 (Mon) to 2026-06-26 (Fri), with Wed as holiday = 4 days
      const holidays = ["2026-06-24"];
      expect(calculateLeaveDaysPreview("2026-06-22", "2026-06-26", "NONE", holidays)).toBe(4);
    });

    it("holiday on weekend has no extra effect", () => {
      // Saturday holiday doesn't change count
      const holidays = ["2026-06-27"];
      expect(calculateLeaveDaysPreview("2026-06-22", "2026-06-28", "NONE", holidays)).toBe(5);
    });

    it("multiple holidays in range", () => {
      // Mon-Fri with 2 holidays = 3 days
      const holidays = ["2026-06-22", "2026-06-24"];
      expect(calculateLeaveDaysPreview("2026-06-22", "2026-06-26", "NONE", holidays)).toBe(3);
    });

    it("all weekdays are holidays returns 0", () => {
      const holidays = ["2026-06-22", "2026-06-23", "2026-06-24", "2026-06-25", "2026-06-26"];
      expect(calculateLeaveDaysPreview("2026-06-22", "2026-06-26", "NONE", holidays)).toBe(0);
    });
  });

  // ---- Half-day tests ----
  describe("Half-day support", () => {
    it("FIRST_HALF deducts 0.5 from single day", () => {
      expect(calculateLeaveDaysPreview("2026-06-23", "2026-06-23", "FIRST_HALF", [])).toBe(0.5);
    });

    it("SECOND_HALF deducts 0.5 from single day", () => {
      expect(calculateLeaveDaysPreview("2026-06-23", "2026-06-23", "SECOND_HALF", [])).toBe(0.5);
    });

    it("FIRST_HALF deducts 0.5 from multi-day range", () => {
      // 5 working days - 0.5 = 4.5
      expect(calculateLeaveDaysPreview("2026-06-22", "2026-06-26", "FIRST_HALF", [])).toBe(4.5);
    });

    it("NONE does not deduct anything", () => {
      expect(calculateLeaveDaysPreview("2026-06-23", "2026-06-23", "NONE", [])).toBe(1);
    });

    it("half-day on zero working days returns 0", () => {
      // Weekend only
      expect(calculateLeaveDaysPreview("2026-06-27", "2026-06-28", "FIRST_HALF", [])).toBe(0);
    });
  });

  // ---- Date boundary tests ----
  describe("Date boundaries", () => {
    it("start equals end (single weekday)", () => {
      expect(calculateLeaveDaysPreview("2026-06-23", "2026-06-23", "NONE", [])).toBe(1);
    });

    it("cross-month range", () => {
      // 2026-06-29 (Mon) to 2026-07-03 (Fri) = 5 weekdays
      expect(calculateLeaveDaysPreview("2026-06-29", "2026-07-03", "NONE", [])).toBe(5);
    });

    it("cross-year range", () => {
      // 2026-12-29 (Tue) to 2027-01-02 (Sat) excluding Jan 1 holiday
      // Dec 29 Tue, Dec 30 Wed, Dec 31 Thu = 3 (Jan 1=holiday, Jan 2=Sat)
      const holidays = ["2027-01-01"];
      expect(calculateLeaveDaysPreview("2026-12-29", "2027-01-02", "NONE", holidays)).toBe(3);
    });
  });
});
