import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { canManageEmployees } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";

import { EmployeeEditForm } from "./employee-edit-form";

export default async function EditEmployeePage({ params }: { params: Promise<{ id: string }> }) {
  const { employee: actor } = await getAuthenticatedUser();

  if (!canManageEmployees(actor.role)) {
    redirect("/dashboard");
  }

  const { id } = await params;
  const supabase = await createClient();

  const [{ data: employee }, { data: departments }, { data: employees }] = await Promise.all([
    supabase.from("employees").select("*").eq("id", id).single(),
    supabase.from("departments").select("id, name").eq("is_active", true).order("name"),
    supabase.from("employees").select("id, full_name").eq("status", "ACTIVE").neq("id", id).order("full_name"),
  ]);

  if (!employee) {
    notFound();
  }

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/dashboard/employees/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="font-semibold text-2xl tracking-tight">Edit {employee.full_name}</h1>
      </div>
      <EmployeeEditForm employee={employee} departments={departments ?? []} employees={employees ?? []} />
    </div>
  );
}
