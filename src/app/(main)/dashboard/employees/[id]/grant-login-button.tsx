"use client";

import { useState, useTransition } from "react";
import { Copy, KeyRound, Loader2 } from "lucide-react";
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

import { grantLoginAccessAction } from "./grant-login-action";

interface GrantLoginButtonProps {
  employeeId: string;
  employeeName: string;
}

export function GrantLoginButton({ employeeId, employeeName }: GrantLoginButtonProps) {
  const { t } = useTranslation();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  function handleGrant() {
    startTransition(async () => {
      const result = await grantLoginAccessAction(employeeId);
      if (result.success && result.temporaryPassword) {
        setTempPassword(result.temporaryPassword);
        toast.success(t("employee.loginGranted"));
      } else {
        toast.error(result.error ?? "Failed to grant login access.");
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
        <Button variant="outline" size="sm" className="gap-2">
          <KeyRound className="h-4 w-4" />
          {t("employee.grantLogin")}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        {tempPassword ? (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("employee.loginGrantedTitle")}</AlertDialogTitle>
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
              <AlertDialogTitle>{t("employee.grantLoginTitle")}</AlertDialogTitle>
              <AlertDialogDescription>
                {`${t("employee.grantLoginDesc")} ${employeeName}?`}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
              <Button onClick={handleGrant} disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("employee.grantLogin")}
              </Button>
            </AlertDialogFooter>
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
