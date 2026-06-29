"use client";

import { useState, useTransition } from "react";

import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { Copy, Eye, EyeOff, Loader2, RefreshCw } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList } from "@/components/ui/combobox";
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type EmployeeCreateInput, employeeCreateSchema, generateTemporaryPassword } from "@/lib/employees/schemas";

import { createEmployeeAction } from "../actions";

interface Props {
  departments: { id: string; name: string }[];
}

export function EmployeeCreateForm({ departments }: Props) {
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
          <Button type="button" variant="ghost" size="icon" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"}>
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Copy password"
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
    <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {serverError && (
        <div role="alert" className="rounded-md bg-destructive/10 p-3 text-center text-destructive text-sm">{serverError}</div>
      )}

      <div className="rounded-lg border bg-card p-6">
        <h2 className="mb-4 font-medium text-lg">Personal Information</h2>
        <FieldGroup>
          <div className="grid gap-4 md:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="employee_code">Employee Code</FieldLabel>
              <FieldContent>
                <Input id="employee_code" placeholder="EMP001" aria-required="true" {...form.register("employee_code")} />
              </FieldContent>
              <FieldError>{form.formState.errors.employee_code?.message}</FieldError>
            </Field>
            <Field>
              <FieldLabel htmlFor="full_name">Full Name</FieldLabel>
              <FieldContent>
                <Input id="full_name" placeholder="John Doe" aria-required="true" {...form.register("full_name")} />
              </FieldContent>
              <FieldError>{form.formState.errors.full_name?.message}</FieldError>
            </Field>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="work_email">Work Email</FieldLabel>
              <FieldContent>
                <Input id="work_email" type="email" placeholder="john@company.com" aria-required="true" autoComplete="email" {...form.register("work_email")} />
              </FieldContent>
              <FieldError>{form.formState.errors.work_email?.message}</FieldError>
            </Field>
            <Field>
              <FieldLabel htmlFor="phone_number">Phone Number</FieldLabel>
              <FieldContent>
                <Input id="phone_number" placeholder="+62 812 ..." autoComplete="tel" {...form.register("phone_number")} />
              </FieldContent>
              <FieldError>{form.formState.errors.phone_number?.message}</FieldError>
            </Field>
          </div>
          <Field>
            <FieldLabel htmlFor="join_date">Join Date</FieldLabel>
            <FieldContent>
              <Input id="join_date" type="date" aria-required="true" {...form.register("join_date")} />
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
              <FieldLabel>Team</FieldLabel>
              <FieldContent>
                <Controller
                  control={form.control}
                  name="department_id"
                  render={({ field }) => (
                    <Combobox
                      value={departments.find((d) => d.id === field.value)?.name ?? ""}
                      onValueChange={(val) => {
                        const match = departments.find((d) => d.name === val);
                        field.onChange(match?.id ?? "");
                      }}
                    >
                      <ComboboxInput showClear placeholder="Search team..." />
                      <ComboboxContent>
                        <ComboboxList>
                          <ComboboxEmpty>No team found.</ComboboxEmpty>
                          {departments.map((d) => (
                            <ComboboxItem key={d.id} value={d.name}>
                              {d.name}
                            </ComboboxItem>
                          ))}
                        </ComboboxList>
                      </ComboboxContent>
                    </Combobox>
                  )}
                />
              </FieldContent>
              <FieldError>{form.formState.errors.department_id?.message}</FieldError>
            </Field>
            <Field>
              <FieldLabel htmlFor="position">Position</FieldLabel>
              <FieldContent>
                <Input id="position" placeholder="Software Engineer" aria-required="true" {...form.register("position")} />
              </FieldContent>
              <FieldError>{form.formState.errors.position?.message}</FieldError>
            </Field>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field>
              <FieldLabel>Role</FieldLabel>
              <FieldContent>
                <Controller
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EMPLOYEE">Employee</SelectItem>
                        <SelectItem value="MANAGER">Manager</SelectItem>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
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
                  <Button type="button" variant="outline" size="icon" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button type="button" variant="outline" size="icon" onClick={handleGeneratePassword} aria-label="Generate password">
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
