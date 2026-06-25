"use server";

import { redirect } from "next/navigation";

import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { createClient } from "@/lib/supabase/server";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ApprovalRequest {
  id: string;
  request_number: string | null;
  start_date: string;
  end_date: string;
  requested_days: number;
  created_at: string;
  employee_id: string;
  leave_types: { name: string; color: string; code: string } | null;
  employees: {
    id: string;
    full_name: string;
    employee_code: string;
    department_id: string | null;
  } | null;
}

export interface FetchApprovalsResult {
  requests: ApprovalRequest[];
  capacityWarnings: Record<string, string>;
}

// ---------------------------------------------------------------------------
// Server action
// ---------------------------------------------------------------------------

export async function fetchApprovals(): Promise<FetchApprovalsResult> {
  const { employee: actor } = await getAuthenticatedUser();

  // Role guard — only MANAGER / ADMIN may access
  if (actor.role === "EMPLOYEE") {
    redirect("/dashboard");
  }

  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];

  // ---- Direct pending requests ----
  const { data: requests } = await supabase
    .from("leave_requests")
    .select(
      "*, leave_types(name, color, code), employees!leave_requests_employee_id_fk(id, full_name, employee_code, department_id)",
    )
    .eq("status", "PENDING")
    .order("created_at", { ascending: true });

  // ---- Delegation: find active delegations TO the current user ----
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
    const { data: delegatedEmployees } = await supabase
      .from("employees")
      .select("id")
      .in("manager_id", delegatorIds);

    const delegatedEmployeeIds = (delegatedEmployees ?? []).map((e) => e.id);

    if (delegatedEmployeeIds.length > 0) {
      const { data: dRequests } = await supabase
        .from("leave_requests")
        .select(
          "*, leave_types(name, color, code), employees!leave_requests_employee_id_fk(id, full_name, employee_code, department_id)",
        )
        .eq("status", "PENDING")
        .in("employee_id", delegatedEmployeeIds)
        .order("created_at", { ascending: true });

      delegatedRequests = dRequests;
    }
  }

  // ---- Merge & deduplicate ----
  const allRequests = [...(requests ?? []), ...(delegatedRequests ?? [])];
  const uniqueRequestMap = new Map(allRequests.map((r) => [r.id, r]));
  const mergedRequests = Array.from(uniqueRequestMap.values());

  // Filter out actor's own requests (self-approval prevention)
  const filteredRequests = mergedRequests.filter(
    (r) => r.employee_id !== actor.id,
  );

  // ---- Capacity warnings (batched by dept+dates) ----
  const capacityWarnings: Record<string, string> = {};

  const capacityKeyToRequestIds = new Map<string, string[]>();
  const capacityKeyToParams = new Map<
    string,
    { deptId: string; start: string; end: string }
  >();

  for (const req of filteredRequests) {
    const deptId = (req.employees as Record<string, unknown>)
      ?.department_id as string | undefined;
    if (deptId) {
      const key = `${deptId}|${req.start_date}|${req.end_date}`;
      if (!capacityKeyToRequestIds.has(key)) {
        capacityKeyToRequestIds.set(key, []);
        capacityKeyToParams.set(key, {
          deptId,
          start: req.start_date,
          end: req.end_date,
        });
      }
      capacityKeyToRequestIds.get(key)!.push(req.id);
    }
  }

  // Issue one RPC call per unique key (in parallel)
  const capacityEntries = Array.from(capacityKeyToParams.entries());
  const capacityResults = await Promise.allSettled(
    capacityEntries.map(([, params]) =>
      supabase.rpc("check_department_capacity", {
        p_department_id: params.deptId,
        p_start_date: params.start,
        p_end_date: params.end,
      }),
    ),
  );

  for (let i = 0; i < capacityEntries.length; i++) {
    const [key] = capacityEntries[i];
    const settled = capacityResults[i];
    if (settled.status === "fulfilled") {
      const result = settled.value.data as Record<string, unknown> | null;
      if (result?.warning) {
        const message =
          (result.message as string) ??
          "Department capacity may be exceeded.";
        for (const reqId of capacityKeyToRequestIds.get(key)!) {
          capacityWarnings[reqId] = message;
        }
      }
    }
    // Silently skip rejected / errored capacity checks
  }

  return {
    requests: filteredRequests as ApprovalRequest[],
    capacityWarnings,
  };
}
