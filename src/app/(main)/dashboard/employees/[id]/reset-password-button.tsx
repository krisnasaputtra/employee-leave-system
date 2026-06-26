"use client";

import { useState, useTransition } from "react";
import { Copy, KeyRound, Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/providers/locale-provider";

import { resetPasswordAction } from "./reset-password-action";

interface ResetPasswordButtonProps {
  employeeId: string;
  employeeName: string;
}

export function ResetPasswordButton({ employeeId, employeeName }: ResetPasswordButtonProps) {
  const { t } = useTranslation();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  function handleReset() {
    startTransition(async () => {
      const result = await resetPasswordAction(employeeId);
      if (result.success && result.temporaryPassword) {
        setTempPassword(result.temporaryPassword);
        toast.success(t("employee.passwordResetSuccess"));
      } else {
        toast.error(result.error ?? "Failed to reset password.");
        setOpen(false);
      }
    });
  }

  function copyPassword() {
    if (tempPassword) {
      navigator.clipboard.writeText(tempPassword);
      toast.success(t("employee.passwordCopied"));
    }
  }

  function handleClose() {
    setOpen(false);
    setTempPassword(null);
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2" type="button">
          <RotateCcw className="h-4 w-4" />
          {t("employee.resetPassword")}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        {tempPassword ? (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("employee.passwordResetTitle")}</AlertDialogTitle>
              <AlertDialogDescription>
                {t("employee.loginGrantedDesc")}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-3 py-2">
              <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
                <p className="text-sm text-muted-foreground">{t("employee.tempPassword")}</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 rounded bg-background px-3 py-2 font-mono text-sm font-semibold tracking-wide">
                    {tempPassword}
                  </code>
                  <Button variant="outline" size="icon" onClick={copyPassword} aria-label="Copy password">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <p className="text-xs text-destructive font-medium">
                ⚠️ {t("employee.tempPasswordWarning")}
              </p>
            </div>
            <AlertDialogFooter>
              <Button onClick={handleClose}>{t("common.close")}</Button>
            </AlertDialogFooter>
          </>
        ) : (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("employee.resetPasswordTitle")}</AlertDialogTitle>
              <AlertDialogDescription>
                {`${t("employee.resetPasswordDesc")} ${employeeName}?`}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
              <Button onClick={handleReset} disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("employee.resetPassword")}
              </Button>
            </AlertDialogFooter>
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
