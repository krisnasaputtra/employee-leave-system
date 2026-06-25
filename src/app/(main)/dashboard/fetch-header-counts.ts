"use server";

import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { createClient } from "@/lib/supabase/server";

/**
 * Fetch notification + approval counts for the header badges.
 * Called from client component via TanStack Query to avoid
 * blocking layout rendering on every navigation.
 */
export async function fetchHeaderCounts(): Promise<{
  unreadNotifications: number;
  pendingApprovals: number;
}> {
  const { employee } = await getAuthenticatedUser();
  const supabase = await createClient();

  const approvalQuery =
    employee.role === "ADMIN"
      ? supabase
          .from("leave_requests")
          .select("*", { count: "exact", head: true })
          .eq("status", "PENDING")
      : employee.role === "MANAGER"
        ? supabase
            .from("leave_requests")
            .select("*, employees!inner(manager_id)", { count: "exact", head: true })
            .eq("status", "PENDING")
            .eq("employees.manager_id", employee.id)
        : null;

  const [notifResult, approvalResult] = await Promise.all([
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("employee_id", employee.id)
      .eq("is_read", false),
    approvalQuery ?? Promise.resolve({ count: 0 }),
  ]);

  return {
    unreadNotifications: notifResult.count ?? 0,
    pendingApprovals: approvalResult.count ?? 0,
  };
}
