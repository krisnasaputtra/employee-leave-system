import Link from "next/link";
import { redirect } from "next/navigation";

import { Eye } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { createClient } from "@/lib/supabase/server";

import { ApprovalActions } from "./_components/approval-actions";

function formatDate(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function ApprovalsPage() {
  const { employee: actor } = await getAuthenticatedUser();

  if (actor.role === "EMPLOYEE") {
    redirect("/dashboard");
  }

  const supabase = await createClient();

  const { data: requests } = await supabase
    .from("leave_requests")
    .select("*, leave_types(name, color, code), employees!leave_requests_employee_id_fk(id, full_name, employee_code)")
    .eq("status", "PENDING")
    .order("created_at", { ascending: true });

  // Filter out actor's own requests (self-approval prevention)
  const filteredRequests = (requests ?? []).filter((r) => r.employee_id !== actor.id);

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <div className="flex items-center gap-3">
        <h1 className="font-semibold text-2xl tracking-tight">Pending Approvals</h1>
        <Badge variant="secondary">{filteredRequests.length}</Badge>
      </div>

      {filteredRequests.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Pending Requests</CardTitle>
            <CardDescription>There are no leave requests waiting for your approval at this time.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Leave Type</TableHead>
                  <TableHead>Date Range</TableHead>
                  <TableHead className="text-right">Days</TableHead>
                  <TableHead>Requested On</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((r) => {
                  const leaveType = r.leave_types as {
                    name: string;
                    color: string;
                    code: string;
                  } | null;

                  const employee = r.employees as {
                    id: string;
                    full_name: string;
                    employee_code: string;
                  } | null;

                  return (
                    <TableRow key={r.id}>
                      <TableCell>
                        <div className="font-medium">{employee?.full_name ?? "Unknown"}</div>
                        <div className="text-muted-foreground text-sm">{employee?.employee_code ?? ""}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: leaveType?.color ?? "#888" }}
                          />
                          {leaveType?.name ?? "Unknown"}
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatDate(r.start_date)} — {formatDate(r.end_date)}
                      </TableCell>
                      <TableCell className="text-right">{r.requested_days}</TableCell>
                      <TableCell>
                        {new Date(r.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/dashboard/leave/requests/${r.id}`}>
                              <Eye className="mr-1 h-4 w-4" />
                              View
                            </Link>
                          </Button>
                          <ApprovalActions
                            requestId={r.id}
                            requestNumber={r.request_number ?? ""}
                            employeeName={employee?.full_name ?? "Employee"}
                          />
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
