import { describe, expect, it } from "vitest";

import { canCommentOnLeaveRequest, canViewLeaveRequest } from "../access";

describe("leave request access helpers", () => {
  const requesterId = "employee-1";
  const managerId = "manager-1";
  const otherId = "employee-2";

  it("allows admins to view any request", () => {
    expect(
      canViewLeaveRequest({
        actorId: "admin-1",
        actorRole: "ADMIN",
        requesterId,
        requesterManagerId: null,
      }),
    ).toBe(true);
  });

  it("allows the requester to view their own request", () => {
    expect(
      canViewLeaveRequest({
        actorId: requesterId,
        actorRole: "EMPLOYEE",
        requesterId,
        requesterManagerId: managerId,
      }),
    ).toBe(true);
  });

  it("allows a direct manager to view a report request", () => {
    expect(
      canViewLeaveRequest({
        actorId: managerId,
        actorRole: "MANAGER",
        requesterId,
        requesterManagerId: managerId,
      }),
    ).toBe(true);
  });

  it("allows an active delegated approver to view another employee request", () => {
    expect(
      canViewLeaveRequest({
        actorId: otherId,
        actorRole: "EMPLOYEE",
        requesterId,
        requesterManagerId: managerId,
        hasActiveApprovalDelegation: true,
      }),
    ).toBe(true);
  });

  it("denies unrelated employees", () => {
    expect(
      canViewLeaveRequest({
        actorId: otherId,
        actorRole: "EMPLOYEE",
        requesterId,
        requesterManagerId: managerId,
      }),
    ).toBe(false);
  });

  it("uses the same policy for comments", () => {
    expect(
      canCommentOnLeaveRequest({
        actorId: otherId,
        actorRole: "EMPLOYEE",
        requesterId,
        requesterManagerId: managerId,
      }),
    ).toBe(false);
  });
});
