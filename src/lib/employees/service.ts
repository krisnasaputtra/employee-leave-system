import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

import type { EmployeeCreateInput } from "./schemas";

interface CreateEmployeeResult {
  success: boolean;
  employeeId?: string;
  temporaryPassword?: string;
  error?: string;
}

/**
 * Server-only orchestration for creating an employee with optional auth account.
 * Uses the admin client to bypass RLS for provisioning.
 *
 * Flow:
 * 1. Validate unique email and employee code
 * 2. Create Supabase Auth user (if requested)
 * 3. Create employee record
 * 4. Initialize current-year leave balances
 * 5. Write audit log
 * 6. Compensation cleanup on partial failure
 */
export async function createEmployeeWithAccount(
  input: EmployeeCreateInput,
  actorEmployeeId: string,
): Promise<CreateEmployeeResult> {
  const admin = createAdminClient();
  let authUserId: string | null = null;

  try {
    // Step 1: Check unique constraints
    const { data: existingCode } = await admin
      .from("employees")
      .select("id")
      .eq("employee_code", input.employee_code)
      .maybeSingle();

    if (existingCode) {
      return {
        success: false,
        error: "An employee with this code already exists.",
      };
    }

    const { data: existingEmail } = await admin
      .from("employees")
      .select("id")
      .eq("work_email", input.work_email)
      .maybeSingle();

    if (existingEmail) {
      return {
        success: false,
        error: "An employee with this email already exists.",
      };
    }

    // Step 2: Create Auth user (if requested)
    if (input.create_account && input.temporary_password) {
      const { data: authData, error: authError } = await admin.auth.admin.createUser({
        email: input.work_email,
        password: input.temporary_password,
        email_confirm: true,
      });

      if (authError) {
        return {
          success: false,
          error: `Failed to create auth account: ${authError.message}`,
        };
      }

      authUserId = authData.user.id;
    }

    // Step 3: Create employee record
    const { data: employee, error: employeeError } = await admin
      .from("employees")
      .insert({
        employee_code: input.employee_code,
        full_name: input.full_name,
        work_email: input.work_email,
        phone_number: input.phone_number || null,
        department_id: input.department_id,
        position: input.position,
        manager_id: input.manager_id || null,
        join_date: input.join_date,
        role: input.role,
        status: input.status,
        auth_user_id: authUserId,
        must_change_password: input.create_account,
      })
      .select("id")
      .single();

    if (employeeError || !employee) {
      // Compensation: delete the Auth user if it was created
      if (authUserId) {
        await admin.auth.admin.deleteUser(authUserId);
      }
      return {
        success: false,
        error: `Failed to create employee: ${employeeError?.message ?? "Unknown error"}`,
      };
    }

    // Step 4: Initialize current-year leave balances via RPC
    // This creates balance rows AND ENTITLEMENT ledger entries for audit trail
    await admin.rpc("initialize_employee_balances", {
      p_employee_id: employee.id,
      p_year: new Date().getFullYear(),
    });

    // Step 5: Write audit log
    await admin.from("audit_logs").insert({
      actor_employee_id: actorEmployeeId,
      action: "EMPLOYEE_CREATED",
      entity_type: "employee",
      entity_id: employee.id,
      metadata: {
        employee_code: input.employee_code,
        full_name: input.full_name,
        work_email: input.work_email,
        role: input.role,
        has_account: input.create_account,
      },
    });

    return {
      success: true,
      employeeId: employee.id,
      temporaryPassword: input.create_account ? input.temporary_password : undefined,
    };
  } catch (error) {
    // Compensation: delete the Auth user if it was created
    if (authUserId) {
      try {
        await admin.auth.admin.deleteUser(authUserId);
      } catch {
        console.error("Failed to cleanup auth user after error");
      }
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred.",
    };
  }
}

/**
 * Deactivate an employee and ban their Auth account.
 */
export async function deactivateEmployee(
  employeeId: string,
  actorEmployeeId: string,
): Promise<{ success: boolean; error?: string }> {
  const admin = createAdminClient();

  // Load the employee
  const { data: employee, error: loadError } = await admin
    .from("employees")
    .select("id, auth_user_id, full_name, status")
    .eq("id", employeeId)
    .single();

  if (loadError || !employee) {
    return { success: false, error: "Employee not found." };
  }

  if (employee.status !== "ACTIVE") {
    return { success: false, error: "Employee is already inactive." };
  }

  // Update employee status
  const { error: updateError } = await admin.from("employees").update({ status: "INACTIVE" }).eq("id", employeeId);

  if (updateError) {
    return {
      success: false,
      error: `Failed to deactivate: ${updateError.message}`,
    };
  }

  // Ban the Auth user if linked
  if (employee.auth_user_id) {
    const { error: banError } = await admin.auth.admin.updateUserById(employee.auth_user_id, {
      ban_duration: "876600h",
    });

    if (banError) {
      console.error("Failed to ban auth user:", banError.message);
    }
  }

  // Write audit log
  await admin.from("audit_logs").insert({
    actor_employee_id: actorEmployeeId,
    action: "EMPLOYEE_DEACTIVATED",
    entity_type: "employee",
    entity_id: employeeId,
    metadata: {
      old_status: employee.status,
      new_status: "INACTIVE",
    },
  });

  return { success: true };
}
