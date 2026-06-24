import Link from "next/link";
import { notFound } from "next/navigation";

import { EmptyState } from "@/components/ui/empty-state";

import {
  ArrowLeft,
  Briefcase,
  Building2,
  Calendar,
  Hash,
  Mail,
  Pencil,
  Phone,
  Shield,
  UserCheck,
  Users,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardAction,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { canManageEmployees, canViewEmployee } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import {
  ROLE_BADGE_STYLES,
  EMPLOYMENT_STATUS_STYLES,
  STATUS_BADGE_STYLES,
} from "@/lib/ui/badge-variants";
import { formatDate } from "@/lib/utils/format-date";

export default async function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { employee: actor } = await getAuthenticatedUser();
  const { id } = await params;
  const supabase = await createClient();

  const { data: employee, error } = await supabase
    .from("employees")
    .select(
      "*, departments!employees_department_id_fk(name)"
    )
    .eq("id", id)
    .single();

  if (error || !employee) {
    notFound();
  }

  if (!canViewEmployee(actor.role, actor.id, employee.id, employee.manager_id)) {
    notFound();
  }

  const isAdmin = canManageEmployees(actor.role);

  // Fetch leave balances (admin only)
  let balances: Array<{
    id: string;
    entitled_days: number;
    used_days: number;
    adjustment_days: number;
    leave_types: { name: string } | null;
  }> = [];
  if (isAdmin) {
    const { data } = await supabase
      .from("leave_balances")
      .select("id, entitled_days, used_days, adjustment_days, leave_types!leave_balances_leave_type_id_fk(name)")
      .eq("employee_id", employee.id)
      .eq("balance_year", new Date().getFullYear());
    balances = (data ?? []) as typeof balances;
  }

  // Fetch recent leave requests
  const { data: recentRequests } = await supabase
    .from("leave_requests")
    .select("id, request_number, status, start_date, end_date, requested_days, leave_types!leave_requests_leave_type_id_fk(name)")
    .eq("employee_id", employee.id)
    .order("created_at", { ascending: false })
    .limit(5);

  const initials = employee.full_name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // Separate query for manager name
  let managerName: string | null = null;
  if (employee?.manager_id) {
    const { data: mgr } = await supabase
      .from("employees")
      .select("full_name")
      .eq("id", employee.manager_id)
      .single();
    managerName = mgr?.full_name ?? null;
  }
  const departmentName = (employee.departments as { name: string } | null)?.name;

  return (
    <div className="@container/main flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/employees">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <Avatar className="h-16 w-16 border-2 border-primary">
          <AvatarFallback className="text-lg font-bold bg-primary/10">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h1 className="font-semibold text-2xl tracking-tight">{employee.full_name}</h1>
          <p className="text-muted-foreground text-sm">{employee.position}</p>
          {managerName && (
            <p className="text-muted-foreground text-xs mt-0.5">
              <Users className="inline-block h-3 w-3 mr-1" />
              Reports To: <span className="font-medium text-foreground">{managerName}</span>
            </p>
          )}
        </div>
        {isAdmin && (
          <Button asChild>
            <Link href={`/dashboard/employees/${employee.id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
        )}
      </div>

      {/* Personal Information & Organization */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4 text-sm">
              <div className="flex items-center gap-3">
                <Hash className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <dt className="text-muted-foreground text-xs">Employee Code</dt>
                  <dd className="font-mono">{employee.employee_code}</dd>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <dt className="text-muted-foreground text-xs">Work Email</dt>
                  <dd>{employee.work_email}</dd>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <dt className="text-muted-foreground text-xs">Phone</dt>
                  <dd>{employee.phone_number ?? "—"}</dd>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <dt className="text-muted-foreground text-xs">Join Date</dt>
                  <dd>{formatDate(employee.join_date)}</dd>
                </div>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Organization</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4 text-sm">
              <div className="flex items-center gap-3">
                <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <dt className="text-muted-foreground text-xs">Department</dt>
                  <dd>{departmentName ?? "—"}</dd>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Briefcase className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <dt className="text-muted-foreground text-xs">Position</dt>
                  <dd>{employee.position}</dd>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Shield className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <dt className="text-muted-foreground text-xs">Role</dt>
                  <dd>
                    <Badge variant="outline" className={ROLE_BADGE_STYLES[employee.role]?.className}>{employee.role}</Badge>
                  </dd>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <UserCheck className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <dt className="text-muted-foreground text-xs">Status</dt>
                  <dd>
                    <Badge variant="outline" className={EMPLOYMENT_STATUS_STYLES[employee.status]?.className}>{employee.status}</Badge>
                  </dd>
                </div>
              </div>
              {managerName && (
                <div className="flex items-center gap-3">
                  <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <dt className="text-muted-foreground text-xs">Reports To</dt>
                    <dd>{managerName}</dd>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Shield className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <dt className="text-muted-foreground text-xs">Login Access</dt>
                  <dd>
                    <Badge variant={employee.auth_user_id ? "default" : "outline"}>
                      {employee.auth_user_id ? "Yes" : "No"}
                    </Badge>
                  </dd>
                </div>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>

      {/* Leave Summary (Admin only) */}
      {isAdmin && balances.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Leave Summary — {new Date().getFullYear()}</CardTitle>
            <CardAction>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/dashboard/leave/balances/${employee.id}`}>
                  Manage Balances
                </Link>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {balances.map((b) => {
                const remaining = b.entitled_days + b.adjustment_days - b.used_days;
                const utilization =
                  b.entitled_days > 0
                    ? Math.round((b.used_days / b.entitled_days) * 100)
                    : 0;
                return (
                  <div
                    key={b.id}
                    className="rounded-lg border p-4 space-y-3"
                  >
                    <p className="font-medium text-sm">
                      {b.leave_types?.name ?? "Unknown"}
                    </p>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Entitled: {b.entitled_days}</span>
                      <span>Used: {b.used_days}</span>
                      <span>Remaining: {remaining}</span>
                    </div>
                    <Progress value={utilization} className="h-2" />
                    <p className="text-xs text-muted-foreground text-right">
                      {utilization}% used
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Manage Balances link when no balances exist yet */}
      {isAdmin && balances.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Leave Summary &mdash; {new Date().getFullYear()}</CardTitle>
            <CardAction>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/dashboard/leave/balances/${employee.id}`}>
                  Initialize Balances
                </Link>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">No leave balances found for this employee. Click &quot;Initialize Balances&quot; to set up their leave entitlements.</p>
          </CardContent>
        </Card>
      )}

      {/* Recent Requests */}
      {recentRequests && recentRequests.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Recent Leave Requests</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Request #</TableHead>
                  <TableHead>Leave Type</TableHead>
                  <TableHead className="hidden md:table-cell">Start Date</TableHead>
                  <TableHead className="hidden md:table-cell">End Date</TableHead>
                  <TableHead>Days</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentRequests.map((req) => {
                  const leaveType = (req.leave_types as { name: string } | null)?.name ?? "—";
                  return (
                    <TableRow key={req.id}>
                      <TableCell className="font-mono text-xs">{req.request_number ?? "—"}</TableCell>
                      <TableCell className="font-medium">{leaveType}</TableCell>
                      <TableCell className="hidden md:table-cell">{formatDate(req.start_date)}</TableCell>
                      <TableCell className="hidden md:table-cell">{formatDate(req.end_date)}</TableCell>
                      <TableCell>{req.requested_days}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={STATUS_BADGE_STYLES[req.status]?.className}>{STATUS_BADGE_STYLES[req.status]?.label ?? req.status}</Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <EmptyState
          icon={Calendar}
          title="No Leave Requests"
          description="This employee has not submitted any leave requests yet."
        />
      )}
    </div>
  );
}
