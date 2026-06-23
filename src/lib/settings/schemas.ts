import { z } from "zod";

const UUID_RE = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

// =============================================================
// Department schemas
// =============================================================

export const departmentCreateSchema = z.object({
  code: z
    .string()
    .min(1, "Department code is required.")
    .max(20, "Code must be at most 20 characters.")
    .regex(/^[A-Z0-9_]+$/, "Code must be uppercase letters, numbers, or underscores."),
  name: z.string().min(1, "Department name is required.").max(100),
  description: z.string().max(500).optional().or(z.literal("")),
  manager_employee_id: z.string().regex(UUID_RE).optional().or(z.literal("")),
  is_active: z.boolean(),
});

export type DepartmentCreateInput = z.infer<typeof departmentCreateSchema>;

export const departmentUpdateSchema = departmentCreateSchema.partial().required({ is_active: true });
export type DepartmentUpdateInput = z.infer<typeof departmentUpdateSchema>;

// =============================================================
// Leave Type schemas
// =============================================================

const hexColorRegex = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

export const leaveTypeCreateSchema = z.object({
  code: z
    .string()
    .min(1, "Leave type code is required.")
    .max(20, "Code must be at most 20 characters.")
    .regex(/^[A-Z0-9_]+$/, "Code must be uppercase letters, numbers, or underscores."),
  name: z.string().min(1, "Leave type name is required.").max(100),
  description: z.string().max(500).optional().or(z.literal("")),
  default_entitlement: z
    .number()
    .min(0, "Default entitlement cannot be negative.")
    .max(365, "Entitlement cannot exceed 365 days."),
  color: z.string().regex(hexColorRegex, "Please enter a valid hex color (e.g. #3B82F6)."),
  deducts_balance: z.boolean(),
  allow_negative_balance: z.boolean(),
  requires_attachment: z.boolean(),
  show_type_on_calendar: z.boolean(),
  is_active: z.boolean(),
});

export type LeaveTypeCreateInput = z.infer<typeof leaveTypeCreateSchema>;

export const leaveTypeUpdateSchema = leaveTypeCreateSchema.partial().required({ is_active: true });
export type LeaveTypeUpdateInput = z.infer<typeof leaveTypeUpdateSchema>;

// =============================================================
// Holiday schemas
// =============================================================

export const holidayCreateSchema = z.object({
  name: z.string().min(1, "Holiday name is required.").max(100),
  holiday_date: z.string().min(1, "Holiday date is required."),
  is_recurring: z.boolean(),
  is_active: z.boolean(),
});

export type HolidayCreateInput = z.infer<typeof holidayCreateSchema>;

export const holidayUpdateSchema = holidayCreateSchema;
export type HolidayUpdateInput = z.infer<typeof holidayUpdateSchema>;
