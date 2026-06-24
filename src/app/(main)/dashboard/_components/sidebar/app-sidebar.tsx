"use client";

import Image from "next/image";
import Link from "next/link";

import { useShallow } from "zustand/react/shallow";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { APP_CONFIG } from "@/config/app-config";
import type { ApplicationRole } from "@/lib/permissions/roles";
import { filterNavByRole, type NavBadge, type NavGroup, sidebarItems } from "@/navigation/sidebar/sidebar-items";
import { usePreferencesStore } from "@/stores/preferences/preferences-provider";

import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";

interface SidebarUser {
  name: string;
  email: string;
  role: ApplicationRole;
}

export function AppSidebar({ user, pendingApprovalCount, ...props }: React.ComponentProps<typeof Sidebar> & { user: SidebarUser; pendingApprovalCount?: number }) {
  const { sidebarVariant, sidebarCollapsible, isSynced } = usePreferencesStore(
    useShallow((s) => ({
      sidebarVariant: s.sidebarVariant,
      sidebarCollapsible: s.sidebarCollapsible,
      isSynced: s.isSynced,
    })),
  );

  const variant = isSynced ? sidebarVariant : props.variant;
  const collapsible = isSynced ? sidebarCollapsible : props.collapsible;
  const filteredItems = filterNavByRole(sidebarItems, user.role);

  // Inject pending approval count badge on the Approvals nav item
  const itemsWithBadges: NavGroup[] = filteredItems.map(group => ({
    ...group,
    items: group.items.map(item => {
      if ('url' in item && item.url === '/dashboard/approvals' && pendingApprovalCount) {
        return { ...item, badge: pendingApprovalCount as NavBadge };
      }
      return item;
    }),
  }));

  return (
    <Sidebar {...props} variant={variant} collapsible={collapsible}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link prefetch={false} href="/dashboard">
                <Image src="/lrm-icon.png" alt="LRM" width={28} height={28} />
                <span className="font-semibold text-base">{APP_CONFIG.name}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={itemsWithBadges} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={{ name: user.name, email: user.email, avatar: "" }} />
      </SidebarFooter>
    </Sidebar>
  );
}
