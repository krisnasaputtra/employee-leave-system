import { describe, expect, it } from "vitest";

import { balanceAdjustmentSchema, balanceEmployeeIdSchema } from "../schemas";

describe("balance schemas", () => {
  const uuid = "123e4567-e89b-12d3-a456-426614174000";

  describe("balanceAdjustmentSchema", () => {
    it("accepts a valid adjustment payload", () => {
      const result = balanceAdjustmentSchema.safeParse({
        balance_id: uuid,
        days: 1.5,
        reason: "Correction after HR review",
      });

      expect(result.success).toBe(true);
    });

    it("rejects zero-day adjustments", () => {
      const result = balanceAdjustmentSchema.safeParse({
        balance_id: uuid,
        days: 0,
        reason: "Correction after HR review",
      });

      expect(result.success).toBe(false);
    });

    it("rejects invalid balance ids", () => {
      const result = balanceAdjustmentSchema.safeParse({
        balance_id: "not-a-uuid",
        days: 1,
        reason: "Correction after HR review",
      });

      expect(result.success).toBe(false);
    });
  });

  describe("balanceEmployeeIdSchema", () => {
    it("accepts a valid employee id", () => {
      expect(balanceEmployeeIdSchema.safeParse(uuid).success).toBe(true);
    });

    it("rejects an invalid employee id", () => {
      expect(balanceEmployeeIdSchema.safeParse("not-a-uuid").success).toBe(false);
    });
  });
});
