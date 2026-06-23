"use server";

import { revalidatePath } from "next/cache";

import { leaveRejectionSchema } from "@/lib/approvals/schemas";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { createClient } from "@/lib/supabase/server";

interface ActionResult {
  success: boolean;
  error?: string;
  request_id?: string;
  request_number?: string;
}

export async function approveLeaveRequestAction(requestId: string): Promise<ActionResult> {
  const { employee: _actor } = await getAuthenticatedUser();

  const supabase = await createClient();

  const { data, error } = await supabase.rpc("approve_leave_request", {
    p_request_id: requestId,
  });

  if (error) {
    const msg = error.message?.replace(/^.*?:\s*/, "") ?? "Failed to approve request.";
    return { success: false, error: msg };
  }

  const result = data as Record<string, unknown> | null;

  revalidatePath("/dashboard/approvals");
  revalidatePath("/dashboard/leave/requests");
  revalidatePath("/dashboard/leave/balances");
  revalidatePath(`/dashboard/leave/requests/${requestId}`);

  return {
    success: true,
    request_id: requestId,
    request_number: (result?.request_number as string) ?? "",
  };
}

export async function rejectLeaveRequestAction(
  requestId: string,
  input: Record<string, unknown>,
): Promise<ActionResult> {
  const { employee: _actor } = await getAuthenticatedUser();

  const parsed = leaveRejectionSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Validation failed." };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.rpc("reject_leave_request", {
    p_request_id: requestId,
    p_rejection_reason: parsed.data.rejection_reason,
  });

  if (error) {
    const msg = error.message?.replace(/^.*?:\s*/, "") ?? "Failed to reject request.";
    return { success: false, error: msg };
  }

  const result = data as Record<string, unknown> | null;

  revalidatePath("/dashboard/approvals");
  revalidatePath("/dashboard/leave/requests");
  revalidatePath("/dashboard/leave/balances");
  revalidatePath(`/dashboard/leave/requests/${requestId}`);

  return {
    success: true,
    request_id: requestId,
    request_number: (result?.request_number as string) ?? "",
  };
}
