import Link from "next/link";

import { Eye, Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { createClient } from "@/lib/supabase/server";

type StatusVariant = "secondary" | "default" | "destructive" | "outline";

const STATUS_BADGE_MAP: Record<string, StatusVariant> = {
  PENDING: "secondary",
  APPROVED: "default",
  REJECTED: "destructive",
  CANCELLED: "outline",
};

function formatDate(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function MyLeaveRequestsPage() {
  const { employee: actor } = await getAuthenticatedUser();
  const supabase = await createClient();

  const { data: requests, error } = await supabase
    .from("leave_requests")
    .select("*, leave_types(name, color, code)")
    .eq("employee_id", actor.id)
    .order("created_at", { ascending: false });

  const count = requests?.length ?? 0;

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="font-semibold text-2xl tracking-tight">My Leave Requests</h1>
          <Badge variant="secondary">{count}</Badge>
        </div>
        <Button size="sm" asChild>
          <Link href="/dashboard/leave/requests/new">
            <Plus className="mr-2 h-4 w-4" />
            New Request
          </Link>
        </Button>
      </div>

      {error ? (
        <div className="flex flex-col items-center justify-center gap-2 py-20">
          <p className="text-destructive text-sm">Failed to load leave requests.</p>
          <p className="text-muted-foreground text-xs">{error.message}</p>
        </div>
      ) : count === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-20">
            <p className="text-muted-foreground text-sm">You haven&apos;t submitted any leave requests yet.</p>
            <Button size="sm" className="mt-4" asChild>
              <Link href="/dashboard/leave/requests/new">
                <Plus className="mr-2 h-4 w-4" />
                Create your first request
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Request #</TableHead>
                <TableHead>Leave Type</TableHead>
                <TableHead>Date Range</TableHead>
                <TableHead className="text-right">Days</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((r) => {
                const leaveType = r.leave_types as {
                  name: string;
                  color: string;
                  code: string;
                } | null;

                return (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.request_number ?? "—"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-2.5 w-2.5 rounded-full"
                          style={{
                            backgroundColor: leaveType?.color ?? "#888",
                          }}
                        />
                        {leaveType?.name ?? "Unknown"}
                      </div>
                    </TableCell>
                    <TableCell>
                      {formatDate(r.start_date)} — {formatDate(r.end_date)}
                    </TableCell>
                    <TableCell className="text-right">{r.requested_days}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_BADGE_MAP[r.status] ?? "secondary"}>{r.status}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/dashboard/leave/requests/${r.id}`}>
                          <Eye className="mr-1 h-4 w-4" />
                          View
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
