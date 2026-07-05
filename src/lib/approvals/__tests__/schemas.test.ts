import { describe, expect, it } from "vitest";

import { approvalRequestIdSchema, bulkApprovalRequestIdsSchema, leaveRejectionSchema } from "../schemas";

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

describe("approvalRequestIdSchema", () => {
  it("accepts a valid request id", () => {
    const result = approvalRequestIdSchema.safeParse("11111111-1111-4111-8111-111111111111");

    expect(result.success).toBe(true);
  });

  it("rejects a malformed request id", () => {
    const result = approvalRequestIdSchema.safeParse("not-a-uuid");

    expect(result.success).toBe(false);
  });
});

describe("bulkApprovalRequestIdsSchema", () => {
  const validId = "11111111-1111-4111-8111-111111111111";
  const secondValidId = "22222222-2222-4222-8222-222222222222";

  it("accepts valid request ids", () => {
    const result = bulkApprovalRequestIdsSchema.safeParse([validId, secondValidId]);

    expect(result.success).toBe(true);
  });

  it("rejects an empty selection", () => {
    const result = bulkApprovalRequestIdsSchema.safeParse([]);

    expect(result.success).toBe(false);
  });

  it("rejects malformed request ids", () => {
    const result = bulkApprovalRequestIdsSchema.safeParse([validId, "not-a-uuid"]);

    expect(result.success).toBe(false);
  });

  it("rejects more than 50 request ids", () => {
    const ids = Array.from({ length: 51 }, (_, index) => `11111111-1111-4111-8111-${String(index).padStart(12, "0")}`);

    const result = bulkApprovalRequestIdsSchema.safeParse(ids);

    expect(result.success).toBe(false);
  });

  it("deduplicates request ids", () => {
    const result = bulkApprovalRequestIdsSchema.safeParse([validId, validId, secondValidId]);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual([validId, secondValidId]);
    }
  });
});
