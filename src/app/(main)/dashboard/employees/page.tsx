import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { canManageEmployees } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";

import { EmployeeListClient } from "./_components/employee-list-client";
import { fetchEmployees } from "./fetch-employees";

export default async function EmployeesPage() {
  const { employee: actor } = await getAuthenticatedUser();
  const isAdmin = canManageEmployees(actor.role);
  const supabase = await createClient();

  // Prefetch initial data + departments for filters
  const [initialData, { data: departments }] = await Promise.all([
    fetchEmployees({ page: 1 }),
    supabase
      .from("departments")
      .select("id, name")
      .eq("is_active", true)
      .order("name"),
  ]);

  return (
    <EmployeeListClient
      initialData={initialData}
      isAdmin={isAdmin}
      departments={departments ?? []}
    />
  );
}
