"use server";

import { revalidatePath } from "next/cache";

import { isNextInternalError } from "@/lib/utils/server-action-utils";

import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { leaveRequestCreateSchema, leaveRequestUpdateSchema } from "@/lib/leave-requests/schemas";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/send";
import { leaveSubmittedTemplate } from "@/lib/email/templates";

interface ActionResult {
  success: boolean;
  error?: string;
  request_id?: string;
  request_number?: string;
  requested_days?: number;
}

export async function createLeaveRequestAction(input: Record<string, unknown>): Promise<ActionResult> {
  try {
    // 1. Authenticate
    const { employee } = await getAuthenticatedUser();

    // 2. No special role needed — any active employee can create

    // 3. Validate
    const parsed = leaveRequestCreateSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Validation failed.",
      };
    }

    // 4. Execute RPC via user-scoped client (RPC uses auth.uid())
    const supabase = await createClient();

    const { data, error } = await supabase.rpc("create_leave_request", {
      p_leave_type_id: parsed.data.leave_type_id,
      p_start_date: parsed.data.start_date,
      p_end_date: parsed.data.end_date,
      p_partial_day: parsed.data.partial_day,
      p_reason: parsed.data.reason ?? "",
    });

    if (error) {
      // Extract user-friendly message from PostgreSQL error
      const msg = error.message?.replace(/^.*?:\s*/, "") ?? "Failed to create leave request.";
      return { success: false, error: msg };
    }

    const result = data as Record<string, unknown> | null;

    // 5. Revalidate
    revalidatePath("/dashboard/leave/requests");
    revalidatePath("/dashboard/leave/balances");

    // 6. Fire-and-forget: email notification to manager
    const requestId = (result?.request_id as string) ?? "";
    const requestNumber = (result?.request_number as string) ?? "";
    const requestedDays = (result?.requested_days as number) ?? 0;

    if (employee.manager_id && requestId) {
      void (async () => {
        try {
          const admin = createAdminClient();

          // Fetch manager email
          const { data: manager } = await admin
            .from("employees")
            .select("work_email, full_name")
            .eq("id", employee.manager_id!)
            .single();

          // Fetch leave type name
          const { data: leaveType } = await admin
            .from("leave_types")
            .select("name")
            .eq("id", parsed.data.leave_type_id)
            .single();

          if (manager?.work_email) {
            const template = leaveSubmittedTemplate({
              employeeName: employee.full_name,
              leaveType: leaveType?.name ?? "Leave",
              startDate: parsed.data.start_date,
              endDate: parsed.data.end_date,
              days: requestedDays,
              requestNumber,
              requestId,
            });
            await sendEmail({ to: manager.work_email, ...template });
          }
        } catch (emailErr) {
          console.error("[Email] leaveSubmitted notification failed:", emailErr);
        }
      })();
    }

    return {
      success: true,
      request_id: requestId,
      request_number: requestNumber,
      requested_days: requestedDays,
    };
  } catch (error) {
    if (isNextInternalError(error)) throw error;
    console.error('createLeaveRequestAction failed:', error);
    return { success: false, error: 'An unexpected error occurred. Please try again.' };
  }
}

export async function updateLeaveRequestAction(
  requestId: string,
  input: Record<string, unknown>,
): Promise<ActionResult> {
  try {
    await getAuthenticatedUser();

    const parsed = leaveRequestUpdateSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Validation failed.",
      };
    }

    const supabase = await createClient();

    const { data, error } = await supabase.rpc("update_pending_leave_request", {
      p_request_id: requestId,
      p_leave_type_id: parsed.data.leave_type_id,
      p_start_date: parsed.data.start_date,
      p_end_date: parsed.data.end_date,
      p_partial_day: parsed.data.partial_day,
      p_reason: parsed.data.reason ?? "",
    });

    if (error) {
      const msg = error.message?.replace(/^.*?:\s*/, "") ?? "Failed to update leave request.";
      return { success: false, error: msg };
    }

    const result = data as Record<string, unknown> | null;

    revalidatePath("/dashboard/leave/requests");
    revalidatePath("/dashboard/leave/balances");
    revalidatePath(`/dashboard/leave/requests/${requestId}`);

    return {
      success: true,
      request_id: requestId,
      requested_days: (result?.requested_days as number) ?? 0,
    };
  } catch (error) {
    if (isNextInternalError(error)) throw error;
    console.error('updateLeaveRequestAction failed:', error);
    return { success: false, error: 'An unexpected error occurred. Please try again.' };
  }
}

export async function cancelLeaveRequestAction(requestId: string): Promise<ActionResult> {
  try {
    await getAuthenticatedUser();

    const supabase = await createClient();

    const { error } = await supabase.rpc("cancel_leave_request", {
      p_request_id: requestId,
    });

    if (error) {
      const msg = error.message?.replace(/^.*?:\s*/, "") ?? "Failed to cancel leave request.";
      return { success: false, error: msg };
    }

    revalidatePath("/dashboard/leave/requests");
    revalidatePath("/dashboard/leave/balances");
    revalidatePath(`/dashboard/leave/requests/${requestId}`);

    return { success: true, request_id: requestId };
  } catch (error) {
    if (isNextInternalError(error)) throw error;
    console.error('cancelLeaveRequestAction failed:', error);
    return { success: false, error: 'An unexpected error occurred. Please try again.' };
  }
}

