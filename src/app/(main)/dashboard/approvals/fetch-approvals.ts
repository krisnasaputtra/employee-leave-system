"use server";

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

type UntypedRpc = (
  functionName: string,
  args?: Record<string, unknown>,
) => Promise<{ data: unknown; error: { message?: string } | null }>;

// ---------------------------------------------------------------------------
// Server action
// ---------------------------------------------------------------------------

export async function fetchApprovals(): Promise<FetchApprovalsResult> {
  await getAuthenticatedUser();

  const supabase = await createClient();
  const rpc = supabase.rpc.bind(supabase) as unknown as UntypedRpc;
  const { data, error } = await rpc("get_pending_approval_requests");

  if (error) {
    throw new Error(error.message ?? "Failed to fetch approvals.");
  }

  const requests = Array.isArray(data) ? (data as ApprovalRequest[]) : [];

  // ---- Capacity warnings (batched by dept+dates) ----
  const capacityWarnings: Record<string, string> = {};

  const capacityKeyToRequestIds = new Map<string, string[]>();
  const capacityKeyToParams = new Map<string, { deptId: string; start: string; end: string }>();

  for (const req of requests) {
    const deptId = req.employees?.department_id ?? undefined;
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
      const requestIds = capacityKeyToRequestIds.get(key);
      if (requestIds) {
        requestIds.push(req.id);
      }
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
        const message = (result.message as string) ?? "Department capacity may be exceeded.";
        for (const reqId of capacityKeyToRequestIds.get(key) ?? []) {
          capacityWarnings[reqId] = message;
        }
      }
    }
    // Silently skip rejected / errored capacity checks
  }

  return {
    requests,
    capacityWarnings,
  };
}
