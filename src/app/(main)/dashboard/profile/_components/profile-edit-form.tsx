"use client";

import { useState, useTransition } from "react";

import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldContent, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

import { updateProfileAction } from "../actions";

interface ProfileEditFormProps {
  phoneNumber: string | null;
}

export function ProfileEditForm({ phoneNumber }: ProfileEditFormProps) {
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: {
      phone_number: phoneNumber ?? "",
    },
  });

  const onSubmit = (data: { phone_number: string }) => {
    setServerError(null);
    startTransition(async () => {
      const result = await updateProfileAction({
        phone_number: data.phone_number || null,
      });
      if (!result.success) {
        setServerError(result.error ?? "Update failed.");
      } else {
        toast.success("Phone number updated successfully.");
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Phone Number</CardTitle>
      </CardHeader>
      <CardContent>
        <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {serverError && (
            <div className="rounded-md bg-destructive/10 p-3 text-center text-destructive text-sm">
              {serverError}
            </div>
          )}

          <FieldGroup>
            <Field>
              <FieldLabel>Phone Number</FieldLabel>
              <FieldContent>
                <Input
                  placeholder="e.g. +62 812 3456 7890"
                  {...form.register("phone_number")}
                />
              </FieldContent>
            </Field>
          </FieldGroup>

          <div className="flex">
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
