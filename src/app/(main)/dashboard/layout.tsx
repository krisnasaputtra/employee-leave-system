import type { ReactNode } from "react";

import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Bell } from "lucide-react";

import { AppSidebar } from "@/app/(main)/dashboard/_components/sidebar/app-sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { SIDEBAR_COLLAPSIBLE_VALUES, SIDEBAR_VARIANT_VALUES } from "@/lib/preferences/layout";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { getPreference } from "@/server/server-actions";

import { LanguageSwitcher } from "@/components/language-switcher";

import { LayoutControls } from "./_components/sidebar/layout-controls";
import { SearchDialog } from "./_components/sidebar/search-dialog";
import { ThemeSwitcher } from "./_components/sidebar/theme-switcher";

export default async function Layout({ children }: Readonly<{ children: ReactNode }>) {
  // Server-side auth check — redirect to /login if not authenticated
  const { employee } = await getAuthenticatedUser();

  // Enforce must_change_password
  if (employee.must_change_password) {
    redirect("/change-password");
  }

  const supabase = await createClient();

  // Build the approval count query based on role
  const approvalQuery =
    employee.role === "ADMIN"
      ? supabase
          .from("leave_requests")
          .select("*", { count: "exact", head: true })
          .eq("status", "PENDING")
      : employee.role === "MANAGER"
        ? supabase
            .from("leave_requests")
            .select("*, employees!inner(manager_id)", { count: "exact", head: true })
            .eq("status", "PENDING")
            .eq("employees.manager_id", employee.id)
        : null;

  // Run independent queries in parallel
  const [notifResult, approvalResult] = await Promise.all([
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("employee_id", employee.id)
      .eq("is_read", false),
    approvalQuery ?? Promise.resolve({ count: 0 }),
  ]);

  const unreadCount = notifResult.count;
  const pendingApprovalCount = approvalResult.count ?? 0;

  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false";
  const [variant, collapsible] = await Promise.all([
    getPreference("sidebar_variant", SIDEBAR_VARIANT_VALUES, "inset"),
    getPreference("sidebar_collapsible", SIDEBAR_COLLAPSIBLE_VALUES, "icon"),
  ]);

  const sidebarUser = {
    name: employee.full_name,
    email: employee.work_email,
    role: employee.role,
  };

  return (
    <SidebarProvider
      defaultOpen={defaultOpen}
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 68)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant={variant} collapsible={collapsible} user={sidebarUser} pendingApprovalCount={pendingApprovalCount} />
      <SidebarInset
        className={cn(
          "[html[data-content-layout=centered]_&>*]:mx-auto",
          "[html[data-content-layout=centered]_&>*]:w-full",
          "[html[data-content-layout=centered]_&>*]:max-w-screen-2xl",
          "peer-data-[variant=inset]:border",
          "[--dashboard-header-height:--spacing(12)]",
          "min-w-0 overflow-x-hidden",
        )}
      >
        <header
          className={cn(
            "flex h-12 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12",
            "[html[data-navbar-style=sticky]_&]:sticky [html[data-navbar-style=sticky]_&]:top-0 [html[data-navbar-style=sticky]_&]:z-50 [html[data-navbar-style=sticky]_&]:overflow-hidden [html[data-navbar-style=sticky]_&]:rounded-t-[inherit] [html[data-navbar-style=sticky]_&]:bg-background/50 [html[data-navbar-style=sticky]_&]:backdrop-blur-md",
          )}
        >
          <div className="flex w-full items-center justify-between px-4 lg:px-6">
            <div className="flex items-center gap-1 lg:gap-2">
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className="mx-2 data-[orientation=vertical]:h-4 data-[orientation=vertical]:self-center"
              />
              <SearchDialog />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" asChild className="relative">
                <Link href="/dashboard/notifications" aria-label="Notifications">
                  <Bell className="h-4 w-4" />
                  {(unreadCount ?? 0) > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center px-1 text-[10px]"
                    >
                      {unreadCount}
                    </Badge>
                  )}
                </Link>
              </Button>
              <LanguageSwitcher />
              <LayoutControls />
              <ThemeSwitcher />
            </div>
          </div>
        </header>
        <div className="min-h-0 min-w-0 flex-1 overflow-x-hidden p-4 has-data-[content-padding=false]:p-0 md:p-6 md:has-data-[content-padding=false]:p-0">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
