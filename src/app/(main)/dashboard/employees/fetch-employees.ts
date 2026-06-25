"use server";

import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { createClient } from "@/lib/supabase/server";
import { sanitizeSearch } from "@/lib/utils/sanitize-search";
import type { Database } from "@/types/database.types";

type ApplicationRole = Database["public"]["Enums"]["application_role"];
type EmploymentStatus = Database["public"]["Enums"]["employment_status"];

export interface EmployeeRow {
  id: string;
  employee_code: string;
  full_name: string;
  work_email: string;
  position: string;
  role: string;
  status: string;
  auth_user_id: string | null;
  department_id: string | null;
  departments: { name: string } | null;
}

export interface FetchEmployeesParams {
  search?: string;
  department?: string;
  role?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

export interface FetchEmployeesResult {
  employees: EmployeeRow[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export async function fetchEmployees(params: FetchEmployeesParams = {}): Promise<FetchEmployeesResult> {
  await getAuthenticatedUser(); // ensure authenticated
  const supabase = await createClient();

  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 10;
  const offset = (page - 1) * pageSize;

  let query = supabase
    .from("employees")
    .select(
      "id, employee_code, full_name, work_email, position, role, status, auth_user_id, department_id, departments!employees_department_id_fk(name)",
      { count: "exact" },
    );

  if (params.search) {
    const safeSearch = sanitizeSearch(params.search);
    if (safeSearch) {
      query = query.or(
        `full_name.ilike.%${safeSearch}%,employee_code.ilike.%${safeSearch}%,work_email.ilike.%${safeSearch}%`,
      );
    }
  }
  if (params.department) {
    query = query.eq("department_id", params.department);
  }
  if (params.role) {
    query = query.eq("role", params.role as ApplicationRole);
  }
  if (params.status) {
    query = query.eq("status", params.status as EmploymentStatus);
  }

  query = query.order("full_name").range(offset, offset + pageSize - 1);

  const { data, count, error } = await query;

  if (error) throw new Error(error.message);

  return {
    employees: (data ?? []) as unknown as EmployeeRow[],
    totalCount: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  };
}
