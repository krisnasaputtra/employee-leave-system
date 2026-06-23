import { describe, expect, it } from "vitest";

import {
  canApproveLeaveRequest,
  canCreateLeaveRequest,
  canEditLeaveRequest,
  canManageConfiguration,
  canManageEmployees,
  canManageLeaveBalance,
  canViewAuditLogs,
  canViewEmployee,
  isActiveEmployee,
} from "../roles";

// =============================================================
// Phase 3 — Extended Permission Tests covering the RLS matrix
// These tests validate that permission helpers enforce:
// - Anonymous: denied (represented by never calling with valid role)
// - EMPLOYEE: scoped to self
// - MANAGER: scoped to direct reports + self
// - ADMIN: all access
// =============================================================

describe("RLS Matrix — Employee operations", () => {
  const adminId = "admin-1";
  const managerId = "manager-1";
  const employeeId = "employee-1";
  const otherEmployeeId = "employee-2";

  describe("canManageEmployees — Admin only", () => {
    it("ADMIN can manage", () => expect(canManageEmployees("ADMIN")).toBe(true));
    it("MANAGER cannot manage", () => expect(canManageEmployees("MANAGER")).toBe(false));
    it("EMPLOYEE cannot manage", () => expect(canManageEmployees("EMPLOYEE")).toBe(false));
  });

  describe("canViewEmployee — Scoped", () => {
    // Admin sees all
    it("ADMIN sees any employee", () => expect(canViewEmployee("ADMIN", adminId, otherEmployeeId, null)).toBe(true));

    // Employee sees self only
    it("EMPLOYEE sees self", () => expect(canViewEmployee("EMPLOYEE", employeeId, employeeId, null)).toBe(true));
    it("EMPLOYEE cannot see other", () =>
      expect(canViewEmployee("EMPLOYEE", employeeId, otherEmployeeId, null)).toBe(false));
    it("EMPLOYEE cannot see other even with manager field", () =>
      expect(canViewEmployee("EMPLOYEE", employeeId, otherEmployeeId, "someone-else")).toBe(false));

    // Manager sees self
    it("MANAGER sees self", () => expect(canViewEmployee("MANAGER", managerId, managerId, null)).toBe(true));
    // Manager sees direct report
    it("MANAGER sees direct report", () =>
      expect(canViewEmployee("MANAGER", managerId, otherEmployeeId, managerId)).toBe(true));
    // Manager cannot see non-report
    it("MANAGER cannot see non-report", () =>
      expect(canViewEmployee("MANAGER", managerId, otherEmployeeId, "other-manager")).toBe(false));
  });

  describe("canManageLeaveBalance — Admin only", () => {
    it("ADMIN can manage", () => expect(canManageLeaveBalance("ADMIN")).toBe(true));
    it("MANAGER cannot manage", () => expect(canManageLeaveBalance("MANAGER")).toBe(false));
    it("EMPLOYEE cannot manage", () => expect(canManageLeaveBalance("EMPLOYEE")).toBe(false));
  });

  describe("canCreateLeaveRequest — All authenticated", () => {
    it("all roles can create", () => {
      expect(canCreateLeaveRequest("ADMIN")).toBe(true);
      expect(canCreateLeaveRequest("MANAGER")).toBe(true);
      expect(canCreateLeaveRequest("EMPLOYEE")).toBe(true);
    });
  });

  describe("canEditLeaveRequest — Owner + PENDING only", () => {
    it("owner can edit PENDING", () =>
      expect(canEditLeaveRequest("EMPLOYEE", employeeId, employeeId, "PENDING")).toBe(true));
    it("owner cannot edit APPROVED", () =>
      expect(canEditLeaveRequest("EMPLOYEE", employeeId, employeeId, "APPROVED")).toBe(false));
    it("non-owner cannot edit", () =>
      expect(canEditLeaveRequest("EMPLOYEE", otherEmployeeId, employeeId, "PENDING")).toBe(false));
    it("ADMIN cannot edit others' requests", () =>
      expect(canEditLeaveRequest("ADMIN", otherEmployeeId, adminId, "PENDING")).toBe(false));
  });

  describe("canApproveLeaveRequest — No self-approval", () => {
    it("ADMIN can approve others", () => expect(canApproveLeaveRequest("ADMIN", adminId, employeeId, null)).toBe(true));
    it("ADMIN cannot self-approve", () => expect(canApproveLeaveRequest("ADMIN", adminId, adminId, null)).toBe(false));
    it("MANAGER approves direct report", () =>
      expect(canApproveLeaveRequest("MANAGER", managerId, employeeId, managerId)).toBe(true));
    it("MANAGER cannot approve non-report", () =>
      expect(canApproveLeaveRequest("MANAGER", managerId, employeeId, "other-manager")).toBe(false));
    it("MANAGER cannot self-approve", () =>
      expect(canApproveLeaveRequest("MANAGER", managerId, managerId, managerId)).toBe(false));
    it("EMPLOYEE cannot approve anyone", () =>
      expect(canApproveLeaveRequest("EMPLOYEE", employeeId, otherEmployeeId, null)).toBe(false));
  });

  describe("canViewAuditLogs — Admin only", () => {
    it("ADMIN can view", () => expect(canViewAuditLogs("ADMIN")).toBe(true));
    it("MANAGER cannot view", () => expect(canViewAuditLogs("MANAGER")).toBe(false));
    it("EMPLOYEE cannot view", () => expect(canViewAuditLogs("EMPLOYEE")).toBe(false));
  });

  describe("isActiveEmployee — Status check", () => {
    it("ACTIVE is active", () => expect(isActiveEmployee("ACTIVE")).toBe(true));
    it("INACTIVE is not active", () => expect(isActiveEmployee("INACTIVE")).toBe(false));
    it("TERMINATED is not active", () => expect(isActiveEmployee("TERMINATED")).toBe(false));
  });

  describe("canManageConfiguration — Admin only (Phase 4)", () => {
    it("ADMIN can manage configuration", () => expect(canManageConfiguration("ADMIN")).toBe(true));
    it("MANAGER cannot manage configuration", () => expect(canManageConfiguration("MANAGER")).toBe(false));
    it("EMPLOYEE cannot manage configuration", () => expect(canManageConfiguration("EMPLOYEE")).toBe(false));
  });
});
