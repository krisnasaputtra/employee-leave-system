"use server";

import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { createClient } from "@/lib/supabase/server";
import { sanitizeSearch } from "@/lib/utils/sanitize-search";
import type { Database } from "@/types/database.types";

type LeaveRequestStatus = Database["public"]["Enums"]["leave_request_status"];

export interface LeaveRequestRow {
  id: string;
  request_number: string | null;
  employee_id: string;
  leave_type_id: string;
  start_date: string;
  end_date: string;
  requested_days: number;
  status: string;
  reason: string | null;
  partial_day: string | null;
  created_at: string;
  employees: { full_name: string; employee_code: string } | null;
  leave_types: { name: string; color: string } | null;
}

export interface FetchAllRequestsParams {
  search?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

export interface FetchAllRequestsResult {
  requests: LeaveRequestRow[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export async function fetchAllRequests(
  params: FetchAllRequestsParams = {},
): Promise<FetchAllRequestsResult> {
  const { employee: actor } = await getAuthenticatedUser();

  // Admin-only
  if (actor.role !== "ADMIN") {
    throw new Error("Unauthorized: admin access required.");
  }

  const supabase = await createClient();

  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 10;
  const offset = (page - 1) * pageSize;
  const statusFilter =
    params.status && params.status !== "ALL" ? params.status : null;

  let query = supabase
    .from("leave_requests")
    .select(
      "*, employees!leave_requests_employee_id_fk(full_name, employee_code), leave_types!leave_requests_leave_type_id_fk(name, color)",
      { count: "exact" },
    );

  if (
    statusFilter &&
    ["PENDING", "APPROVED", "REJECTED", "CANCELLED"].includes(statusFilter)
  ) {
    query = query.eq(
      "status",
      statusFilter as NonNullable<LeaveRequestStatus>,
    );
  }

  if (params.search) {
    const safeSearch = sanitizeSearch(params.search);
    if (safeSearch) {
      query = query.or(
        `request_number.ilike.%${safeSearch}%,employees.full_name.ilike.%${safeSearch}%`,
      );
    }
  }

  query = query
    .order("created_at", { ascending: false })
    .range(offset, offset + pageSize - 1);

  const { data, count, error } = await query;

  if (error) throw new Error(error.message);

  return {
    requests: (data ?? []) as unknown as LeaveRequestRow[],
    totalCount: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  };
}
