import { redirect } from "next/navigation";

import { Pencil } from "lucide-react";

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

import { CapacityFormDialog } from "./_components/capacity-form-dialog";

export default async function CapacityPage() {
  const { employee: actor } = await getAuthenticatedUser();
  if (!canManageConfiguration(actor.role)) redirect("/dashboard");

  const supabase = await createClient();

  const { data: departments } = await supabase
    .from("departments")
    .select("id, name, is_active, workforce_capacity_rules(id, department_id, max_absent_percentage, min_staff_count)")
    .eq("is_active", true)
    .order("name");

  // Count employees per department
  const { data: employeeCounts } = await supabase
    .from("employees")
    .select("department_id")
    .eq("status", "ACTIVE");

  const countMap = new Map<string, number>();
  if (employeeCounts) {
    for (const emp of employeeCounts) {
      if (emp.department_id) {
        countMap.set(emp.department_id, (countMap.get(emp.department_id) ?? 0) + 1);
      }
    }
  }

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">Capacity Rules</h1>
          <p className="text-muted-foreground text-sm">Set department-level staffing limits</p>
        </div>
      </div>

      {!departments || departments.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border bg-card py-20">
          <p className="text-muted-foreground text-sm">No active departments found.</p>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Department</TableHead>
                  <TableHead>Max Absent %</TableHead>
                  <TableHead className="hidden md:table-cell">Min Staff</TableHead>
                  <TableHead className="hidden md:table-cell">Current Employees</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {departments.map((dept) => {
                  const rule = Array.isArray(dept.workforce_capacity_rules)
                    ? dept.workforce_capacity_rules[0] ?? null
                    : dept.workforce_capacity_rules ?? null;
                  const empCount = countMap.get(dept.id) ?? 0;

                  return (
                    <TableRow key={dept.id}>
                      <TableCell className="font-medium">{dept.name}</TableCell>
                      <TableCell>
                        {rule ? (
                          `${rule.max_absent_percentage}%`
                        ) : (
                          <span className="text-muted-foreground">Not configured</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {rule ? (
                          rule.min_staff_count != null ? (
                            rule.min_staff_count
                          ) : (
                            <span className="text-muted-foreground">No minimum</span>
                          )
                        ) : (
                          <span className="text-muted-foreground">Not configured</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="outline">{empCount}</Badge>
                      </TableCell>
                      <TableCell>
                        <CapacityFormDialog
                          departmentId={dept.id}
                          departmentName={dept.name}
                          employeeCount={empCount}
                          rule={rule}
                          trigger={
                            <Button variant="ghost" size="sm">
                              <Pencil className="mr-1 h-3 w-3" />
                              {rule ? "Edit" : "Configure"}
                            </Button>
                          }
                        />
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
