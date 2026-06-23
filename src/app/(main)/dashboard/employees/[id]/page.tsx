import Link from "next/link";
import { notFound } from "next/navigation";

import { ArrowLeft, Pencil } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { canManageEmployees, canViewEmployee } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";

export default async function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { employee: actor } = await getAuthenticatedUser();
  const { id } = await params;
  const supabase = await createClient();

  const { data: employee, error } = await supabase
    .from("employees")
    .select("*, departments(name)")
    .eq("id", id)
    .single();

  if (error || !employee) {
    notFound();
  }

  if (!canViewEmployee(actor.role, actor.id, employee.id, employee.manager_id)) {
    notFound();
  }

  const isAdmin = canManageEmployees(actor.role);

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/employees">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="font-semibold text-2xl tracking-tight">{employee.full_name}</h1>
          <p className="text-muted-foreground text-sm">{employee.position}</p>
        </div>
        {isAdmin && (
          <Button asChild>
            <Link href={`/dashboard/employees/${employee.id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border bg-card p-6">
          <h2 className="mb-4 font-medium text-lg">Personal Information</h2>
          <dl className="grid gap-3 text-sm">
            <div>
              <dt className="text-muted-foreground">Employee Code</dt>
              <dd className="font-mono">{employee.employee_code}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Full Name</dt>
              <dd>{employee.full_name}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Work Email</dt>
              <dd>{employee.work_email}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Phone</dt>
              <dd>{employee.phone_number ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Join Date</dt>
              <dd>{employee.join_date}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <h2 className="mb-4 font-medium text-lg">Organization</h2>
          <dl className="grid gap-3 text-sm">
            <div>
              <dt className="text-muted-foreground">Department</dt>
              <dd>{(employee.departments as { name: string } | null)?.name ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Position</dt>
              <dd>{employee.position}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Role</dt>
              <dd>
                <Badge>{employee.role}</Badge>
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Status</dt>
              <dd>
                <Badge variant={employee.status === "ACTIVE" ? "default" : "destructive"}>{employee.status}</Badge>
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Login Access</dt>
              <dd>
                <Badge variant={employee.auth_user_id ? "default" : "outline"}>
                  {employee.auth_user_id ? "Yes" : "No"}
                </Badge>
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
