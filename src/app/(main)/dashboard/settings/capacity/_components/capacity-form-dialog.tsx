"use client";

import { useState, useTransition } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

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

import { upsertCapacityRuleAction } from "../actions";

// =============================================================
// Schema
// =============================================================

const capacityFormSchema = z.object({
  department_id: z.string().uuid(),
  max_absent_percentage: z.coerce.number().min(0).max(100),
  min_staff_count: z.coerce
    .number()
    .int()
    .min(0)
    .nullable()
    .optional()
    .transform((v) => (v === 0 ? null : v)),
});

type CapacityFormInput = z.output<typeof capacityFormSchema>;

// =============================================================
// Types
// =============================================================

interface CapacityRuleData {
  id: string;
  department_id: string;
  max_absent_percentage: number;
  min_staff_count: number | null;
}

interface Props {
  departmentId: string;
  departmentName: string;
  employeeCount: number;
  rule?: CapacityRuleData | null;
  trigger: React.ReactNode;
}

// =============================================================
// Component
// =============================================================

export function CapacityFormDialog({ departmentId, departmentName, employeeCount, rule, trigger }: Props) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<CapacityFormInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(capacityFormSchema) as any,
    defaultValues: {
      department_id: departmentId,
      max_absent_percentage: rule?.max_absent_percentage ?? 25,
      min_staff_count: rule?.min_staff_count ?? undefined,
    },
  });

  const maxAbsentPct = form.watch("max_absent_percentage");
  const maxAbsentCount = Math.floor((employeeCount * (maxAbsentPct || 0)) / 100);

  const onSubmit = (data: CapacityFormInput) => {
    setServerError(null);
    startTransition(async () => {
      const result = await upsertCapacityRuleAction(data as unknown as Record<string, unknown>);
      if (!result.success) {
        setServerError(result.error ?? "Operation failed.");
      } else {
        toast.success(rule ? "Capacity rule updated." : "Capacity rule created.");
        setOpen(false);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{rule ? "Edit Capacity Rule" : "Configure Capacity Rule"}</DialogTitle>
          <DialogDescription>
            {rule
              ? `Update the staffing limits for ${departmentName}.`
              : `Set staffing limits for ${departmentName}.`}
          </DialogDescription>
        </DialogHeader>

        <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {serverError && (
            <div role="alert" className="rounded-md bg-destructive/10 p-3 text-center text-destructive text-sm">{serverError}</div>
          )}

          <FieldGroup>
            <Field>
              <FieldLabel>Max Absent Percentage (%)</FieldLabel>
              <FieldContent>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  step={1}
                  placeholder="25"
                  {...form.register("max_absent_percentage", { valueAsNumber: true })}
                />
              </FieldContent>
              <FieldError>{form.formState.errors.max_absent_percentage?.message}</FieldError>
            </Field>

            <Field>
              <FieldLabel>Min Staff Count</FieldLabel>
              <FieldContent>
                <Input
                  type="number"
                  min={0}
                  placeholder="No minimum"
                  {...form.register("min_staff_count", { valueAsNumber: true })}
                />
              </FieldContent>
              <FieldError>{form.formState.errors.min_staff_count?.message}</FieldError>
            </Field>

            {employeeCount > 0 && (
              <div className="rounded-md bg-muted/50 p-3 text-muted-foreground text-sm">
                With <span className="font-medium text-foreground">{employeeCount}</span> employee{employeeCount !== 1 ? "s" : ""}, max{" "}
                <span className="font-medium text-foreground">{maxAbsentCount}</span> can be absent at{" "}
                {maxAbsentPct ?? 0}%.
              </div>
            )}
          </FieldGroup>

          <Button className="w-full" type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {rule ? "Save Changes" : "Configure Rule"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
