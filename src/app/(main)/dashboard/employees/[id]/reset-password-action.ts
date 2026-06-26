"use server";

import { revalidatePath } from "next/cache";

import { isNextInternalError } from "@/lib/utils/server-action-utils";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { canManageEmployees } from "@/lib/permissions";
import { createAdminClient } from "@/lib/supabase/admin";

import { generateTempPassword } from "./password-utils";

interface ResetPasswordResult {
  success: boolean;
  temporaryPassword?: string;
  error?: string;
}

/**
 * Reset an employee's password to a new temporary password.
 * Only works for employees that already have an auth account.
 */
export async function resetPasswordAction(employeeId: string): Promise<ResetPasswordResult> {
  try {
    const { employee: actor } = await getAuthenticatedUser();

    if (!canManageEmployees(actor.role)) {
      return { success: false, error: "You do not have permission to manage employees." };
    }

    const admin = createAdminClient();

    const { data: employee, error: loadError } = await admin
      .from("employees")
      .select("id, auth_user_id, full_name, work_email")
      .eq("id", employeeId)
      .single();

    if (loadError || !employee) {
      return { success: false, error: "Employee not found." };
    }

    if (!employee.auth_user_id) {
      return { success: false, error: "This employee does not have a login account." };
    }

    const temporaryPassword = generateTempPassword();

    // Update the auth user's password
    const { error: updateError } = await admin.auth.admin.updateUserById(employee.auth_user_id, {
      password: temporaryPassword,
    });

    if (updateError) {
      return { success: false, error: `Failed to reset password: ${updateError.message}` };
    }

    // Set must_change_password flag
    await admin.from("employees").update({ must_change_password: true }).eq("id", employeeId);

    // Audit log
    await admin.from("audit_logs").insert({
      actor_employee_id: actor.id,
      action: "PASSWORD_RESET",
      entity_type: "employee",
      entity_id: employeeId,
      metadata: {
        employee_name: employee.full_name,
        reset_by: actor.id,
      },
    });

    revalidatePath(`/dashboard/employees/${employeeId}`);

    return { success: true, temporaryPassword };
  } catch (error) {
    if (isNextInternalError(error)) throw error;
    console.error("resetPasswordAction failed:", error);
    return { success: false, error: "An unexpected error occurred. Please try again." };
  }
}
