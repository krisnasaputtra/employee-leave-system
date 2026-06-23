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
import { type LeaveTypeCreateInput, leaveTypeCreateSchema } from "@/lib/settings/schemas";
import type { Database } from "@/types/database.types";

import { createLeaveTypeAction, updateLeaveTypeAction } from "../../actions";

type LeaveTypeRow = Database["public"]["Tables"]["leave_types"]["Row"];

interface Props {
  mode: "create" | "edit";
  leaveType?: LeaveTypeRow;
  trigger: React.ReactNode;
}

export function LeaveTypeFormDialog({ mode, leaveType, trigger }: Props) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<LeaveTypeCreateInput>({
    resolver: zodResolver(leaveTypeCreateSchema),
    defaultValues:
      mode === "edit" && leaveType
        ? {
            code: leaveType.code,
            name: leaveType.name,
            description: leaveType.description ?? "",
            default_entitlement: leaveType.default_entitlement,
            color: leaveType.color,
            deducts_balance: leaveType.deducts_balance,
            allow_negative_balance: leaveType.allow_negative_balance,
            requires_attachment: leaveType.requires_attachment,
            show_type_on_calendar: leaveType.show_type_on_calendar,
            is_active: leaveType.is_active,
          }
        : {
            code: "",
            name: "",
            description: "",
            default_entitlement: 0,
            color: "#3B82F6",
            deducts_balance: true,
            allow_negative_balance: false,
            requires_attachment: false,
            show_type_on_calendar: true,
            is_active: true,
          },
  });

  const colorValue = form.watch("color");

  const onSubmit = (data: LeaveTypeCreateInput) => {
    setServerError(null);
    startTransition(async () => {
      const result =
        mode === "create" ? await createLeaveTypeAction(data) : await updateLeaveTypeAction(leaveType?.id ?? "", data);
      if (!result.success) {
        setServerError(result.error ?? "Operation failed.");
      } else {
        toast.success(mode === "create" ? "Leave type created." : "Leave type updated.");
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
          <DialogTitle>{mode === "create" ? "Create Leave Type" : "Edit Leave Type"}</DialogTitle>
          <DialogDescription>
            {mode === "create" ? "Add a new leave type definition." : "Update the leave type details."}
          </DialogDescription>
        </DialogHeader>

        <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {serverError && (
            <div className="rounded-md bg-destructive/10 p-3 text-center text-destructive text-sm">{serverError}</div>
          )}

          <FieldGroup>
            <div className="grid gap-4 md:grid-cols-2">
              <Field>
                <FieldLabel>Code</FieldLabel>
                <FieldContent>
                  <Input placeholder="LEAVE_CODE" disabled={mode === "edit"} {...form.register("code")} />
                </FieldContent>
                <FieldError>{form.formState.errors.code?.message}</FieldError>
              </Field>

              <Field>
                <FieldLabel>Name</FieldLabel>
                <FieldContent>
                  <Input placeholder="Leave type name" {...form.register("name")} />
                </FieldContent>
                <FieldError>{form.formState.errors.name?.message}</FieldError>
              </Field>
            </div>

            <Field>
              <FieldLabel>Description</FieldLabel>
              <FieldContent>
                <textarea
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  placeholder="Brief description..."
                  {...form.register("description")}
                />
              </FieldContent>
              <FieldError>{form.formState.errors.description?.message}</FieldError>
            </Field>

            <div className="grid gap-4 md:grid-cols-2">
              <Field>
                <FieldLabel>Default Entitlement</FieldLabel>
                <FieldContent>
                  <Input
                    type="number"
                    min={0}
                    max={365}
                    {...form.register("default_entitlement", { valueAsNumber: true })}
                  />
                </FieldContent>
                <FieldError>{form.formState.errors.default_entitlement?.message}</FieldError>
              </Field>

              <Field>
                <FieldLabel>Color</FieldLabel>
                <FieldContent>
                  <div className="flex items-center gap-2">
                    <div
                      style={{
                        backgroundColor: colorValue,
                      }}
                      className="h-8 w-8 shrink-0 rounded-full border"
                    />
                    <Input placeholder="#3B82F6" {...form.register("color")} />
                  </div>
                </FieldContent>
                <FieldError>{form.formState.errors.color?.message}</FieldError>
              </Field>
            </div>

            <div className="grid gap-3">
              <Field>
                <div className="flex items-center justify-between">
                  <FieldLabel>Deducts Balance</FieldLabel>
                  <Switch
                    checked={form.watch("deducts_balance")}
                    onCheckedChange={(v) => form.setValue("deducts_balance", v)}
                  />
                </div>
              </Field>

              <Field>
                <div className="flex items-center justify-between">
                  <FieldLabel>Allow Negative Balance</FieldLabel>
                  <Switch
                    checked={form.watch("allow_negative_balance")}
                    onCheckedChange={(v) => form.setValue("allow_negative_balance", v)}
                  />
                </div>
              </Field>

              <Field>
                <div className="flex items-center justify-between">
                  <FieldLabel>Requires Attachment</FieldLabel>
                  <Switch
                    checked={form.watch("requires_attachment")}
                    onCheckedChange={(v) => form.setValue("requires_attachment", v)}
                  />
                </div>
              </Field>

              <Field>
                <div className="flex items-center justify-between">
                  <FieldLabel>Show on Calendar</FieldLabel>
                  <Switch
                    checked={form.watch("show_type_on_calendar")}
                    onCheckedChange={(v) => form.setValue("show_type_on_calendar", v)}
                  />
                </div>
              </Field>

              <Field>
                <div className="flex items-center justify-between">
                  <FieldLabel>Active</FieldLabel>
                  <Switch checked={form.watch("is_active")} onCheckedChange={(v) => form.setValue("is_active", v)} />
                </div>
              </Field>
            </div>
          </FieldGroup>

          <Button className="w-full" type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === "create" ? "Create" : "Save Changes"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
