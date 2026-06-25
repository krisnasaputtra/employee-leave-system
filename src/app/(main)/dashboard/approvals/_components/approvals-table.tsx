"use client";

import { useState, useTransition } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { AlertTriangle, CheckCircle, Eye, Loader2, XCircle } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDate } from "@/lib/utils/format-date";

import { bulkApproveAction, bulkRejectAction } from "../actions";

import { ApprovalActions } from "./approval-actions";

interface ApprovalRequest {
  id: string;
  request_number: string | null;
  start_date: string;
  end_date: string;
  requested_days: number;
  created_at: string;
  leave_types: { name: string; color: string; code: string } | null;
  employees: { id: string; full_name: string; employee_code: string } | null;
}

interface ApprovalsTableProps {
  requests: ApprovalRequest[];
  capacityWarnings?: Record<string, string>;
}

export function ApprovalsTable({ requests, capacityWarnings = {} }: ApprovalsTableProps) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isApproving, startApproving] = useTransition();
  const [isRejecting, startRejecting] = useTransition();
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const allSelected = requests.length > 0 && selectedIds.size === requests.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < requests.length;

  function toggleAll() {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(requests.map((r) => r.id)));
    }
  }

  function toggleOne(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function handleBulkApprove() {
    const ids = Array.from(selectedIds);
    startApproving(async () => {
      const result = await bulkApproveAction(ids);
      if (!result.success) {
        toast.error(result.error ?? "Bulk approve failed.");
        return;
      }
      const succeeded = result.results?.filter((r) => r.success).length ?? 0;
      const failed = result.results?.filter((r) => !r.success).length ?? 0;
      if (failed > 0) {
        toast.warning(`Approved ${succeeded} request(s). ${failed} failed.`);
      } else {
        toast.success(`Successfully approved ${succeeded} request(s).`);
      }
      setSelectedIds(new Set());
      router.refresh();
    });
  }

  function handleBulkReject() {
    if (!rejectionReason.trim()) {
      toast.error("Please provide a rejection reason.");
      return;
    }
    const ids = Array.from(selectedIds);
    const reason = rejectionReason.trim();
    startRejecting(async () => {
      const result = await bulkRejectAction(ids, reason);
      if (!result.success) {
        toast.error(result.error ?? "Bulk reject failed.");
        return;
      }
      const succeeded = result.results?.filter((r) => r.success).length ?? 0;
      const failed = result.results?.filter((r) => !r.success).length ?? 0;
      if (failed > 0) {
        toast.warning(`Rejected ${succeeded} request(s). ${failed} failed.`);
      } else {
        toast.success(`Successfully rejected ${succeeded} request(s).`);
      }
      setSelectedIds(new Set());
      setRejectDialogOpen(false);
      setRejectionReason("");
      router.refresh();
    });
  }

  return (
    <>
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={allSelected ? true : someSelected ? "indeterminate" : false}
                  onCheckedChange={toggleAll}
                  aria-label="Select all requests"
                />
              </TableHead>
              <TableHead>Employee</TableHead>
              <TableHead>Leave Type</TableHead>
              <TableHead>Date Range</TableHead>
              <TableHead className="text-right">Days</TableHead>
              <TableHead>Requested On</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((r) => {
              const leaveType = r.leave_types;
              const employee = r.employees;

              return (
                <TableRow key={r.id} data-state={selectedIds.has(r.id) ? "selected" : undefined}>
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.has(r.id)}
                      onCheckedChange={() => toggleOne(r.id)}
                      aria-label={`Select request from ${employee?.full_name ?? "Unknown"}`}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div>
                        <div className="font-medium">{employee?.full_name ?? "Unknown"}</div>
                        <div className="text-muted-foreground text-sm">
                          {employee?.employee_code ?? ""}
                        </div>
                      </div>
                      {capacityWarnings[r.id] && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <AlertTriangle className="h-4 w-4 text-amber-500" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p>{capacityWarnings[r.id]}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: leaveType?.color ?? "#888" }}
                      />
                      {leaveType?.name ?? "Unknown"}
                    </div>
                  </TableCell>
                  <TableCell>
                    {formatDate(r.start_date)} — {formatDate(r.end_date)}
                  </TableCell>
                  <TableCell className="text-right">{r.requested_days}</TableCell>
                  <TableCell>
                    {new Date(r.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/dashboard/leave/requests/${r.id}`}>
                          <Eye className="mr-1 h-4 w-4" />
                          View
                        </Link>
                      </Button>
                      <ApprovalActions
                        requestId={r.id}
                        requestNumber={r.request_number ?? ""}
                        employeeName={employee?.full_name ?? "Employee"}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Floating Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg border bg-card p-4 shadow-lg">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">{selectedIds.size} selected</span>

            {/* Bulk Approve */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" disabled={isApproving}>
                  <CheckCircle className="mr-1 h-4 w-4" />
                  Approve Selected ({selectedIds.size})
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Bulk Approve Leave Requests</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to approve <strong>{selectedIds.size}</strong> leave
                    request(s)? This will deduct from each employee&apos;s leave balance.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleBulkApprove} disabled={isApproving}>
                    {isApproving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Yes, approve all
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* Bulk Reject */}
            <Button
              variant="destructive"
              size="sm"
              disabled={isRejecting}
              onClick={() => setRejectDialogOpen(true)}
            >
              <XCircle className="mr-1 h-4 w-4" />
              Reject Selected ({selectedIds.size})
            </Button>
          </div>
        </div>
      )}

      {/* Bulk Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Reject Leave Requests</DialogTitle>
            <DialogDescription>
              You are about to reject <strong>{selectedIds.size}</strong> leave request(s). Please
              provide a reason that will be applied to all selected requests.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Provide a reason for rejecting these requests..."
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setRejectDialogOpen(false);
                  setRejectionReason("");
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                disabled={isRejecting}
                onClick={handleBulkReject}
              >
                {isRejecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Reject {selectedIds.size} Request(s)
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
