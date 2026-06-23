import { z } from "zod";

export const employeeCreateSchema = z.object({
  employee_code: z
    .string()
    .min(1, "Employee code is required.")
    .max(20, "Employee code must be at most 20 characters."),
  full_name: z
    .string()
    .min(3, "Full name must be at least 3 characters.")
    .max(100, "Full name must be at most 100 characters."),
  work_email: z.string().email("Please enter a valid email address."),
  phone_number: z.string().max(20).optional().or(z.literal("")),
  department_id: z.string().uuid("Please select a department."),
  position: z.string().min(1, "Position is required.").max(100),
  manager_id: z.string().uuid().optional().or(z.literal("")),
  join_date: z.string().min(1, "Join date is required."),
  role: z.enum(["ADMIN", "MANAGER", "EMPLOYEE"]),
  status: z.enum(["ACTIVE", "INACTIVE", "TERMINATED"]),
  create_account: z.boolean(),
  temporary_password: z.string().optional(),
});

export type EmployeeCreateInput = z.infer<typeof employeeCreateSchema>;

export const employeeUpdateSchema = z.object({
  full_name: z.string().min(3, "Full name must be at least 3 characters.").max(100).optional(),
  work_email: z.string().email("Please enter a valid email.").optional(),
  phone_number: z.string().max(20).optional().or(z.literal("")),
  department_id: z.string().uuid().optional(),
  position: z.string().min(1).max(100).optional(),
  manager_id: z.string().uuid().optional().or(z.literal("")),
  join_date: z.string().optional(),
  role: z.enum(["ADMIN", "MANAGER", "EMPLOYEE"]).optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "TERMINATED"]).optional(),
});

export type EmployeeUpdateInput = z.infer<typeof employeeUpdateSchema>;

/** Generate a random temporary password */
export function generateTemporaryPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let password = "";
  const array = new Uint8Array(12);
  crypto.getRandomValues(array);
  for (const byte of array) {
    password += chars[byte % chars.length];
  }
  return password;
}
