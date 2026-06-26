"use client";

import { useState, useTransition } from "react";

import { useRouter } from "next/navigation";

import { Loader2 } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList } from "@/components/ui/combobox";
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Database } from "@/types/database.types";

import { activateEmployeeAction, deactivateEmployeeAction, updateEmployeeAction } from "../../actions";
import { GrantLoginButton } from "../grant-login-button";
import { ResetPasswordButton } from "../reset-password-button";

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

  const handleActivate = () => {
    startTransition(async () => {
      const result = await activateEmployeeAction(employee.id);
      if (!result.success) {
        setServerError(result.error ?? "Activation failed.");
      } else {
        toast.success("Employee activated.");
        router.refresh();
      }
    });
  };

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
              <FieldLabel htmlFor="edit_full_name">Full Name</FieldLabel>
              <FieldContent>
                <Input id="edit_full_name" aria-required="true" {...form.register("full_name")} />
              </FieldContent>
              <FieldError>{form.formState.errors.full_name?.message}</FieldError>
            </Field>
            <Field>
              <FieldLabel htmlFor="edit_work_email">Work Email</FieldLabel>
              <FieldContent>
                <Input id="edit_work_email" type="email" aria-required="true" autoComplete="email" {...form.register("work_email")} />
              </FieldContent>
            </Field>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="edit_phone_number">Phone Number</FieldLabel>
              <FieldContent>
                <Input id="edit_phone_number" autoComplete="tel" {...form.register("phone_number")} />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="edit_join_date">Join Date</FieldLabel>
              <FieldContent>
                <Input id="edit_join_date" type="date" aria-required="true" {...form.register("join_date")} />
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
              <FieldLabel>Team</FieldLabel>
              <FieldContent>
                <Controller
                  control={form.control}
                  name="department_id"
                  render={({ field }) => (
                    <Combobox
                      value={field.value}
                      onValueChange={(val) => field.onChange(val as string)}
                    >
                      <ComboboxInput showClear placeholder="Search team..." />
                      <ComboboxContent>
                        <ComboboxList>
                          <ComboboxEmpty>No team found.</ComboboxEmpty>
                          {departments.map((d) => (
                            <ComboboxItem key={d.id} value={d.id}>
                              {d.name}
                            </ComboboxItem>
                          ))}
                        </ComboboxList>
                      </ComboboxContent>
                    </Combobox>
                  )}
                />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="edit_position">Position</FieldLabel>
              <FieldContent>
                <Input id="edit_position" aria-required="true" {...form.register("position")} />
              </FieldContent>
            </Field>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field>
              <FieldLabel>Manager</FieldLabel>
              <FieldContent>
                <Controller
                  control={form.control}
                  name="manager_id"
                  render={({ field }) => (
                    <Combobox
                      value={field.value}
                      onValueChange={(val) => field.onChange((val as string) ?? "")}
                    >
                      <ComboboxInput showClear placeholder="Search manager..." />
                      <ComboboxContent>
                        <ComboboxList>
                          <ComboboxEmpty>No employee found.</ComboboxEmpty>
                          {employees.map((e) => (
                            <ComboboxItem key={e.id} value={e.id}>
                              {e.full_name}
                            </ComboboxItem>
                          ))}
                        </ComboboxList>
                      </ComboboxContent>
                    </Combobox>
                  )}
                />
              </FieldContent>
            </Field>
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

      <div className="flex gap-2">
        <Button className="flex-1" type="submit" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
        {employee.status === "ACTIVE" && !employee.auth_user_id && (
          <GrantLoginButton employeeId={employee.id} employeeName={employee.full_name} />
        )}
        {employee.auth_user_id && (
          <ResetPasswordButton employeeId={employee.id} employeeName={employee.full_name} />
        )}
        {employee.status === "ACTIVE" && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button type="button" variant="destructive" disabled={isPending}>
                Deactivate
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Deactivate Employee</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to deactivate this employee? Their login will be banned and they will no longer be able to access the system.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeactivate}>
                  Deactivate
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
        {employee.status === "INACTIVE" && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button type="button" variant="outline" disabled={isPending}>
                Activate
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Activate Employee</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to reactivate this employee? Their login ban will be lifted and they will be able to access the system again.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleActivate}>
                  Activate
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </form>
  );
}
