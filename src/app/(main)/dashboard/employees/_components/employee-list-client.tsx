"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Plus, Search, Users, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { ExportButton } from "@/components/ui/export-button";
import { ExportCSVButton } from "@/components/export-csv-button";
import { ROLE_BADGE_STYLES, EMPLOYMENT_STATUS_STYLES } from "@/lib/ui/badge-variants";
import { generateCsv } from "@/lib/utils/export-csv";
import { useDebounce } from "@/hooks/use-debounce";

import { fetchEmployees, type FetchEmployeesResult } from "../fetch-employees";
import { exportEmployeesCSV } from "../export-action";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface EmployeeListClientProps {
  initialData: FetchEmployeesResult;
  isAdmin: boolean;
  departments: { id: string; name: string }[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function EmployeeListClient({
  initialData,
  isAdmin,
  departments,
}: EmployeeListClientProps) {
  // ------ local filter / pagination state ------
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounce(search, 300);

  // Reset to page 1 whenever any filter changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, department, role, status]);

  // ------ React Query ------
  const isDefault =
    page === 1 && !debouncedSearch && !department && !role && !status;

  const { data, isFetching } = useQuery({
    queryKey: ["employees", debouncedSearch, department, role, status, page],
    queryFn: () =>
      fetchEmployees({
        search: debouncedSearch,
        department,
        role,
        status,
        page,
      }),
    initialData: isDefault ? initialData : undefined,
    placeholderData: (previousData) => previousData, // keep old data while new loads
  });

  const employees = data?.employees ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = data?.totalPages ?? 1;

  // ------ CSV (for current page export) ------
  const csvContent = useMemo(
    () =>
      generateCsv(
        [
          { key: "employee_code" as const, label: "Employee Code" },
          { key: "full_name" as const, label: "Full Name" },
          { key: "work_email" as const, label: "Email" },
          { key: "department_name" as const, label: "Department" },
          { key: "position" as const, label: "Position" },
          { key: "role" as const, label: "Role" },
          { key: "status" as const, label: "Status" },
        ],
        employees.map((emp) => ({
          employee_code: emp.employee_code,
          full_name: emp.full_name,
          work_email: emp.work_email,
          department_name: emp.departments?.name ?? "",
          position: emp.position,
          role: emp.role,
          status: emp.status,
        })),
      ),
    [employees],
  );

  // ------ helpers ------
  const hasActiveFilters = !!search || !!department || !!role || !!status;

  const clearFilters = useCallback(() => {
    setSearch("");
    setDepartment("");
    setRole("");
    setStatus("");
    setPage(1);
  }, []);

  // ------ render ------
  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">Employees</h1>
          <p className="text-muted-foreground text-sm">
            {totalCount} employee{totalCount !== 1 ? "s" : ""} total
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton csvContent={csvContent} filename="employees.csv" />
          {isAdmin && (
            <ExportCSVButton
              exportFn={exportEmployeesCSV}
              filename="employees"
              label="Export All"
            />
          )}
          {isAdmin && (
            <Button asChild>
              <Link href="/dashboard/employees/new">
                <Plus className="mr-2 h-4 w-4" />
                Add Employee
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Search & Filters bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-2">
        {/* Search input */}
        <div className="relative flex-1 max-w-sm">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search name, code, or email…"
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
          <NativeSelectOption value="">All Departments</NativeSelectOption>
          {departments.map((d) => (
            <NativeSelectOption key={d.id} value={d.id}>
              {d.name}
            </NativeSelectOption>
          ))}
        </NativeSelect>

        {/* Role filter */}
        <NativeSelect
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="w-full sm:w-auto"
        >
          <NativeSelectOption value="">All Roles</NativeSelectOption>
          <NativeSelectOption value="ADMIN">Admin</NativeSelectOption>
          <NativeSelectOption value="MANAGER">Manager</NativeSelectOption>
          <NativeSelectOption value="EMPLOYEE">Employee</NativeSelectOption>
        </NativeSelect>

        {/* Status filter */}
        <NativeSelect
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full sm:w-auto"
        >
          <NativeSelectOption value="">All Statuses</NativeSelectOption>
          <NativeSelectOption value="ACTIVE">Active</NativeSelectOption>
          <NativeSelectOption value="INACTIVE">Inactive</NativeSelectOption>
          <NativeSelectOption value="TERMINATED">Terminated</NativeSelectOption>
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
            Clear
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
          icon={Users}
          title="No employees found"
          description="Try adjusting your filters or add a new employee."
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
                  <TableHead className="hidden md:table-cell">
                    Department
                  </TableHead>
                  <TableHead className="hidden lg:table-cell">
                    Position
                  </TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden sm:table-cell">Login</TableHead>
                  {isAdmin && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((emp) => (
                  <TableRow key={emp.id}>
                    <TableCell>
                      <Link
                        href={`/dashboard/employees/${emp.id}`}
                        className="font-medium hover:underline"
                      >
                        {emp.full_name}
                      </Link>
                      <p className="text-muted-foreground text-xs">
                        {emp.work_email}
                      </p>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {emp.employee_code}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {emp.departments?.name ?? "—"}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {emp.position}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={ROLE_BADGE_STYLES[emp.role]?.className}
                      >
                        {emp.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          EMPLOYMENT_STATUS_STYLES[emp.status]?.className
                        }
                      >
                        {emp.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant={emp.auth_user_id ? "default" : "outline"}>
                        {emp.auth_user_id ? "Yes" : "No"}
                      </Badge>
                    </TableCell>
                    {isAdmin && (
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" asChild>
                            <Link
                              href={`/dashboard/employees/${emp.id}/edit`}
                            >
                              Edit
                            </Link>
                          </Button>
                        </div>
                      </TableCell>
                    )}
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
