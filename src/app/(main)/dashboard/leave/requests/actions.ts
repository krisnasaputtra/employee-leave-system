"use server";

import { revalidatePath } from "next/cache";

import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { leaveRequestCreateSchema, leaveRequestUpdateSchema } from "@/lib/leave-requests/schemas";
import { createClient } from "@/lib/supabase/server";

interface ActionResult {
  success: boolean;
  error?: string;
  request_id?: string;
  request_number?: string;
  requested_days?: number;
}

export async function createLeaveRequestAction(input: Record<string, unknown>): Promise<ActionResult> {
  // 1. Authenticate
  await getAuthenticatedUser();

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

  return {
    success: true,
    request_id: (result?.request_id as string) ?? "",
    request_number: (result?.request_number as string) ?? "",
    requested_days: (result?.requested_days as number) ?? 0,
  };
}

export async function updateLeaveRequestAction(
  requestId: string,
  input: Record<string, unknown>,
): Promise<ActionResult> {
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
}

export async function cancelLeaveRequestAction(requestId: string): Promise<ActionResult> {
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
}
