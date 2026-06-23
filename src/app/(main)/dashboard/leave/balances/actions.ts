"use server";

import { revalidatePath } from "next/cache";

import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { balanceAdjustmentSchema } from "@/lib/balances/schemas";
import { canManageLeaveBalance } from "@/lib/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { sanitizeDbError } from "@/lib/utils/sanitize-error";

interface ActionResult {
  success: boolean;
  error?: string;
  count?: number;
}

export async function adjustLeaveBalanceAction(input: Record<string, unknown>): Promise<ActionResult> {
  // 1. Authenticate
  const { employee: actor } = await getAuthenticatedUser();

  // 2. Authorize
  if (!canManageLeaveBalance(actor.role)) {
    return {
      success: false,
      error: "You do not have permission to adjust leave balances.",
    };
  }

  // 3. Validate
  const parsed = balanceAdjustmentSchema.safeParse(input);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return {
      success: false,
      error: firstError?.message ?? "Validation failed.",
    };
  }

  // 4. Execute RPC
  const admin = createAdminClient();
  const { error } = await admin.rpc("adjust_leave_balance", {
    p_balance_id: parsed.data.balance_id,
    p_days: parsed.data.days,
    p_reason: parsed.data.reason,
  });

  if (error) {
    return {
      success: false,
      error: sanitizeDbError(error, "Failed to adjust balance."),
    };
  }

  revalidatePath("/dashboard/leave/balances");
  revalidatePath("/dashboard/employees");

  return { success: true };
}

export async function initializeBalancesAction(employeeId: string, year?: number): Promise<ActionResult> {
  // 1. Authenticate
  const { employee: actor } = await getAuthenticatedUser();

  // 2. Authorize — admin only
  if (!canManageLeaveBalance(actor.role)) {
    return {
      success: false,
      error: "You do not have permission to initialize leave balances.",
    };
  }

  // 3. Execute RPC
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("initialize_employee_balances", {
    p_employee_id: employeeId,
    p_year: year ?? new Date().getFullYear(),
  });

  if (error) {
    return {
      success: false,
      error: sanitizeDbError(error, "Failed to initialize balances."),
    };
  }

  revalidatePath("/dashboard/leave/balances");
  revalidatePath("/dashboard/employees");

  return { success: true, count: data ?? 0 };
}
