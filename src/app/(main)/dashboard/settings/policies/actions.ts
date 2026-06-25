"use server";

import { revalidatePath } from "next/cache";

import { z } from "zod";

import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { canManageConfiguration } from "@/lib/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { sanitizeDbError } from "@/lib/utils/sanitize-error";
import { isNextInternalError } from "@/lib/utils/server-action-utils";

// =============================================================
// Shared types
// =============================================================

interface ActionResult {
  success: boolean;
  error?: string;
}

// =============================================================
// Zod schema
// =============================================================

const policyUpsertSchema = z.object({
  leave_type_id: z.string().uuid(),
  notice_period_days: z.coerce.number().int().min(0).default(0),
  max_consecutive_days: z.coerce.number().int().min(1).nullable().optional(),
  requires_attachment: z.boolean().default(false),
});

// =============================================================
// Upsert Policy
// =============================================================

export async function upsertPolicyAction(input: Record<string, unknown>): Promise<ActionResult> {
  try {
    // 1. Authenticate
    const { employee: actor } = await getAuthenticatedUser();

    // 2. Authorize
    if (!canManageConfiguration(actor.role)) {
      return {
        success: false,
        error: "You do not have permission to manage leave policies.",
      };
    }

    // 3. Validate
    const parsed = policyUpsertSchema.safeParse(input);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return {
        success: false,
        error: firstError?.message ?? "Validation failed.",
      };
    }

    // 4. Execute — upsert by leave_type_id
    const admin = createAdminClient();

    // Check if a policy already exists for this leave type
    const { data: existing } = await admin
      .from("leave_policies")
      .select("id")
      .eq("leave_type_id", parsed.data.leave_type_id)
      .maybeSingle();

    let error;

    if (existing) {
      // Update existing policy
      ({ error } = await admin
        .from("leave_policies")
        .update({
          notice_period_days: parsed.data.notice_period_days,
          max_consecutive_days: parsed.data.max_consecutive_days ?? null,
          requires_attachment: parsed.data.requires_attachment,
        })
        .eq("id", existing.id));
    } else {
      // Insert new policy
      ({ error } = await admin.from("leave_policies").insert({
        leave_type_id: parsed.data.leave_type_id,
        notice_period_days: parsed.data.notice_period_days,
        max_consecutive_days: parsed.data.max_consecutive_days ?? null,
        requires_attachment: parsed.data.requires_attachment,
      }));
    }

    if (error) {
      return {
        success: false,
        error: sanitizeDbError(error, "Operation failed."),
      };
    }

    // 5. Audit
    await admin.from("audit_logs").insert({
      actor_employee_id: actor.id,
      action: existing ? "LEAVE_POLICY_UPDATED" : "LEAVE_POLICY_CREATED",
      entity_type: "leave_policy",
      entity_id: existing?.id ?? null,
      metadata: {
        leave_type_id: parsed.data.leave_type_id,
        notice_period_days: parsed.data.notice_period_days,
      } as unknown as Record<string, string>,
    });

    // 6. Revalidate
    revalidatePath("/dashboard/settings/policies");

    // 7. Return
    return { success: true };
  } catch (error) {
    if (isNextInternalError(error)) throw error;
    console.error("upsertPolicyAction failed:", error);
    return { success: false, error: "An unexpected error occurred. Please try again." };
  }
}

// =============================================================
// Delete Policy
// =============================================================

export async function deletePolicyAction(id: string): Promise<ActionResult> {
  try {
    // 1. Authenticate
    const { employee: actor } = await getAuthenticatedUser();

    // 2. Authorize
    if (!canManageConfiguration(actor.role)) {
      return {
        success: false,
        error: "You do not have permission to manage leave policies.",
      };
    }

    // 3. Validate
    if (!id) {
      return { success: false, error: "Policy ID is required." };
    }

    // 4. Execute
    const admin = createAdminClient();
    const { error } = await admin.from("leave_policies").delete().eq("id", id);

    if (error) {
      return {
        success: false,
        error: sanitizeDbError(error, "Operation failed."),
      };
    }

    // 5. Audit
    await admin.from("audit_logs").insert({
      actor_employee_id: actor.id,
      action: "LEAVE_POLICY_DELETED",
      entity_type: "leave_policy",
      entity_id: id,
      metadata: {} as unknown as Record<string, string>,
    });

    // 6. Revalidate
    revalidatePath("/dashboard/settings/policies");

    // 7. Return
    return { success: true };
  } catch (error) {
    if (isNextInternalError(error)) throw error;
    console.error("deletePolicyAction failed:", error);
    return { success: false, error: "An unexpected error occurred. Please try again." };
  }
}
