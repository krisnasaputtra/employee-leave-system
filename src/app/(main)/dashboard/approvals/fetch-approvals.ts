"use server";

import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import {
  getRpcResultBoolean,
  getRpcResultNullableString,
  getRpcResultNumber,
  getRpcResultObject,
  getRpcResultString,
  hasRpcResultFields,
} from "@/lib/supabase/rpc-result";
import { createClient } from "@/lib/supabase/server";
import { getUntypedRpc } from "@/lib/supabase/untyped-rpc";

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

function mapApprovalRequest(row: unknown): ApprovalRequest {
  const record = getRpcResultObject(row);
  const leaveType = getRpcResultObject(record.leave_types);
  const employee = getRpcResultObject(record.employees);

  return {
    id: getRpcResultString(record, "id"),
    request_number: getRpcResultNullableString(record, "request_number"),
    start_date: getRpcResultString(record, "start_date"),
    end_date: getRpcResultString(record, "end_date"),
    requested_days: getRpcResultNumber(record, "requested_days"),
    created_at: getRpcResultString(record, "created_at"),
    employee_id: getRpcResultString(record, "employee_id"),
    leave_types: hasRpcResultFields(leaveType)
      ? {
          name: getRpcResultString(leaveType, "name"),
          color: getRpcResultString(leaveType, "color"),
          code: getRpcResultString(leaveType, "code"),
        }
      : null,
    employees: hasRpcResultFields(employee)
      ? {
          id: getRpcResultString(employee, "id"),
          full_name: getRpcResultString(employee, "full_name"),
          employee_code: getRpcResultString(employee, "employee_code"),
          department_id: getRpcResultNullableString(employee, "department_id"),
        }
      : null,
  };
}

export async function fetchApprovals(): Promise<FetchApprovalsResult> {
  await getAuthenticatedUser();

  const supabase = await createClient();
  const rpc = getUntypedRpc(supabase);
  const { data, error } = await rpc("get_pending_approval_requests");

  if (error) {
    throw new Error(error.message ?? "Failed to fetch approvals.");
  }

  const requests = Array.isArray(data) ? data.map(mapApprovalRequest) : [];

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
      if (getRpcResultBoolean(settled.value.data, "warning")) {
        const message = getRpcResultString(settled.value.data, "message") || "Department capacity may be exceeded.";
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
