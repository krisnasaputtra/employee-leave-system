"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { useQueryClient } from "@tanstack/react-query";
import { Loader2, X } from "lucide-react";
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

import { cancelLeaveRequestAction } from "../../actions";

interface CancelRequestButtonProps {
  requestId: string;
  requestNumber: string;
}

export function CancelRequestButton({ requestId, requestNumber }: CancelRequestButtonProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isPending, setIsPending] = useState(false);

  async function handleCancel() {
    setIsPending(true);
    const result = await cancelLeaveRequestAction(requestId);
    setIsPending(false);

    if (!result.success) {
      toast.error(result.error ?? "Failed to cancel leave request.");
      return;
    }

    toast.success(`Leave request ${requestNumber} has been cancelled.`);
    queryClient.invalidateQueries({ queryKey: ["my-leave-requests"] });
    queryClient.invalidateQueries({ queryKey: ["header-counts"] });
    router.push("/dashboard/leave/requests");
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <X className="mr-1 h-4 w-4" />
          Cancel
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel Leave Request</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to cancel request <strong>{requestNumber}</strong>? This will release any reserved
            balance.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>No, keep it</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={handleCancel} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Yes, cancel request
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
