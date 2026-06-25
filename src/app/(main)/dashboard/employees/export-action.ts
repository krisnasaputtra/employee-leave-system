"use server";

import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { createClient } from "@/lib/supabase/server";
import { toCSV } from "@/lib/utils/csv";
import { isNextInternalError } from "@/lib/utils/server-action-utils";

export async function exportEmployeesCSV(): Promise<{ success: boolean; csv?: string; error?: string }> {
  try {
    const { employee: actor } = await getAuthenticatedUser();
    if (actor.role !== "ADMIN") {
      return { success: false, error: "Only admins can export employee data." };
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("employees")
      .select("employee_code, full_name, work_email, phone_number, position, status, role, join_date, departments!employees_department_id_fk(name)")
      .order("full_name");

    if (error) return { success: false, error: error.message };

    const rows = (data ?? []).map(e => ({
      employee_code: e.employee_code,
      full_name: e.full_name,
      work_email: e.work_email,
      phone_number: e.phone_number ?? "",
      department: (e.departments as { name: string } | null)?.name ?? "",
      position: e.position,
      role: e.role,
      status: e.status,
      join_date: e.join_date,
    }));

    const csv = toCSV(rows, [
      { key: "employee_code", label: "Employee Code" },
      { key: "full_name", label: "Full Name" },
      { key: "work_email", label: "Work Email" },
      { key: "phone_number", label: "Phone" },
      { key: "department", label: "Department" },
      { key: "position", label: "Position" },
      { key: "role", label: "Role" },
      { key: "status", label: "Status" },
      { key: "join_date", label: "Join Date" },
    ]);

    return { success: true, csv };
  } catch (error) {
    if (isNextInternalError(error)) throw error;
    return { success: false, error: "Export failed." };
  }
}

export async function exportLeaveRequestsCSV(): Promise<{ success: boolean; csv?: string; error?: string }> {
  try {
    const { employee: actor } = await getAuthenticatedUser();
    if (actor.role !== "ADMIN") {
      return { success: false, error: "Only admins can export leave data." };
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("leave_requests")
      .select("request_number, status, start_date, end_date, requested_days, reason, partial_day, created_at, employees!leave_requests_employee_id_fk(full_name, employee_code), leave_types!leave_requests_leave_type_id_fk(name)")
      .order("created_at", { ascending: false })
      .limit(1000);

    if (error) return { success: false, error: error.message };

    const rows = (data ?? []).map(r => ({
      request_number: r.request_number,
      employee_code: (r.employees as { employee_code: string } | null)?.employee_code ?? "",
      employee_name: (r.employees as { full_name: string } | null)?.full_name ?? "",
      leave_type: (r.leave_types as { name: string } | null)?.name ?? "",
      start_date: r.start_date,
      end_date: r.end_date,
      days: r.requested_days,
      partial_day: r.partial_day,
      status: r.status,
      reason: r.reason ?? "",
      created_at: r.created_at,
    }));

    const csv = toCSV(rows, [
      { key: "request_number", label: "Request #" },
      { key: "employee_code", label: "Employee Code" },
      { key: "employee_name", label: "Employee Name" },
      { key: "leave_type", label: "Leave Type" },
      { key: "start_date", label: "Start Date" },
      { key: "end_date", label: "End Date" },
      { key: "days", label: "Days" },
      { key: "partial_day", label: "Partial Day" },
      { key: "status", label: "Status" },
      { key: "reason", label: "Reason" },
      { key: "created_at", label: "Created At" },
    ]);

    return { success: true, csv };
  } catch (error) {
    if (isNextInternalError(error)) throw error;
    return { success: false, error: "Export failed." };
  }
}
