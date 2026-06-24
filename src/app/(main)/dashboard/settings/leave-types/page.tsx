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
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden md:table-cell">Entitlement</TableHead>
                  <TableHead className="hidden md:table-cell">Color</TableHead>
                  <TableHead className="hidden lg:table-cell">Deducts Balance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaveTypes.map((lt) => (
                  <TableRow key={lt.id}>
                    <TableCell className="font-mono text-xs">{lt.code}</TableCell>
                    <TableCell className="font-medium">{lt.name}</TableCell>
                    <TableCell className="hidden md:table-cell">{lt.default_entitlement} days</TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        <div
                          style={{
                            backgroundColor: lt.color,
                          }}
                          className="inline-block h-4 w-4 rounded-full"
                        />
                        <span className="font-mono text-xs">{lt.color}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <Badge variant={lt.deducts_balance ? "default" : "outline"}>
                        {lt.deducts_balance ? "Yes" : "No"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={lt.is_active ? "default" : "secondary"}>
                        {lt.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
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
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

