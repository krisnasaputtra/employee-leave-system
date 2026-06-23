import type { ReactNode } from "react";

import { Command } from "lucide-react";

import { APP_CONFIG } from "@/config/app-config";

export default function AuthLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <main>
      <div className="grid h-dvh justify-center p-2 lg:grid-cols-2">
        <div className="relative order-2 hidden h-full rounded-3xl bg-primary lg:flex">
          <div className="absolute top-10 space-y-1 px-10 text-primary-foreground">
            <Command className="size-10" />
            <h1 className="font-medium text-2xl">{APP_CONFIG.name}</h1>
            <p className="text-sm">Employee Leave Management System</p>
          </div>
          <div className="absolute bottom-10 flex w-full justify-between px-10">
            <div>
              <p className="font-medium text-primary-foreground text-sm">Manage your leaves</p>
              <p className="text-primary-foreground/70 text-xs">Submit, track, and approve leave requests</p>
            </div>
          </div>
        </div>
        <div className="relative order-1 flex h-full">{children}</div>
      </div>
    </main>
  );
}
