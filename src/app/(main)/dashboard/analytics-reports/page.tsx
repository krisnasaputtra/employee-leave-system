import { redirect } from "next/navigation";

import { BarChart3, CalendarCheck, Percent, Timer, UserX } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { createClient } from "@/lib/supabase/server";
import { generateCsv } from "@/lib/utils/export-csv";

import { AnalyticsExportButton } from "./_components/analytics-export-button";
import { DepartmentUtilizationChart } from "./_components/department-chart";
import { LeaveTypeDistributionChart } from "./_components/leave-type-chart";
import { AnalyticsMonthlyTrendChart, type MonthlyTrendItem } from "./_components/monthly-trend-chart";
import type { DepartmentChartItem } from "./_components/department-chart";
import type { LeaveTypeChartItem } from "./_components/leave-type-chart";

/* ---------- Metric Card ---------- */
function MetricCard({
  title,
  value,
  icon: Icon,
  description,
}: {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="font-medium text-sm">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="font-bold text-2xl">{value}</div>
        {description && <p className="mt-1 text-muted-foreground text-xs">{description}</p>}
      </CardContent>
    </Card>
  );
}

/* ---------- Types for data ---------- */
interface LeaveRequestRow {
  id: string;
  status: string;
  requested_days: number;
  start_date: string;
  created_at: string;
  leave_type_id: string;
  employee_id: string;
  leave_types: { name: string; color: string } | null;
  employees: {
    full_name: string;
    departments: { name: string } | null;
  } | null;
}

interface LeaveBalanceRow {
  employee_id: string;
  entitled_days: number;
  used_days: number;
  pending_days: number;
  leave_type_id: string;
  leave_types: { name: string; color: string } | null;
}

interface TopLeaveTaker {
  employeeName: string;
  department: string;
  totalDays: number;
  requestCount: number;
}

interface BalanceOverviewRow {
  leaveType: string;
  totalEntitled: number;
  totalUsed: number;
  totalRemaining: number;
}

/* ============================================================
   Page (Server Component)
   ============================================================ */
