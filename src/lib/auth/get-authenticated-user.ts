import { cache } from "react";
import { redirect } from "next/navigation";

import type { AuthEmployee } from "@/lib/permissions/roles";
import { createClient } from "@/lib/supabase/server";

export interface AuthenticatedUser {
  user: { id: string; email: string };
  employee: AuthEmployee;
}

/**
 * Cached per-request auth check.
 *
 * React's `cache()` deduplicates calls within the same server request,
 * so calling this from layout.tsx AND page.tsx only hits the DB once.
 */
export const getAuthenticatedUser = cache(async (): Promise<AuthenticatedUser> => {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { data: employee, error: employeeError } = await supabase
    .from("employees")
    .select(
      "id, auth_user_id, full_name, work_email, role, status, manager_id, must_change_password, department_id, position",
    )
    .eq("auth_user_id", user.id)
    .single();

  if (employeeError || !employee) {
    await supabase.auth.signOut();
    redirect("/login");
  }

  if (employee.status !== "ACTIVE") {
    await supabase.auth.signOut();
    redirect("/login");
  }

  return {
    user: { id: user.id, email: user.email ?? "" },
    employee: employee as AuthEmployee,
  };
});
