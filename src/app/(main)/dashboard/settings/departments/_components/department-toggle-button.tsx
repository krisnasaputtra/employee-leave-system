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
import { useTranslation } from "@/providers/locale-provider";

import { toggleDepartmentAction } from "../../actions";

interface Props {
  departmentId: string;
  isActive: boolean;
  name: string;
}

export function DepartmentToggleButton({ departmentId, isActive, name }: Props) {
  const { t } = useTranslation();
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
          {isActive ? t("common.deactivate") : t("common.activate")}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{isActive ? t("settings.deactivateDepartment") : t("settings.activateDepartment")}</AlertDialogTitle>
          <AlertDialogDescription>
            {`${isActive ? t("common.deactivate") : t("common.activate")} ${name}?`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
          <AlertDialogAction onClick={handleToggle}>{isActive ? t("common.deactivate") : t("common.activate")}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
