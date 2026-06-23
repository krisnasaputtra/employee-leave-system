import Link from "next/link";

import { Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { canManageEmployees } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

type ApplicationRole = Database["public"]["Enums"]["application_role"];
type EmploymentStatus = Database["public"]["Enums"]["employment_status"];

const statusVariant = (status: string) => {
  switch (status) {
    case "ACTIVE":
      return "default" as const;
    case "INACTIVE":
      return "secondary" as const;
    case "TERMINATED":
      return "destructive" as const;
    default:
      return "outline" as const;
  }
};

const roleVariant = (role: string) => {
  switch (role) {
    case "ADMIN":
      return "destructive" as const;
    case "MANAGER":
      return "default" as const;
    default:
      return "secondary" as const;
  }
};

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
  const pageSize = 20;
  const offset = (page - 1) * pageSize;

  let query = supabase
    .from("employees")
    .select(
      "id, employee_code, full_name, work_email, position, role, status, auth_user_id, department_id, departments(name)",
      { count: "exact" },
    );

  if (params.search) {
    query = query.or(
      `full_name.ilike.%${params.search}%,employee_code.ilike.%${params.search}%,work_email.ilike.%${params.search}%`,
    );
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
        <p className="text-muted-foreground text-xs">{error.message}</p>
      </div>
    );
  }

  const totalPages = Math.ceil((count ?? 0) / pageSize);

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">Employees</h1>
          <p className="text-muted-foreground text-sm">
            {count ?? 0} employee{count !== 1 ? "s" : ""} total
          </p>
        </div>
        {isAdmin && (
          <Button asChild>
            <Link href="/dashboard/employees/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Employee
            </Link>
          </Button>
        )}
      </div>

      {!employees || employees.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border bg-card py-20">
          <p className="text-muted-foreground text-sm">No employees found.</p>
        </div>
      ) : (
        <div className="rounded-lg border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">Employee</th>
                  <th className="px-4 py-3 text-left font-medium">Code</th>
                  <th className="hidden px-4 py-3 text-left font-medium md:table-cell">Department</th>
                  <th className="hidden px-4 py-3 text-left font-medium lg:table-cell">Position</th>
                  <th className="px-4 py-3 text-left font-medium">Role</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="hidden px-4 py-3 text-left font-medium sm:table-cell">Login</th>
                  {isAdmin && <th className="px-4 py-3 text-left font-medium">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => (
                  <tr key={emp.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <Link href={`/dashboard/employees/${emp.id}`} className="font-medium hover:underline">
                        {emp.full_name}
                      </Link>
                      <p className="text-muted-foreground text-xs">{emp.work_email}</p>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{emp.employee_code}</td>
                    <td className="hidden px-4 py-3 md:table-cell">
                      {(emp.departments as { name: string } | null)?.name ?? "—"}
                    </td>
                    <td className="hidden px-4 py-3 lg:table-cell">{emp.position}</td>
                    <td className="px-4 py-3">
                      <Badge variant={roleVariant(emp.role)}>{emp.role}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant(emp.status)}>{emp.status}</Badge>
                    </td>
                    <td className="hidden px-4 py-3 sm:table-cell">
                      <Badge variant={emp.auth_user_id ? "default" : "outline"}>
                        {emp.auth_user_id ? "Yes" : "No"}
                      </Badge>
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/dashboard/employees/${emp.id}/edit`}>Edit</Link>
                          </Button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t px-4 py-3">
              <p className="text-muted-foreground text-xs">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-1">
                {page > 1 && (
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/dashboard/employees?page=${page - 1}`}>Previous</Link>
                  </Button>
                )}
                {page < totalPages && (
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/dashboard/employees?page=${page + 1}`}>Next</Link>
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
