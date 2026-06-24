"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { createClient } from "@/lib/supabase/server";
import { isNextInternalError } from "@/lib/utils/server-action-utils";

const profileUpdateSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  position: z.string().min(1, "Position is required"),
});

export async function updateProfileAction(input: Record<string, unknown>) {
  try {
    const { employee: actor } = await getAuthenticatedUser();
    const parsed = profileUpdateSchema.parse(input);

    const supabase = await createClient();
    const { error } = await supabase
      .from("employees")
      .update({ full_name: parsed.full_name, position: parsed.position })
      .eq("id", actor.id);

    if (error) return { success: false, error: "Failed to update profile" };

    revalidatePath("/dashboard/profile");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    if (isNextInternalError(error)) throw error;
    console.error("updateProfileAction failed:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
