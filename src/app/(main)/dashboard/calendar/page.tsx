import type { Metadata } from "next";

import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { createClient } from "@/lib/supabase/server";

import { LeaveCalendar } from "./_components/leave-calendar";

export const metadata: Metadata = {
  title: "Leave Calendar",
};

export default async function CalendarPage() {
  await getAuthenticatedUser();
  const supabase = await createClient();

  // Fetch filter options and holidays
  const [{ data: departments }, { data: leaveTypes }, { data: holidays }] = await Promise.all([
    supabase.from("departments").select("id, name").eq("is_active", true).order("name"),
    supabase
      .from("leave_types")
      .select("id, name, color, code")
      .eq("is_active", true)
      .eq("show_type_on_calendar", true)
      .order("name"),
    supabase
      .from("holidays")
      .select("id, name, holiday_date, is_recurring")
      .eq("is_active", true)
      .order("holiday_date"),
  ]);

  return (
    <LeaveCalendar
      departments={departments ?? []}
      leaveTypes={leaveTypes ?? []}
      holidays={holidays ?? []}
    />
  );
}
