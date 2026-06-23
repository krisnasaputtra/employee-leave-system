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
import { type HolidayCreateInput, holidayCreateSchema } from "@/lib/settings/schemas";
import type { Database } from "@/types/database.types";

import { createHolidayAction, updateHolidayAction } from "../../actions";

type HolidayRow = Database["public"]["Tables"]["holidays"]["Row"];

interface Props {
  mode: "create" | "edit";
  holiday?: HolidayRow;
  trigger: React.ReactNode;
}

export function HolidayFormDialog({ mode, holiday, trigger }: Props) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<HolidayCreateInput>({
    resolver: zodResolver(holidayCreateSchema),
    defaultValues:
      mode === "edit" && holiday
        ? {
            name: holiday.name,
            holiday_date: holiday.holiday_date,
            is_recurring: holiday.is_recurring,
            is_active: holiday.is_active,
          }
        : {
            name: "",
            holiday_date: "",
            is_recurring: false,
            is_active: true,
          },
  });

  const onSubmit = (data: HolidayCreateInput) => {
    setServerError(null);
    startTransition(async () => {
      const result =
        mode === "create" ? await createHolidayAction(data) : await updateHolidayAction(holiday?.id ?? "", data);
      if (!result.success) {
        setServerError(result.error ?? "Operation failed.");
      } else {
        toast.success(mode === "create" ? "Holiday created." : "Holiday updated.");
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
          <DialogTitle>{mode === "create" ? "Create Holiday" : "Edit Holiday"}</DialogTitle>
          <DialogDescription>
            {mode === "create" ? "Add a new holiday to the calendar." : "Update the holiday details."}
          </DialogDescription>
        </DialogHeader>

        <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {serverError && (
            <div className="rounded-md bg-destructive/10 p-3 text-center text-destructive text-sm">{serverError}</div>
          )}

          <FieldGroup>
            <Field>
              <FieldLabel>Name</FieldLabel>
              <FieldContent>
                <Input placeholder="Holiday name" {...form.register("name")} />
              </FieldContent>
              <FieldError>{form.formState.errors.name?.message}</FieldError>
            </Field>

            <Field>
              <FieldLabel>Date</FieldLabel>
              <FieldContent>
                <Input type="date" {...form.register("holiday_date")} />
              </FieldContent>
              <FieldError>{form.formState.errors.holiday_date?.message}</FieldError>
            </Field>

            <Field>
              <div className="flex items-center justify-between">
                <FieldLabel>Recurring</FieldLabel>
                <Switch
                  checked={form.watch("is_recurring")}
                  onCheckedChange={(v) => form.setValue("is_recurring", v)}
                />
              </div>
            </Field>

            <Field>
              <div className="flex items-center justify-between">
                <FieldLabel>Active</FieldLabel>
                <Switch checked={form.watch("is_active")} onCheckedChange={(v) => form.setValue("is_active", v)} />
              </div>
            </Field>
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
