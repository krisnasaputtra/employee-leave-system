import { Skeleton } from "@/components/ui/skeleton";

const NOTIFICATION_SKELETON_KEYS = [
  "notification-row-1",
  "notification-row-2",
  "notification-row-3",
  "notification-row-4",
  "notification-row-5",
  "notification-row-6",
];

export default function NotificationsLoading() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <Skeleton className="h-8 w-48" />
      <div className="space-y-3">
        {NOTIFICATION_SKELETON_KEYS.map((key) => (
          <Skeleton key={key} className="h-16 w-full" />
        ))}
      </div>
    </div>
  );
}
