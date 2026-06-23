import { describe, expect, it } from "vitest";

import { leaveRejectionSchema } from "../schemas";

describe("leaveRejectionSchema", () => {
  it("requires rejection reason", () => {
    const result = leaveRejectionSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects empty reason", () => {
    const result = leaveRejectionSchema.safeParse({ rejection_reason: "" });
    expect(result.success).toBe(false);
  });

  it("rejects too short reason", () => {
    const result = leaveRejectionSchema.safeParse({ rejection_reason: "ab" });
    expect(result.success).toBe(false);
  });

  it("accepts valid reason", () => {
    const result = leaveRejectionSchema.safeParse({ rejection_reason: "Budget constraints" });
    expect(result.success).toBe(true);
  });

  it("rejects reason over 500 chars", () => {
    const result = leaveRejectionSchema.safeParse({ rejection_reason: "x".repeat(501) });
    expect(result.success).toBe(false);
  });

  it("accepts 500-char reason", () => {
    const result = leaveRejectionSchema.safeParse({ rejection_reason: "x".repeat(500) });
    expect(result.success).toBe(true);
  });
});
