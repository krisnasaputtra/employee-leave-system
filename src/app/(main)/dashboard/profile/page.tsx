import { redirect } from "next/navigation";

import {
  Briefcase,
  Building2,
  Hash,
  Mail,
  Shield,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { createClient } from "@/lib/supabase/server";
import { ROLE_BADGE_STYLES } from "@/lib/ui/badge-variants";

import { ProfileEditForm } from "./_components/profile-edit-form";

export const metadata = {
  title: "My Profile",
};

export default async function ProfilePage() {
  const { employee: authEmployee } = await getAuthenticatedUser();

  const supabase = await createClient();

  // Fetch full employee record
  const { data: employee } = await supabase
    .from("employees")
    .select(
      "id, full_name, work_email, employee_code, phone_number, role, position, department_id, departments!employees_department_id_fk(name)",
    )
    .eq("id", authEmployee.id)
    .single();

  if (!employee) {
    redirect("/dashboard");
  }

  const departmentName = (employee.departments as { name: string } | null)?.name ?? "—";

  const initials = employee.full_name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="@container/main flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16 border-2 border-primary">
          <AvatarFallback className="text-lg font-bold bg-primary/10">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h1 className="font-semibold text-2xl tracking-tight">{employee.full_name}</h1>
          <p className="text-muted-foreground text-sm">{employee.position}</p>
        </div>
      </div>

      {/* Personal Information & Organization */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4 text-sm">
              <div className="flex items-center gap-3">
                <Hash className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <dt className="text-muted-foreground text-xs">Employee Code</dt>
                  <dd className="font-mono">{employee.employee_code}</dd>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <dt className="text-muted-foreground text-xs">Work Email</dt>
                  <dd>{employee.work_email}</dd>
                </div>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Organization</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4 text-sm">
              <div className="flex items-center gap-3">
                <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <dt className="text-muted-foreground text-xs">Team</dt>
                  <dd>{departmentName}</dd>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Briefcase className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <dt className="text-muted-foreground text-xs">Position</dt>
                  <dd>{employee.position}</dd>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Shield className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <dt className="text-muted-foreground text-xs">Role</dt>
                  <dd>
                    <Badge variant="outline" className={ROLE_BADGE_STYLES[employee.role]?.className}>{employee.role}</Badge>
                  </dd>
                </div>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>

      {/* Phone Number Edit Form */}
      <div className="max-w-md">
        <ProfileEditForm phoneNumber={employee.phone_number} />
      </div>
    </div>
  );
}
