"use client";

import { useState, useTransition } from "react";

import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { Copy, Eye, EyeOff, Loader2, RefreshCw } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { type EmployeeCreateInput, employeeCreateSchema, generateTemporaryPassword } from "@/lib/employees/schemas";

import { createEmployeeAction } from "../actions";

interface Props {
  departments: { id: string; name: string }[];
  employees: { id: string; full_name: string }[];
}

export function EmployeeCreateForm({ departments, employees }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [createdPassword, setCreatedPassword] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<EmployeeCreateInput>({
    resolver: zodResolver(employeeCreateSchema),
    defaultValues: {
      employee_code: "",
      full_name: "",
      work_email: "",
      phone_number: "",
      department_id: "",
      position: "",
      manager_id: "",
      join_date: new Date().toISOString().split("T")[0],
      role: "EMPLOYEE",
      status: "ACTIVE",
      create_account: false,
      temporary_password: "",
    },
  });

  const createAccount = form.watch("create_account");

  const handleGeneratePassword = () => {
    const pw = generateTemporaryPassword();
    form.setValue("temporary_password", pw);
  };

  const onSubmit = (data: EmployeeCreateInput) => {
    setServerError(null);
    setCreatedPassword(null);
    startTransition(async () => {
      const result = await createEmployeeAction(data as unknown as Record<string, unknown>);
      if (!result.success) {
        setServerError(result.error ?? "Failed to create employee.");
      } else {
        if (result.temporaryPassword) {
          setCreatedPassword(result.temporaryPassword);
          toast.success("Employee created with login account.");
        } else {
          toast.success("Employee created successfully.");
          router.push("/dashboard/employees");
        }
      }
    });
  };

  if (createdPassword) {
    return (
      <div className="mx-auto max-w-md rounded-lg border bg-card p-6">
        <h2 className="mb-2 font-medium text-lg">Employee Created</h2>
        <p className="mb-4 text-muted-foreground text-sm">
          The temporary password is shown below. It will not be displayed again.
        </p>
        <div className="mb-4 flex items-center gap-2 rounded-md border bg-muted p-3 font-mono text-sm">
          <span className="flex-1">{showPassword ? createdPassword : "••••••••••••"}</span>
          <Button type="button" variant="ghost" size="icon" onClick={() => setShowPassword(!showPassword)}>
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => {
              navigator.clipboard.writeText(createdPassword);
              toast.success("Password copied to clipboard.");
            }}
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
        <Button className="w-full" onClick={() => router.push("/dashboard/employees")}>
          Done
        </Button>
      </div>
    );
  }

  return (
    <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="mx-auto max-w-2xl space-y-6">
      {serverError && (
        <div className="rounded-md bg-destructive/10 p-3 text-center text-destructive text-sm">{serverError}</div>
      )}

      <div className="rounded-lg border bg-card p-6">
        <h2 className="mb-4 font-medium text-lg">Personal Information</h2>
        <FieldGroup>
          <div className="grid gap-4 md:grid-cols-2">
            <Field>
              <FieldLabel>Employee Code</FieldLabel>
              <FieldContent>
                <Input placeholder="EMP001" {...form.register("employee_code")} />
              </FieldContent>
              <FieldError>{form.formState.errors.employee_code?.message}</FieldError>
            </Field>
            <Field>
              <FieldLabel>Full Name</FieldLabel>
              <FieldContent>
                <Input placeholder="John Doe" {...form.register("full_name")} />
              </FieldContent>
              <FieldError>{form.formState.errors.full_name?.message}</FieldError>
            </Field>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field>
              <FieldLabel>Work Email</FieldLabel>
              <FieldContent>
                <Input type="email" placeholder="john@company.com" {...form.register("work_email")} />
              </FieldContent>
              <FieldError>{form.formState.errors.work_email?.message}</FieldError>
            </Field>
            <Field>
              <FieldLabel>Phone Number</FieldLabel>
              <FieldContent>
                <Input placeholder="+62 812 ..." {...form.register("phone_number")} />
              </FieldContent>
              <FieldError>{form.formState.errors.phone_number?.message}</FieldError>
            </Field>
          </div>
          <Field>
            <FieldLabel>Join Date</FieldLabel>
            <FieldContent>
              <Input type="date" {...form.register("join_date")} />
            </FieldContent>
            <FieldError>{form.formState.errors.join_date?.message}</FieldError>
          </Field>
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
                  <option value="">Select department...</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </FieldContent>
              <FieldError>{form.formState.errors.department_id?.message}</FieldError>
            </Field>
            <Field>
              <FieldLabel>Position</FieldLabel>
              <FieldContent>
                <Input placeholder="Software Engineer" {...form.register("position")} />
              </FieldContent>
              <FieldError>{form.formState.errors.position?.message}</FieldError>
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

      <div className="rounded-lg border bg-card p-6">
        <h2 className="mb-4 font-medium text-lg">Authentication</h2>
        <FieldGroup>
          <Field>
            <FieldContent>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" {...form.register("create_account")} className="rounded" />
                Create login account for this employee
              </label>
            </FieldContent>
          </Field>
          {createAccount && (
            <Field>
              <FieldLabel>Temporary Password</FieldLabel>
              <FieldContent>
                <div className="flex gap-2">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter or generate..."
                    {...form.register("temporary_password")}
                  />
                  <Button type="button" variant="outline" size="icon" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button type="button" variant="outline" size="icon" onClick={handleGeneratePassword}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </FieldContent>
              <FieldError>{form.formState.errors.temporary_password?.message}</FieldError>
            </Field>
          )}
        </FieldGroup>
      </div>

      <Button className="w-full" type="submit" disabled={isPending}>
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Create Employee
      </Button>
    </form>
  );
}
