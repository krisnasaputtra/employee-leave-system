"use server";

import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import {
  type ApplicationRole,
  type EmploymentStatus,
  isApplicationRole,
  isEmploymentStatus,
} from "@/lib/permissions/roles";
import { firstRelation } from "@/lib/supabase/relations";
import { createClient } from "@/lib/supabase/server";
import { sanitizeSearch } from "@/lib/utils/sanitize-search";

export interface EmployeeRow {
  id: string;
  employee_code: string;
  full_name: string;
  work_email: string;
  position: string;
  role: ApplicationRole;
  status: EmploymentStatus;
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
  if (params.role && isApplicationRole(params.role)) {
    query = query.eq("role", params.role);
  }
  if (params.status && isEmploymentStatus(params.status)) {
    query = query.eq("status", params.status);
  }

  query = query.order("full_name").range(offset, offset + pageSize - 1);

  const { data, count, error } = await query;

  if (error) throw new Error(error.message);

  return {
    employees: (data ?? []).map((employee) => ({
      id: employee.id,
      employee_code: employee.employee_code,
      full_name: employee.full_name,
      work_email: employee.work_email,
      position: employee.position,
      role: employee.role,
      status: employee.status,
      auth_user_id: employee.auth_user_id,
      department_id: employee.department_id,
      departments: firstRelation(employee.departments),
    })),
    totalCount: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  };
}
