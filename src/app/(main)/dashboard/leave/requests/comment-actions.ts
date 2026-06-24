"use server";

import { revalidatePath } from "next/cache";

import { z } from "zod";

import { isNextInternalError } from "@/lib/utils/server-action-utils";

import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { createClient } from "@/lib/supabase/server";

const commentSchema = z.object({
  request_id: z.string().uuid(),
  comment: z
    .string()
    .min(1, "Comment cannot be empty.")
    .max(500, "Comment must be at most 500 characters."),
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

    const supabase = await createClient();

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
