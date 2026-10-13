import { z } from "zod";

import { UUID_RE } from "@/lib/utils/constants";

export const leaveRejectionSchema = z.object({
  rejection_reason: z
    .string()
    .min(3, "Rejection reason must be at least 3 characters.")
    .max(500, "Rejection reason must be at most 500 characters."),
});

export type LeaveRejectionInput = z.infer<typeof leaveRejectionSchema>;

export const approvalRequestIdSchema = z.string().regex(UUID_RE, "Invalid request selected.");
export type ApprovalRequestIdInput = z.infer<typeof approvalRequestIdSchema>;

export const bulkApprovalRequestIdsSchema = z
  .array(approvalRequestIdSchema)
  .min(1, "Select at least one request.")
  .max(50, "You can process up to 50 requests at once.")
  .transform((ids) => Array.from(new Set(ids)));

export type BulkApprovalRequestIdsInput = z.infer<typeof bulkApprovalRequestIdsSchema>;
