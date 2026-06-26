"use client";

import { useTranslation } from "@/providers/locale-provider";

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
import { Switch } from "@/components/ui/switch";

import { upsertPolicyAction } from "../actions";

// =============================================================
// Schema
// =============================================================

const policyFormSchema = z.object({
  leave_type_id: z.string().uuid(),
  notice_period_days: z.coerce.number().int().min(0).default(0),
  max_consecutive_days: z.coerce
    .number()
    .int()
    .min(1)
    .nullable()
    .optional()
    .transform((v) => (v === 0 ? null : v)),
  requires_attachment: z.boolean().default(false),
});

type PolicyFormInput = z.output<typeof policyFormSchema>;

// =============================================================
// Types
// =============================================================

interface PolicyData {
  id: string;
  leave_type_id: string;
  notice_period_days: number;
  max_consecutive_days: number | null;
  requires_attachment: boolean;
}

interface Props {
  leaveTypeId: string;
  leaveTypeName: string;
  policy?: PolicyData | null;
  trigger: React.ReactNode;
}

// =============================================================
// Component
// =============================================================

export function PolicyFormDialog({ leaveTypeId, leaveTypeName, policy, trigger }: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<PolicyFormInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(policyFormSchema) as any,
    defaultValues: {
      leave_type_id: leaveTypeId,
      notice_period_days: policy?.notice_period_days ?? 0,
      max_consecutive_days: policy?.max_consecutive_days ?? undefined,
      requires_attachment: policy?.requires_attachment ?? false,
    },
  });

  const onSubmit = (data: PolicyFormInput) => {
    setServerError(null);
    startTransition(async () => {
      const result = await upsertPolicyAction(data as unknown as Record<string, unknown>);
      if (!result.success) {
        setServerError(result.error ?? "Operation failed.");
      } else {
        toast.success(policy ? "Leave policy updated." : "Leave policy created.");
        setOpen(false);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{policy ? t("settings.editPolicy") : t("settings.configurePolicy")}</DialogTitle>
          <DialogDescription>
            {policy ? `${t("settings.editPolicyDesc")} — ${leaveTypeName}` : `${t("settings.configurePolicyDesc")} — ${leaveTypeName}`}
          </DialogDescription>
        </DialogHeader>

        <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {serverError && (
            <div role="alert" className="rounded-md bg-destructive/10 p-3 text-center text-destructive text-sm">{serverError}</div>
          )}

          <FieldGroup>
            <Field>
              <FieldLabel>{t("settings.noticePeriod")}</FieldLabel>
              <FieldContent>
                <Input
                  type="number"
                  min={0}
                  placeholder="0"
                  {...form.register("notice_period_days", { valueAsNumber: true })}
                />
              </FieldContent>
              <FieldError>{form.formState.errors.notice_period_days?.message}</FieldError>
            </Field>

            <Field>
              <FieldLabel>{t("settings.maxConsecutiveDays")}</FieldLabel>
              <FieldContent>
                <Input
                  type="number"
                  min={1}
                  placeholder="No limit"
                  {...form.register("max_consecutive_days", { valueAsNumber: true })}
                />
              </FieldContent>
              <FieldError>{form.formState.errors.max_consecutive_days?.message}</FieldError>
            </Field>

            <Field>
              <div className="flex items-center justify-between">
                <FieldLabel>{t("settings.requiresAttachment")}</FieldLabel>
                <Switch
                  checked={form.watch("requires_attachment")}
                  onCheckedChange={(v) => form.setValue("requires_attachment", v)}
                />
              </div>
            </Field>
          </FieldGroup>

          <Button className="w-full" type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {policy ? t("common.saveChanges") : t("settings.configurePolicy")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
