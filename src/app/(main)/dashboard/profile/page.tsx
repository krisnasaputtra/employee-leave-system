import { redirect } from "next/navigation";

import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { createClient } from "@/lib/supabase/server";

import { ProfileEditForm } from "./profile-edit-form";

export const metadata = {
  title: "My Profile",
};

export default async function ProfilePage() {
  const { employee: authEmployee } = await getAuthenticatedUser();

  const supabase = await createClient();

  // Fetch full employee record (including employee_code)
  const { data: employee } = await supabase
    .from("employees")
    .select("id, full_name, work_email, employee_code, role, position, department_id")
    .eq("id", authEmployee.id)
    .single();

  if (!employee) {
    redirect("/dashboard");
  }

  // Fetch department name
  const { data: department } = await supabase
    .from("departments")
    .select("name")
    .eq("id", employee.department_id)
    .single();

  return (
    <div className="flex flex-1 flex-col gap-6 p-4">
      <div>
        <h1 className="font-semibold text-2xl tracking-tight">My Profile</h1>
        <p className="text-muted-foreground text-sm">
          View and update your personal information.
        </p>
      </div>
      <div className="mx-auto w-full max-w-2xl">
        <ProfileEditForm
          employee={{
            id: employee.id,
            full_name: employee.full_name,
            work_email: employee.work_email,
            employee_code: employee.employee_code,
            role: employee.role,
            position: employee.position,
            department_name: department?.name ?? "Unknown",
          }}
        />
      </div>
    </div>
  );
}
