import { describe, expect, it } from "vitest";

import { delegationCreateSchema, delegationIdSchema } from "../schemas";

describe("delegation schemas", () => {
  const uuid = "123e4567-e89b-12d3-a456-426614174000";

  it("accepts a valid delegation payload", () => {
    const result = delegationCreateSchema.safeParse({
      delegate_id: uuid,
      start_date: "2026-07-08",
      end_date: "2026-07-09",
      reason: "Coverage during leave",
    });

    expect(result.success).toBe(true);
  });

  it("rejects an end date before the start date", () => {
    const result = delegationCreateSchema.safeParse({
      delegate_id: uuid,
      start_date: "2026-07-09",
      end_date: "2026-07-08",
      reason: "Coverage during leave",
    });

    expect(result.success).toBe(false);
  });

  it("accepts a valid delegation id", () => {
    expect(delegationIdSchema.safeParse(uuid).success).toBe(true);
  });

  it("rejects an invalid delegation id", () => {
    expect(delegationIdSchema.safeParse("not-a-uuid").success).toBe(false);
  });
});
