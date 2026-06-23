"use client";

import { useState, useTransition } from "react";

import { useRouter } from "next/navigation";

import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { Database } from "@/types/database.types";

import { deactivateEmployeeAction, updateEmployeeAction } from "../../actions";

type Employee = Database["public"]["Tables"]["employees"]["Row"];

interface Props {
  employee: Employee;
  departments: { id: string; name: string }[];
  employees: { id: string; full_name: string }[];
}

export function EmployeeEditForm({ employee, departments, employees }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: {
      full_name: employee.full_name,
      work_email: employee.work_email,
      phone_number: employee.phone_number ?? "",
      department_id: employee.department_id,
      position: employee.position,
      manager_id: employee.manager_id ?? "",
      join_date: employee.join_date,
      role: employee.role,
      status: employee.status,
    },
  });

  const onSubmit = (data: Record<string, unknown>) => {
    setServerError(null);
    startTransition(async () => {
      const result = await updateEmployeeAction(employee.id, data);
      if (!result.success) {
        setServerError(result.error ?? "Update failed.");
      } else {
        toast.success("Employee updated.");
        router.push(`/dashboard/employees/${employee.id}`);
      }
    });
  };

  const handleDeactivate = () => {
    if (!confirm("Are you sure you want to deactivate this employee? Their login will be banned.")) return;
    startTransition(async () => {
      const result = await deactivateEmployeeAction(employee.id);
      if (!result.success) {
        setServerError(result.error ?? "Deactivation failed.");
      } else {
        toast.success("Employee deactivated.");
        router.push("/dashboard/employees");
      }
    });
  };

  return (
    <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {serverError && (
        <div className="rounded-md bg-destructive/10 p-3 text-center text-destructive text-sm">{serverError}</div>
      )}

      <div className="rounded-lg border bg-card p-6">
        <h2 className="mb-4 font-medium text-lg">Personal Information</h2>
        <FieldGroup>
          <div className="grid gap-4 md:grid-cols-2">
            <Field>
              <FieldLabel>Full Name</FieldLabel>
              <FieldContent>
                <Input {...form.register("full_name")} />
              </FieldContent>
              <FieldError>{form.formState.errors.full_name?.message}</FieldError>
            </Field>
            <Field>
              <FieldLabel>Work Email</FieldLabel>
              <FieldContent>
                <Input type="email" {...form.register("work_email")} />
              </FieldContent>
            </Field>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field>
              <FieldLabel>Phone Number</FieldLabel>
              <FieldContent>
                <Input {...form.register("phone_number")} />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel>Join Date</FieldLabel>
              <FieldContent>
                <Input type="date" {...form.register("join_date")} />
              </FieldContent>
            </Field>
          </div>
        </FieldGroup>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <h2 className="mb-4 font-medium text-lg">Organization</h2>
        <FieldGroup>
          <div className="grid gap-4 md:grid-cols-2">
            <Field>
              <FieldLabel>Department</FieldLabel>
              <FieldContent>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
                  {...form.register("department_id")}
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel>Position</FieldLabel>
              <FieldContent>
                <Input {...form.register("position")} />
              </FieldContent>
            </Field>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field>
              <FieldLabel>Manager</FieldLabel>
              <FieldContent>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
                  {...form.register("manager_id")}
                >
                  <option value="">No manager</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.full_name}
                    </option>
                  ))}
                </select>
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel>Role</FieldLabel>
              <FieldContent>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
                  {...form.register("role")}
                >
                  <option value="EMPLOYEE">Employee</option>
                  <option value="MANAGER">Manager</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </FieldContent>
            </Field>
          </div>
        </FieldGroup>
      </div>

      <div className="flex gap-2">
        <Button className="flex-1" type="submit" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
        {employee.status === "ACTIVE" && (
          <Button type="button" variant="destructive" disabled={isPending} onClick={handleDeactivate}>
            Deactivate
          </Button>
        )}
      </div>
    </form>
  );
}
