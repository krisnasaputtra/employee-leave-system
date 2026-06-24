"use server";

import { revalidatePath } from "next/cache";

import { isNextInternalError } from "@/lib/utils/server-action-utils";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { canManageConfiguration } from "@/lib/permissions";
import {
  departmentCreateSchema,
  departmentUpdateSchema,
  holidayCreateSchema,
  holidayUpdateSchema,
  leaveTypeCreateSchema,
  leaveTypeUpdateSchema,
} from "@/lib/settings/schemas";
import { createAdminClient } from "@/lib/supabase/admin";
import { sanitizeDbError } from "@/lib/utils/sanitize-error";
import type { Database } from "@/types/database.types";

// =============================================================
// Shared types
// =============================================================

type DepartmentUpdate = Database["public"]["Tables"]["departments"]["Update"];
type LeaveTypeUpdate = Database["public"]["Tables"]["leave_types"]["Update"];
type HolidayUpdate = Database["public"]["Tables"]["holidays"]["Update"];

interface ActionResult {
  success: boolean;
  error?: string;
  warning?: string;
}

// =============================================================
// Department actions
// =============================================================

export async function createDepartmentAction(input: Record<string, unknown>): Promise<ActionResult> {
  try {
  // 1. Authenticate
  const { employee: actor } = await getAuthenticatedUser();

  // 2. Authorize
  if (!canManageConfiguration(actor.role)) {
    return {
      success: false,
      error: "You do not have permission to manage departments.",
    };
  }

  // 3. Validate
  const parsed = departmentCreateSchema.safeParse(input);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return {
      success: false,
      error: firstError?.message ?? "Validation failed.",
    };
  }

  // 4. Execute — check unique code
  const admin = createAdminClient();
  const { data: existing } = await admin.from("departments").select("id").eq("code", parsed.data.code).maybeSingle();

  if (existing) {
    return {
      success: false,
      error: `Department code "${parsed.data.code}" already exists.`,
    };
  }

  const { error } = await admin.from("departments").insert({
    code: parsed.data.code,
    name: parsed.data.name,
    description: parsed.data.description || null,
    manager_employee_id: parsed.data.manager_employee_id || null,
    is_active: parsed.data.is_active,
  });

  if (error) {
    return {
      success: false,
      error: sanitizeDbError(error, "Operation failed."),
    };
  }

  // 5. Audit
  await admin.from("audit_logs").insert({
    actor_employee_id: actor.id,
    action: "DEPARTMENT_CREATED",
    entity_type: "department",
    entity_id: null,
    metadata: { code: parsed.data.code, name: parsed.data.name } as unknown as Record<string, string>,
  });

  // 6. Revalidate
  revalidatePath("/dashboard/settings/departments");

  // 7. Return
  return { success: true };
  } catch (error) {
    if (isNextInternalError(error)) throw error;
    console.error("createDepartmentAction failed:", error);
    return { success: false, error: "An unexpected error occurred. Please try again." };
  }
}

export async function updateDepartmentAction(id: string, input: Record<string, unknown>): Promise<ActionResult> {
  try {
  // 1. Authenticate
  const { employee: actor } = await getAuthenticatedUser();

  // 2. Authorize
  if (!canManageConfiguration(actor.role)) {
    return {
      success: false,
      error: "You do not have permission to manage departments.",
    };
  }

  // 3. Validate
  const parsed = departmentUpdateSchema.safeParse(input);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return {
      success: false,
      error: firstError?.message ?? "Validation failed.",
    };
  }

  // 4. Execute — build typed update object
  const admin = createAdminClient();
  const updateData: DepartmentUpdate = {};

  for (const [key, value] of Object.entries(parsed.data)) {
    if (value !== undefined) {
      const safeValue = key === "manager_employee_id" || key === "description" ? (value as string) || null : value;
      (updateData as Record<string, unknown>)[key] = safeValue;
    }
  }

  const { error } = await admin.from("departments").update(updateData).eq("id", id);

  if (error) {
    return {
      success: false,
      error: sanitizeDbError(error, "Operation failed."),
    };
  }

  // 5. Audit
  await admin.from("audit_logs").insert({
    actor_employee_id: actor.id,
    action: "DEPARTMENT_UPDATED",
    entity_type: "department",
    entity_id: id,
    metadata: updateData as unknown as Record<string, string>,
  });

  // 6. Revalidate
  revalidatePath("/dashboard/settings/departments");

  // 7. Return
  return { success: true };
  } catch (error) {
    if (isNextInternalError(error)) throw error;
    console.error("updateDepartmentAction failed:", error);
    return { success: false, error: "An unexpected error occurred. Please try again." };
  }
}