export default async function AnalyticsReportsPage() {
  const { employee } = await getAuthenticatedUser();

  // Only ADMIN and MANAGER can access this page
  if (employee.role !== "ADMIN" && employee.role !== "MANAGER") {
    redirect("/dashboard");
  }

  const supabase = await createClient();
  const currentYear = new Date().getFullYear();

  /* ---------- Data Queries ---------- */
  const [
    { data: requests },
    { data: balances },
    { count: totalEmployees },
  ] = await Promise.all([
    // 1. All leave requests for the year
    supabase
      .from("leave_requests")
      .select(
        "id, status, requested_days, start_date, created_at, leave_type_id, employee_id, leave_types(name, color), employees!leave_requests_employee_id_fk(full_name, departments!employees_department_id_fk(name))",
      )
      .gte("start_date", `${currentYear}-01-01`)
      .lte("start_date", `${currentYear}-12-31`),

    // 2. All balances for the year
    supabase
      .from("leave_balances")
      .select(
        "employee_id, entitled_days, used_days, pending_days, leave_type_id, leave_types(name, color)",
      )
      .eq("balance_year", currentYear),

    // 3. All active employees count
    supabase
      .from("employees")
      .select("id", { count: "exact", head: true })
      .eq("status", "ACTIVE"),
  ]);

  const safeRequests = (requests ?? []) as LeaveRequestRow[];
  const safeBalances = (balances ?? []) as LeaveBalanceRow[];

  /* ---------- Compute Summary Metrics ---------- */
  const totalRequests = safeRequests.length;
  const approvedCount = safeRequests.filter((r) => r.status === "APPROVED").length;
  const approvedRate = totalRequests > 0 ? Math.round((approvedCount / totalRequests) * 100) : 0;
  const totalDaysRequested = safeRequests.reduce((sum, r) => sum + (r.requested_days ?? 0), 0);
  const avgDaysPerRequest = totalRequests > 0 ? Math.round((totalDaysRequested / totalRequests) * 10) / 10 : 0;

  // Employees with zero balance (remaining = entitled - used <= 0)
  const employeeBalanceMap = new Map<string, number>();
  for (const b of safeBalances) {
    const remaining = b.entitled_days - b.used_days;
    const current = employeeBalanceMap.get(b.employee_id) ?? 0;
    employeeBalanceMap.set(b.employee_id, current + remaining);
  }
  const employeesWithZeroBalance = Array.from(employeeBalanceMap.values()).filter((r) => r <= 0).length;

  /* ---------- Monthly Leave Trend (Stacked by Status) ---------- */
  const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthlyTrendData: MonthlyTrendItem[] = MONTH_NAMES.map((month) => ({
    month,
    APPROVED: 0,
    REJECTED: 0,
    PENDING: 0,
    CANCELLED: 0,
  }));

  for (const r of safeRequests) {
    const monthIndex = new Date(r.start_date).getMonth();
    const status = r.status as keyof Omit<MonthlyTrendItem, "month">;
    if (monthlyTrendData[monthIndex] && status in monthlyTrendData[monthIndex]) {
      monthlyTrendData[monthIndex][status] += 1;
    }
  }

  /* ---------- Leave Type Distribution ---------- */
  const leaveTypeCountMap = new Map<string, { count: number; color: string }>();
  for (const r of safeRequests) {
    const name = r.leave_types?.name ?? "Unknown";
    const color = r.leave_types?.color ?? "#6b7280";
    const entry = leaveTypeCountMap.get(name) ?? { count: 0, color };
    entry.count += 1;
    leaveTypeCountMap.set(name, entry);
  }
  const leaveTypeData: LeaveTypeChartItem[] = Array.from(leaveTypeCountMap.entries())
    .map(([name, { count, color }]) => ({
      name,
      count,
      color,
      percentage: totalRequests > 0 ? Math.round((count / totalRequests) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  /* ---------- Department Utilization ---------- */
  const deptDaysMap = new Map<string, number>();
  for (const r of safeRequests) {
    if (r.status === "APPROVED") {
      const deptName = r.employees?.departments?.name ?? "Unknown";
      deptDaysMap.set(deptName, (deptDaysMap.get(deptName) ?? 0) + (r.requested_days ?? 0));
    }
  }
  const departmentData: DepartmentChartItem[] = Array.from(deptDaysMap.entries())
    .map(([department, totalDays]) => ({ department, totalDays }))
    .sort((a, b) => b.totalDays - a.totalDays);

  /* ---------- Top Leave Takers ---------- */
  const employeeLeaveMap = new Map<string, { name: string; department: string; totalDays: number; count: number }>();
  for (const r of safeRequests) {
    if (r.status === "APPROVED") {
      const empName = r.employees?.full_name ?? "Unknown";
      const deptName = r.employees?.departments?.name ?? "Unknown";
      const key = r.employee_id;
      const entry = employeeLeaveMap.get(key) ?? { name: empName, department: deptName, totalDays: 0, count: 0 };
      entry.totalDays += r.requested_days ?? 0;
      entry.count += 1;
      employeeLeaveMap.set(key, entry);
    }
  }
  const topLeaveTakers: TopLeaveTaker[] = Array.from(employeeLeaveMap.values())
    .map((e) => ({
      employeeName: e.name,
      department: e.department,
      totalDays: e.totalDays,
      requestCount: e.count,
    }))
    .sort((a, b) => b.totalDays - a.totalDays)
    .slice(0, 10);

  /* ---------- Balance Overview ---------- */
  const balanceByTypeMap = new Map<string, { entitled: number; used: number }>();
  for (const b of safeBalances) {
    const typeName = b.leave_types?.name ?? "Unknown";
    const entry = balanceByTypeMap.get(typeName) ?? { entitled: 0, used: 0 };
    entry.entitled += b.entitled_days;
    entry.used += b.used_days;
    balanceByTypeMap.set(typeName, entry);
  }
  const balanceOverview: BalanceOverviewRow[] = Array.from(balanceByTypeMap.entries())
    .map(([leaveType, { entitled, used }]) => ({
      leaveType,
      totalEntitled: entitled,
      totalUsed: used,
      totalRemaining: entitled - used,
    }))
    .sort((a, b) => a.leaveType.localeCompare(b.leaveType));

  /* ---------- CSV Generation ---------- */
  const topLeaveTakersCsv = generateCsv(
    [
      { key: "employeeName", label: "Employee Name" },
      { key: "department", label: "Team" },
      { key: "totalDays", label: "Total Days" },
      { key: "requestCount", label: "Requests" },
    ],
    topLeaveTakers,
  );

  const balanceOverviewCsv = generateCsv(
    [
      { key: "leaveType", label: "Leave Type" },
      { key: "totalEntitled", label: "Total Entitled" },
      { key: "totalUsed", label: "Total Used" },
      { key: "totalRemaining", label: "Total Remaining" },
    ],
    balanceOverview,
  );

  /* ============================================================
     Render
     ============================================================ */
  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            <h1 className="font-semibold text-2xl tracking-tight">Leave Analytics &amp; Reports</h1>
          </div>
          <p className="text-muted-foreground text-sm">
            Comprehensive overview of leave trends for {currentYear}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <AnalyticsExportButton
            topLeaveTakersCsv={topLeaveTakersCsv}
            balanceOverviewCsv={balanceOverviewCsv}
            year={currentYear}
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Leave Requests"
          value={totalRequests}
          icon={CalendarCheck}
          description={`Year ${currentYear}`}
        />
        <MetricCard
          title="Approved Rate"
          value={`${approvedRate}%`}
          icon={Percent}
          description={`${approvedCount} of ${totalRequests} approved`}
        />
        <MetricCard
          title="Avg Days per Request"
          value={avgDaysPerRequest}
          icon={Timer}
          description="Across all request types"
        />
        <MetricCard
          title="Zero Balance Employees"
          value={employeesWithZeroBalance}
          icon={UserX}
          description={`Out of ${totalEmployees ?? 0} active employees`}
        />
      </div>

      {/* Charts Row: Monthly Trend + Leave Type Distribution */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Leave Trend</CardTitle>
            <CardDescription>Leave requests per month stacked by status – Year {currentYear}</CardDescription>
          </CardHeader>
          <CardContent>
            <AnalyticsMonthlyTrendChart data={monthlyTrendData} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Leave Type Distribution</CardTitle>
            <CardDescription>Percentage of requests per leave type – Year {currentYear}</CardDescription>
          </CardHeader>
          <CardContent>
            {leaveTypeData.length > 0 ? (
              <LeaveTypeDistributionChart data={leaveTypeData} totalRequests={totalRequests} />
            ) : (
              <p className="py-12 text-center text-muted-foreground text-sm">No leave type data available.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Department Utilization */}
      <Card>
        <CardHeader>
          <CardTitle>Team Utilization</CardTitle>
          <CardDescription>Total approved leave days per team – Year {currentYear}</CardDescription>
        </CardHeader>
        <CardContent>
          <DepartmentUtilizationChart data={departmentData} />
        </CardContent>
      </Card>

      {/* Tables Row: Top Leave Takers + Balance Overview */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Top Leave Takers */}
        <Card>
          <CardHeader>
            <CardTitle>Top Leave Takers</CardTitle>
            <CardDescription>Top 10 employees by approved leave days – Year {currentYear}</CardDescription>
          </CardHeader>
          <CardContent>
            {topLeaveTakers.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Team</TableHead>
                    <TableHead className="text-right">Days</TableHead>
                    <TableHead className="text-right">Requests</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topLeaveTakers.map((t, idx) => (
                    <TableRow key={`top-${idx}`}>
                      <TableCell className="font-medium">{t.employeeName}</TableCell>
                      <TableCell>{t.department}</TableCell>
                      <TableCell className="text-right">{t.totalDays}</TableCell>
                      <TableCell className="text-right">{t.requestCount}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="py-6 text-center text-muted-foreground text-sm">No approved leave data.</p>
            )}
          </CardContent>
        </Card>

        {/* Balance Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Balance Overview</CardTitle>
            <CardDescription>Leave balance summary per type – Year {currentYear}</CardDescription>
          </CardHeader>
          <CardContent>
            {balanceOverview.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Leave Type</TableHead>
                    <TableHead className="text-right">Entitled</TableHead>
                    <TableHead className="text-right">Used</TableHead>
                    <TableHead className="text-right">Remaining</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {balanceOverview.map((b, idx) => (
                    <TableRow key={`balance-${idx}`}>
                      <TableCell className="font-medium">{b.leaveType}</TableCell>
                      <TableCell className="text-right">{b.totalEntitled}</TableCell>
                      <TableCell className="text-right">{b.totalUsed}</TableCell>
                      <TableCell className="text-right">{b.totalRemaining}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="py-6 text-center text-muted-foreground text-sm">No balance data available.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
