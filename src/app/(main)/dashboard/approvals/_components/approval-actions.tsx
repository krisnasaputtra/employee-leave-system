"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle, Loader2, XCircle } from "lucide-react";
import { useForm } from "react-hook-form";

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
import { useApproveLeaveRequest, useRejectLeaveRequest } from "@/hooks/use-approval-mutations";
import { type LeaveRejectionInput, leaveRejectionSchema } from "@/lib/approvals/schemas";

interface ApprovalActionsProps {
  requestId: string;
  requestNumber: string;
  employeeName: string;
}

export function ApprovalActions({ requestId, requestNumber, employeeName }: ApprovalActionsProps) {
  const router = useRouter();
  const [rejectOpen, setRejectOpen] = useState(false);

  const approveMutation = useApproveLeaveRequest();
  const rejectMutation = useRejectLeaveRequest();

  const form = useForm<LeaveRejectionInput>({
    resolver: zodResolver(leaveRejectionSchema),
    defaultValues: { rejection_reason: "" },
  });

  function handleApprove() {
    approveMutation.mutate(requestId, {
      onSuccess: (result) => {
        router.refresh();
      },
    });
  }

  function handleReject(data: LeaveRejectionInput) {
    rejectMutation.mutate(
      { requestId, reason: data.rejection_reason },
      {
        onSuccess: () => {
          setRejectOpen(false);
          form.reset();
          router.refresh();
        },
      },
    );
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
            <AlertDialogAction onClick={handleApprove} disabled={approveMutation.isPending}>
              {approveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
              <Button type="submit" variant="destructive" disabled={rejectMutation.isPending}>
                {rejectMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Reject Request
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
