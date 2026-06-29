"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Bell } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/providers/locale-provider";

import { fetchHeaderCounts } from "../fetch-header-counts";

/**
 * Client-side notification bell that fetches count via TanStack Query.
 * This avoids blocking the layout server render on every navigation.
 */
export function NotificationBell() {
  const { data } = useQuery({
    queryKey: ["header-counts"],
    queryFn: () => fetchHeaderCounts(),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // auto-refetch every 60s
  });

  const { t } = useTranslation();
  const unreadCount = data?.unreadNotifications ?? 0;

  return (
    <Button variant="ghost" size="icon" asChild className="relative">
      <Link href="/dashboard/notifications" aria-label={t("notification.title")} suppressHydrationWarning>
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center px-1 text-[10px]"
          >
            {unreadCount}
          </Badge>
        )}
      </Link>
    </Button>
  );
}
