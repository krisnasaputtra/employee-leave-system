import { describe, expect, it } from "vitest";

import { attachmentIdSchema } from "../schemas";

describe("attachmentIdSchema", () => {
  it("accepts a valid attachment id", () => {
    const result = attachmentIdSchema.safeParse("11111111-1111-4111-8111-111111111111");

    expect(result.success).toBe(true);
  });

  it("rejects a malformed attachment id", () => {
    const result = attachmentIdSchema.safeParse("not-a-uuid");

    expect(result.success).toBe(false);
  });
});
