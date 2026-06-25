"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { createClient } from "@/lib/supabase/server";
import { isNextInternalError } from "@/lib/utils/server-action-utils";

const updateProfileSchema = z.object({
  phone_number: z.string().max(20).nullable(),
});

export async function updateProfileAction(formData: { phone_number: string | null }) {
  try {
    const { employee } = await getAuthenticatedUser();
    const parsed = updateProfileSchema.parse(formData);

    const supabase = await createClient();
    const { error } = await supabase
      .from("employees")
      .update({ phone_number: parsed.phone_number })
      .eq("id", employee.id);

    if (error) return { success: false, error: error.message };

    revalidatePath("/dashboard/profile");
    return { success: true };
  } catch (error) {
    if (isNextInternalError(error)) throw error;
    return { success: false, error: "Update failed." };
  }
}
