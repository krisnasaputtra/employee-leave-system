"use server";

import { revalidatePath } from "next/cache";

import { approvalRequestIdSchema, bulkApprovalRequestIdsSchema, leaveRejectionSchema } from "@/lib/approvals/schemas";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { sendEmail } from "@/lib/email/send";
import { leaveApprovedTemplate, leaveRejectedTemplate } from "@/lib/email/templates";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { sanitizeDbError } from "@/lib/utils/sanitize-error";
import { isNextInternalError } from "@/lib/utils/server-action-utils";

interface ActionResult {
  success: boolean;
  error?: string;
  request_id?: string;
  request_number?: string;
}

export async function approveLeaveRequestAction(requestId: string): Promise<ActionResult> {
  try {
    const { employee: _actor } = await getAuthenticatedUser();

    const parsedId = approvalRequestIdSchema.safeParse(requestId);
    if (!parsedId.success) {
      return { success: false, error: parsedId.error.issues[0]?.message ?? "Validation failed." };
    }

    const supabase = await createClient();

    const { data, error } = await supabase.rpc("approve_leave_request", {
      p_request_id: parsedId.data,
    });

    if (error) {
      return { success: false, error: sanitizeDbError(error, "Failed to approve request.") };
    }

    const result = data as Record<string, unknown> | null;

    revalidatePath("/dashboard/approvals");
    revalidatePath("/dashboard/leave/requests");
    revalidatePath("/dashboard/leave/balances");
    revalidatePath(`/dashboard/leave/requests/${parsedId.data}`);

    // Fire-and-forget: email notification to employee
    const requestNumber = (result?.request_number as string) ?? "";
    void (async () => {
      try {
        const admin = createAdminClient();

        // Fetch the leave request with employee and leave type details
        const { data: request } = await admin
          .from("leave_requests")
          .select("employee_id, leave_type_id, start_date, end_date, requested_days")
          .eq("id", parsedId.data)
          .single();

        if (!request) return;

        const { data: emp } = await admin
          .from("employees")
          .select("work_email, full_name")
          .eq("id", request.employee_id)
          .single();

        const { data: leaveType } = await admin
          .from("leave_types")
          .select("name")
          .eq("id", request.leave_type_id)
          .single();

        if (emp?.work_email) {
          const template = leaveApprovedTemplate({
            employeeName: emp.full_name,
            leaveType: leaveType?.name ?? "Leave",
            startDate: request.start_date,
            endDate: request.end_date,
            days: request.requested_days,
            requestNumber,
            requestId: parsedId.data,
            approverName: _actor.full_name,
          });
          await sendEmail({ to: emp.work_email, ...template });
        }
      } catch (emailErr) {
        console.error("[Email] leaveApproved notification failed:", emailErr);
      }
    })();

    return {
      success: true,
      request_id: parsedId.data,
      request_number: requestNumber,
    };
  } catch (error) {
    if (isNextInternalError(error)) throw error;
    console.error("approveLeaveRequestAction failed:", error);
    return { success: false, error: "An unexpected error occurred. Please try again." };
  }
}

