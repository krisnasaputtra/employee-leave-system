import Link from "next/link";
import { redirect } from "next/navigation";

import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { canManageEmployees } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";

import { EmployeeCreateForm } from "./employee-create-form";

export default async function NewEmployeePage() {
  const { employee: actor } = await getAuthenticatedUser();

  if (!canManageEmployees(actor.role)) {
    redirect("/dashboard");
  }

  const supabase = await createClient();

  const { data: departments } = await supabase
    .from("departments")
    .select("id, name")
    .eq("is_active", true)
    .order("name");

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild aria-label="Go back">
          <Link href="/dashboard/employees">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="font-semibold text-2xl tracking-tight">Add Employee</h1>
      </div>
      <EmployeeCreateForm departments={departments ?? []} />
    </div>
  );
}
