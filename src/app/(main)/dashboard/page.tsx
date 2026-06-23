import Link from "next/link";

import { Bell, CalendarDays, CheckCircle, Clock, Plus, ShieldCheck, TrendingUp, UserCheck, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { createClient } from "@/lib/supabase/server";

import { MonthlyTrendChart } from "./_components/monthly-trend-chart";

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

/* ---------- Employee Dashboard Types ---------- */
interface EmployeeDashboardData {
  remaining_leave: number;
  pending_days: number;
  used_days: number;
  next_leave: { start_date: string; end_date: string; leave_type: string } | null;
  recent_requests: {
    id: string;
    request_number: string;
    leave_type: string;
    start_date: string;
    end_date: string;
    requested_days: number;
    status: string;
  }[];
  unread_notifications: number;
  year: number;
}

/* ---------- Manager Dashboard Types ---------- */
interface ManagerDashboardData {
  pending_approvals: number;
  on_leave_today: number;
  upcoming_leave: {
    employee_name: string;
    leave_type: string;
    start_date: string;
    end_date: string;
    requested_days: number;
  }[];
  recent_requests: {
    id: string;
    request_number: string;
    employee_name: string;
    leave_type: string;
    status: string;
    created_at: string;
  }[];
}

/* ---------- Admin Dashboard Types ---------- */
interface AdminDashboardData {
  active_employees: number;
  pending_requests: number;
  on_leave_today: number;
  utilization_pct: number;
  total_entitled: number;
  total_used: number;
  status_distribution: { status: string; count: number }[];
  monthly_trend: { month: string; count: number }[];
  recent_audit: {
    id: string;
    action: string;
    entity_type: string;
    actor_name: string;
    created_at: string;
  }[];
  year: number;
}

/* ============================================================
   Metric Card
   ============================================================ */
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

/* ============================================================
   EMPLOYEE Dashboard
   ============================================================ */
function EmployeeDashboard({ data }: { data: EmployeeDashboardData }) {
  return (
    <>
      {/* Metric cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Remaining Leave"
          value={data.remaining_leave}
          icon={CalendarDays}
          description={`Year ${data.year}`}
        />
        <MetricCard title="Pending Days" value={data.pending_days} icon={Clock} />
        <MetricCard title="Used Days" value={data.used_days} icon={CheckCircle} />
        <MetricCard title="Notifications" value={data.unread_notifications} icon={Bell} description="Unread" />
      </div>

      {/* Next Leave */}
      {data.next_leave && (
        <Card>
          <CardHeader>
            <CardTitle>Next Upcoming Leave</CardTitle>
            <CardDescription>{data.next_leave.leave_type}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              {formatDate(data.next_leave.start_date)} — {formatDate(data.next_leave.end_date)}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Actions + Recent Requests */}
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-lg">Recent Requests</h2>
        <Button size="sm" asChild>
          <Link href="/dashboard/leave/requests/new">
            <Plus className="mr-2 h-4 w-4" />
            New Request
          </Link>
        </Button>
      </div>
      {data.recent_requests.length > 0 ? (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Request #</TableHead>
                <TableHead>Leave Type</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead className="text-right">Days</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.recent_requests.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">
                    <Link href={`/dashboard/leave/requests/${r.id}`} className="hover:underline">
                      {r.request_number}
                    </Link>
                  </TableCell>
                  <TableCell>{r.leave_type}</TableCell>
                  <TableCell>
                    {formatDate(r.start_date)} — {formatDate(r.end_date)}
                  </TableCell>
                  <TableCell className="text-right">{r.requested_days}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_BADGE_MAP[r.status] ?? "secondary"}>{r.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground text-sm">No recent leave requests.</p>
          </CardContent>
        </Card>
      )}
    </>
  );
}

/* ============================================================
   MANAGER Dashboard (extends Employee)
   ============================================================ */
function ManagerDashboard({ empData, mgrData }: { empData: EmployeeDashboardData; mgrData: ManagerDashboardData }) {
  return (
    <>
      {/* Employee metric cards + manager extras */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Remaining Leave"
          value={empData.remaining_leave}
          icon={CalendarDays}
          description={`Year ${empData.year}`}
        />
        <MetricCard title="Pending Days" value={empData.pending_days} icon={Clock} />
        <MetricCard title="Pending Approvals" value={mgrData.pending_approvals} icon={ShieldCheck} />
        <MetricCard title="On Leave Today" value={mgrData.on_leave_today} icon={UserCheck} />
      </div>

      {/* Upcoming Team Leave */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Team Leave</CardTitle>
        </CardHeader>
        <CardContent>
          {mgrData.upcoming_leave.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Leave Type</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead className="text-right">Days</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mgrData.upcoming_leave.map((item, i) => (
                  <TableRow key={`upcoming-${i}`}>
                    <TableCell className="font-medium">{item.employee_name}</TableCell>
                    <TableCell>{item.leave_type}</TableCell>
                    <TableCell>
                      {formatDate(item.start_date)} — {formatDate(item.end_date)}
                    </TableCell>
                    <TableCell className="text-right">{item.requested_days}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="py-6 text-center text-muted-foreground text-sm">No upcoming team leave.</p>
          )}
        </CardContent>
      </Card>

      {/* Recent Team Requests */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Team Requests</CardTitle>
            <Button size="sm" variant="outline" asChild>
              <Link href="/dashboard/approvals">View All</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {mgrData.recent_requests.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Request #</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Leave Type</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mgrData.recent_requests.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.request_number}</TableCell>
                    <TableCell>{r.employee_name}</TableCell>
                    <TableCell>{r.leave_type}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_BADGE_MAP[r.status] ?? "secondary"}>{r.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="py-6 text-center text-muted-foreground text-sm">No recent team requests.</p>
          )}
        </CardContent>
      </Card>
    </>
  );
}

/* ============================================================
   ADMIN Dashboard
   ============================================================ */
function AdminDashboard({ data }: { data: AdminDashboardData }) {
  return (
    <>
      {/* Metric cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Active Employees" value={data.active_employees} icon={Users} />
        <MetricCard title="Pending Requests" value={data.pending_requests} icon={Clock} />
        <MetricCard title="On Leave Today" value={data.on_leave_today} icon={UserCheck} />
        <MetricCard
          title="Utilization"
          value={`${data.utilization_pct}%`}
          icon={TrendingUp}
          description={`${data.total_used} / ${data.total_entitled} days used`}
        />
      </div>

      {/* Status Distribution */}
      {data.status_distribution.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Request Status Distribution</CardTitle>
            <CardDescription>Year {data.year}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              {data.status_distribution.map((item) => (
                <div key={item.status} className="flex items-center gap-2">
                  <Badge variant={STATUS_BADGE_MAP[item.status] ?? "secondary"}>{item.status}</Badge>
                  <span className="font-semibold text-sm">{item.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Monthly Trend */}
      {data.monthly_trend.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Monthly Leave Trend</CardTitle>
            <CardDescription>Leave requests per month – Year {data.year}</CardDescription>
          </CardHeader>
          <CardContent>
            <MonthlyTrendChart data={data.monthly_trend} />
          </CardContent>
        </Card>
      )}

      {/* Recent Audit */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Audit Log</CardTitle>
            <Button size="sm" variant="outline" asChild>
              <Link href="/dashboard/audit-logs">View All</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {data.recent_audit.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recent_audit.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="text-muted-foreground">
                      {new Date(entry.created_at).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </TableCell>
                    <TableCell className="font-medium">{entry.actor_name}</TableCell>
                    <TableCell>{entry.action}</TableCell>
                    <TableCell>{entry.entity_type}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="py-6 text-center text-muted-foreground text-sm">No audit entries found.</p>
          )}
        </CardContent>
      </Card>
    </>
  );
}

/* ============================================================
   Page (Server Component)
   ============================================================ */
export default async function DashboardPage() {
  const { employee } = await getAuthenticatedUser();
  const supabase = await createClient();

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <div className="space-y-2">
        <h1 className="font-semibold text-2xl tracking-tight">Welcome, {employee.full_name}</h1>
        <p className="text-muted-foreground text-sm">
          You are signed in as <span className="font-medium">{employee.role}</span>
          {" · "}
          {employee.position}
        </p>
      </div>

      {employee.role === "ADMIN" ? (
        <AdminDashboardSection supabase={supabase} />
      ) : employee.role === "MANAGER" ? (
        <ManagerDashboardSection supabase={supabase} />
      ) : (
        <EmployeeDashboardSection supabase={supabase} />
      )}
    </div>
  );
}

/* ---------- Async sub-sections ---------- */
// biome-ignore lint/suspicious/noExplicitAny: Supabase client type
async function EmployeeDashboardSection({ supabase }: { supabase: any }) {
  const { data } = await supabase.rpc("get_employee_dashboard");
  const empData = data as EmployeeDashboardData;

  return <EmployeeDashboard data={empData} />;
}

// biome-ignore lint/suspicious/noExplicitAny: Supabase client type
async function ManagerDashboardSection({ supabase }: { supabase: any }) {
  const [{ data: empRaw }, { data: mgrRaw }] = await Promise.all([
    supabase.rpc("get_employee_dashboard"),
    supabase.rpc("get_manager_dashboard"),
  ]);
  const empData = empRaw as EmployeeDashboardData;
  const mgrData = mgrRaw as ManagerDashboardData;

  return <ManagerDashboard empData={empData} mgrData={mgrData} />;
}

// biome-ignore lint/suspicious/noExplicitAny: Supabase client type
async function AdminDashboardSection({ supabase }: { supabase: any }) {
  const { data } = await supabase.rpc("get_admin_dashboard");
  const adminData = data as AdminDashboardData;

  return <AdminDashboard data={adminData} />;
}