export async function rejectLeaveRequestAction(
  requestId: string,
  input: Record<string, unknown>,
): Promise<ActionResult> {
  try {
    const { employee: _actor } = await getAuthenticatedUser();

    const parsedId = approvalRequestIdSchema.safeParse(requestId);
    if (!parsedId.success) {
      return { success: false, error: parsedId.error.issues[0]?.message ?? "Validation failed." };
    }

    const parsed = leaveRejectionSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Validation failed." };
    }

    const supabase = await createClient();

    const { data, error } = await supabase.rpc("reject_leave_request", {
      p_request_id: parsedId.data,
      p_rejection_reason: parsed.data.rejection_reason,
    });

    if (error) {
      return { success: false, error: sanitizeDbError(error, "Failed to reject request.") };
    }

    const result = data as Record<string, unknown> | null;

    revalidatePath("/dashboard/approvals");
    revalidatePath("/dashboard/leave/requests");
    revalidatePath("/dashboard/leave/balances");
    revalidatePath(`/dashboard/leave/requests/${parsedId.data}`);

    // Fire-and-forget: email notification to employee
    const requestNumber = (result?.request_number as string) ?? "";
    void (async () => {
      try {
        const admin = createAdminClient();

        const { data: request } = await admin
          .from("leave_requests")
          .select("employee_id, leave_type_id, start_date, end_date, requested_days")
          .eq("id", parsedId.data)
          .single();

        if (!request) return;

        const { data: emp } = await admin
          .from("employees")
          .select("work_email, full_name")
          .eq("id", request.employee_id)
          .single();

        const { data: leaveType } = await admin
          .from("leave_types")
          .select("name")
          .eq("id", request.leave_type_id)
          .single();

        if (emp?.work_email) {
          const template = leaveRejectedTemplate({
            employeeName: emp.full_name,
            leaveType: leaveType?.name ?? "Leave",
            startDate: request.start_date,
            endDate: request.end_date,
            days: request.requested_days,
            requestNumber,
            requestId: parsedId.data,
            approverName: _actor.full_name,
            rejectionReason: parsed.data.rejection_reason,
          });
          await sendEmail({ to: emp.work_email, ...template });
        }
      } catch (emailErr) {
        console.error("[Email] leaveRejected notification failed:", emailErr);
      }
    })();

    return {
      success: true,
      request_id: parsedId.data,
      request_number: requestNumber,
    };
  } catch (error) {
    if (isNextInternalError(error)) throw error;
    console.error("rejectLeaveRequestAction failed:", error);
    return { success: false, error: "An unexpected error occurred. Please try again." };
  }
}

export async function bulkApproveAction(requestIds: string[]) {
  try {
    await getAuthenticatedUser();

    const parsedIds = bulkApprovalRequestIdsSchema.safeParse(requestIds);
    if (!parsedIds.success) {
      return { success: false, error: parsedIds.error.issues[0]?.message ?? "Validation failed." };
    }

    const supabase = await createClient();
    const settled = await Promise.allSettled(
      parsedIds.data.map((id) => supabase.rpc("approve_leave_request", { p_request_id: id })),
    );
    const results = settled.map((s, i) => ({
      id: parsedIds.data[i],
      success: s.status === "fulfilled" && !s.value.error,
      error:
        s.status === "fulfilled" && s.value.error
          ? sanitizeDbError(s.value.error, "Failed to approve request.")
          : s.status === "rejected"
            ? sanitizeDbError({ message: (s.reason as Error)?.message }, "Failed to approve request.")
            : undefined,
    }));

    revalidatePath("/dashboard/approvals");
    revalidatePath("/dashboard/leave/requests");
    revalidatePath("/dashboard/leave/balances");
    return { success: true, results };
  } catch (error) {
    if (isNextInternalError(error)) throw error;
    return { success: false, error: "Bulk approve failed" };
  }
}

export async function bulkRejectAction(requestIds: string[], reason: string) {
  try {
    await getAuthenticatedUser();

    const parsedIds = bulkApprovalRequestIdsSchema.safeParse(requestIds);
    if (!parsedIds.success) {
      return { success: false, error: parsedIds.error.issues[0]?.message ?? "Validation failed." };
    }

    const parsed = leaveRejectionSchema.safeParse({ rejection_reason: reason });
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Validation failed." };
    }

    const supabase = await createClient();
    const settled = await Promise.allSettled(
      parsedIds.data.map((id) =>
        supabase.rpc("reject_leave_request", { p_request_id: id, p_rejection_reason: parsed.data.rejection_reason }),
      ),
    );
    const results = settled.map((s, i) => ({
      id: parsedIds.data[i],
      success: s.status === "fulfilled" && !s.value.error,
      error:
        s.status === "fulfilled" && s.value.error
          ? sanitizeDbError(s.value.error, "Failed to reject request.")
          : s.status === "rejected"
            ? sanitizeDbError({ message: (s.reason as Error)?.message }, "Failed to reject request.")
            : undefined,
    }));

    revalidatePath("/dashboard/approvals");
    revalidatePath("/dashboard/leave/requests");
    revalidatePath("/dashboard/leave/balances");
    return { success: true, results };
  } catch (error) {
    if (isNextInternalError(error)) throw error;
    return { success: false, error: "Bulk reject failed" };
  }
}
