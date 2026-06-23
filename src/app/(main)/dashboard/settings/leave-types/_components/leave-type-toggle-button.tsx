"use client";

import { useTransition } from "react";

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

import { toggleLeaveTypeAction } from "../../actions";

interface Props {
  leaveTypeId: string;
  isActive: boolean;
  name: string;
}

export function LeaveTypeToggleButton({ leaveTypeId, isActive, name }: Props) {
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    startTransition(async () => {
      const result = await toggleLeaveTypeAction(leaveTypeId);
      if (!result.success) {
        toast.error(result.error ?? "Operation failed.");
      } else {
        toast.success(`Leave type ${isActive ? "deactivated" : "activated"}.`);
      }
    });
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant={isActive ? "outline" : "default"} size="sm" disabled={isPending}>
          {isActive ? "Deactivate" : "Activate"}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{isActive ? "Deactivate" : "Activate"} Leave Type</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to {isActive ? "deactivate" : "activate"} {name}?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleToggle}>{isActive ? "Deactivate" : "Activate"}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
