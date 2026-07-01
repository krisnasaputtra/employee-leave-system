"use server";

import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { createAdminClient } from "@/lib/supabase/admin";

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
  const supabase = createAdminClient();
  const today = new Date().toISOString().split("T")[0];

  // Direct approval count (ADMIN/MANAGER only) — exclude self-requests
  const approvalQuery =
    employee.role === "ADMIN"
      ? supabase
          .from("leave_requests")
          .select("*", { count: "exact", head: true })
          .eq("status", "PENDING")
          .neq("employee_id", employee.id)
      : employee.role === "MANAGER"
        ? supabase
            .from("leave_requests")
            .select("*, employees!inner(manager_id)", { count: "exact", head: true })
            .eq("status", "PENDING")
            .eq("employees.manager_id", employee.id)
            .neq("employee_id", employee.id)
        : null;

  const [notifResult, approvalResult] = await Promise.all([
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("employee_id", employee.id)
      .eq("is_read", false),
    approvalQuery ?? Promise.resolve({ count: 0 }),
  ]);

  let directCount = approvalResult.count ?? 0;

  // Also count delegated approvals (for any role) — exclude self-requests
  let delegatedCount = 0;
  const { data: activeDelegations } = await supabase
    .from("approval_delegations")
    .select("delegator_id")
    .eq("delegate_id", employee.id)
    .eq("is_active", true)
    .lte("start_date", today)
    .gte("end_date", today);

  if (activeDelegations && activeDelegations.length > 0) {
    const delegatorIds = activeDelegations.map((d) => d.delegator_id);
    const { data: delegatedEmployees } = await supabase
      .from("employees")
      .select("id")
      .in("manager_id", delegatorIds);

    const delegatedEmployeeIds = (delegatedEmployees ?? [])
      .map((e) => e.id)
      .filter((id) => id !== employee.id); // exclude self

    if (delegatedEmployeeIds.length > 0) {
      const { count } = await supabase
        .from("leave_requests")
        .select("*", { count: "exact", head: true })
        .eq("status", "PENDING")
        .in("employee_id", delegatedEmployeeIds);
      delegatedCount = count ?? 0;
    }
  }

  return {
    unreadNotifications: notifResult.count ?? 0,
    pendingApprovals: directCount + delegatedCount,
  };
}
