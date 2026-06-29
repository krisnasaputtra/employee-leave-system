"use client";

import { useState, useTransition } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

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
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { type DepartmentCreateInput, departmentCreateSchema } from "@/lib/settings/schemas";
import type { Database } from "@/types/database.types";
import { useTranslation } from "@/providers/locale-provider";

import { createDepartmentAction, updateDepartmentAction } from "../../actions";

type DepartmentRow = Database["public"]["Tables"]["departments"]["Row"];

interface Props {
  mode: "create" | "edit";
  department?: DepartmentRow;
  employees: { id: string; full_name: string }[];
  trigger: React.ReactNode;
}

export function DepartmentFormDialog({ mode, department, employees, trigger }: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<DepartmentCreateInput>({
    resolver: zodResolver(departmentCreateSchema),
    defaultValues:
      mode === "edit" && department
        ? {
            code: department.code,
            name: department.name,
            description: department.description ?? "",
            manager_employee_id: department.manager_employee_id ?? "",
            is_active: department.is_active,
          }
        : {
            code: "",
            name: "",
            description: "",
            manager_employee_id: "",
            is_active: true,
          },
  });

  const onSubmit = (data: DepartmentCreateInput) => {
    setServerError(null);
    startTransition(async () => {
      const result =
        mode === "create"
          ? await createDepartmentAction(data)
          : await updateDepartmentAction(department?.id ?? "", data);
      if (!result.success) {
        setServerError(result.error ?? "Operation failed.");
      } else {
        toast.success(mode === "create" ? "Team created." : "Team updated.");
        setOpen(false);
        form.reset();
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? t("settings.createDepartment") : t("settings.editDepartment")}</DialogTitle>
          <DialogDescription>
            {mode === "create" ? t("settings.createDepartmentDesc") : t("settings.editDepartmentDesc")}
          </DialogDescription>
        </DialogHeader>

        <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {serverError && (
            <div role="alert" className="rounded-md bg-destructive/10 p-3 text-center text-destructive text-sm">{serverError}</div>
          )}

          <FieldGroup>
            <Field>
              <FieldLabel>{t("settings.code")}</FieldLabel>
              <FieldContent>
                <Input placeholder="DEPT_CODE" disabled={mode === "edit"} {...form.register("code")} />
              </FieldContent>
              <FieldError>{form.formState.errors.code?.message}</FieldError>
            </Field>

            <Field>
              <FieldLabel>{t("settings.name")}</FieldLabel>
              <FieldContent>
                <Input placeholder="Team name" {...form.register("name")} />
              </FieldContent>
              <FieldError>{form.formState.errors.name?.message}</FieldError>
            </Field>

            <Field>
              <FieldLabel>{t("settings.description")}</FieldLabel>
              <FieldContent>
                <textarea
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  placeholder="Brief description..."
                  {...form.register("description")}
                />
              </FieldContent>
              <FieldError>{form.formState.errors.description?.message}</FieldError>
            </Field>

            <Field>
              <FieldLabel>{t("settings.manager")}</FieldLabel>
              <FieldContent>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
                  {...form.register("manager_employee_id")}
                >
                  <option value="">{t("settings.noManager")}</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.full_name}
                    </option>
                  ))}
                </select>
              </FieldContent>
            </Field>

            <Field>
              <div className="flex items-center justify-between">
                <FieldLabel>{t("status.active")}</FieldLabel>
                <Switch checked={form.watch("is_active")} onCheckedChange={(v) => form.setValue("is_active", v)} />
              </div>
            </Field>
          </FieldGroup>

          <Button className="w-full" type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === "create" ? t("common.create") : t("common.saveChanges")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
