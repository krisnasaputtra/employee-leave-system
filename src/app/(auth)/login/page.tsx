import { redirect } from "next/navigation";

import { APP_CONFIG } from "@/config/app-config";
import { getSafeRedirectUrl } from "@/lib/auth/safe-redirect";
import { createClient } from "@/lib/supabase/server";

import { LoginForm } from "./login-form";

export const metadata = {
  title: `Login — ${APP_CONFIG.name}`,
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ redirectTo?: string }> }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const params = await searchParams;
    redirect(getSafeRedirectUrl(params.redirectTo));
  }

  return (
    <div className="mx-auto flex w-full flex-col justify-center space-y-8 sm:w-[350px]">
      <div className="space-y-2 text-center">
        <h1 className="font-medium text-3xl">Sign in to your account</h1>
        <p className="text-muted-foreground text-sm">Enter your credentials to access the system.</p>
      </div>
      <LoginForm />
      <p className="text-center text-muted-foreground text-xs">{APP_CONFIG.copyright}</p>
    </div>
  );
}
