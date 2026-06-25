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

import { PolicyFormDialog } from "./_components/policy-form-dialog";

export default async function PoliciesPage() {
  const { employee: actor } = await getAuthenticatedUser();
  if (!canManageConfiguration(actor.role)) redirect("/dashboard");

  const supabase = await createClient();

  const { data: leaveTypes } = await supabase
    .from("leave_types")
    .select("id, name, is_active, leave_policies(id, leave_type_id, notice_period_days, max_consecutive_days, requires_attachment)")
    .eq("is_active", true)
    .order("name");

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">Leave Policies</h1>
          <p className="text-muted-foreground text-sm">Configure submission rules per leave type</p>
        </div>
      </div>

      {!leaveTypes || leaveTypes.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border bg-card py-20">
          <p className="text-muted-foreground text-sm">No active leave types found.</p>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Leave Type</TableHead>
                  <TableHead>Notice Period</TableHead>
                  <TableHead className="hidden md:table-cell">Max Consecutive Days</TableHead>
                  <TableHead className="hidden md:table-cell">Requires Attachment</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaveTypes.map((lt) => {
                  const policy = Array.isArray(lt.leave_policies)
                    ? lt.leave_policies[0] ?? null
                    : lt.leave_policies ?? null;

                  return (
                    <TableRow key={lt.id}>
                      <TableCell className="font-medium">{lt.name}</TableCell>
                      <TableCell>
                        {policy ? (
                          `${policy.notice_period_days} day${policy.notice_period_days !== 1 ? "s" : ""}`
                        ) : (
                          <span className="text-muted-foreground">Not configured</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {policy ? (
                          policy.max_consecutive_days != null ? (
                            `${policy.max_consecutive_days} day${policy.max_consecutive_days !== 1 ? "s" : ""}`
                          ) : (
                            <span className="text-muted-foreground">No limit</span>
                          )
                        ) : (
                          <span className="text-muted-foreground">Not configured</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {policy ? (
                          <Badge variant={policy.requires_attachment ? "default" : "outline"}>
                            {policy.requires_attachment ? "Yes" : "No"}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">Not configured</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <PolicyFormDialog
                          leaveTypeId={lt.id}
                          leaveTypeName={lt.name}
                          policy={policy}
                          trigger={
                            <Button variant="ghost" size="sm">
                              <Pencil className="mr-1 h-3 w-3" />
                              {policy ? "Edit" : "Configure"}
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
