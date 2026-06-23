import { redirect } from "next/navigation";

import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { createClient } from "@/lib/supabase/server";

import { LeaveRequestForm } from "../../_components/leave-request-form";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditLeaveRequestPage({ params }: PageProps) {
  const { id } = await params;
  const { employee: actor } = await getAuthenticatedUser();
  const supabase = await createClient();

  // Load the leave request
  const { data: request, error } = await supabase.from("leave_requests").select("*").eq("id", id).single();

  if (error || !request) {
    redirect(`/dashboard/leave/requests/${id}`);
  }

  // Verify ownership and status
  if (request.employee_id !== actor.id || request.status !== "PENDING") {
    redirect(`/dashboard/leave/requests/${id}`);
  }

  // Load active leave types that deduct balance
  const { data: leaveTypes } = await supabase
    .from("leave_types")
    .select("id, code, name, color")
    .eq("is_active", true)
    .eq("deducts_balance", true)
    .order("name");

  // Load own balances for current year
  const currentYear = new Date().getFullYear();
  const { data: balances } = await supabase
    .from("leave_balances")
    .select("leave_type_id, entitled_days, adjustment_days, used_days, pending_days")
    .eq("employee_id", actor.id)
    .eq("balance_year", currentYear);

  // Load active holidays
  const { data: holidays } = await supabase.from("holidays").select("holiday_date").eq("is_active", true);

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <h1 className="font-semibold text-2xl tracking-tight">Edit Leave Request</h1>

      <LeaveRequestForm
        mode="edit"
        requestId={id}
        leaveTypes={
          leaveTypes?.map((lt) => ({
            id: lt.id,
            code: lt.code,
            name: lt.name,
            color: lt.color ?? "#888",
          })) ?? []
        }
        balances={
          balances?.map((b) => ({
            leave_type_id: b.leave_type_id,
            entitled_days: b.entitled_days,
            adjustment_days: b.adjustment_days,
            used_days: b.used_days,
            pending_days: b.pending_days,
          })) ?? []
        }
        holidays={holidays?.map((h) => h.holiday_date) ?? []}
        defaultValues={{
          leave_type_id: request.leave_type_id,
          start_date: request.start_date,
          end_date: request.end_date,
          partial_day: request.partial_day,
          reason: request.reason ?? "",
        }}
      />
    </div>
  );
}
