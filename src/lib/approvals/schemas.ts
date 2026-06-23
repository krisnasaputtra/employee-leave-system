import { z } from "zod";

export const leaveRejectionSchema = z.object({
  rejection_reason: z
    .string()
    .min(3, "Rejection reason must be at least 3 characters.")
    .max(500, "Rejection reason must be at most 500 characters."),
});

export type LeaveRejectionInput = z.infer<typeof leaveRejectionSchema>;
