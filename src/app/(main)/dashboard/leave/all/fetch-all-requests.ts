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
  const safeSearch = params.search ? sanitizeSearch(params.search) : null;

  // If searching by employee name, first find matching employee IDs (fast indexed lookup)
  let employeeIds: string[] | null = null;
  if (safeSearch) {
    const { data: matchedEmployees } = await supabase
      .from("employees")
      .select("id")
      .or(
        `full_name.ilike.%${safeSearch}%,employee_code.ilike.%${safeSearch}%`,
      );
    employeeIds = (matchedEmployees ?? []).map((e) => e.id);
  }

  let query = supabase
    .from("leave_requests")
    .select(
      "id, request_number, employee_id, leave_type_id, start_date, end_date, requested_days, status, reason, partial_day, created_at, employees!leave_requests_employee_id_fk(full_name, employee_code), leave_types!leave_requests_leave_type_id_fk(name, color)",
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

  // Two-step search: filter by request_number OR matching employee IDs
  if (safeSearch && employeeIds !== null) {
    if (employeeIds.length > 0) {
      // Match request_number OR employee_id in matched set
      query = query.or(
        `request_number.ilike.%${safeSearch}%,employee_id.in.(${employeeIds.join(",")})`,
      );
    } else {
      // No employees matched — only search request_number
      query = query.ilike("request_number", `%${safeSearch}%`);
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
