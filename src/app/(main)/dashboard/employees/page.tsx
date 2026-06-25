import Link from "next/link";

import { Plus, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { canManageEmployees } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { sanitizeSearch } from "@/lib/utils/sanitize-search";
import { ROLE_BADGE_STYLES, EMPLOYMENT_STATUS_STYLES } from "@/lib/ui/badge-variants";
import { EmptyState } from "@/components/ui/empty-state";
import type { Database } from "@/types/database.types";
import { ExportButton } from "@/components/ui/export-button";
import { generateCsv } from "@/lib/utils/export-csv";
import { ExportCSVButton } from "@/components/export-csv-button";
import { exportEmployeesCSV } from "./export-action";

type ApplicationRole = Database["public"]["Enums"]["application_role"];
type EmploymentStatus = Database["public"]["Enums"]["employment_status"];

function buildPaginationUrl(
  targetPage: number,
  currentParams: Record<string, string | undefined>,
) {
  const params = new URLSearchParams();
  if (currentParams.search) params.set("search", currentParams.search);
  if (currentParams.department) params.set("department", currentParams.department);
  if (currentParams.role) params.set("role", currentParams.role);
  if (currentParams.status) params.set("status", currentParams.status);
  params.set("page", String(targetPage));
  return `/dashboard/employees?${params.toString()}`;
}

export default async function EmployeesPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    department?: string;
    role?: string;
    status?: string;
    page?: string;
  }>;
}) {
  const { employee: actor } = await getAuthenticatedUser();
  const isAdmin = canManageEmployees(actor.role);
  const supabase = await createClient();
  const params = await searchParams;

  const page = Number(params.page ?? "1");
  const pageSize = 10;
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

  const { data: employees, count, error } = await query;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-20">
        <p className="text-destructive text-sm">Failed to load employees.</p>
        <p className="text-muted-foreground text-xs">Something went wrong while loading data. Please try again later.</p>
      </div>
    );
  }

  const totalPages = Math.ceil((count ?? 0) / pageSize);

  // Generate CSV for export
  const csvContent = generateCsv(
    [
      { key: "employee_code", label: "Employee Code" },
      { key: "full_name", label: "Full Name" },
      { key: "work_email", label: "Email" },
      { key: "department_name", label: "Department" },
      { key: "position", label: "Position" },
      { key: "role", label: "Role" },
      { key: "status", label: "Status" },
    ],
    (employees ?? []).map((emp) => ({
      employee_code: emp.employee_code,
      full_name: emp.full_name,
      work_email: emp.work_email,
      department_name: (emp.departments as { name: string } | null)?.name ?? "",
      position: emp.position,
      role: emp.role,
      status: emp.status,
    })),
  );

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">Employees</h1>
          <p className="text-muted-foreground text-sm">
            {count ?? 0} employee{count !== 1 ? "s" : ""} total
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton csvContent={csvContent} filename="employees.csv" />
          {isAdmin && <ExportCSVButton exportFn={exportEmployeesCSV} filename="employees" label="Export All" />}
          {isAdmin && (
            <Button asChild>
              <Link href="/dashboard/employees/new">
                <Plus className="mr-2 h-4 w-4" />
                Add Employee
              </Link>
            </Button>
          )}
        </div>
      </div>

      {!employees || employees.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No employees found"
          description="Try adjusting your filters or add a new employee."
        />
      ) : (
        <div className="rounded-lg border bg-card">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead className="hidden md:table-cell">Department</TableHead>
                  <TableHead className="hidden lg:table-cell">Position</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden sm:table-cell">Login</TableHead>
                  {isAdmin && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((emp) => (
                  <TableRow key={emp.id}>
                    <TableCell>
                      <Link href={`/dashboard/employees/${emp.id}`} className="font-medium hover:underline">
                        {emp.full_name}
                      </Link>
                      <p className="text-muted-foreground text-xs">{emp.work_email}</p>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{emp.employee_code}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      {(emp.departments as { name: string } | null)?.name ?? "—"}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">{emp.position}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={ROLE_BADGE_STYLES[emp.role]?.className}>{emp.role}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={EMPLOYMENT_STATUS_STYLES[emp.status]?.className}>{emp.status}</Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant={emp.auth_user_id ? "default" : "outline"}>
                        {emp.auth_user_id ? "Yes" : "No"}
                      </Badge>
                    </TableCell>
                    {isAdmin && (
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/dashboard/employees/${emp.id}/edit`}>Edit</Link>
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
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
