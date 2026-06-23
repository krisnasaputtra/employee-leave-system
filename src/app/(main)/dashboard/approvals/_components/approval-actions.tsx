"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle, Loader2, XCircle } from "lucide-react";
import { useForm } from "react-hook-form";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { type LeaveRejectionInput, leaveRejectionSchema } from "@/lib/approvals/schemas";

import { approveLeaveRequestAction, rejectLeaveRequestAction } from "../actions";

interface ApprovalActionsProps {
  requestId: string;
  requestNumber: string;
  employeeName: string;
}

export function ApprovalActions({ requestId, requestNumber, employeeName }: ApprovalActionsProps) {
  const router = useRouter();
  const [isApproving, setIsApproving] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);

  const form = useForm<LeaveRejectionInput>({
    resolver: zodResolver(leaveRejectionSchema),
    defaultValues: { rejection_reason: "" },
  });

  async function handleApprove() {
    setIsApproving(true);
    const result = await approveLeaveRequestAction(requestId);
    setIsApproving(false);

    if (!result.success) {
      toast.error(result.error ?? "Failed to approve leave request.");
      return;
    }

    toast.success(`Leave request ${result.request_number ?? requestNumber} has been approved.`);
    router.refresh();
  }

  async function handleReject(data: LeaveRejectionInput) {
    const result = await rejectLeaveRequestAction(requestId, data);

    if (!result.success) {
      toast.error(result.error ?? "Failed to reject leave request.");
      return;
    }

    toast.success(`Leave request ${result.request_number ?? requestNumber} has been rejected.`);
    setRejectOpen(false);
    form.reset();
    router.refresh();
  }

  return (
    <>
      {/* Approve Button with AlertDialog */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="default" size="sm">
            <CheckCircle className="mr-1 h-4 w-4" />
            Approve
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Leave Request</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve <strong>{requestNumber}</strong> for <strong>{employeeName}</strong>?
              This will deduct from their leave balance.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleApprove} disabled={isApproving}>
              {isApproving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Yes, approve
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Button with Dialog + Form */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogTrigger asChild>
          <Button variant="destructive" size="sm">
            <XCircle className="mr-1 h-4 w-4" />
            Reject
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Leave Request</DialogTitle>
            <DialogDescription>
              Rejecting <strong>{requestNumber}</strong> for <strong>{employeeName}</strong>. Please provide a reason.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(handleReject)}>
            <FieldGroup>
              <Field>
                <FieldLabel>Rejection Reason</FieldLabel>
                <FieldContent>
                  <Textarea
                    placeholder="Provide a reason for rejecting this request..."
                    rows={3}
                    {...form.register("rejection_reason")}
                  />
                </FieldContent>
                <FieldError>{form.formState.errors.rejection_reason?.message}</FieldError>
              </Field>
            </FieldGroup>
            <div className="mt-4 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setRejectOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="destructive" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Reject Request
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
