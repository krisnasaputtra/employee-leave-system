import Link from "next/link";
import { redirect } from "next/navigation";

import {
  Briefcase,
  Building2,
  Calendar,
  CheckCircle2,
  CircleDot,
  Clock,
  Eye,
  Hash,
  TreePalm,
  Users,
  UserX,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { createClient } from "@/lib/supabase/server";
import { EMPLOYMENT_STATUS_STYLES, ROLE_BADGE_STYLES } from "@/lib/ui/badge-variants";
import { formatDate } from "@/lib/utils/format-date";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default async function TeamPage() {
  const { employee: actor } = await getAuthenticatedUser();

  // Only MANAGER and ADMIN can access this page
  if (actor.role === "EMPLOYEE") {
    redirect("/dashboard");
  }

  const supabase = await createClient();
  const isAdmin = actor.role === "ADMIN";

  // Get direct reports (or all employees for ADMIN)
  let query = supabase
    .from("employees")
    .select(
      `id, employee_code, full_name, position, status, role,
      departments!employees_department_id_fk(name)`,
    )
    .order("full_name");

  if (!isAdmin) {
    query = query.eq("manager_id", actor.id);
  } else {
    // ADMIN sees all except themselves
    query = query.neq("id", actor.id);
  }

  const { data: teamMembers, error } = await query;

  if (error) {
    return (
      <div className="@container/main flex flex-col gap-4 md:gap-6">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">
            {isAdmin ? "All Employees" : "My Team"}
          </h1>
        </div>
        <div className="flex flex-col items-center justify-center gap-2 py-20">
          <p className="text-destructive text-sm">
            Failed to load team members.
          </p>
          <p className="text-muted-foreground text-xs">
            Something went wrong while loading data. Please try again later.
          </p>
        </div>
      </div>
    );
  }

  const members = teamMembers ?? [];

  // Get today's date for leave status check
  const today = new Date().toISOString().split("T")[0];
  const currentYear = new Date().getFullYear();

  // Get employees currently on approved leave today
  let onLeaveSet = new Set<string>();
  if (members.length > 0) {
    const { data: onLeaveToday } = await supabase
      .from("leave_requests")
      .select("employee_id")
      .eq("status", "APPROVED")
      .lte("start_date", today)
      .gte("end_date", today)
      .in(
        "employee_id",
        members.map((m) => m.id),
      );

    onLeaveSet = new Set((onLeaveToday ?? []).map((r) => r.employee_id));
  }

  // Get pending request counts per employee
  const pendingCountMap = new Map<string, number>();
  if (members.length > 0) {
    const { data: pendingRequests } = await supabase
      .from("leave_requests")
      .select("employee_id")
      .eq("status", "PENDING")
      .in(
        "employee_id",
        members.map((m) => m.id),
      );

    for (const r of pendingRequests ?? []) {
      pendingCountMap.set(
        r.employee_id,
        (pendingCountMap.get(r.employee_id) ?? 0) + 1,
      );
    }
  }

  // Get leave balance summary per employee for current year
  const leaveBalanceMap = new Map<
    string,
    { entitled: number; used: number; remaining: number }
  >();
  if (members.length > 0) {
    const { data: balances } = await supabase
      .from("leave_balances")
      .select("employee_id, entitled_days, used_days, pending_days")
      .eq("balance_year", currentYear)
      .in(
        "employee_id",
        members.map((m) => m.id),
      );

    for (const b of balances ?? []) {
      const existing = leaveBalanceMap.get(b.employee_id) ?? {
        entitled: 0,
        used: 0,
        remaining: 0,
      };
      existing.entitled += b.entitled_days;
      existing.used += b.used_days;
      existing.remaining += b.entitled_days - b.used_days;
      leaveBalanceMap.set(b.employee_id, existing);
    }
  }

  const activeCount = members.filter((m) => m.status === "ACTIVE").length;
  const onLeaveCount = onLeaveSet.size;
  const totalPending = Array.from(pendingCountMap.values()).reduce(
    (sum, c) => sum + c,
    0,
  );

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      {/* Page Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">
            {isAdmin ? "All Employees" : "My Team"}
          </h1>
          <p className="text-muted-foreground text-sm">
            {members.length} {isAdmin ? "employee" : "direct report"}
            {members.length !== 1 ? "s" : ""}
          </p>
        </div>
        {members.length > 0 && (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1.5">
              <Users className="h-3 w-3" />
              {activeCount} Active
            </Badge>
            {onLeaveCount > 0 && (
              <Badge
                variant="secondary"
                className="gap-1.5 bg-amber-500/10 text-amber-700 dark:text-amber-400"
              >
                <TreePalm className="h-3 w-3" />
                {onLeaveCount} On Leave
              </Badge>
            )}
            {totalPending > 0 && (
              <Badge
                variant="secondary"
                className="gap-1.5 bg-orange-500/10 text-orange-700 dark:text-orange-400"
              >
                <Clock className="h-3 w-3" />
                {totalPending} Pending
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Summary Cards */}
      {members.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Entitled</CardDescription>
              <CardTitle className="text-2xl">
                {Array.from(leaveBalanceMap.values()).reduce(
                  (sum, b) => sum + b.entitled,
                  0,
                )}{" "}
                <span className="font-normal text-muted-foreground text-sm">days</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-xs">
                Across all team members for {currentYear}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Used</CardDescription>
              <CardTitle className="text-2xl">
                {Array.from(leaveBalanceMap.values()).reduce(
                  (sum, b) => sum + b.used,
                  0,
                )}{" "}
                <span className="font-normal text-muted-foreground text-sm">days</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-xs">
                Leave days consumed this year
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Remaining</CardDescription>
              <CardTitle className="text-2xl">
                {Array.from(leaveBalanceMap.values()).reduce(
                  (sum, b) => sum + b.remaining,
                  0,
                )}{" "}
                <span className="font-normal text-muted-foreground text-sm">days</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-xs">
                Available leave balance remaining
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Empty State */}
      {members.length === 0 ? (
        <Card>
          <CardContent className="py-16">
            <EmptyState
              icon={UserX}
              title="No Direct Reports"
              description={
                isAdmin
                  ? "No employees found in the system."
                  : "You don't have any team members assigned to you yet. Contact an administrator to assign employees to your team."
              }
            />
          </CardContent>
        </Card>
      ) : (
        /* Team Member Table */
        <Card>
          <CardHeader>
            <CardTitle>Team Members</CardTitle>
            <CardDescription>
              {isAdmin
                ? "Overview of all employees with leave balances"
                : "Your direct reports with leave balance summary"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Entitled</TableHead>
                  <TableHead className="text-center">Used</TableHead>
                  <TableHead className="text-center">Remaining</TableHead>
                  <TableHead className="text-center">Pending</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => {
                  const department = member.departments as {
                    name: string;
                  } | null;
                  const isOnLeave = onLeaveSet.has(member.id);
                  const pendingCount = pendingCountMap.get(member.id) ?? 0;
                  const balance = leaveBalanceMap.get(member.id) ?? {
                    entitled: 0,
                    used: 0,
                    remaining: 0,
                  };
                  const statusStyle =
                    EMPLOYMENT_STATUS_STYLES[member.status] ?? EMPLOYMENT_STATUS_STYLES.ACTIVE;

                  return (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar size="sm">
                            <AvatarFallback
                              className={
                                member.status === "ACTIVE"
                                  ? "bg-primary/10 text-primary text-xs"
                                  : "bg-muted text-muted-foreground text-xs"
                              }
                            >
                              {getInitials(member.full_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-sm">
                              {member.full_name}
                            </p>
                            <p className="flex items-center gap-1 text-muted-foreground text-xs">
                              <Hash className="h-3 w-3" />
                              {member.employee_code}
                            </p>
                          </div>
                          {isOnLeave && (
                            <Badge
                              variant="outline"
                              className="ml-1 shrink-0 border-amber-500/30 bg-amber-500/10 text-[10px] text-amber-700 dark:text-amber-400"
                            >
                              <TreePalm className="mr-0.5 h-2.5 w-2.5" />
                              On Leave
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm">
                          <Building2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          {department?.name ?? "\u2014"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {member.position || "\u2014"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={statusStyle.className}
                        >
                          {member.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-medium text-sm">
                          {balance.entitled}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-sm">{balance.used}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span
                          className={`font-medium text-sm ${
                            balance.remaining <= 3 && balance.remaining > 0
                              ? "text-amber-600 dark:text-amber-400"
                              : balance.remaining === 0
                                ? "text-red-600 dark:text-red-400"
                                : "text-emerald-600 dark:text-emerald-400"
                          }`}
                        >
                          {balance.remaining}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        {pendingCount > 0 ? (
                          <Badge variant="destructive" className="text-[10px]">
                            <Clock className="mr-0.5 h-2.5 w-2.5" />
                            {pendingCount}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            0
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                          >
                            <Link
                              href={`/dashboard/employees/${member.id}`}
                            >
                              <Eye className="mr-1 h-3.5 w-3.5" />
                              View
                            </Link>
                          </Button>
                          {pendingCount > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              asChild
                            >
                              <Link href="/dashboard/approvals">
                                <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                                Approve
                              </Link>
                            </Button>
                          )}
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
