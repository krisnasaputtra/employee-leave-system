import { describe, expect, it } from "vitest";

import { sanitizeDbError } from "../sanitize-error";

describe("sanitizeDbError", () => {
  it("returns fallback when no message is available", () => {
    expect(sanitizeDbError(null, "Fallback message")).toBe("Fallback message");
  });

  it("keeps user-facing RPC exception messages", () => {
    expect(sanitizeDbError({ message: "ERROR: Insufficient balance. Available: 1 days" }, "Fallback")).toBe(
      "Insufficient balance. Available: 1 days",
    );
  });

  it("hides duplicate key errors", () => {
    expect(
      sanitizeDbError(
        {
          message: 'duplicate key value violates unique constraint "leave_requests_request_number_unique"',
        },
        "Failed to create leave request.",
      ),
    ).toBe("Failed to create leave request.");
  });

  it("hides permission errors", () => {
    expect(sanitizeDbError({ message: "permission denied for table employees" }, "Failed to approve request.")).toBe(
      "Failed to approve request.",
    );
  });
});
