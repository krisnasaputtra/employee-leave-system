"use server";

import { isNextInternalError } from "@/lib/utils/server-action-utils";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

interface ChangePasswordResult {
  error?: string;
}

export async function changePasswordAction(data: { password: string }): Promise<ChangePasswordResult> {
  try {
    const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in to change your password." };
  }

  const { error: updateError } = await supabase.auth.updateUser({ password: data.password });

  if (updateError) {
    return { error: "Failed to update password. Please try again." };
  }

  const adminClient = createAdminClient();
  const { error: flagError } = await adminClient
    .from("employees")
    .update({ must_change_password: false })
    .eq("auth_user_id", user.id);

  if (flagError) {
    console.error("Failed to clear must_change_password flag:", flagError.message);
  }

    return {};
  } catch (error) {
    if (isNextInternalError(error)) throw error;
    console.error("changePasswordAction failed:", error);
    return { error: "An unexpected error occurred. Please try again." };
  }
}
