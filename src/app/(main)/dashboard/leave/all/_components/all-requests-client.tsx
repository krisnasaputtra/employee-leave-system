"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Eye, FileText, Loader2, Search, X } from "lucide-react";

import { useTranslation } from "@/providers/locale-provider";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ExportButton } from "@/components/ui/export-button";
import { ExportCSVButton } from "@/components/export-csv-button";
import { STATUS_BADGE_STYLES } from "@/lib/ui/badge-variants";
import { formatDate } from "@/lib/utils/format-date";
import { generateCsv } from "@/lib/utils/export-csv";
import { useDebounce } from "@/hooks/use-debounce";

import {
  fetchAllRequests,
  type FetchAllRequestsResult,
} from "../fetch-all-requests";
import { exportLeaveRequestsCSV } from "../../../employees/export-action";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STATUS_OPTIONS = ["ALL", "PENDING", "APPROVED", "REJECTED", "CANCELLED"] as const;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface AllRequestsClientProps {
  initialData: FetchAllRequestsResult;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AllRequestsClient({ initialData }: AllRequestsClientProps) {
  const { t } = useTranslation();
  // ------ local filter / pagination state ------
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounce(search, 300);

  // Reset to page 1 whenever any filter changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status]);

  // ------ React Query ------
  const isDefault = page === 1 && !debouncedSearch && !status;

  const { data, isFetching } = useQuery({
    queryKey: ["all-leave-requests", debouncedSearch, status, page],
    queryFn: () =>
      fetchAllRequests({
        search: debouncedSearch,
        status: status || undefined,
        page,
      }),
    initialData: isDefault ? initialData : undefined,
    placeholderData: (previousData) => previousData, // keep old data while new loads
  });

  const requests = data?.requests ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = data?.totalPages ?? 1;

  // ------ CSV (for current page export) ------
  const csvContent = useMemo(
    () =>
      generateCsv(
        [
          { key: "request_number" as const, label: "Request Number" },
          { key: "employee_name" as const, label: "Employee Name" },
          { key: "leave_type" as const, label: "Leave Type" },
          { key: "start_date" as const, label: "Start Date" },
          { key: "end_date" as const, label: "End Date" },
          { key: "days" as const, label: "Days" },
          { key: "status" as const, label: "Status" },
          { key: "created_at" as const, label: "Created At" },
        ],
        requests.map((r) => {
          return {
            request_number: r.request_number ?? "",
            employee_name: r.employees?.full_name ?? "Unknown",
            leave_type: r.leave_types?.name ?? "Unknown",
            start_date: r.start_date,
            end_date: r.end_date,
            days: r.requested_days,
            status: r.status,
            created_at: new Date(r.created_at).toLocaleDateString("en-US"),
          };
        }),
      ),
    [requests],
  );

  // ------ helpers ------
  const hasActiveFilters = !!search || !!status;

  const clearFilters = useCallback(() => {
    setSearch("");
    setStatus("");
    setPage(1);
  }, []);

  // ------ render ------
  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">{t("leave.allTitle")}</h1>
          <p className="text-muted-foreground text-sm">
            {totalCount} {t("leave.requestCountLabel")} {t("common.total").toLowerCase()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton csvContent={csvContent} filename="leave-requests.csv" />
          <ExportCSVButton exportFn={exportLeaveRequestsCSV} filename="leave-requests" label={t("common.exportAll")} />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search input — plain input, no <form>, no browser refresh */}
        <div className="relative flex-1 md:max-w-sm">
          <Search className="text-muted-foreground absolute left-2.5 top-2.5 h-4 w-4" />
          <Input
            placeholder={t("leave.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Status filter buttons */}
        <div className="flex gap-1">
          {STATUS_OPTIONS.map((s) => {
            const isActive = s === "ALL" ? !status : status === s;
            return (
              <Button
                key={s}
                variant={isActive ? "default" : "outline"}
                size="sm"
                onClick={() => setStatus(s === "ALL" ? "" : s)}
              >
                {s}
              </Button>
            );
          })}
        </div>

        {/* Clear filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-muted-foreground"
          >
            <X className="mr-1 h-3.5 w-3.5" />
            {t("common.clearFilters")}
          </Button>
        )}

        {/* Fetching indicator */}
        {isFetching && (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Empty state */}
      {requests.length === 0 && !isFetching ? (
        <EmptyState
          icon={FileText}
          title={t("leave.noRequestsFound")}
          description={
            search || status
              ? t("leave.noRequestsFilterDescription")
              : t("leave.noRequestsSystemDescription")
          }
        />
      ) : (
        /* Data table */
        <Card>
          <CardContent className="p-0">
            <div
              className={`transition-opacity duration-150 ${
                isFetching ? "opacity-60" : "opacity-100"
              }`}
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("leave.requestNumber")}</TableHead>
                    <TableHead>{t("employee.fullName")}</TableHead>
                    <TableHead>{t("leave.leaveType")}</TableHead>
                    <TableHead>{t("leave.dateRange")}</TableHead>
                    <TableHead className="text-right">{t("leave.days")}</TableHead>
                    <TableHead>{t("common.status")}</TableHead>
                    <TableHead>{t("leave.created")}</TableHead>
                    <TableHead className="text-right">{t("common.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.request_number ?? "—"}</TableCell>
                      <TableCell>
                        <div className="font-medium">{r.employees?.full_name ?? "Unknown"}</div>
                        <div className="text-muted-foreground text-sm">
                          {r.employees?.employee_code ?? ""}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: r.leave_types?.color ?? "#888" }}
                          />
                          {r.leave_types?.name ?? "Unknown"}
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatDate(r.start_date)} — {formatDate(r.end_date)}
                      </TableCell>
                      <TableCell className="text-right">{r.requested_days}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={STATUS_BADGE_STYLES[r.status]?.className}>
                          {STATUS_BADGE_STYLES[r.status]?.label ?? r.status}
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
                            {t("common.view")}
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t px-4 py-3">
              <p className="text-muted-foreground text-xs">
                {t("common.page")} {page} {t("common.of")} {totalPages}
              </p>
              <div className="flex gap-1">
                {page > 1 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => p - 1)}
                  >
                    {t("common.previous")}
                  </Button>
                )}
                {page < totalPages && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => p + 1)}
                  >
                    {t("common.next")}
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
