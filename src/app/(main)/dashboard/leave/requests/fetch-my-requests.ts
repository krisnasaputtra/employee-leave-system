"use server";

import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import type { LeaveRequestStatus } from "@/lib/leave-requests/status";
import { firstRelation } from "@/lib/supabase/relations";
import { createClient } from "@/lib/supabase/server";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LeaveRequestRow {
  id: string;
  request_number: string | null;
  employee_id: string;
  leave_type_id: string;
  start_date: string;
  end_date: string;
  requested_days: number;
  status: LeaveRequestStatus;
  reason: string | null;
  created_at: string;
  leave_types: {
    name: string;
    color: string;
    code: string;
  } | null;
}

export interface FetchMyRequestsParams {
  page?: number;
  pageSize?: number;
}

export interface FetchMyRequestsResult {
  requests: LeaveRequestRow[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ---------------------------------------------------------------------------
// Server action
// ---------------------------------------------------------------------------

export async function fetchMyRequests(params: FetchMyRequestsParams = {}): Promise<FetchMyRequestsResult> {
  const { employee: actor } = await getAuthenticatedUser();
  const supabase = await createClient();

  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 10;
  const offset = (page - 1) * pageSize;

  const { data, count, error } = await supabase
    .from("leave_requests")
    .select(
      "id, request_number, employee_id, leave_type_id, start_date, end_date, requested_days, status, reason, created_at, leave_types(name, color, code)",
      { count: "exact" },
    )
    .eq("employee_id", actor.id)
    .order("created_at", { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (error) throw new Error(error.message);

  return {
    requests: (data ?? []).map((request) => ({
      id: request.id,
      request_number: request.request_number,
      employee_id: request.employee_id,
      leave_type_id: request.leave_type_id,
      start_date: request.start_date,
      end_date: request.end_date,
      requested_days: request.requested_days,
      status: request.status,
      reason: request.reason,
      created_at: request.created_at,
      leave_types: firstRelation(request.leave_types),
    })),
    totalCount: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  };
}
