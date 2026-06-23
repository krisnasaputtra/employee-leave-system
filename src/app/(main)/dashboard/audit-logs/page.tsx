import Link from "next/link";
import { redirect } from "next/navigation";

import { Search, ShieldAlert } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { createClient } from "@/lib/supabase/server";

const ACTION_OPTIONS = [
  "ALL",
  "EMPLOYEE_CREATED",
  "EMPLOYEE_UPDATED",
  "EMPLOYEE_DEACTIVATED",
  "DEPARTMENT_CREATED",
  "DEPARTMENT_UPDATED",
  "DEPARTMENT_TOGGLED",
  "LEAVE_TYPE_CREATED",
  "LEAVE_TYPE_UPDATED",
  "LEAVE_TYPE_TOGGLED",
  "HOLIDAY_CREATED",
  "HOLIDAY_UPDATED",
  "HOLIDAY_TOGGLED",
  "ATTACHMENT_UPLOADED",
  "ATTACHMENT_REMOVED",
  "ATTACHMENT_ACCESSED",
] as const;

function formatMetadata(value: unknown): string {
  if (value === null || value === undefined) return "—";
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    action?: string;
    page?: string;
    pageSize?: string;
  }>;
}) {
  const { employee } = await getAuthenticatedUser();

  if (employee.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const supabase = await createClient();
  const params = await searchParams;

  const page = Math.max(1, Number(params.page ?? "1"));
  const pageSize = Math.min(100, Math.max(1, Number(params.pageSize ?? "20")));
  const offset = (page - 1) * pageSize;
  const actionFilter = params.action && params.action !== "ALL" ? params.action : null;
  const searchTerm = params.search?.trim() ?? "";

  // Build query
  let query = supabase
    .from("audit_logs")
    .select(
      "id, action, entity_type, metadata, created_at, actor_employee_id, employees!audit_logs_actor_employee_id_fk(full_name)",
      { count: "exact" },
    );

  if (actionFilter) {
    query = query.eq("action", actionFilter);
  }

  if (searchTerm) {
    // Search by actor name via the joined table
    query = query.ilike("employees.full_name", `%${searchTerm}%`);
  }

  query = query.order("created_at", { ascending: false }).range(offset, offset + pageSize - 1);

  const { data: logs, count, error } = await query;

  const items = logs ?? [];
  const totalCount = count ?? 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  // Build URL helper for pagination & filters
  function buildUrl(overrides: Record<string, string | undefined>) {
    const base: Record<string, string> = {};
    if (params.search) base.search = params.search;
    if (params.action) base.action = params.action;
    if (params.pageSize && params.pageSize !== "20") base.pageSize = params.pageSize;

    const merged = { ...base, ...overrides };
    const clean: Record<string, string> = {};
    for (const [key, value] of Object.entries(merged)) {
      if (value) clean[key] = value;
    }
    const qs = new URLSearchParams(clean).toString();
    return `/dashboard/audit-logs${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShieldAlert className="h-5 w-5 text-muted-foreground" />
          <h1 className="font-semibold text-2xl tracking-tight">Audit Logs</h1>
          <Badge variant="secondary">{totalCount}</Badge>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <form className="relative flex-1 md:max-w-sm" action="/dashboard/audit-logs" method="GET">
          {actionFilter && <input type="hidden" name="action" value={actionFilter} />}
          <Search className="text-muted-foreground absolute left-2.5 top-2.5 h-4 w-4" />
          <Input
            name="search"
            placeholder="Search by actor name..."
            defaultValue={searchTerm}
            className="pl-9"
          />
        </form>

        <div className="flex flex-wrap gap-1">
          {(["ALL", "EMPLOYEE_CREATED", "EMPLOYEE_UPDATED", "DEPARTMENT_CREATED", "LEAVE_TYPE_CREATED", "HOLIDAY_CREATED", "ATTACHMENT_UPLOADED"] as const).map((s) => {
            const isActive = s === "ALL" ? !actionFilter : actionFilter === s;
            return (
              <Button
                key={s}
                variant={isActive ? "default" : "outline"}
                size="sm"
                asChild
              >
                <Link href={buildUrl({ action: s === "ALL" ? undefined : s, page: undefined })}>
                  {s === "ALL" ? "All" : s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()).toLowerCase().replace(/^\w/, (c) => c.toUpperCase())}
                </Link>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Error state */}
      {error ? (
        <div className="flex flex-col items-center justify-center gap-2 py-20">
          <p className="text-destructive text-sm">Failed to load audit logs.</p>
          <p className="text-muted-foreground text-xs">{error.message}</p>
        </div>
      ) : items.length === 0 ? (
        /* Empty state */
        <Card>
          <CardHeader>
            <CardTitle>No Audit Logs Found</CardTitle>
            <CardDescription>
              {searchTerm || actionFilter
                ? "No audit log entries match your current filters. Try adjusting your search or action filter."
                : "There are no audit log entries recorded yet."}
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        /* Data table */
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity Type</TableHead>
                <TableHead>Metadata</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((log) => {
                const actor = log.employees as { full_name: string } | null;

                return (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {new Date(log.created_at).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </TableCell>
                    <TableCell className="font-medium">{actor?.full_name ?? "System"}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{log.action}</Badge>
                    </TableCell>
                    <TableCell>{log.entity_type}</TableCell>
                    <TableCell className="max-w-xs">
                      <pre className="whitespace-pre-wrap break-all font-mono text-xs">
                        {formatMetadata(log.metadata)}
                      </pre>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

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
        </div>
      )}
    </div>
  );
}
