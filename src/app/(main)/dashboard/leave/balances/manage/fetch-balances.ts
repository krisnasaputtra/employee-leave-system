"use server";

import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { createClient } from "@/lib/supabase/server";
import { sanitizeSearch } from "@/lib/utils/sanitize-search";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BalanceRow {
  id: string;
  employee_code: string;
  full_name: string;
  department_id: string | null;
  departments: { name: string } | null;
  balance: {
    entitled: number;
    used: number;
    pending: number;
    remaining: number;
  };
}

export interface FetchBalancesParams {
  search?: string;
  department?: string;
  page?: number;
  pageSize?: number;
}

export interface FetchBalancesResult {
  employees: BalanceRow[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ---------------------------------------------------------------------------
// Server action
// ---------------------------------------------------------------------------

export async function fetchBalances(
  params: FetchBalancesParams = {},
): Promise<FetchBalancesResult> {
  await getAuthenticatedUser(); // ensure authenticated
  const supabase = await createClient();

  const currentYear = new Date().getFullYear();
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 10;
  const offset = (page - 1) * pageSize;

  // ---------- Query employees ----------
  let query = supabase
    .from("employees")
    .select(
      "id, employee_code, full_name, department_id, departments!employees_department_id_fk(name)",
      { count: "exact" },
    )
    .eq("status", "ACTIVE");

  if (params.search) {
    const safeSearch = sanitizeSearch(params.search);
    if (safeSearch) {
      query = query.or(
        `full_name.ilike.%${safeSearch}%,employee_code.ilike.%${safeSearch}%`,
      );
    }
  }

  if (params.department) {
    query = query.eq("department_id", params.department);
  }

  query = query.order("full_name").range(offset, offset + pageSize - 1);

  const { data: employees, count, error } = await query;

  if (error) throw new Error(error.message);

  // ---------- Fetch balances for displayed employees ----------
  const employeeIds = (employees ?? []).map((e) => e.id);

  const balancesMap: Record<
    string,
    { entitled: number; used: number; pending: number; remaining: number }
  > = {};

  if (employeeIds.length > 0) {
    const { data: balances } = await supabase
      .from("leave_balances")
      .select(
        "employee_id, entitled_days, adjustment_days, used_days, pending_days",
      )
      .in("employee_id", employeeIds)
      .eq("balance_year", currentYear);

    if (balances) {
      for (const b of balances) {
        const existing = balancesMap[b.employee_id] ?? {
          entitled: 0,
          used: 0,
          pending: 0,
          remaining: 0,
        };
        const entitled = b.entitled_days + b.adjustment_days;
        existing.entitled += entitled;
        existing.used += b.used_days;
        existing.pending += b.pending_days;
        existing.remaining += entitled - b.used_days;
        balancesMap[b.employee_id] = existing;
      }
    }
  }

  // ---------- Merge employees with balances ----------
  const rows: BalanceRow[] = (employees ?? []).map((emp) => ({
    id: emp.id,
    employee_code: emp.employee_code,
    full_name: emp.full_name,
    department_id: emp.department_id,
    departments: emp.departments as { name: string } | null,
    balance: balancesMap[emp.id] ?? {
      entitled: 0,
      used: 0,
      pending: 0,
      remaining: 0,
    },
  }));

  return {
    employees: rows,
    totalCount: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  };
}
