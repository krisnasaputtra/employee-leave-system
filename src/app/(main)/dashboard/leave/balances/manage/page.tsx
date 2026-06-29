import Link from "next/link";
import { redirect } from "next/navigation";

import { Search, Settings, Users, Wallet } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { canManageLeaveBalance } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { sanitizeSearch } from "@/lib/utils/sanitize-search";

const PAGE_SIZE = 10;

function buildPaginationUrl(
  targetPage: number,
  currentParams: Record<string, string | undefined>,
) {
  const params = new URLSearchParams();
  if (currentParams.search) params.set("search", currentParams.search);
  if (currentParams.department) params.set("department", currentParams.department);
  params.set("page", String(targetPage));
  return `/dashboard/leave/balances/manage?${params.toString()}`;
}

function getRemainingColor(remaining: number): string {
  if (remaining <= 0) return "text-red-600 dark:text-red-400";
  if (remaining <= 3) return "text-amber-600 dark:text-amber-400";
  return "text-emerald-600 dark:text-emerald-400";
}

function getRemainingBadgeClass(remaining: number): string {
  if (remaining <= 0)
    return "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700";
  if (remaining <= 3)
    return "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700";
  return "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-700";
}

export default async function ManageBalancesPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    department?: string;
    page?: string;
  }>;
}) {
  const { employee: actor } = await getAuthenticatedUser();

  if (!canManageLeaveBalance(actor.role)) {
    redirect("/dashboard/leave/balances");
  }

  const supabase = await createClient();
  const params = await searchParams;
  const currentYear = new Date().getFullYear();

  const page = Math.max(1, Number(params.page ?? "1"));
  const offset = (page - 1) * PAGE_SIZE;

  // ---------- Fetch departments for filter dropdown ----------
  const { data: departments } = await supabase
    .from("departments")
    .select("id, name")
    .order("name");

  // ---------- Fetch employees with pagination ----------
  let employeeQuery = supabase
    .from("employees")
    .select(
      "id, employee_code, full_name, department_id, departments!employees_department_id_fk(name)",
      { count: "exact" },
    )
    .eq("status", "ACTIVE");

  if (params.search) {
    const safeSearch = sanitizeSearch(params.search);
    if (safeSearch) {
      employeeQuery = employeeQuery.or(
        `full_name.ilike.%${safeSearch}%,employee_code.ilike.%${safeSearch}%`,
      );
    }
  }

  if (params.department) {
    employeeQuery = employeeQuery.eq("department_id", params.department);
  }

  employeeQuery = employeeQuery.order("full_name").range(offset, offset + PAGE_SIZE - 1);

  const { data: employees, count, error } = await employeeQuery;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-20">
        <p className="text-destructive text-sm">Failed to load employee balances.</p>
        <p className="text-muted-foreground text-xs">
          Something went wrong while loading data. Please try again later.
        </p>
      </div>
    );
  }

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE);

  // ---------- Fetch balances for the displayed employees ----------
  const employeeIds = (employees ?? []).map((e) => e.id);

  let balancesMap: Record<
    string,
    { entitled: number; used: number; pending: number; remaining: number }
  > = {};

  if (employeeIds.length > 0) {
    const { data: balances } = await supabase
      .from("leave_balances")
      .select("employee_id, entitled_days, adjustment_days, used_days, pending_days")
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

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-semibold text-2xl tracking-tight">Manage Balances</h1>
            <Badge variant="secondary">{currentYear}</Badge>
          </div>
          <p className="text-muted-foreground text-sm">
            {count ?? 0} employee{count !== 1 ? "s" : ""} total
          </p>
        </div>
      </div>

      {/* Filters */}
      <form
        method="GET"
        action="/dashboard/leave/balances/manage"
        className="flex flex-col gap-2 sm:flex-row"
      >
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            name="search"
            placeholder="Search by name or code…"
            defaultValue={params.search ?? ""}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 pl-8 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
        <select
          name="department"
          defaultValue={params.department ?? ""}
          className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="">All Teams</option>
          {(departments ?? []).map((dept) => (
            <option key={dept.id} value={dept.id}>
              {dept.name}
            </option>
          ))}
        </select>
        <Button type="submit" variant="secondary" size="sm" className="h-9">
          Filter
        </Button>
      </form>

      {/* Table */}
      {!employees || employees.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="No employees found"
          description="Try adjusting your search or filter criteria."
        />
      ) : (
        <div className="rounded-lg border bg-card">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead className="hidden md:table-cell">Team</TableHead>
                  <TableHead className="text-right">Entitled</TableHead>
                  <TableHead className="text-right">Used</TableHead>
                  <TableHead className="text-right hidden sm:table-cell">Pending</TableHead>
                  <TableHead className="text-right">Remaining</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((emp) => {
                  const bal = balancesMap[emp.id] ?? {
                    entitled: 0,
                    used: 0,
                    pending: 0,
                    remaining: 0,
                  };

                  return (
                    <TableRow key={emp.id}>
                      <TableCell className="font-medium">{emp.full_name}</TableCell>
                      <TableCell className="font-mono text-xs">{emp.employee_code}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        {(emp.departments as { name: string } | null)?.name ?? "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {bal.entitled}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {bal.used}
                      </TableCell>
                      <TableCell className="text-right tabular-nums hidden sm:table-cell">
                        {bal.pending}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant="outline"
                          className={getRemainingBadgeClass(bal.remaining)}
                        >
                          {bal.remaining}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/dashboard/leave/balances/${emp.id}`}>
                            <Settings className="mr-1.5 h-3.5 w-3.5" />
                            Manage
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t px-4 py-3">
              <p className="text-muted-foreground text-xs">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-1">
                {page > 1 && (
                  <Button variant="outline" size="sm" asChild>
                    <Link href={buildPaginationUrl(page - 1, params)}>Previous</Link>
                  </Button>
                )}
                {page < totalPages && (
                  <Button variant="outline" size="sm" asChild>
                    <Link href={buildPaginationUrl(page + 1, params)}>Next</Link>
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
