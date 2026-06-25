"use client";

import { useCallback, useState } from "react";

import { useRouter } from "next/navigation";

import { Bell, CheckCheck, Inbox } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { useMarkAllNotificationsRead, useMarkNotificationRead } from "@/hooks/use-notifications";

interface Notification {
  id: string;
  title: string;
  message: string;
  notification_type: string;
  is_read: boolean;
  created_at: string;
}

interface NotificationListProps {
  notifications: Notification[];
}

function formatRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function NotificationList({ notifications: initialNotifications }: NotificationListProps) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const router = useRouter();

  const markReadMutation = useMarkNotificationRead();
  const markAllReadMutation = useMarkAllNotificationsRead();

  const markAsRead = useCallback(
    (notificationId: string) => {
      // Optimistic update
      setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n)));

      markReadMutation.mutate(notificationId, {
        onSuccess: () => {
          router.refresh();
        },
        onError: () => {
          // Rollback optimistic update
          setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, is_read: false } : n)));
        },
      });
    },
    [markReadMutation, router],
  );

  const markAllRead = useCallback(() => {
    // Optimistic update – save previous state for rollback
    const previousNotifications = notifications;
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));

    markAllReadMutation.mutate(undefined, {
      onSuccess: () => {
        router.refresh();
      },
      onError: () => {
        // Rollback optimistic update
        setNotifications(previousNotifications);
      },
    });
  }, [markAllReadMutation, notifications, router]);

  const isPending = markReadMutation.isPending || markAllReadMutation.isPending;
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  if (notifications.length === 0) {
    return (
      <Card>
        <CardContent className="py-20">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Inbox />
              </EmptyMedia>
              <EmptyTitle>No notifications</EmptyTitle>
              <EmptyDescription>You&apos;re all caught up! Check back later.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {unreadCount > 0 && (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={markAllRead} disabled={isPending}>
            <CheckCheck className="mr-2 h-4 w-4" />
            Mark all as read
          </Button>
        </div>
      )}
      <div className="flex flex-col gap-2">
        {notifications.map((notification) => (
          <Card
            key={notification.id}
            className={`cursor-pointer transition-colors hover:bg-muted/50 ${
              !notification.is_read ? "border-primary/30 bg-primary/5" : ""
            }`}
            onClick={() => {
              if (!notification.is_read) {
                markAsRead(notification.id);
              }
            }}
          >
            <CardContent className="flex items-start gap-3 py-3">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                <Bell className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm">{notification.title}</p>
                  {!notification.is_read && (
                    <Badge variant="default" className="text-[10px]">
                      New
                    </Badge>
                  )}
                </div>
                <p className="mt-0.5 text-muted-foreground text-sm">{notification.message}</p>
                <p className="mt-1 text-muted-foreground text-xs">{formatRelativeTime(notification.created_at)}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
