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

import { toggleDepartmentAction } from "../../actions";

interface Props {
  departmentId: string;
  isActive: boolean;
  name: string;
}

export function DepartmentToggleButton({ departmentId, isActive, name }: Props) {
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    startTransition(async () => {
      const result = await toggleDepartmentAction(departmentId);
      if (!result.success) {
        toast.error(result.error ?? "Operation failed.");
      } else {
        toast.success(`Department ${isActive ? "deactivated" : "activated"}.`);
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
          <AlertDialogTitle>{isActive ? "Deactivate" : "Activate"} Department</AlertDialogTitle>
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
