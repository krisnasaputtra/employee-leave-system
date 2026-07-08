"use server";

import { revalidatePath } from "next/cache";

import { z } from "zod";

import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { canCommentOnLeaveRequest } from "@/lib/leave-requests/access";
import { createAdminClient } from "@/lib/supabase/admin";
import { isNextInternalError } from "@/lib/utils/server-action-utils";

const commentSchema = z.object({
  request_id: z.string().uuid(),
  comment: z.string().min(1, "Comment cannot be empty.").max(500, "Comment must be at most 500 characters."),
});

export async function addCommentAction(input: Record<string, unknown>) {
  try {
    const { employee: actor } = await getAuthenticatedUser();
    const parsed = commentSchema.safeParse(input);

    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Validation failed.",
      };
    }

    const supabase = createAdminClient();

    const { data: request } = await supabase
      .from("leave_requests")
      .select("employee_id")
      .eq("id", parsed.data.request_id)
      .single();

    if (!request) {
      return { success: false, error: "Leave request not found." };
    }

    const { data: requester } = await supabase
      .from("employees")
      .select("manager_id")
      .eq("id", request.employee_id)
      .single();

    let hasActiveApprovalDelegation = false;
    if (request.employee_id !== actor.id && requester?.manager_id) {
      const today = new Date().toISOString().split("T")[0];
      const { data: delegation } = await supabase
        .from("approval_delegations")
        .select("id")
        .eq("delegate_id", actor.id)
        .eq("delegator_id", requester.manager_id)
        .eq("is_active", true)
        .lte("start_date", today)
        .gte("end_date", today)
        .limit(1);

      hasActiveApprovalDelegation = (delegation ?? []).length > 0;
    }

    const canComment = canCommentOnLeaveRequest({
      actorId: actor.id,
      actorRole: actor.role,
      requesterId: request.employee_id,
      requesterManagerId: requester?.manager_id ?? null,
      hasActiveApprovalDelegation,
    });

    if (!canComment) {
      return { success: false, error: "You do not have permission to comment on this request." };
    }

    // Store comment as an audit log entry
    const { error } = await supabase.from("audit_logs").insert({
      actor_employee_id: actor.id,
      action: "COMMENT_ADDED",
      entity_type: "leave_request",
      entity_id: parsed.data.request_id,
      metadata: {
        comment: parsed.data.comment,
        actor_name: actor.full_name,
      },
    });

    if (error) return { success: false, error: "Failed to add comment." };

    revalidatePath(`/dashboard/leave/requests/${parsed.data.request_id}`);
    return { success: true };
  } catch (error) {
    if (isNextInternalError(error)) throw error;
    return { success: false, error: "An unexpected error occurred." };
  }
}
