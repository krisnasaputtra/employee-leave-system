import { redirect } from "next/navigation";

import { Pencil, Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { canManageConfiguration } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";

import { DepartmentFormDialog } from "./_components/department-form-dialog";
import { DepartmentToggleButton } from "./_components/department-toggle-button";

export default async function DepartmentsPage() {
  const { employee: actor } = await getAuthenticatedUser();
  if (!canManageConfiguration(actor.role)) redirect("/dashboard");

  const supabase = await createClient();

  const { data: departments } = await supabase
    .from("departments")
    .select("*, employees!departments_manager_employee_id_fk(full_name)")
    .order("name");

  const { data: employees } = await supabase
    .from("employees")
    .select("id, full_name")
    .eq("status", "ACTIVE")
    .order("full_name");

  const safeEmployees = (employees ?? []).map((e) => ({
    id: e.id,
    full_name: e.full_name,
  }));

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">Departments</h1>
          <p className="text-muted-foreground text-sm">Manage organization departments</p>
        </div>
        <DepartmentFormDialog
          mode="create"
          employees={safeEmployees}
          trigger={
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Department
            </Button>
          }
        />
      </div>

      {!departments || departments.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border bg-card py-20">
          <p className="text-muted-foreground text-sm">No departments found.</p>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden md:table-cell">Description</TableHead>
                  <TableHead className="hidden lg:table-cell">Manager</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {departments.map((dept) => {
                  const manager = dept.employees as { full_name: string } | null;
                  return (
                    <TableRow key={dept.id}>
                      <TableCell className="font-mono text-xs">{dept.code}</TableCell>
                      <TableCell className="font-medium">{dept.name}</TableCell>
                      <TableCell className="hidden max-w-[200px] truncate text-muted-foreground md:table-cell">
                        {dept.description ?? "—"}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">{manager?.full_name ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant={dept.is_active ? "default" : "secondary"}>
                          {dept.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <DepartmentFormDialog
                            mode="edit"
                            department={dept}
                            employees={safeEmployees}
                            trigger={
                              <Button variant="ghost" size="sm">
                                <Pencil className="mr-1 h-3 w-3" />
                                Edit
                              </Button>
                            }
                          />
                          <DepartmentToggleButton departmentId={dept.id} isActive={dept.is_active} name={dept.name} />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

