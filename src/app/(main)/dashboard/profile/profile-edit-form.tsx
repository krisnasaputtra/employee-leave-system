"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

import { updateProfileAction } from "./actions";

interface ProfileEditFormProps {
  employee: {
    id: string;
    full_name: string;
    work_email: string;
    employee_code: string;
    role: string;
    position: string;
    department_name: string;
  };
}

export function ProfileEditForm({ employee }: ProfileEditFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: {
      full_name: employee.full_name,
      position: employee.position,
    },
  });

  const onSubmit = (data: Record<string, unknown>) => {
    setServerError(null);
    startTransition(async () => {
      const result = await updateProfileAction(data);
      if (!result.success) {
        setServerError(result.error ?? "Update failed.");
      } else {
        toast.success("Profile updated successfully.");
        router.refresh();
      }
    });
  };

  return (
    <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {serverError && (
        <div className="rounded-md bg-destructive/10 p-3 text-center text-destructive text-sm">
          {serverError}
        </div>
      )}

      <div className="rounded-lg border bg-card p-6">
        <h2 className="mb-4 font-medium text-lg">Account Information</h2>
        <FieldGroup>
          <div className="grid gap-4 md:grid-cols-2">
            <Field>
              <FieldLabel>Employee Code</FieldLabel>
              <FieldContent>
                <Input value={employee.employee_code} disabled />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel>Work Email</FieldLabel>
              <FieldContent>
                <Input value={employee.work_email} disabled />
              </FieldContent>
            </Field>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field>
              <FieldLabel>Role</FieldLabel>
              <FieldContent>
                <Input value={employee.role} disabled />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel>Department</FieldLabel>
              <FieldContent>
                <Input value={employee.department_name} disabled />
              </FieldContent>
            </Field>
          </div>
        </FieldGroup>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <h2 className="mb-4 font-medium text-lg">Editable Information</h2>
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
              <FieldLabel>Position</FieldLabel>
              <FieldContent>
                <Input {...form.register("position")} />
              </FieldContent>
              <FieldError>{form.formState.errors.position?.message}</FieldError>
            </Field>
          </div>
        </FieldGroup>
      </div>

      <div className="flex">
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
      </div>
    </form>
  );
}
