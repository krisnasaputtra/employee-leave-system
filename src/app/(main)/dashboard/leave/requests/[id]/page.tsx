import Link from "next/link";
import { redirect } from "next/navigation";

import { ArrowLeft, Pencil } from "lucide-react";

import { ApprovalActions } from "@/app/(main)/dashboard/approvals/_components/approval-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { canApproveLeaveRequest } from "@/lib/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { STATUS_BADGE_STYLES } from "@/lib/ui/badge-variants";
import { formatDate } from "@/lib/utils/format-date";

import { AttachmentSection } from "./_components/attachment-section";
import { CancelRequestButton } from "./_components/cancel-request-button";
import { DownloadButton } from "./_components/download-button";
import { CommentSection } from "./_components/comment-section";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function LeaveRequestDetailPage({ params }: PageProps) {
  const { id } = await params;
  const { employee: actor } = await getAuthenticatedUser();
  const supabase = createAdminClient();

  const { data: request, error } = await supabase
    .from("leave_requests")
    .select("id, request_number, employee_id, status, start_date, end_date, requested_days, partial_day, reason, created_at, decided_at, rejection_reason, leave_types(name, color, code), employees!leave_requests_employee_id_fk(full_name, employee_code)")
    .eq("id", id)
    .single();

  if (error || !request) {
    redirect("/dashboard/leave/requests");
  }

  const leaveType = request.leave_types as {
    name: string;
    color: string;
    code: string;
  } | null;

  const employee = request.employees as {
    full_name: string;
    employee_code: string;
  } | null;

  const { data: requesterEmployee } = await supabase
    .from("employees")
    .select("manager_id")
    .eq("id", request.employee_id)
    .single();

  const isOwner = request.employee_id === actor.id;
  const isPending = request.status === "PENDING";
  let canApprove = canApproveLeaveRequest(
    actor.role,
    actor.id,
    request.employee_id,
    requesterEmployee?.manager_id ?? null,
  );

  // Also check delegation: if the actor has an active delegation from the requester's manager
  if (!canApprove && !isOwner && requesterEmployee?.manager_id) {
    const today = new Date().toISOString().split("T")[0];
    const { data: delegation } = await supabase
      .from("approval_delegations")
      .select("id")
      .eq("delegate_id", actor.id)
      .eq("delegator_id", requesterEmployee.manager_id)
      .eq("is_active", true)
      .lte("start_date", today)
      .gte("end_date", today)
      .limit(1);
    if (delegation && delegation.length > 0) {
      canApprove = true;
    }
  }

  // Fetch attachments (RLS-scoped: owner, manager, admin)
  const { data: attachments } = await supabase
    .from("leave_request_attachments")
    .select("id, original_name, mime_type, size_bytes, created_at")
    .eq("leave_request_id", id)
    .order("created_at", { ascending: true });

  // Fetch audit events / comments for this request
  const { data: auditEvents } = await supabase
    .from("audit_logs")
    .select("id, action, created_at, metadata, actor_employee_id")
    .eq("entity_type", "leave_request")
    .eq("entity_id", id)
    .order("created_at", { ascending: true });

  // Resolve actor names for the activity timeline
  const actorIds = [
    ...new Set(
      (auditEvents ?? [])
        .map((e) => e.actor_employee_id)
        .filter(Boolean) as string[]
    ),
  ];
  let actorNameMap: Record<string, string> = {};
  if (actorIds.length > 0) {
    const { data: actors } = await supabase
      .from("employees")
      .select("id, full_name")
      .in("id", actorIds);
    actorNameMap = Object.fromEntries(
      (actors ?? []).map((a) => [a.id, a.full_name])
    );
  }

  // Enrich events with actor names
  const enrichedEvents = (auditEvents ?? []).map((e) => ({
    id: e.id,
    action: e.action,
    created_at: e.created_at,
    actor_employee_id: e.actor_employee_id,
    metadata: {
      ...(e.metadata as Record<string, unknown> | null),
      actor_name:
        (e.metadata as Record<string, unknown> | null)?.actor_name ??
        (e.actor_employee_id ? actorNameMap[e.actor_employee_id] : null) ??
        "System",
    },
  }));

  const canUpload = isOwner && isPending;
  const canRemove = (isOwner && isPending) || actor.role === "ADMIN";

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/leave/requests">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back
          </Link>
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="font-semibold text-2xl tracking-tight">{request.request_number ?? "Leave Request"}</h1>
          <Badge variant="outline" className={STATUS_BADGE_STYLES[request.status]?.className}>{STATUS_BADGE_STYLES[request.status]?.label ?? request.status}</Badge>
        </div>

        {isOwner && isPending && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/dashboard/leave/requests/${id}/edit`}>
                <Pencil className="mr-1 h-4 w-4" />
                Edit
              </Link>
            </Button>
            <CancelRequestButton requestId={id} requestNumber={request.request_number ?? ""} />
          </div>
        )}
        {canApprove && isPending && (
          <div className="flex gap-2">
            <ApprovalActions
              requestId={request.id}
              requestNumber={request.request_number ?? ""}
              employeeName={employee?.full_name ?? "Employee"}
            />
          </div>
        )}
      </div>

      {/* Detail Card */}
      <Card>
        <CardHeader>
          <CardTitle>Request Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Employee */}
            {!isOwner && employee && (
              <div>
                <p className="text-muted-foreground text-sm">Employee</p>
                <p className="font-medium">
                  {employee.full_name} ({employee.employee_code})
                </p>
              </div>
            )}

            {/* Leave Type */}
            <div>
              <p className="text-muted-foreground text-sm">Leave Type</p>
              <div className="flex items-center gap-2 font-medium">
                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: leaveType?.color ?? "#888" }} />
                {leaveType?.name ?? "Unknown"}
              </div>
            </div>

            {/* Date Range */}
            <div>
              <p className="text-muted-foreground text-sm">Date Range</p>
              <p className="font-medium">
                {formatDate(request.start_date)} — {formatDate(request.end_date)}
              </p>
            </div>

            {/* Requested Days */}
            <div>
              <p className="text-muted-foreground text-sm">Requested Days</p>
              <p className="font-medium">{request.requested_days}</p>
            </div>

            {/* Partial Day */}
            <div>
              <p className="text-muted-foreground text-sm">Partial Day</p>
              <p className="font-medium">
                {request.partial_day === "NONE"
                  ? "None (Full Day)"
                  : request.partial_day === "FIRST_HALF"
                    ? "First Half"
                    : "Second Half"}
              </p>
            </div>

            {/* Reason */}
            {request.reason && (
              <div className="sm:col-span-2">
                <p className="text-muted-foreground text-sm">Reason</p>
                <p className="font-medium">{request.reason}</p>
              </div>
            )}
          </div>

          <Separator className="my-4" />

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Created At */}
            <div>
              <p className="text-muted-foreground text-sm">Created At</p>
              <p className="font-medium">
                {new Date(request.created_at).toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </p>
            </div>

            {/* Decided At */}
            {request.decided_at && (
              <div>
                <p className="text-muted-foreground text-sm">Decided At</p>
                <p className="font-medium">
                  {new Date(request.decided_at).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            )}

            {/* Rejection Reason */}
            {request.rejection_reason && (
              <div className="sm:col-span-2">
                <p className="text-muted-foreground text-sm">Rejection Reason</p>
                <p className="font-medium text-destructive">{request.rejection_reason}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Attachments */}
      <AttachmentSection
        requestId={id}
        attachments={(attachments ?? []).map((a) => ({
          id: a.id,
          original_name: a.original_name,
          mime_type: a.mime_type,
          size_bytes: a.size_bytes,
          created_at: a.created_at,
        }))}
        canUpload={canUpload}
        canRemove={canRemove}
      />

      {/* Download Links (visible to owner, manager, admin) */}
      {(attachments ?? []).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Download</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {(attachments ?? []).map((att) => (
                <div key={att.id} className="flex items-center justify-between">
                  <span className="truncate text-sm">{att.original_name}</span>
                  <DownloadButton attachmentId={att.id} fileName={att.original_name} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Comments & Activity */}
      <CommentSection
        requestId={id}
        events={enrichedEvents}
      />
    </div>
  );
}
