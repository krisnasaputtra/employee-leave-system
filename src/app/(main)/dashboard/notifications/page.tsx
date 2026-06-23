import { Bell } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { createClient } from "@/lib/supabase/server";

import { NotificationList } from "./_components/notification-list";

export default async function NotificationsPage() {
  const { employee } = await getAuthenticatedUser();
  const supabase = await createClient();

  const { data: notifications } = await supabase
    .from("notifications")
    .select("id, title, message, notification_type, is_read, created_at")
    .eq("employee_id", employee.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const items = notifications ?? [];
  const unreadCount = items.filter((n) => !n.is_read).length;

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <div className="flex items-center gap-3">
        <Bell className="h-5 w-5 text-muted-foreground" />
        <h1 className="font-semibold text-2xl tracking-tight">Notifications</h1>
        {unreadCount > 0 && <Badge variant="default">{unreadCount} unread</Badge>}
      </div>
      <NotificationList notifications={items} />
    </div>
  );
}
