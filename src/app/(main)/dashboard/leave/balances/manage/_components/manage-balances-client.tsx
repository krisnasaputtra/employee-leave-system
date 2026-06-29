"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Search, Settings, Wallet, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDebounce } from "@/hooks/use-debounce";

import {
  fetchBalances,
  type FetchBalancesResult,
} from "../fetch-balances";

// ---------------------------------------------------------------------------
// Helpers (keep existing colour logic)
// ---------------------------------------------------------------------------

function getRemainingBadgeClass(remaining: number): string {
  if (remaining <= 0)
    return "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700";
  if (remaining <= 3)
    return "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700";
  return "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-700";
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ManageBalancesClientProps {
  initialData: FetchBalancesResult;
  departments: { id: string; name: string }[];
  currentYear: number;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ManageBalancesClient({
  initialData,
  departments,
  currentYear,
}: ManageBalancesClientProps) {
  // ------ local filter / pagination state ------
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounce(search, 300);

  // Reset to page 1 whenever any filter changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, department]);

  // ------ React Query ------
  const isDefault = page === 1 && !debouncedSearch && !department;

  const { data, isFetching } = useQuery({
    queryKey: ["manage-balances", debouncedSearch, department, page],
    queryFn: () =>
      fetchBalances({
        search: debouncedSearch,
        department,
        page,
      }),
    initialData: isDefault ? initialData : undefined,
    placeholderData: (previousData) => previousData, // keep old data while new loads
  });

  const employees = data?.employees ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = data?.totalPages ?? 1;

  // ------ helpers ------
  const hasActiveFilters = !!search || !!department;

  const clearFilters = useCallback(() => {
    setSearch("");
    setDepartment("");
    setPage(1);
  }, []);

  // ------ render ------
  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-semibold text-2xl tracking-tight">
              Manage Balances
            </h1>
            <Badge variant="secondary">{currentYear}</Badge>
          </div>
          <p className="text-muted-foreground text-sm">
            {totalCount} employee{totalCount !== 1 ? "s" : ""} total
          </p>
        </div>
      </div>

      {/* Search & Filters bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-2">
        {/* Search input */}
        <div className="relative flex-1 max-w-sm">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or code…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>

        {/* Department filter */}
        <NativeSelect
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          className="w-full sm:w-auto"
        >
          <NativeSelectOption value="">All Teams</NativeSelectOption>
          {departments.map((d) => (
            <NativeSelectOption key={d.id} value={d.id}>
              {d.name}
            </NativeSelectOption>
          ))}
        </NativeSelect>

        {/* Clear filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-muted-foreground"
          >
            <X className="mr-1 h-3.5 w-3.5" />
            Clear filters
          </Button>
        )}

        {/* Fetching indicator */}
        {isFetching && (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Table or Empty state */}
      {employees.length === 0 && !isFetching ? (
        <EmptyState
          icon={Wallet}
          title="No employees found"
          description="Try adjusting your search or filter criteria."
        />
      ) : (
        <div
          className={`rounded-lg border bg-card transition-opacity duration-150 ${
            isFetching ? "opacity-60" : "opacity-100"
          }`}
        >
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead className="hidden md:table-cell">Team</TableHead>
                  <TableHead className="text-right">Entitled</TableHead>
                  <TableHead className="text-right">Used</TableHead>
                  <TableHead className="text-right hidden sm:table-cell">
                    Pending
                  </TableHead>
                  <TableHead className="text-right">Remaining</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((emp) => (
                  <TableRow key={emp.id}>
                    <TableCell className="font-medium">
                      {emp.full_name}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {emp.employee_code}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {emp.departments?.name ?? "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {emp.balance.entitled}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {emp.balance.used}
                    </TableCell>
                    <TableCell className="text-right tabular-nums hidden sm:table-cell">
                      {emp.balance.pending}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant="outline"
                        className={getRemainingBadgeClass(
                          emp.balance.remaining,
                        )}
                      >
                        {emp.balance.remaining}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/dashboard/leave/balances/${emp.id}`}>
                          <Settings className="mr-1.5 h-3.5 w-3.5" />
                          Manage
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t px-4 py-3">
              <p className="text-muted-foreground text-xs">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-1">
                {page > 1 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Previous
                  </Button>
                )}
                {page < totalPages && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
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
