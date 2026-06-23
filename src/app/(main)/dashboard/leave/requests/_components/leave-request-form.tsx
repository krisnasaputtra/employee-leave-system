"use client";

import { useMemo, useState } from "react";

import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { calculateLeaveDaysPreview } from "@/lib/leave-requests/calculate-leave-days";
import { type LeaveRequestCreateInput, leaveRequestCreateSchema } from "@/lib/leave-requests/schemas";

import { createLeaveRequestAction, updateLeaveRequestAction } from "../actions";

interface LeaveRequestFormProps {
  mode: "create" | "edit";
  leaveTypes: { id: string; code: string; name: string; color: string }[];
  balances: {
    leave_type_id: string;
    entitled_days: number;
    adjustment_days: number;
    used_days: number;
    pending_days: number;
  }[];
  holidays: string[];
  defaultValues?: {
    leave_type_id: string;
    start_date: string;
    end_date: string;
    partial_day: string;
    reason: string;
  };
  requestId?: string;
}

export function LeaveRequestForm({
  mode,
  leaveTypes,
  balances,
  holidays,
  defaultValues,
  requestId,
}: LeaveRequestFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState("");

  const form = useForm<LeaveRequestCreateInput>({
    resolver: zodResolver(leaveRequestCreateSchema),
    defaultValues: defaultValues
      ? {
          leave_type_id: defaultValues.leave_type_id,
          start_date: defaultValues.start_date,
          end_date: defaultValues.end_date,
          partial_day: defaultValues.partial_day as LeaveRequestCreateInput["partial_day"],
          reason: defaultValues.reason,
        }
      : {
          leave_type_id: "",
          start_date: "",
          end_date: "",
          partial_day: "NONE",
          reason: "",
        },
  });

  const { register, handleSubmit, formState, watch, setValue } = form;
  const { errors, isSubmitting } = formState;

  // Watch fields for live preview
  const watchedLeaveTypeId = watch("leave_type_id");
  const watchedStartDate = watch("start_date");
  const watchedEndDate = watch("end_date");
  const watchedPartialDay = watch("partial_day");

  // Calculate estimated days
  const estimatedDays = useMemo(
    () => calculateLeaveDaysPreview(watchedStartDate, watchedEndDate, watchedPartialDay, holidays),
    [watchedStartDate, watchedEndDate, watchedPartialDay, holidays],
  );

  // Find balance for selected leave type
  const selectedBalance = useMemo(() => {
    if (!watchedLeaveTypeId) return null;
    return balances.find((b) => b.leave_type_id === watchedLeaveTypeId) ?? null;
  }, [watchedLeaveTypeId, balances]);

  const selectedLeaveType = useMemo(() => {
    if (!watchedLeaveTypeId) return null;
    return leaveTypes.find((lt) => lt.id === watchedLeaveTypeId) ?? null;
  }, [watchedLeaveTypeId, leaveTypes]);

  const balanceSummary = useMemo(() => {
    if (!selectedBalance) return null;
    const entitled = selectedBalance.entitled_days + selectedBalance.adjustment_days;
    const remaining = entitled - selectedBalance.used_days;
    const available = remaining - selectedBalance.pending_days;
    const afterRequest = available - estimatedDays;
    return { entitled, remaining, pending: selectedBalance.pending_days, available, afterRequest };
  }, [selectedBalance, estimatedDays]);

  async function onSubmit(data: LeaveRequestCreateInput) {
    setServerError("");
    const input: Record<string, unknown> = { ...data };

    let result: Awaited<ReturnType<typeof createLeaveRequestAction>>;
    if (mode === "create") {
      result = await createLeaveRequestAction(input);
    } else {
      result = await updateLeaveRequestAction(requestId ?? "", input);
    }

    if (!result.success) {
      setServerError(result.error ?? "An unexpected error occurred.");
      return;
    }

    if (mode === "create") {
      toast.success(
        `Leave request ${result.request_number ?? ""} created — ${result.requested_days ?? 0} day(s) reserved.`,
      );
    } else {
      toast.success("Leave request updated successfully.");
    }

    router.push("/dashboard/leave/requests");
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6 lg:grid-cols-3">
      {/* Main Form */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>{mode === "create" ? "Request Details" : "Edit Request"}</CardTitle>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              {/* Leave Type */}
              <Field data-invalid={!!errors.leave_type_id}>
                <FieldLabel>Leave Type</FieldLabel>
                <FieldContent>
                  <Select
                    value={watchedLeaveTypeId}
                    onValueChange={(value) => setValue("leave_type_id", value, { shouldValidate: true })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select leave type" />
                    </SelectTrigger>
                    <SelectContent>
                      {leaveTypes.map((lt) => (
                        <SelectItem key={lt.id} value={lt.id}>
                          <div className="flex items-center gap-2">
                            <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: lt.color }} />
                            {lt.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldError>{errors.leave_type_id?.message}</FieldError>
                </FieldContent>
              </Field>

              {/* Date Range */}
              <div className="grid gap-5 sm:grid-cols-2">
                <Field data-invalid={!!errors.start_date}>
                  <FieldLabel>Start Date</FieldLabel>
                  <FieldContent>
                    <Input type="date" {...register("start_date")} />
                    <FieldError>{errors.start_date?.message}</FieldError>
                  </FieldContent>
                </Field>

                <Field data-invalid={!!errors.end_date}>
                  <FieldLabel>End Date</FieldLabel>
                  <FieldContent>
                    <Input type="date" {...register("end_date")} />
                    <FieldError>{errors.end_date?.message}</FieldError>
                  </FieldContent>
                </Field>
              </div>

              {/* Partial Day */}
              <Field data-invalid={!!errors.partial_day}>
                <FieldLabel>Partial Day</FieldLabel>
                <FieldContent>
                  <Select
                    value={watchedPartialDay}
                    onValueChange={(value) =>
                      setValue("partial_day", value as LeaveRequestCreateInput["partial_day"], { shouldValidate: true })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select partial day" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NONE">None (Full Day)</SelectItem>
                      <SelectItem value="FIRST_HALF">First Half</SelectItem>
                      <SelectItem value="SECOND_HALF">Second Half</SelectItem>
                    </SelectContent>
                  </Select>
                  <FieldError>{errors.partial_day?.message}</FieldError>
                </FieldContent>
              </Field>

              {/* Reason */}
              <Field data-invalid={!!errors.reason}>
                <FieldLabel>Reason (optional)</FieldLabel>
                <FieldContent>
                  <Textarea rows={3} placeholder="Enter reason for your leave request..." {...register("reason")} />
                  <FieldError>{errors.reason?.message}</FieldError>
                </FieldContent>
              </Field>
            </FieldGroup>

            {/* Server Error */}
            {serverError && (
              <div className="mt-4 rounded-md bg-destructive/10 p-3 text-destructive text-sm">{serverError}</div>
            )}

            {/* Submit */}
            <div className="mt-6 flex gap-3">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {mode === "create" ? "Submit Request" : "Save Changes"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.push("/dashboard/leave/requests")}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live Preview Sidebar */}
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              {/* Selected Leave Type */}
              {selectedLeaveType && (
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: selectedLeaveType.color }} />
                  <span className="font-medium">{selectedLeaveType.name}</span>
                </div>
              )}

              <Separator />

              {/* Estimated Days */}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Estimated days</span>
                <span className="font-medium">{estimatedDays}</span>
              </div>

              {/* Balance Info */}
              {balanceSummary && (
                <>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Entitled</span>
                    <span>{balanceSummary.entitled}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Used</span>
                    <span>{selectedBalance?.used_days ?? 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pending</span>
                    <span>{balanceSummary.pending}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Available</span>
                    <span className="font-medium">{balanceSummary.available}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">After this request</span>
                    <span className={balanceSummary.afterRequest < 0 ? "font-medium text-destructive" : "font-medium"}>
                      {balanceSummary.afterRequest}
                    </span>
                  </div>
                </>
              )}

              {!watchedLeaveTypeId && (
                <p className="text-muted-foreground text-xs">Select a leave type to see balance info.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </form>
  );
}
