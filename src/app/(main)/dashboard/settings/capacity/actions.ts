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

const capacityUpsertSchema = z.object({
  department_id: z.string().uuid(),
  max_absent_percentage: z.coerce.number().min(0).max(100),
  min_staff_count: z.coerce.number().int().min(0).nullable().optional(),
});

// =============================================================
// Upsert Capacity Rule
// =============================================================

export async function upsertCapacityRuleAction(input: Record<string, unknown>): Promise<ActionResult> {
  try {
    // 1. Authenticate
    const { employee: actor } = await getAuthenticatedUser();

    // 2. Authorize
    if (!canManageConfiguration(actor.role)) {
      return {
        success: false,
        error: "You do not have permission to manage capacity rules.",
      };
    }

    // 3. Validate
    const parsed = capacityUpsertSchema.safeParse(input);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return {
        success: false,
        error: firstError?.message ?? "Validation failed.",
      };
    }

    // 4. Execute — upsert by department_id
    const admin = createAdminClient();

    // Check if a rule already exists for this department
    const { data: existing } = await admin
      .from("workforce_capacity_rules")
      .select("id")
      .eq("department_id", parsed.data.department_id)
      .maybeSingle();

    let error;

    if (existing) {
      // Update existing rule
      ({ error } = await admin
        .from("workforce_capacity_rules")
        .update({
          max_absent_percentage: parsed.data.max_absent_percentage,
          min_staff_count: parsed.data.min_staff_count ?? null,
        })
        .eq("id", existing.id));
    } else {
      // Insert new rule
      ({ error } = await admin.from("workforce_capacity_rules").insert({
        department_id: parsed.data.department_id,
        max_absent_percentage: parsed.data.max_absent_percentage,
        min_staff_count: parsed.data.min_staff_count ?? null,
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
      action: existing ? "CAPACITY_RULE_UPDATED" : "CAPACITY_RULE_CREATED",
      entity_type: "workforce_capacity_rule",
      entity_id: existing?.id ?? null,
      metadata: {
        department_id: parsed.data.department_id,
        max_absent_percentage: parsed.data.max_absent_percentage,
      } as unknown as Record<string, string>,
    });

    // 6. Revalidate
    revalidatePath("/dashboard/settings/capacity");

    // 7. Return
    return { success: true };
  } catch (error) {
    if (isNextInternalError(error)) throw error;
    console.error("upsertCapacityRuleAction failed:", error);
    return { success: false, error: "An unexpected error occurred. Please try again." };
  }
}

// =============================================================
// Delete Capacity Rule
// =============================================================

export async function deleteCapacityRuleAction(id: string): Promise<ActionResult> {
  try {
    // 1. Authenticate
    const { employee: actor } = await getAuthenticatedUser();

    // 2. Authorize
    if (!canManageConfiguration(actor.role)) {
      return {
        success: false,
        error: "You do not have permission to manage capacity rules.",
      };
    }

    // 3. Validate
    if (!id) {
      return { success: false, error: "Rule ID is required." };
    }

    // 4. Execute
    const admin = createAdminClient();
    const { error } = await admin.from("workforce_capacity_rules").delete().eq("id", id);

    if (error) {
      return {
        success: false,
        error: sanitizeDbError(error, "Operation failed."),
      };
    }

    // 5. Audit
    await admin.from("audit_logs").insert({
      actor_employee_id: actor.id,
      action: "CAPACITY_RULE_DELETED",
      entity_type: "workforce_capacity_rule",
      entity_id: id,
      metadata: {} as unknown as Record<string, string>,
    });

    // 6. Revalidate
    revalidatePath("/dashboard/settings/capacity");

    // 7. Return
    return { success: true };
  } catch (error) {
    if (isNextInternalError(error)) throw error;
    console.error("deleteCapacityRuleAction failed:", error);
    return { success: false, error: "An unexpected error occurred. Please try again." };
  }
}
