import { z } from "zod";

export const balanceAdjustmentSchema = z.object({
  balance_id: z.string().uuid("Invalid balance ID."),
  days: z
    .number()
    .refine((v) => v !== 0, "Adjustment days cannot be zero.")
    .refine((v) => Math.abs(v) <= 365, "Adjustment must be between -365 and 365 days."),
  reason: z
    .string()
    .min(3, "Reason is required (minimum 3 characters).")
    .max(500, "Reason must be at most 500 characters."),
});

export type BalanceAdjustmentInput = z.infer<typeof balanceAdjustmentSchema>;
