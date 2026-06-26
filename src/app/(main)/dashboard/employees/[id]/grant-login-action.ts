"use server";

import { revalidatePath } from "next/cache";

import { isNextInternalError } from "@/lib/utils/server-action-utils";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { canManageEmployees } from "@/lib/permissions";
import { createAdminClient } from "@/lib/supabase/admin";

interface GrantLoginResult {
  success: boolean;
  temporaryPassword?: string;
  error?: string;
}

/**
 * Grant login access to an existing employee who doesn't have an auth account.
 * Creates a Supabase Auth user, links it to the employee, and returns a temporary password.
 */
export async function grantLoginAccessAction(employeeId: string): Promise<GrantLoginResult> {
  try {
    const { employee: actor } = await getAuthenticatedUser();

    if (!canManageEmployees(actor.role)) {
      return { success: false, error: "You do not have permission to manage employees." };
    }

    const admin = createAdminClient();

    // Load the employee
    const { data: employee, error: loadError } = await admin
      .from("employees")
      .select("id, work_email, full_name, auth_user_id, status")
      .eq("id", employeeId)
      .single();

    if (loadError || !employee) {
      return { success: false, error: "Employee not found." };
    }

    if (employee.auth_user_id) {
      return { success: false, error: "This employee already has login access." };
    }

    if (employee.status !== "ACTIVE") {
      return { success: false, error: "Cannot grant login to an inactive employee." };
    }

    // Generate a temporary password
    const temporaryPassword = `Temp${Math.random().toString(36).slice(2, 8)}!${Math.floor(Math.random() * 90 + 10)}`;

    // Create Supabase Auth user
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email: employee.work_email,
      password: temporaryPassword,
      email_confirm: true,
    });

    if (authError) {
      return { success: false, error: `Failed to create auth account: ${authError.message}` };
    }

    // Link auth user to employee
    const { error: updateError } = await admin
      .from("employees")
      .update({
        auth_user_id: authData.user.id,
        must_change_password: true,
      })
      .eq("id", employeeId);

    if (updateError) {
      // Compensation: delete the auth user
      await admin.auth.admin.deleteUser(authData.user.id);
      return { success: false, error: `Failed to link account: ${updateError.message}` };
    }

    // Audit log
    await admin.from("audit_logs").insert({
      actor_employee_id: actor.id,
      action: "LOGIN_ACCESS_GRANTED",
      entity_type: "employee",
      entity_id: employeeId,
      metadata: {
        employee_name: employee.full_name,
        employee_email: employee.work_email,
      },
    });

    revalidatePath(`/dashboard/employees/${employeeId}`);
    revalidatePath("/dashboard/employees");

    return { success: true, temporaryPassword };
  } catch (error) {
    if (isNextInternalError(error)) throw error;
    console.error("grantLoginAccessAction failed:", error);
    return { success: false, error: "An unexpected error occurred. Please try again." };
  }
}
