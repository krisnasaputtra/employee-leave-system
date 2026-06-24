"use client";

import { useTransition } from "react";

import { Loader2, XCircle } from "lucide-react";
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

import { revokeDelegationAction } from "../actions";

interface RevokeButtonProps {
  delegationId: string;
  delegateName: string;
}

export function RevokeButton({ delegationId, delegateName }: RevokeButtonProps) {
  const [isPending, startTransition] = useTransition();

  function handleRevoke() {
    startTransition(async () => {
      const result = await revokeDelegationAction(delegationId);
      if (result.success) {
        toast.success("Delegation revoked successfully.");
      } else {
        toast.error(result.error ?? "Failed to revoke delegation.");
      }
    });
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm" disabled={isPending}>
          {isPending ? (
            <Loader2 className="mr-1 h-4 w-4 animate-spin" />
          ) : (
            <XCircle className="mr-1 h-4 w-4" />
          )}
          Revoke
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Revoke Delegation</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to revoke the delegation to{" "}
            <strong>{delegateName}</strong>? They will no longer be able to
            approve leave requests on your behalf.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleRevoke} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Yes, revoke
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
