"use client";

import { useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
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
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { BalanceAdjustmentInput } from "@/lib/balances/schemas";
import { balanceAdjustmentSchema } from "@/lib/balances/schemas";

import { adjustLeaveBalanceAction } from "../../actions";

interface BalanceAdjustmentDialogProps {
  balanceId: string;
  leaveTypeName: string;
  currentAdjustment: number;
  trigger: React.ReactNode;
}

export function BalanceAdjustmentDialog({
  balanceId,
  leaveTypeName,
  currentAdjustment,
  trigger,
}: BalanceAdjustmentDialogProps) {
  const [open, setOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BalanceAdjustmentInput>({
    resolver: zodResolver(balanceAdjustmentSchema),
    defaultValues: {
      balance_id: balanceId,
      days: 0,
      reason: "",
    },
  });

  const onSubmit = async (data: BalanceAdjustmentInput) => {
    const result = await adjustLeaveBalanceAction(data as unknown as Record<string, unknown>);

    if (result.success) {
      toast.success("Balance adjusted successfully.");
      reset();
      setOpen(false);
    } else {
      toast.error(result.error ?? "Failed to adjust balance.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adjust {leaveTypeName} Balance</DialogTitle>
          <DialogDescription>
            Current adjustment: {currentAdjustment > 0 ? "+" : ""}
            {currentAdjustment} days. Enter the number of days to add or subtract.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input type="hidden" {...register("balance_id")} />
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="days">Days</FieldLabel>
              <Input
                id="days"
                type="number"
                step="0.5"
                placeholder="e.g. 2 or -1.5"
                {...register("days", {
                  valueAsNumber: true,
                })}
              />
              <FieldError>{errors.days?.message}</FieldError>
            </Field>
            <Field>
              <FieldLabel htmlFor="reason">Reason</FieldLabel>
              <Textarea id="reason" placeholder="Reason for adjustment..." {...register("reason")} />
              <FieldError>{errors.reason?.message}</FieldError>
            </Field>
          </FieldGroup>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Adjustment"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
