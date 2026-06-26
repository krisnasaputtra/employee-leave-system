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
import { useTranslation } from "@/providers/locale-provider";

interface ApprovalActionsProps {
  requestId: string;
  requestNumber: string;
  employeeName: string;
}

export function ApprovalActions({ requestId, requestNumber, employeeName }: ApprovalActionsProps) {
  const { t } = useTranslation();
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
            {t("approval.approve")}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("approval.approveTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {`${t("approval.approveDescription")} (${requestNumber} - ${employeeName})`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleApprove} disabled={approveMutation.isPending}>
              {approveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("approval.yesApprove")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Button with Dialog + Form */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogTrigger asChild>
          <Button variant="destructive" size="sm">
            <XCircle className="mr-1 h-4 w-4" />
            {t("approval.reject")}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("approval.rejectTitle")}</DialogTitle>
            <DialogDescription>
              {`${t("approval.rejectDescription")} (${requestNumber} - ${employeeName})`}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(handleReject)}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="rejection_reason">{t("approval.rejectionReason")}</FieldLabel>
                <FieldContent>
                  <Textarea
                    id="rejection_reason"
                    placeholder={t("approval.rejectionReasonPlaceholder")}
                    rows={3}
                    aria-required="true"
                    aria-describedby={form.formState.errors.rejection_reason ? "rejection_reason-error" : undefined}
                    {...form.register("rejection_reason")}
                  />
                </FieldContent>
                <FieldError id="rejection_reason-error">{form.formState.errors.rejection_reason?.message}</FieldError>
              </Field>
            </FieldGroup>
            <div className="mt-4 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setRejectOpen(false)}>
                {t("common.cancel")}
              </Button>
              <Button type="submit" variant="destructive" disabled={rejectMutation.isPending}>
                {rejectMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("approval.rejectRequest")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
