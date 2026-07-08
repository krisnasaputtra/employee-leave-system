"use server";

import { revalidatePath } from "next/cache";

import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { delegationCreateSchema, delegationIdSchema } from "@/lib/delegations/schemas";
import { createClient } from "@/lib/supabase/server";
import { sanitizeDbError } from "@/lib/utils/sanitize-error";
import { isNextInternalError } from "@/lib/utils/server-action-utils";

interface ActionResult {
  success: boolean;
  error?: string;
}

export async function createDelegationAction(input: Record<string, unknown>): Promise<ActionResult> {
  try {
    const { employee: actor } = await getAuthenticatedUser();

    if (actor.role !== "MANAGER" && actor.role !== "ADMIN") {
      return { success: false, error: "Only managers and admins can create delegations." };
    }

    const parsed = delegationCreateSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Validation failed." };
    }

    if (parsed.data.delegate_id === actor.id) {
      return { success: false, error: "You cannot delegate to yourself." };
    }

    const supabase = await createClient();

    // Verify delegate is in the same department
    const { data: delegate } = await supabase
      .from("employees")
      .select("id, department_id")
      .eq("id", parsed.data.delegate_id)
      .eq("status", "ACTIVE")
      .single();

    if (!delegate) {
      return { success: false, error: "Delegate employee not found or inactive." };
    }

    if (actor.role !== "ADMIN" && delegate.department_id !== actor.department_id) {
      return { success: false, error: "You can only delegate to employees in your department." };
    }

    const { error } = await supabase.from("approval_delegations").insert({
      delegator_id: actor.id,
      delegate_id: parsed.data.delegate_id,
      start_date: parsed.data.start_date,
      end_date: parsed.data.end_date,
      reason: parsed.data.reason,
    });

    if (error) {
      return { success: false, error: sanitizeDbError(error, "Failed to create delegation.") };
    }

    revalidatePath("/dashboard/delegations");
    revalidatePath("/dashboard/approvals");
    return { success: true };
  } catch (error) {
    if (isNextInternalError(error)) throw error;
    console.error("createDelegationAction failed:", error);
    return { success: false, error: "An unexpected error occurred. Please try again." };
  }
}

export async function revokeDelegationAction(delegationId: string): Promise<ActionResult> {
  try {
    const { employee: actor } = await getAuthenticatedUser();

    const parsedDelegationId = delegationIdSchema.safeParse(delegationId);
    if (!parsedDelegationId.success) {
      return { success: false, error: parsedDelegationId.error.issues[0]?.message ?? "Validation failed." };
    }

    const supabase = await createClient();

    // Verify ownership (or admin)
    const { data: delegation } = await supabase
      .from("approval_delegations")
      .select("delegator_id")
      .eq("id", parsedDelegationId.data)
      .single();

    if (!delegation) {
      return { success: false, error: "Delegation not found." };
    }

    if (delegation.delegator_id !== actor.id && actor.role !== "ADMIN") {
      return { success: false, error: "You can only revoke your own delegations." };
    }

    const { error } = await supabase
      .from("approval_delegations")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("id", parsedDelegationId.data);

    if (error) {
      return { success: false, error: sanitizeDbError(error, "Failed to revoke delegation.") };
    }

    revalidatePath("/dashboard/delegations");
    revalidatePath("/dashboard/approvals");
    return { success: true };
  } catch (error) {
    if (isNextInternalError(error)) throw error;
    console.error("revokeDelegationAction failed:", error);
    return { success: false, error: "An unexpected error occurred. Please try again." };
  }
}
