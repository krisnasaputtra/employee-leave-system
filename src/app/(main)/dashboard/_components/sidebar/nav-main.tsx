"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { ChevronRight, PlusCircleIcon } from "lucide-react";


import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import type {
  NavBadge,
  NavGroup,
  NavMainItem,
  NavMainLinkItem,
  NavMainParentItem,
} from "@/navigation/sidebar/sidebar-items";
import { SIDEBAR_I18N_MAP } from "@/navigation/sidebar/sidebar-items";
import { useTranslation } from "@/providers/locale-provider";

interface NavMainProps {
  readonly items: readonly NavGroup[];
}
interface NavItemProps {
  readonly item: NavMainItem;
  readonly isItemActive: (item: NavMainItem) => boolean;
  readonly isSubItemActive: (url: string) => boolean;
  readonly isSubmenuOpen: (item: NavMainParentItem) => boolean;
}

interface NavLinkItemProps {
  readonly item: NavMainLinkItem;
  readonly isActive: boolean;
  readonly showIconFallback: boolean;
}

interface NavDropdownItemProps {
  readonly item: NavMainParentItem;
  readonly isActive: boolean;
  readonly isSubItemActive: (url: string) => boolean;
}

interface NavCollapsibleItemProps {
  readonly item: NavMainParentItem;
  readonly isActive: boolean;
  readonly defaultOpen: boolean;
  readonly isSubItemActive: (url: string) => boolean;
}

function CollapsedIconFallback({ title }: { title: string }) {
  return (
    <span className="flex size-4 shrink-0 items-center justify-center rounded-xs font-medium text-[10px] outline">
      {title.slice(0, 1)}
    </span>
  );
}

function hasSubItems(item: NavMainItem): item is NavMainParentItem {
  return Boolean(item.subItems?.length);
}

/**
 * Resolves a translated title for a sidebar item or group label.
 * Falls back to the original title if no mapping exists.
 */
function useItemTitle(idOrLabel: string, fallback: string): string {
  const { t } = useTranslation();
  const key = SIDEBAR_I18N_MAP[idOrLabel];
  return key ? t(key) : fallback;
}

export function NavMain({ items }: NavMainProps) {
  const path = usePathname();
  const { t } = useTranslation();

  const isItemActive = (item: NavMainItem) => {
    if (hasSubItems(item)) {
      return item.subItems.some((sub) => path.startsWith(sub.url));
    }

    return path === item.url;
  };

  const isSubItemActive = (url: string) => {
    return path === url;
  };

  const isSubmenuOpen = (item: NavMainParentItem) => {
    return item.subItems.some((sub) => path.startsWith(sub.url));
  };

  const quickCreateLabel = t("nav.quickCreate");

  return (
    <>
      <SidebarGroup>
        <SidebarGroupContent className="flex flex-col gap-2">
          <SidebarMenu>
            <SidebarMenuItem className="flex items-center gap-2">
              <SidebarMenuButton
                asChild
                tooltip={quickCreateLabel}
                className="min-w-8 bg-primary text-primary-foreground duration-200 ease-linear hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground"
              >
                <Link href="/dashboard/leave/requests/new">
                  <PlusCircleIcon />
                  <span suppressHydrationWarning>{quickCreateLabel}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
      {items.map((group) => (
        <NavGroupSection key={group.id} group={group} isItemActive={isItemActive} isSubItemActive={isSubItemActive} isSubmenuOpen={isSubmenuOpen} />
      ))}
    </>
  );
}

