import { redirect } from "next/navigation";

import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { canManageLeaveBalance } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";

import { fetchBalances } from "./fetch-balances";
import { ManageBalancesClient } from "./_components/manage-balances-client";

export default async function ManageBalancesPage() {
  const { employee: actor } = await getAuthenticatedUser();

  if (!canManageLeaveBalance(actor.role)) {
    redirect("/dashboard/leave/balances");
  }

  // ---------- Fetch departments for filter dropdown ----------
  const supabase = await createClient();
  const { data: departments } = await supabase
    .from("departments")
    .select("id, name")
    .order("name");

  // ---------- Fetch initial (unfiltered, page 1) data ----------
  const initialData = await fetchBalances();

  const currentYear = new Date().getFullYear();

  return (
    <ManageBalancesClient
      initialData={initialData}
      departments={departments ?? []}
      currentYear={currentYear}
    />
  );
}
