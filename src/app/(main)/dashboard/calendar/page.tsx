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

  // Fetch filter options
  const [{ data: departments }, { data: leaveTypes }] = await Promise.all([
    supabase.from("departments").select("id, name").eq("is_active", true).order("name"),
    supabase
      .from("leave_types")
      .select("id, name, color, code")
      .eq("is_active", true)
      .eq("show_type_on_calendar", true)
      .order("name"),
  ]);

  return <LeaveCalendar departments={departments ?? []} leaveTypes={leaveTypes ?? []} />;
}
