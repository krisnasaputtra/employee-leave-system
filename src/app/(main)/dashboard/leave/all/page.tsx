import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Eye, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

type LeaveRequestStatus = Database["public"]["Enums"]["leave_request_status"];

export const metadata: Metadata = {
  title: "All Leave Requests",
};

type StatusVariant = "secondary" | "default" | "destructive" | "outline";

const STATUS_BADGE_MAP: Record<string, StatusVariant> = {
  PENDING: "secondary",
  APPROVED: "default",
  REJECTED: "destructive",
  CANCELLED: "outline",
};

const STATUS_OPTIONS = ["ALL", "PENDING", "APPROVED", "REJECTED", "CANCELLED"] as const;

function formatDate(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function AllLeaveRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    status?: string;
    page?: string;
    pageSize?: string;
  }>;
}) {
  const { employee: actor } = await getAuthenticatedUser();

  // Admin-only page
  if (actor.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const supabase = await createClient();
  const params = await searchParams;

  const page = Math.max(1, Number(params.page ?? "1"));
  const pageSize = Math.min(100, Math.max(1, Number(params.pageSize ?? "20")));
  const offset = (page - 1) * pageSize;
  const statusFilter = params.status && params.status !== "ALL" ? params.status : null;
  const searchTerm = params.search?.trim() ?? "";

  // Build query with explicit FK hints (ambiguous FKs on employees table)
  let query = supabase
    .from("leave_requests")
    .select(
      "*, employees!leave_requests_employee_id_fk(full_name, employee_code), leave_types!leave_requests_leave_type_id_fk(name, color)",
      { count: "exact" },
    );

  if (statusFilter && ["PENDING", "APPROVED", "REJECTED", "CANCELLED"].includes(statusFilter)) {
    query = query.eq("status", statusFilter as NonNullable<LeaveRequestStatus>);
  }

  if (searchTerm) {
    // Search by request_number or employee name via the joined table
    query = query.or(
      `request_number.ilike.%${searchTerm}%,employees.full_name.ilike.%${searchTerm}%`,
    );
  }

  query = query.order("created_at", { ascending: false }).range(offset, offset + pageSize - 1);

  const { data: requests, count, error } = await query;

  const totalCount = count ?? 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  // Build URL helper for pagination & filters
  function buildUrl(overrides: Record<string, string | undefined>) {
    const base: Record<string, string> = {};
    if (params.search) base.search = params.search;
    if (params.status) base.status = params.status;
    if (params.pageSize && params.pageSize !== "20") base.pageSize = params.pageSize;

    const merged = { ...base, ...overrides };
    // Remove empty/undefined values to build a clean Record<string, string>
    const clean: Record<string, string> = {};
    for (const [key, value] of Object.entries(merged)) {
      if (value) clean[key] = value;
    }
    const qs = new URLSearchParams(clean).toString();
    return `/dashboard/leave/all${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">All Leave Requests</h1>
          <p className="text-muted-foreground text-sm">
            {totalCount} request{totalCount !== 1 ? "s" : ""} total
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <form className="relative flex-1 md:max-w-sm" action="/dashboard/leave/all" method="GET">
          {statusFilter && <input type="hidden" name="status" value={statusFilter} />}
          <Search className="text-muted-foreground absolute left-2.5 top-2.5 h-4 w-4" />
          <Input
            name="search"
            placeholder="Search by name or request #..."
            defaultValue={searchTerm}
            className="pl-9"
          />
        </form>

        <div className="flex gap-1">
          {STATUS_OPTIONS.map((s) => {
            const isActive = s === "ALL" ? !statusFilter : statusFilter === s;
            return (
              <Button
                key={s}
                variant={isActive ? "default" : "outline"}
                size="sm"
                asChild
              >
                <Link href={buildUrl({ status: s === "ALL" ? undefined : s, page: undefined })}>
                  {s}
                </Link>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Error state */}
      {error ? (
        <div className="flex flex-col items-center justify-center gap-2 py-20">
          <p className="text-destructive text-sm">Failed to load leave requests.</p>
          <p className="text-muted-foreground text-xs">
            An unexpected error occurred. Please try again later.
          </p>
        </div>
      ) : !requests || requests.length === 0 ? (
        /* Empty state */
        <Card>
          <CardHeader>
            <CardTitle>No Requests Found</CardTitle>
            <CardDescription>
              {searchTerm || statusFilter
                ? "No leave requests match your current filters. Try adjusting your search or status filter."
                : "There are no leave requests in the system yet."}
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        /* Data table */
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Request #</TableHead>
                  <TableHead>Employee</TableHead>
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
                  const employee = r.employees as {
                    full_name: string;
                    employee_code: string;
                  } | null;

                  const leaveType = r.leave_types as {
                    name: string;
                    color: string;
                  } | null;

                  return (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.request_number ?? "—"}</TableCell>
                      <TableCell>
                        <div className="font-medium">{employee?.full_name ?? "Unknown"}</div>
                        <div className="text-muted-foreground text-sm">
                          {employee?.employee_code ?? ""}
                        </div>
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
                        <Badge variant={STATUS_BADGE_MAP[r.status] ?? "secondary"}>
                          {r.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(r.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
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
          </CardContent>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t px-4 py-3">
              <p className="text-muted-foreground text-xs">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-1">
                {page > 1 && (
                  <Button variant="outline" size="sm" asChild>
                    <Link href={buildUrl({ page: String(page - 1) })}>Previous</Link>
                  </Button>
                )}
                {page < totalPages && (
                  <Button variant="outline" size="sm" asChild>
                    <Link href={buildUrl({ page: String(page + 1) })}>Next</Link>
                  </Button>
                )}
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
