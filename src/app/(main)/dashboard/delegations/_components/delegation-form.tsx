"use client";

import { useTransition } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { delegationCreateSchema, type DelegationCreateInput } from "@/lib/delegations/schemas";
import { useTranslation } from "@/providers/locale-provider";

import { createDelegationAction } from "../actions";

interface DelegationFormProps {
  employees: { id: string; full_name: string; employee_code: string }[];
}

export function DelegationForm({ employees }: DelegationFormProps) {
  const { t } = useTranslation();
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<DelegationCreateInput>({
    resolver: zodResolver(delegationCreateSchema),
    defaultValues: {
      delegate_id: "",
      start_date: "",
      end_date: "",
      reason: "",
    },
  });

  function onSubmit(data: DelegationCreateInput) {
    startTransition(async () => {
      const result = await createDelegationAction(data);
      if (result.success) {
        toast.success("Delegation created successfully.");
        reset();
      } else {
        toast.error(result.error ?? "Failed to create delegation.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="delegate_id">{t("delegation.delegateTo")}</Label>
          <Select
            onValueChange={(value) => setValue("delegate_id", value, { shouldValidate: true })}
          >
            <SelectTrigger id="delegate_id" aria-required="true" aria-describedby={errors.delegate_id ? "delegate_id-error" : undefined}>
              <SelectValue placeholder={t("delegation.selectEmployee")} />
            </SelectTrigger>
            <SelectContent>
              {employees.map((emp) => (
                <SelectItem key={emp.id} value={emp.id}>
                  {emp.full_name} ({emp.employee_code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.delegate_id && (
            <p id="delegate_id-error" role="alert" className="text-sm text-destructive">{errors.delegate_id.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="reason">{t("leave.reason")}</Label>
          <Textarea
            id="reason"
            placeholder={t("delegation.reasonPlaceholder")}
            rows={1}
            aria-describedby={errors.reason ? "reason-error" : undefined}
            {...register("reason")}
          />
          {errors.reason && (
            <p id="reason-error" role="alert" className="text-sm text-destructive">{errors.reason.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="start_date">{t("leave.startDate")}</Label>
          <Input type="date" id="start_date" aria-required="true" aria-describedby={errors.start_date ? "start_date-error" : undefined} {...register("start_date")} />
          {errors.start_date && (
            <p id="start_date-error" role="alert" className="text-sm text-destructive">{errors.start_date.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="end_date">{t("leave.endDate")}</Label>
          <Input type="date" id="end_date" aria-required="true" aria-describedby={errors.end_date ? "end_date-error" : undefined} {...register("end_date")} />
          {errors.end_date && (
            <p id="end_date-error" role="alert" className="text-sm text-destructive">{errors.end_date.message}</p>
          )}
        </div>
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {t("delegation.createDelegation")}
      </Button>
    </form>
  );
}
