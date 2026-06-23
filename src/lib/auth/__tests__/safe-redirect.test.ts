import { describe, expect, it } from "vitest";

import { getSafeRedirectUrl } from "../safe-redirect";

describe("getSafeRedirectUrl", () => {
  it("returns default for null", () => expect(getSafeRedirectUrl(null)).toBe("/dashboard"));
  it("returns default for undefined", () => expect(getSafeRedirectUrl(undefined)).toBe("/dashboard"));
  it("returns default for empty", () => expect(getSafeRedirectUrl("")).toBe("/dashboard"));
  it("allows valid path", () => expect(getSafeRedirectUrl("/dashboard/employees")).toBe("/dashboard/employees"));
  it("blocks protocol-relative", () => expect(getSafeRedirectUrl("//evil.com")).toBe("/dashboard"));
  it("blocks absolute URL", () => expect(getSafeRedirectUrl("https://evil.com")).toBe("/dashboard"));
  it("blocks backslash", () => expect(getSafeRedirectUrl("/foo\\bar")).toBe("/dashboard"));
  it("allows query params", () => expect(getSafeRedirectUrl("/dashboard?tab=x")).toBe("/dashboard?tab=x"));
});
