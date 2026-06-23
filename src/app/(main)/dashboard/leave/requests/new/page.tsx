import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { createClient } from "@/lib/supabase/server";

import { LeaveRequestForm } from "../_components/leave-request-form";

export default async function NewLeaveRequestPage() {
  const { employee: actor } = await getAuthenticatedUser();
  const supabase = await createClient();

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

  // Load active holidays for calendar preview
  const { data: holidays } = await supabase.from("holidays").select("holiday_date").eq("is_active", true);

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <h1 className="font-semibold text-2xl tracking-tight">New Leave Request</h1>

      <LeaveRequestForm
        mode="create"
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
      />
    </div>
  );
}
