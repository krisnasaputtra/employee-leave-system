"use server";

import { revalidatePath } from "next/cache";

import { isNextInternalError } from "@/lib/utils/server-action-utils";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { balanceAdjustmentSchema } from "@/lib/balances/schemas";
import { canManageLeaveBalance } from "@/lib/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { sanitizeDbError } from "@/lib/utils/sanitize-error";
import { sendEmail } from "@/lib/email/send";
import { balanceAdjustedTemplate } from "@/lib/email/templates";

interface ActionResult {
  success: boolean;
  error?: string;
  count?: number;
}

export async function adjustLeaveBalanceAction(input: Record<string, unknown>): Promise<ActionResult> {
  try {
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

    // Fire-and-forget: email notification to employee
    void (async () => {
      try {
        const adminEmail = createAdminClient();

        // Fetch the balance record with employee and leave type
        const { data: balance } = await adminEmail
          .from("leave_balances")
          .select("employee_id, leave_type_id, entitled_days, adjustment_days, used_days, pending_days")
          .eq("id", parsed.data.balance_id)
          .single();

        if (!balance) return;

        const { data: emp } = await adminEmail
          .from("employees")
          .select("work_email, full_name")
          .eq("id", balance.employee_id)
          .single();

        const { data: leaveType } = await adminEmail
          .from("leave_types")
          .select("name")
          .eq("id", balance.leave_type_id)
          .single();

        if (emp?.work_email) {
          const availableBalance =
            balance.entitled_days + balance.adjustment_days - balance.used_days - balance.pending_days;
          const template = balanceAdjustedTemplate({
            employeeName: emp.full_name,
            leaveType: leaveType?.name ?? "Leave",
            adjustmentDays: parsed.data.days,
            reason: parsed.data.reason,
            newBalance: availableBalance,
          });
          await sendEmail({ to: emp.work_email, ...template });
        }
      } catch (emailErr) {
        console.error("[Email] balanceAdjusted notification failed:", emailErr);
      }
    })();

    return { success: true };
  } catch (error) {
    if (isNextInternalError(error)) throw error;
    console.error("adjustLeaveBalanceAction failed:", error);
    return { success: false, error: "An unexpected error occurred. Please try again." };
  }
}

export async function initializeBalancesAction(employeeId: string, year?: number): Promise<ActionResult> {
  try {
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
  } catch (error) {
    if (isNextInternalError(error)) throw error;
    console.error("initializeBalancesAction failed:", error);
    return { success: false, error: "An unexpected error occurred. Please try again." };
  }
}
