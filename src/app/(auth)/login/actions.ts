"use server";

import { getSafeRedirectUrl } from "@/lib/auth/safe-redirect";
import { createClient } from "@/lib/supabase/server";

interface LoginResult {
  error?: string;
  redirectTo?: string;
}

export async function loginAction(data: { email: string; password: string }): Promise<LoginResult> {
  const supabase = await createClient();

  const { error: authError } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  });

  if (authError) {
    return { error: "Invalid email or password." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Authentication failed. Please try again." };
  }

  const { data: employee } = await supabase
    .from("employees")
    .select("id, status, must_change_password")
    .eq("auth_user_id", user.id)
    .single();

  if (!employee) {
    await supabase.auth.signOut();
    return { error: "Your account is not linked to any employee record. Contact your administrator." };
  }

  if (employee.status !== "ACTIVE") {
    await supabase.auth.signOut();
    return { error: "Your account has been deactivated. Contact your administrator." };
  }

  if (employee.must_change_password) {
    return { redirectTo: "/change-password" };
  }

  return { redirectTo: getSafeRedirectUrl("/dashboard") };
}
