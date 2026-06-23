import Link from "next/link";

import { Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
      "id, employee_code, full_name, work_email, position, role, status, auth_user_id, department_id, departments!employees_department_id_fk(name)",
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
                      <Badge variant={roleVariant(emp.role)}>{emp.role}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(emp.status)}>{emp.status}</Badge>
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
