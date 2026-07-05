import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { leaveRequestCreateSchema, leaveRequestIdSchema, leaveRequestUpdateSchema } from "../schemas";

const validInput = {
  leave_type_id: "11111111-1111-4111-8111-111111111111",
  start_date: "2026-07-03",
  end_date: "2026-07-03",
  partial_day: "NONE",
  reason: "Family matter",
};

describe("leaveRequestCreateSchema", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-02T05:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("accepts a valid future-dated leave request", () => {
    const result = leaveRequestCreateSchema.safeParse(validInput);

    expect(result.success).toBe(true);
  });

  it("accepts a request that starts today", () => {
    const result = leaveRequestCreateSchema.safeParse({
      ...validInput,
      start_date: "2026-07-02",
      end_date: "2026-07-02",
    });

    expect(result.success).toBe(true);
  });

  it("rejects a start date in the past", () => {
    const result = leaveRequestCreateSchema.safeParse({
      ...validInput,
      start_date: "2026-07-01",
      end_date: "2026-07-03",
    });

    expect(result.success).toBe(false);
  });

  it("rejects an end date before the start date", () => {
    const result = leaveRequestCreateSchema.safeParse({
      ...validInput,
      start_date: "2026-07-04",
      end_date: "2026-07-03",
    });

    expect(result.success).toBe(false);
  });

  it("rejects a missing leave type", () => {
    const result = leaveRequestCreateSchema.safeParse({
      ...validInput,
      leave_type_id: "",
    });

    expect(result.success).toBe(false);
  });

  it("rejects a malformed leave type id", () => {
    const result = leaveRequestCreateSchema.safeParse({
      ...validInput,
      leave_type_id: "not-a-uuid",
    });

    expect(result.success).toBe(false);
  });

  it("rejects an invalid partial-day value", () => {
    const result = leaveRequestCreateSchema.safeParse({
      ...validInput,
      partial_day: "FULL_DAY",
    });

    expect(result.success).toBe(false);
  });

  it("accepts an empty optional reason", () => {
    const result = leaveRequestCreateSchema.safeParse({
      ...validInput,
      reason: "",
    });

    expect(result.success).toBe(true);
  });

  it("rejects a reason over 1000 characters", () => {
    const result = leaveRequestCreateSchema.safeParse({
      ...validInput,
      reason: "x".repeat(1001),
    });

    expect(result.success).toBe(false);
  });
});

describe("leaveRequestUpdateSchema", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-02T05:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("uses the same validation rules as create", () => {
    expect(leaveRequestUpdateSchema.safeParse(validInput).success).toBe(true);
    expect(
      leaveRequestUpdateSchema.safeParse({
        ...validInput,
        start_date: "2026-07-01",
      }).success,
    ).toBe(false);
  });
});

describe("leaveRequestIdSchema", () => {
  it("accepts a valid leave request id", () => {
    const result = leaveRequestIdSchema.safeParse("11111111-1111-4111-8111-111111111111");

    expect(result.success).toBe(true);
  });

  it("rejects a malformed leave request id", () => {
    const result = leaveRequestIdSchema.safeParse("not-a-uuid");

    expect(result.success).toBe(false);
  });
});
