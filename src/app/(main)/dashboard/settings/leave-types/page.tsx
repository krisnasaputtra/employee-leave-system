import { redirect } from "next/navigation";

import { Pencil, Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { canManageConfiguration } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";

import { LeaveTypeFormDialog } from "./_components/leave-type-form-dialog";
import { LeaveTypeToggleButton } from "./_components/leave-type-toggle-button";

export default async function LeaveTypesPage() {
  const { employee: actor } = await getAuthenticatedUser();
  if (!canManageConfiguration(actor.role)) redirect("/dashboard");

  const supabase = await createClient();

  const { data: leaveTypes } = await supabase.from("leave_types").select("*").order("name");

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">Leave Types</h1>
          <p className="text-muted-foreground text-sm">Manage leave type definitions</p>
        </div>
        <LeaveTypeFormDialog
          mode="create"
          trigger={
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Leave Type
            </Button>
          }
        />
      </div>

      {!leaveTypes || leaveTypes.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border bg-card py-20">
          <p className="text-muted-foreground text-sm">No leave types found.</p>
        </div>
      ) : (
        <div className="rounded-lg border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">Code</th>
                  <th className="px-4 py-3 text-left font-medium">Name</th>
                  <th className="hidden px-4 py-3 text-left font-medium md:table-cell">Entitlement</th>
                  <th className="hidden px-4 py-3 text-left font-medium md:table-cell">Color</th>
                  <th className="hidden px-4 py-3 text-left font-medium lg:table-cell">Deducts Balance</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {leaveTypes.map((lt) => (
                  <tr key={lt.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3 font-mono text-xs">{lt.code}</td>
                    <td className="px-4 py-3 font-medium">{lt.name}</td>
                    <td className="hidden px-4 py-3 md:table-cell">{lt.default_entitlement} days</td>
                    <td className="hidden px-4 py-3 md:table-cell">
                      <div className="flex items-center gap-2">
                        <div
                          style={{
                            backgroundColor: lt.color,
                          }}
                          className="inline-block h-4 w-4 rounded-full"
                        />
                        <span className="font-mono text-xs">{lt.color}</span>
                      </div>
                    </td>
                    <td className="hidden px-4 py-3 lg:table-cell">
                      <Badge variant={lt.deducts_balance ? "default" : "outline"}>
                        {lt.deducts_balance ? "Yes" : "No"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={lt.is_active ? "default" : "secondary"}>
                        {lt.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <LeaveTypeFormDialog
                          mode="edit"
                          leaveType={lt}
                          trigger={
                            <Button variant="ghost" size="sm">
                              <Pencil className="mr-1 h-3 w-3" />
                              Edit
                            </Button>
                          }
                        />
                        <LeaveTypeToggleButton leaveTypeId={lt.id} isActive={lt.is_active} name={lt.name} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
