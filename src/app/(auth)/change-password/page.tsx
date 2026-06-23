import { redirect } from "next/navigation";

import { APP_CONFIG } from "@/config/app-config";
import { createClient } from "@/lib/supabase/server";

import { ChangePasswordForm } from "./change-password-form";

export const metadata = {
  title: `Change Password — ${APP_CONFIG.name}`,
};

export default async function ChangePasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="mx-auto flex w-full flex-col justify-center space-y-8 sm:w-[350px]">
      <div className="space-y-2 text-center">
        <h1 className="font-medium text-3xl">Change Your Password</h1>
        <p className="text-muted-foreground text-sm">You must set a new password before continuing.</p>
      </div>
      <ChangePasswordForm />
    </div>
  );
}
