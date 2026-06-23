import { redirect } from "next/navigation";

import { Pencil, Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
        <div className="rounded-lg border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">Code</th>
                  <th className="px-4 py-3 text-left font-medium">Name</th>
                  <th className="hidden px-4 py-3 text-left font-medium md:table-cell">Description</th>
                  <th className="hidden px-4 py-3 text-left font-medium lg:table-cell">Manager</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {departments.map((dept) => {
                  const manager = dept.employees as { full_name: string } | null;
                  return (
                    <tr key={dept.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3 font-mono text-xs">{dept.code}</td>
                      <td className="px-4 py-3 font-medium">{dept.name}</td>
                      <td className="hidden max-w-[200px] truncate px-4 py-3 text-muted-foreground md:table-cell">
                        {dept.description ?? "—"}
                      </td>
                      <td className="hidden px-4 py-3 lg:table-cell">{manager?.full_name ?? "—"}</td>
                      <td className="px-4 py-3">
                        <Badge variant={dept.is_active ? "default" : "secondary"}>
                          {dept.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
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
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
