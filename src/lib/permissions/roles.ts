import type { Database } from "@/types/database.types";

export type ApplicationRole = Database["public"]["Enums"]["application_role"];
export type EmploymentStatus = Database["public"]["Enums"]["employment_status"];

export interface AuthEmployee {
  id: string;
  auth_user_id: string | null;
  full_name: string;
  work_email: string;
  role: ApplicationRole;
  status: EmploymentStatus;
  manager_id: string | null;
  must_change_password: boolean;
  department_id: string;
  position: string;
}

export function canManageEmployees(role: ApplicationRole): boolean {
  return role === "ADMIN";
}

/** Admin-only: manage departments, leave types, and holidays */
export function canManageConfiguration(role: ApplicationRole): boolean {
  return role === "ADMIN";
}

export function canViewEmployee(
  role: ApplicationRole,
  viewerId: string,
  targetId: string,
  targetManagerId: string | null,
): boolean {
  if (role === "ADMIN") return true;
  if (viewerId === targetId) return true;
  if (role === "MANAGER" && targetManagerId === viewerId) return true;
  return false;
}

export function canManageLeaveBalance(role: ApplicationRole): boolean {
  return role === "ADMIN";
}

export function canCreateLeaveRequest(_role: ApplicationRole): boolean {
  return true;
}

export function canEditLeaveRequest(
  _role: ApplicationRole,
  requesterId: string,
  currentUserId: string,
  status: string,
): boolean {
  return requesterId === currentUserId && status === "PENDING";
}

export function canApproveLeaveRequest(
  role: ApplicationRole,
  approverId: string,
  requesterId: string,
  requesterManagerId: string | null,
): boolean {
  if (approverId === requesterId) return false;
  if (role === "ADMIN") return true;
  if (role === "MANAGER" && requesterManagerId === approverId) return true;
  return false;
}

export function canViewAuditLogs(role: ApplicationRole): boolean {
  return role === "ADMIN";
}

export function isActiveEmployee(status: EmploymentStatus): boolean {
  return status === "ACTIVE";
}
