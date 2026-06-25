import {
  ArrowLeftRight,
  BarChart3,
  Bell,
  Calendar,
  CalendarDays,
  CheckSquare,
  ClipboardList,
  Gauge,
  type LucideIcon,
  ScrollText,
  User,
  Settings,
  Users,
  Wallet,
} from "lucide-react";

import type { ApplicationRole } from "@/lib/permissions/roles";

export type NavBadge = "new" | "soon" | number;

export interface NavSubItem {
  id: string;
  title: string;
  url: string;
  icon?: LucideIcon;
  badge?: NavBadge;
  disabled?: boolean;
  newTab?: boolean;
  /** Roles allowed to see this item. If undefined, all roles can see it. */
  roles?: ApplicationRole[];
}

interface NavItemBase {
  id: string;
  title: string;
  icon?: LucideIcon;
  badge?: NavBadge;
  disabled?: boolean;
  newTab?: boolean;
  /** Roles allowed to see this item. If undefined, all roles can see it. */
  roles?: ApplicationRole[];
}

export interface NavMainLinkItem extends NavItemBase {
  url: string;
  subItems?: never;
}

export interface NavMainParentItem extends NavItemBase {
  subItems: NavSubItem[];
}

export type NavMainItem = NavMainLinkItem | NavMainParentItem;

export interface NavGroup {
  id: number;
  label?: string;
  items: NavMainItem[];
  /** Roles allowed to see this group. If undefined, all roles can see it. */
  roles?: ApplicationRole[];
}

/**
 * Filter navigation items by role.
 * Items without a `roles` property are visible to all roles.
 */
export function filterNavByRole(groups: NavGroup[], role: ApplicationRole): NavGroup[] {
  return groups
    .filter((group) => !group.roles || group.roles.includes(role))
    .map((group) => ({
      ...group,
      items: group.items
        .filter((item) => !item.roles || item.roles.includes(role))
        .map((item) => {
          if ("subItems" in item && item.subItems) {
            return {
              ...item,
              subItems: item.subItems.filter((sub) => !sub.roles || sub.roles.includes(role)),
            };
          }
          return item;
        }),
    }))
    .filter((group) => group.items.length > 0);
}

export const sidebarItems: NavGroup[] = [
  {
    id: 1,
    items: [
      {
        id: "dashboard",
        title: "Dashboard",
        url: "/dashboard",
        icon: Gauge,
      },
    ],
  },
  {
    id: 2,
    label: "Employees",
    roles: ["ADMIN"],
    items: [
      {
        id: "employees",
        title: "Employees",
        url: "/dashboard/employees",
        icon: Users,
        roles: ["ADMIN"],
      },
    ],
  },
  {
    id: 3,
    label: "Leave",
    items: [
      {
        id: "my-leave",
        title: "My Leave",
        icon: CalendarDays,
        subItems: [
          {
            id: "my-requests",
            title: "Requests",
            url: "/dashboard/leave/requests",
          },
          {
            id: "my-balances",
            title: "Balances",
            url: "/dashboard/leave/balances",
          },
        ],
      },
      {
        id: "approvals",
        title: "Approvals",
        url: "/dashboard/approvals",
        icon: CheckSquare,
        roles: ["ADMIN", "MANAGER"],
      },
      {
        id: "delegations",
        title: "Delegations",
        url: "/dashboard/delegations",
        icon: ArrowLeftRight,
        roles: ["ADMIN", "MANAGER"],
      },
      {
        id: "team",
        title: "Team",
        url: "/dashboard/team",
        icon: Users,
        roles: ["MANAGER"],
      },
      {
        id: "all-requests",
        title: "All Requests",
        url: "/dashboard/leave/all",
        icon: ClipboardList,
        roles: ["ADMIN"],
      },
      {
        id: "manage-balances",
        title: "Manage Balances",
        url: "/dashboard/leave/balances/manage",
        icon: Wallet,
        roles: ["ADMIN"],
      },
      {
        id: "analytics-reports",
        title: "Analytics",
        url: "/dashboard/analytics-reports",
        icon: BarChart3,
        roles: ["ADMIN", "MANAGER"],
      },
    ],
  },
  {
    id: 4,
    items: [
      {
        id: "calendar",
        title: "Calendar",
        url: "/dashboard/calendar",
        icon: Calendar,
      },
    ],
  },
  {
    id: 7,
    items: [
      {
        id: "my-profile",
        title: "My Profile",
        url: "/dashboard/profile",
        icon: User,
      },
    ],
  },
  {
    id: 5,
    label: "Settings",
    roles: ["ADMIN"],
    items: [
      {
        id: "settings",
        title: "Settings",
        icon: Settings,
        roles: ["ADMIN"],
        subItems: [
          {
            id: "departments",
            title: "Departments",
            url: "/dashboard/settings/departments",
          },
          {
            id: "leave-types",
            title: "Leave Types",
            url: "/dashboard/settings/leave-types",
          },
          {
            id: "holidays",
            title: "Holidays",
            url: "/dashboard/settings/holidays",
          },
          {
            id: "leave-policies",
            title: "Leave Policies",
            url: "/dashboard/settings/policies",
          },
          {
            id: "capacity-rules",
            title: "Capacity Rules",
            url: "/dashboard/settings/capacity",
          },
        ],
      },
    ],
  },
  {
    id: 6,
    items: [
      {
        id: "audit-logs",
        title: "Audit Logs",
        url: "/dashboard/audit-logs",
        icon: ScrollText,
        roles: ["ADMIN"],
      },
      {
        id: "notifications",
        title: "Notifications",
        url: "/dashboard/notifications",
        icon: Bell,
      },
    ],
  },
];
