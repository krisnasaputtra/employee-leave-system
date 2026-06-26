"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Eye, FileText, Loader2, Plus } from "lucide-react";

import { useTranslation } from "@/providers/locale-provider";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { STATUS_BADGE_STYLES } from "@/lib/ui/badge-variants";
import { formatDate } from "@/lib/utils/format-date";

import {
  fetchMyRequests,
  type FetchMyRequestsResult,
} from "../fetch-my-requests";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface MyRequestsClientProps {
  initialData: FetchMyRequestsResult;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MyRequestsClient({ initialData }: MyRequestsClientProps) {
  const { t } = useTranslation();
  // ------ pagination state ------
  const [page, setPage] = useState(1);

  // ------ React Query ------
  const { data, isFetching } = useQuery({
    queryKey: ["my-leave-requests", page],
    queryFn: () => fetchMyRequests({ page }),
    initialData: page === 1 ? initialData : undefined,
    placeholderData: (previousData) => previousData, // keep old data while loading
  });

  const requests = data?.requests ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = data?.totalPages ?? 1;

  // ------ render ------
  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="font-semibold text-2xl tracking-tight">
            {t("leave.myTitle")}
          </h1>
          <Badge variant="secondary">{totalCount}</Badge>
          {/* Fetching indicator */}
          {isFetching && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>
        <Button size="sm" asChild>
          <Link href="/dashboard/leave/requests/new">
            <Plus className="mr-2 h-4 w-4" />
            {t("leave.newRequest")}
          </Link>
        </Button>
      </div>

      {/* Content */}
      {requests.length === 0 && !isFetching ? (
        <EmptyState
          icon={FileText}
          title={t("leave.noRequests")}
          description={t("leave.noRequestsDescription")}
        >
          <Button size="sm" asChild>
            <Link href="/dashboard/leave/requests/new">
              <Plus className="mr-2 h-4 w-4" />
              {t("leave.createFirst")}
            </Link>
          </Button>
        </EmptyState>
      ) : (
        <div
          className={`rounded-lg border bg-card transition-opacity duration-150 ${
            isFetching ? "opacity-60" : "opacity-100"
          }`}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("leave.requestNumber")}</TableHead>
                <TableHead>{t("leave.leaveType")}</TableHead>
                <TableHead>{t("leave.dateRange")}</TableHead>
                <TableHead className="text-right">{t("leave.days")}</TableHead>
                <TableHead>{t("common.status")}</TableHead>
                <TableHead>{t("leave.created")}</TableHead>
                <TableHead className="text-right">{t("common.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((r) => {
                const leaveType = r.leave_types;

                return (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">
                      {r.request_number ?? "—"}
                    </TableCell>
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
                    <TableCell className="text-right">
                      {r.requested_days}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          STATUS_BADGE_STYLES[r.status]?.className
                        }
                      >
                        {STATUS_BADGE_STYLES[r.status]?.label ?? r.status}
                      </Badge>
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
                          {t("common.view")}
                        </Link>
                      </Button>
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
        </div>
      )}
    </div>
  );
}