export async function toggleDepartmentAction(id: string): Promise<ActionResult> {
  try {
  // 1. Authenticate
  const { employee: actor } = await getAuthenticatedUser();

  // 2. Authorize
  if (!canManageConfiguration(actor.role)) {
    return {
      success: false,
      error: "You do not have permission to manage departments.",
    };
  }

  // 3. Load current state
  const admin = createAdminClient();
  const { data: department, error: fetchError } = await admin
    .from("departments")
    .select("id, is_active")
    .eq("id", id)
    .single();

  if (fetchError || !department) {
    return { success: false, error: "Department not found." };
  }

  const newStatus = !department.is_active;

  // 4. Before deactivating: check for active employees
  if (!newStatus) {
    const { count } = await admin
      .from("employees")
      .select("id", { count: "exact", head: true })
      .eq("department_id", id)
      .eq("status", "ACTIVE");

    if (count && count > 0) {
      return {
        success: false,
        error: `Cannot deactivate: ${count} active employee(s) are assigned to this department.`,
      };
    }
  }

  // 5. Execute
  const { error } = await admin.from("departments").update({ is_active: newStatus }).eq("id", id);

  if (error) {
    return {
      success: false,
      error: sanitizeDbError(error, "Operation failed."),
    };
  }

  // 6. Audit
  await admin.from("audit_logs").insert({
    actor_employee_id: actor.id,
    action: "DEPARTMENT_TOGGLED",
    entity_type: "department",
    entity_id: id,
    metadata: { is_active: newStatus } as unknown as Record<string, string>,
  });

  // 7. Revalidate
  revalidatePath("/dashboard/settings/departments");

  return { success: true };
  } catch (error) {
    if (isNextInternalError(error)) throw error;
    console.error("toggleDepartmentAction failed:", error);
    return { success: false, error: "An unexpected error occurred. Please try again." };
  }
}

// =============================================================
// Leave Type actions
// =============================================================

export async function createLeaveTypeAction(input: Record<string, unknown>): Promise<ActionResult> {
  try {
  // 1. Authenticate
  const { employee: actor } = await getAuthenticatedUser();

  // 2. Authorize
  if (!canManageConfiguration(actor.role)) {
    return {
      success: false,
      error: "You do not have permission to manage leave types.",
    };
  }

  // 3. Validate
  const parsed = leaveTypeCreateSchema.safeParse(input);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return {
      success: false,
      error: firstError?.message ?? "Validation failed.",
    };
  }

  // 4. Execute — check unique code
  const admin = createAdminClient();
  const { data: existing } = await admin.from("leave_types").select("id").eq("code", parsed.data.code).maybeSingle();

  if (existing) {
    return {
      success: false,
      error: `Leave type code "${parsed.data.code}" already exists.`,
    };
  }

  const { error } = await admin.from("leave_types").insert({
    code: parsed.data.code,
    name: parsed.data.name,
    description: parsed.data.description || null,
    default_entitlement: parsed.data.default_entitlement,
    color: parsed.data.color,
    deducts_balance: parsed.data.deducts_balance,
    allow_negative_balance: parsed.data.allow_negative_balance,
    requires_attachment: parsed.data.requires_attachment,
    show_type_on_calendar: parsed.data.show_type_on_calendar,
    is_active: parsed.data.is_active,
  });

  if (error) {
    return {
      success: false,
      error: sanitizeDbError(error, "Operation failed."),
    };
  }

  // 5. Audit
  await admin.from("audit_logs").insert({
    actor_employee_id: actor.id,
    action: "LEAVE_TYPE_CREATED",
    entity_type: "leave_type",
    entity_id: null,
    metadata: { code: parsed.data.code, name: parsed.data.name } as unknown as Record<string, string>,
  });

  // 6. Revalidate
  revalidatePath("/dashboard/settings/leave-types");

  // 7. Return
  return { success: true };
  } catch (error) {
    if (isNextInternalError(error)) throw error;
    console.error("createLeaveTypeAction failed:", error);
    return { success: false, error: "An unexpected error occurred. Please try again." };
  }
}

