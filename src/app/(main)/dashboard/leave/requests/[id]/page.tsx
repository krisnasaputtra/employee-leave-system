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
import { createClient } from "@/lib/supabase/server";

import { AttachmentSection } from "./_components/attachment-section";
import { CancelRequestButton } from "./_components/cancel-request-button";
import { DownloadButton } from "./_components/download-button";

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

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function LeaveRequestDetailPage({ params }: PageProps) {
  const { id } = await params;
  const { employee: actor } = await getAuthenticatedUser();
  const supabase = await createClient();

  const { data: request, error } = await supabase
    .from("leave_requests")
    .select("*, leave_types(name, color, code), employees!leave_requests_employee_id_fk(full_name, employee_code)")
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
  const canApprove = canApproveLeaveRequest(
    actor.role,
    actor.id,
    request.employee_id,
    requesterEmployee?.manager_id ?? null,
  );

  // Fetch attachments (RLS-scoped: owner, manager, admin)
  const { data: attachments } = await supabase
    .from("leave_request_attachments")
    .select("id, original_name, mime_type, size_bytes, created_at")
    .eq("leave_request_id", id)
    .order("created_at", { ascending: true });

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
          <Badge variant={STATUS_BADGE_MAP[request.status] ?? "secondary"}>{request.status}</Badge>
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
    </div>
  );
}
