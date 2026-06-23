import { z } from "zod";

// =============================================================
// Leave Request schemas
// =============================================================

export const leaveRequestCreateSchema = z
  .object({
    leave_type_id: z.string().uuid("Please select a leave type."),
    start_date: z.string().min(1, "Start date is required."),
    end_date: z.string().min(1, "End date is required."),
    partial_day: z.enum(["NONE", "FIRST_HALF", "SECOND_HALF"]),
    reason: z.string().max(1000, "Reason must be at most 1000 characters.").optional().or(z.literal("")),
  })
  .refine((data) => data.start_date <= data.end_date, {
    message: "End date cannot be before start date.",
    path: ["end_date"],
  });

export type LeaveRequestCreateInput = z.infer<typeof leaveRequestCreateSchema>;

export const leaveRequestUpdateSchema = leaveRequestCreateSchema;
export type LeaveRequestUpdateInput = z.infer<typeof leaveRequestUpdateSchema>;
