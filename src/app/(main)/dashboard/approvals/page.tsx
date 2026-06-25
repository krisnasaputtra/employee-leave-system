import { redirect } from "next/navigation";

import { ClipboardCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { createClient } from "@/lib/supabase/server";

import { ApprovalsTable } from "./_components/approvals-table";

export default async function ApprovalsPage() {
  const { employee: actor } = await getAuthenticatedUser();

  if (actor.role === "EMPLOYEE") {
    redirect("/dashboard");
  }

  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];

  // Direct pending requests (original query)
  const { data: requests } = await supabase
    .from("leave_requests")
    .select("*, leave_types(name, color, code), employees!leave_requests_employee_id_fk(id, full_name, employee_code, department_id)")
    .eq("status", "PENDING")
    .order("created_at", { ascending: true });

  // Find active delegations TO the current user
  const { data: activeDelegations } = await supabase
    .from("approval_delegations")
    .select("delegator_id")
    .eq("delegate_id", actor.id)
    .eq("is_active", true)
    .lte("start_date", today)
    .gte("end_date", today);

  const delegatorIds = (activeDelegations ?? []).map((d) => d.delegator_id);

  // Fetch pending leave requests from employees managed by delegators
  let delegatedRequests: typeof requests = [];
  if (delegatorIds.length > 0) {
    // Get employee IDs whose manager_id is one of the delegators
    const { data: delegatedEmployees } = await supabase
      .from("employees")
      .select("id")
      .in("manager_id", delegatorIds);

    const delegatedEmployeeIds = (delegatedEmployees ?? []).map((e) => e.id);

    if (delegatedEmployeeIds.length > 0) {
      const { data: dRequests } = await supabase
        .from("leave_requests")
        .select("*, leave_types(name, color, code), employees!leave_requests_employee_id_fk(id, full_name, employee_code, department_id)")
        .eq("status", "PENDING")
        .in("employee_id", delegatedEmployeeIds)
        .order("created_at", { ascending: true });

      delegatedRequests = dRequests;
    }
  }

  // Merge and deduplicate requests
  const allRequests = [...(requests ?? []), ...(delegatedRequests ?? [])];
  const uniqueRequestMap = new Map(allRequests.map((r) => [r.id, r]));
  const mergedRequests = Array.from(uniqueRequestMap.values());

  // Filter out actor's own requests (self-approval prevention)
  const filteredRequests = mergedRequests.filter((r) => r.employee_id !== actor.id);

  // Check capacity warnings for each request (soft warning)
  const capacityWarnings: Record<string, string> = {};
  for (const req of filteredRequests) {
    const deptId = (req.employees as Record<string, unknown>)?.department_id as string | undefined;
    if (deptId) {
      try {
        const { data } = await supabase.rpc("check_department_capacity", {
          p_department_id: deptId,
          p_start_date: req.start_date,
          p_end_date: req.end_date,
        });
        const result = data as Record<string, unknown> | null;
        if (result?.warning) {
          capacityWarnings[req.id] = (result.message as string) ?? "Department capacity may be exceeded.";
        }
      } catch {
        // Silently skip capacity check errors
      }
    }
  }

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <div className="flex items-center gap-3">
        <h1 className="font-semibold text-2xl tracking-tight">Pending Approvals</h1>
        <Badge variant="secondary">{filteredRequests.length}</Badge>
      </div>

      {filteredRequests.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="No Pending Requests"
          description="There are no leave requests waiting for your approval at this time."
        />
      ) : (
        <ApprovalsTable requests={filteredRequests} capacityWarnings={capacityWarnings} />
      )}
    </div>
  );
}