export async function updateLeaveTypeAction(id: string, input: Record<string, unknown>): Promise<ActionResult> {
  try {
  // 1. Authenticate
  const { employee: actor } = await getAuthenticatedUser();

  // 2. Authorize
  if (!canManageConfiguration(actor.role)) {
    return {
      success: false,
      error: "You do not have permission to manage leave types.",
    };
  }

  // 3. Validate
  const parsed = leaveTypeUpdateSchema.safeParse(input);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return {
      success: false,
      error: firstError?.message ?? "Validation failed.",
    };
  }

  // 4. Execute — build typed update object
  const admin = createAdminClient();
  const updateData: LeaveTypeUpdate = {};

  for (const [key, value] of Object.entries(parsed.data)) {
    if (value !== undefined) {
      const safeValue = key === "description" ? (value as string) || null : value;
      (updateData as Record<string, unknown>)[key] = safeValue;
    }
  }

  const { error } = await admin.from("leave_types").update(updateData).eq("id", id);

  if (error) {
    return {
      success: false,
      error: sanitizeDbError(error, "Operation failed."),
    };
  }

  // 5. Audit
  await admin.from("audit_logs").insert({
    actor_employee_id: actor.id,
    action: "LEAVE_TYPE_UPDATED",
    entity_type: "leave_type",
    entity_id: id,
    metadata: updateData as unknown as Record<string, string>,
  });

  // 6. Revalidate
  revalidatePath("/dashboard/settings/leave-types");

  // 7. Return
  return { success: true };
  } catch (error) {
    if (isNextInternalError(error)) throw error;
    console.error("updateLeaveTypeAction failed:", error);
    return { success: false, error: "An unexpected error occurred. Please try again." };
  }
}

export async function toggleLeaveTypeAction(id: string): Promise<ActionResult> {
  try {
  // 1. Authenticate
  const { employee: actor } = await getAuthenticatedUser();

  // 2. Authorize
  if (!canManageConfiguration(actor.role)) {
    return {
      success: false,
      error: "You do not have permission to manage leave types.",
    };
  }

  // 3. Load current state
  const admin = createAdminClient();
  const { data: leaveType, error: fetchError } = await admin
    .from("leave_types")
    .select("id, is_active")
    .eq("id", id)
    .single();

  if (fetchError || !leaveType) {
    return { success: false, error: "Leave type not found." };
  }

  const newStatus = !leaveType.is_active;

  // 4. Before deactivating: check for pending leave requests
  if (!newStatus) {
    const { count } = await admin
      .from("leave_requests")
      .select("id", { count: "exact", head: true })
      .eq("leave_type_id", id)
      .eq("status", "PENDING");

    if (count && count > 0) {
      return {
        success: false,
        error: `Cannot deactivate: ${count} pending leave request(s) use this leave type.`,
      };
    }
  }

  // 5. Execute
  const { error } = await admin.from("leave_types").update({ is_active: newStatus }).eq("id", id);

  if (error) {
    return {
      success: false,
      error: sanitizeDbError(error, "Operation failed."),
    };
  }

  // 6. Audit
  await admin.from("audit_logs").insert({
    actor_employee_id: actor.id,
    action: "LEAVE_TYPE_TOGGLED",
    entity_type: "leave_type",
    entity_id: id,
    metadata: { is_active: newStatus } as unknown as Record<string, string>,
  });

  // 7. Revalidate
  revalidatePath("/dashboard/settings/leave-types");

  return { success: true };
  } catch (error) {
    if (isNextInternalError(error)) throw error;
    console.error("toggleLeaveTypeAction failed:", error);
    return { success: false, error: "An unexpected error occurred. Please try again." };
  }
}

// =============================================================
// Holiday actions
// =============================================================

