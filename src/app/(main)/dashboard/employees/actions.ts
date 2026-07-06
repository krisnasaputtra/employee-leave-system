"use server";

import { revalidatePath } from "next/cache";

import { auditMetadata } from "@/lib/audit/metadata";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { employeeCreateSchema, employeeUpdateSchema } from "@/lib/employees/schemas";
import { activateEmployee, createEmployeeWithAccount, deactivateEmployee } from "@/lib/employees/service";
import { canManageEmployees } from "@/lib/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { sanitizeDbError } from "@/lib/utils/sanitize-error";
import { isNextInternalError } from "@/lib/utils/server-action-utils";
import type { Database } from "@/types/database.types";

type EmployeeUpdate = Database["public"]["Tables"]["employees"]["Update"];

interface ActionResult {
  success: boolean;
  error?: string;
  temporaryPassword?: string;
  employeeId?: string;
}

export async function createEmployeeAction(input: Record<string, unknown>): Promise<ActionResult> {
  try {
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
  } catch (error) {
    if (isNextInternalError(error)) throw error;
    console.error("createEmployeeAction failed:", error);
    return { success: false, error: "An unexpected error occurred. Please try again." };
  }
}

export async function updateEmployeeAction(employeeId: string, input: Record<string, unknown>): Promise<ActionResult> {
  try {
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
    const updateInput = parsed.data;
    const updateData: EmployeeUpdate = {
      ...(updateInput.full_name !== undefined && { full_name: updateInput.full_name }),
      ...(updateInput.work_email !== undefined && { work_email: updateInput.work_email }),
      ...(updateInput.phone_number !== undefined && { phone_number: updateInput.phone_number || null }),
      ...(updateInput.department_id !== undefined && { department_id: updateInput.department_id }),
      ...(updateInput.position !== undefined && { position: updateInput.position }),
      ...(updateInput.manager_id !== undefined && { manager_id: updateInput.manager_id || null }),
      ...(updateInput.join_date !== undefined && { join_date: updateInput.join_date }),
      ...(updateInput.role !== undefined && { role: updateInput.role }),
      ...(updateInput.status !== undefined && { status: updateInput.status }),
    };

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
      metadata: auditMetadata({ ...updateData }),
    });

    revalidatePath("/dashboard/employees");
    revalidatePath(`/dashboard/employees/${employeeId}`);

    return { success: true };
  } catch (error) {
    if (isNextInternalError(error)) throw error;
    console.error("updateEmployeeAction failed:", error);
    return { success: false, error: "An unexpected error occurred. Please try again." };
  }
}

export async function deactivateEmployeeAction(employeeId: string): Promise<ActionResult> {
  try {
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
  } catch (error) {
    if (isNextInternalError(error)) throw error;
    console.error("deactivateEmployeeAction failed:", error);
    return { success: false, error: "An unexpected error occurred. Please try again." };
  }
}

export async function activateEmployeeAction(employeeId: string): Promise<ActionResult> {
  try {
    const { employee: actor } = await getAuthenticatedUser();

    if (!canManageEmployees(actor.role)) {
      return {
        success: false,
        error: "You do not have permission to activate employees.",
      };
    }

    const result = await activateEmployee(employeeId, actor.id);

    if (result.success) {
      revalidatePath("/dashboard/employees");
    }

    return result;
  } catch (error) {
    if (isNextInternalError(error)) throw error;
    console.error("activateEmployeeAction failed:", error);
    return { success: false, error: "An unexpected error occurred. Please try again." };
  }
}
