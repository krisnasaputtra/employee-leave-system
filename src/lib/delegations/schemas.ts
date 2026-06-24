import { z } from "zod";

const UUID_RE = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export const delegationCreateSchema = z
  .object({
    delegate_id: z.string().min(1, "Please select a delegate.").regex(UUID_RE, "Invalid delegate selected."),
    start_date: z.string().min(1, "Start date is required."),
    end_date: z.string().min(1, "End date is required."),
    reason: z.string().min(1, "Reason is required.").max(500, "Reason must be at most 500 characters."),
  })
  .refine((data) => data.end_date >= data.start_date, {
    message: "End date must be on or after start date.",
    path: ["end_date"],
  });

export type DelegationCreateInput = z.infer<typeof delegationCreateSchema>;
