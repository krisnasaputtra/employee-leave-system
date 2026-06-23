"use server";

import { revalidatePath } from "next/cache";

import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { employeeCreateSchema, employeeUpdateSchema } from "@/lib/employees/schemas";
import { createEmployeeWithAccount, deactivateEmployee } from "@/lib/employees/service";
import { canManageEmployees } from "@/lib/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { sanitizeDbError } from "@/lib/utils/sanitize-error";
import type { Database } from "@/types/database.types";

type EmployeeUpdate = Database["public"]["Tables"]["employees"]["Update"];

interface ActionResult {
  success: boolean;
  error?: string;
  temporaryPassword?: string;
  employeeId?: string;
}

export async function createEmployeeAction(input: Record<string, unknown>): Promise<ActionResult> {
  // 1. Authenticate
  const { employee: actor } = await getAuthenticatedUser();

  // 2. Authorize
  if (!canManageEmployees(actor.role)) {
    return {
      success: false,
      error: "You do not have permission to create employees.",
    };
  }

  // 3. Validate
  const parsed = employeeCreateSchema.safeParse(input);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return {
      success: false,
      error: firstError?.message ?? "Validation failed.",
    };
  }

  // 4. Execute
  const result = await createEmployeeWithAccount(parsed.data, actor.id);

  if (result.success) {
    revalidatePath("/dashboard/employees");
  }

  return result;
}

export async function updateEmployeeAction(employeeId: string, input: Record<string, unknown>): Promise<ActionResult> {
  const { employee: actor } = await getAuthenticatedUser();

  if (!canManageEmployees(actor.role)) {
    return {
      success: false,
      error: "You do not have permission to edit employees.",
    };
  }

  const parsed = employeeUpdateSchema.safeParse(input);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return {
      success: false,
      error: firstError?.message ?? "Validation failed.",
    };
  }

  const admin = createAdminClient();
  const updateData: EmployeeUpdate = {};

  for (const [key, value] of Object.entries(parsed.data)) {
    if (value !== undefined) {
      const safeValue = key === "manager_id" || key === "phone_number" ? (value as string) || null : value;
      (updateData as Record<string, unknown>)[key] = safeValue;
    }
  }

  const { error } = await admin.from("employees").update(updateData).eq("id", employeeId);

  if (error) {
    return {
      success: false,
      error: sanitizeDbError(error, "Failed to update employee."),
    };
  }

  // Write audit log
  await admin.from("audit_logs").insert({
    actor_employee_id: actor.id,
    action: "EMPLOYEE_UPDATED",
    entity_type: "employee",
    entity_id: employeeId,
    metadata: updateData as unknown as Record<string, string>,
  });

  revalidatePath("/dashboard/employees");
  revalidatePath(`/dashboard/employees/${employeeId}`);

  return { success: true };
}

export async function deactivateEmployeeAction(employeeId: string): Promise<ActionResult> {
  const { employee: actor } = await getAuthenticatedUser();

  if (!canManageEmployees(actor.role)) {
    return {
      success: false,
      error: "You do not have permission to deactivate employees.",
    };
  }

  if (actor.id === employeeId) {
    return {
      success: false,
      error: "You cannot deactivate your own account.",
    };
  }

  const result = await deactivateEmployee(employeeId, actor.id);

  if (result.success) {
    revalidatePath("/dashboard/employees");
  }

  return result;
}