export async function createHolidayAction(input: Record<string, unknown>): Promise<ActionResult> {
  try {
  // 1. Authenticate
  const { employee: actor } = await getAuthenticatedUser();

  // 2. Authorize
  if (!canManageConfiguration(actor.role)) {
    return {
      success: false,
      error: "You do not have permission to manage holidays.",
    };
  }

  // 3. Validate
  const parsed = holidayCreateSchema.safeParse(input);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return {
      success: false,
      error: firstError?.message ?? "Validation failed.",
    };
  }

  // 4. Execute — check for duplicate date (warn but allow)
  const admin = createAdminClient();
  let warning: string | undefined;

  const { data: existingOnDate } = await admin
    .from("holidays")
    .select("id, name")
    .eq("holiday_date", parsed.data.holiday_date)
    .maybeSingle();

  if (existingOnDate) {
    warning = `Another holiday ("${existingOnDate.name}") already exists on this date.`;
  }

  const { error } = await admin.from("holidays").insert({
    name: parsed.data.name,
    holiday_date: parsed.data.holiday_date,
    is_recurring: parsed.data.is_recurring,
    is_active: parsed.data.is_active,
  });

  if (error) {
    return {
      success: false,
      error: sanitizeDbError(error, "Operation failed."),
    };
  }

  // 5. Audit
  await admin.from("audit_logs").insert({
    actor_employee_id: actor.id,
    action: "HOLIDAY_CREATED",
    entity_type: "holiday",
    entity_id: null,
    metadata: {
      name: parsed.data.name,
      holiday_date: parsed.data.holiday_date,
    } as unknown as Record<string, string>,
  });

  // 6. Revalidate
  revalidatePath("/dashboard/settings/holidays");

  // 7. Return
  return { success: true, warning };
  } catch (error) {
    if (isNextInternalError(error)) throw error;
    console.error("createHolidayAction failed:", error);
    return { success: false, error: "An unexpected error occurred. Please try again." };
  }
}

export async function updateHolidayAction(id: string, input: Record<string, unknown>): Promise<ActionResult> {
  try {
  // 1. Authenticate
  const { employee: actor } = await getAuthenticatedUser();

  // 2. Authorize
  if (!canManageConfiguration(actor.role)) {
    return {
      success: false,
      error: "You do not have permission to manage holidays.",
    };
  }

  // 3. Validate
  const parsed = holidayUpdateSchema.safeParse(input);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return {
      success: false,
      error: firstError?.message ?? "Validation failed.",
    };
  }

  // 4. Execute — build typed update object
  const admin = createAdminClient();
  const updateData: HolidayUpdate = {};

  for (const [key, value] of Object.entries(parsed.data)) {
    if (value !== undefined) {
      (updateData as Record<string, unknown>)[key] = value;
    }
  }

  const { error } = await admin.from("holidays").update(updateData).eq("id", id);

  if (error) {
    return {
      success: false,
      error: sanitizeDbError(error, "Operation failed."),
    };
  }

  // 5. Audit
  await admin.from("audit_logs").insert({
    actor_employee_id: actor.id,
    action: "HOLIDAY_UPDATED",
    entity_type: "holiday",
    entity_id: id,
    metadata: updateData as unknown as Record<string, string>,
  });

  // 6. Revalidate
  revalidatePath("/dashboard/settings/holidays");

  // 7. Return
  return { success: true };
  } catch (error) {
    if (isNextInternalError(error)) throw error;
    console.error("updateHolidayAction failed:", error);
    return { success: false, error: "An unexpected error occurred. Please try again." };
  }
}

export async function toggleHolidayAction(id: string): Promise<ActionResult> {
  try {
  // 1. Authenticate
  const { employee: actor } = await getAuthenticatedUser();

  // 2. Authorize
  if (!canManageConfiguration(actor.role)) {
    return {
      success: false,
      error: "You do not have permission to manage holidays.",
    };
  }

  // 3. Load current state
  const admin = createAdminClient();
  const { data: holiday, error: fetchError } = await admin
    .from("holidays")
    .select("id, is_active")
    .eq("id", id)
    .single();

  if (fetchError || !holiday) {
    return { success: false, error: "Holiday not found." };
  }

  const newStatus = !holiday.is_active;

  // 4. Execute
  const { error } = await admin.from("holidays").update({ is_active: newStatus }).eq("id", id);

  if (error) {
    return {
      success: false,
      error: sanitizeDbError(error, "Operation failed."),
    };
  }

  // 5. Audit
  await admin.from("audit_logs").insert({
    actor_employee_id: actor.id,
    action: "HOLIDAY_TOGGLED",
    entity_type: "holiday",
    entity_id: id,
    metadata: { is_active: newStatus } as unknown as Record<string, string>,
  });

  // 6. Revalidate
  revalidatePath("/dashboard/settings/holidays");

  return { success: true };
  } catch (error) {
    if (isNextInternalError(error)) throw error;
    console.error("toggleHolidayAction failed:", error);
    return { success: false, error: "An unexpected error occurred. Please try again." };
  }
}
