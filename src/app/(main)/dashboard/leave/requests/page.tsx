import Link from "next/link";

import { Eye, FileText, Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { createClient } from "@/lib/supabase/server";
import { STATUS_BADGE_STYLES } from "@/lib/ui/badge-variants";
import { formatDate } from "@/lib/utils/format-date";

export default async function MyLeaveRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
  }>;
}) {
  const { employee: actor } = await getAuthenticatedUser();
  const supabase = await createClient();
  const params = await searchParams;

  const page = Math.max(1, Number(params.page ?? "1"));
  const pageSize = 10;
  const offset = (page - 1) * pageSize;

  const { data: requests, count, error } = await supabase
    .from("leave_requests")
    .select("*, leave_types(name, color, code)", { count: "exact" })
    .eq("employee_id", actor.id)
    .order("created_at", { ascending: false })
    .range(offset, offset + pageSize - 1);

  const totalCount = count ?? 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  function buildPaginationUrl(targetPage: number) {
    const p = new URLSearchParams();
    p.set("page", String(targetPage));
    return `/dashboard/leave/requests?${p.toString()}`;
  }

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="font-semibold text-2xl tracking-tight">My Leave Requests</h1>
          <Badge variant="secondary">{totalCount}</Badge>
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
          <p className="text-muted-foreground text-xs">Something went wrong while loading data. Please try again later.</p>
        </div>
      ) : totalCount === 0 ? (
        <EmptyState
          icon={FileText}
          title="No leave requests yet"
          description="You haven't submitted any leave requests yet."
        >
          <Button size="sm" asChild>
            <Link href="/dashboard/leave/requests/new">
              <Plus className="mr-2 h-4 w-4" />
              Create your first request
            </Link>
          </Button>
        </EmptyState>
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
                      <Badge variant="outline" className={STATUS_BADGE_STYLES[r.status]?.className}>{STATUS_BADGE_STYLES[r.status]?.label ?? r.status}</Badge>
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
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t px-4 py-3">
              <p className="text-muted-foreground text-xs">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-1">
                {page > 1 && (
                  <Button variant="outline" size="sm" asChild>
                    <Link href={buildPaginationUrl(page - 1)}>Previous</Link>
                  </Button>
                )}
                {page < totalPages && (
                  <Button variant="outline" size="sm" asChild>
                    <Link href={buildPaginationUrl(page + 1)}>Next</Link>
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