function NavGroupSection({ group, isItemActive, isSubItemActive, isSubmenuOpen }: { group: NavGroup; isItemActive: (item: NavMainItem) => boolean; isSubItemActive: (url: string) => boolean; isSubmenuOpen: (item: NavMainParentItem) => boolean }) {
  const translatedLabel = useItemTitle(group.label ?? "", group.label ?? "");

  return (
    <SidebarGroup>
      {group.label && (
        <SidebarGroupLabel className="group-data-[collapsible=icon]:pointer-events-none" suppressHydrationWarning>
          {translatedLabel}
        </SidebarGroupLabel>
      )}
      <SidebarGroupContent>
        <SidebarMenu>
          {group.items.map((item) => (
            <NavItem
              key={item.id}
              item={item}
              isItemActive={isItemActive}
              isSubItemActive={isSubItemActive}
              isSubmenuOpen={isSubmenuOpen}
            />
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

function NavItem({ item, isItemActive, isSubItemActive, isSubmenuOpen }: NavItemProps) {
  const { state, isMobile } = useSidebar();
  const isCollapsedDesktop = state === "collapsed" && !isMobile;

  if (!hasSubItems(item)) {
    return <NavLinkItem item={item} isActive={isItemActive(item)} showIconFallback={isCollapsedDesktop} />;
  }

  if (isCollapsedDesktop) {
    return <NavDropdownItem item={item} isActive={isItemActive(item)} isSubItemActive={isSubItemActive} />;
  }

  return (
    <NavCollapsibleItem
      item={item}
      isActive={isItemActive(item)}
      defaultOpen={isSubmenuOpen(item)}
      isSubItemActive={isSubItemActive}
    />
  );
}

function NavLinkItem({ item, isActive, showIconFallback }: NavLinkItemProps) {
  const Icon = item.icon;
  const translatedTitle = useItemTitle(item.id, item.title);

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild aria-disabled={item.disabled} tooltip={translatedTitle} isActive={isActive}>
        <Link
          prefetch={false}
          href={item.url}
          target={item.newTab ? "_blank" : undefined}
          rel={item.newTab ? "noreferrer" : undefined}
        >
          {Icon ? <Icon /> : showIconFallback ? <CollapsedIconFallback title={translatedTitle} /> : null}
          <span suppressHydrationWarning>{translatedTitle}</span>
        </Link>
      </SidebarMenuButton>
      <NavItemBadge badge={item.badge} />
    </SidebarMenuItem>
  );
}

function NavDropdownItem({ item, isActive, isSubItemActive }: NavDropdownItemProps) {
  const Icon = item.icon;
  const translatedTitle = useItemTitle(item.id, item.title);

  return (
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton tooltip={translatedTitle} isActive={isActive} disabled={item.disabled}>
            {Icon ? <Icon /> : <CollapsedIconFallback title={translatedTitle} />}
            <span suppressHydrationWarning>{translatedTitle}</span>
          </SidebarMenuButton>
        </DropdownMenuTrigger>

        <DropdownMenuContent side="right" align="start" sideOffset={12} className="w-48">
          <DropdownMenuGroup>
            {item.subItems.map((subItem) => {
              return <NavDropdownSubItem key={subItem.id} subItem={subItem} isSubItemActive={isSubItemActive} />;
            })}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  );
}

function NavDropdownSubItem({ subItem, isSubItemActive }: { subItem: NavMainParentItem["subItems"][number]; isSubItemActive: (url: string) => boolean }) {
  const SubIcon = subItem.icon;
  const translatedTitle = useItemTitle(subItem.id, subItem.title);

  return (
    <DropdownMenuItem asChild disabled={subItem.disabled}>
      <Link
        prefetch={false}
        href={subItem.url}
        target={subItem.newTab ? "_blank" : undefined}
        rel={subItem.newTab ? "noreferrer" : undefined}
        aria-current={isSubItemActive(subItem.url) ? "page" : undefined}
        className="flex items-center gap-2"
      >
        {SubIcon && <SubIcon />}
        <span suppressHydrationWarning>{translatedTitle}</span>
      </Link>
    </DropdownMenuItem>
  );
}

function NavCollapsibleItem({ item, isActive, defaultOpen, isSubItemActive }: NavCollapsibleItemProps) {
  const Icon = item.icon;
  const translatedTitle = useItemTitle(item.id, item.title);

  return (
    <Collapsible asChild defaultOpen={defaultOpen} className="group/collapsible">
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton tooltip={translatedTitle} isActive={isActive} disabled={item.disabled}>
            {Icon && <Icon />}
            <span suppressHydrationWarning>{translatedTitle}</span>
            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <NavItemBadge badge={item.badge} />

        <CollapsibleContent>
          <SidebarMenuSub>
            {item.subItems.map((subItem) => {
              return <NavCollapsibleSubItem key={subItem.id} subItem={subItem} isSubItemActive={isSubItemActive} />;
            })}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}

function NavCollapsibleSubItem({ subItem, isSubItemActive }: { subItem: NavMainParentItem["subItems"][number]; isSubItemActive: (url: string) => boolean }) {
  const SubIcon = subItem.icon;
  const translatedTitle = useItemTitle(subItem.id, subItem.title);

  return (
    <SidebarMenuSubItem>
      <SidebarMenuSubButton
        asChild
        aria-disabled={subItem.disabled}
        isActive={isSubItemActive(subItem.url)}
      >
        <Link
          prefetch={false}
          href={subItem.url}
          target={subItem.newTab ? "_blank" : undefined}
          rel={subItem.newTab ? "noreferrer" : undefined}
        >
          {SubIcon && <SubIcon />}
          <span suppressHydrationWarning>{translatedTitle}</span>
        </Link>
      </SidebarMenuSubButton>
    </SidebarMenuSubItem>
  );
}

function NavItemBadge({ badge }: { badge?: NavBadge }) {
  if (!badge && badge !== 0) {
    return null;
  }

  if (typeof badge === "number") {
    if (badge <= 0) return null;
    return (
      <SidebarMenuBadge className="bg-red-500 text-white text-xs font-bold min-w-[20px] h-5 flex items-center justify-center">
        {badge > 99 ? "99+" : badge}
      </SidebarMenuBadge>
    );
  }

  return (
    <SidebarMenuBadge
      className={cn(
        "rounded-sm border capitalize",
        badge === "new" &&
          "border-green-600 text-green-600 peer-hover/menu-button:text-green-600 peer-data-active/menu-button:text-green-600",
        badge === "soon" && "border-muted-foreground text-muted-foreground",
      )}
    >
      {badge}
    </SidebarMenuBadge>
  );
}
