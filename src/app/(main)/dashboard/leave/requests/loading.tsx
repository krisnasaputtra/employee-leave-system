import { Skeleton } from "@/components/ui/skeleton";

const ROW_SKELETON_KEYS = [
  "leave-request-row-1",
  "leave-request-row-2",
  "leave-request-row-3",
  "leave-request-row-4",
  "leave-request-row-5",
  "leave-request-row-6",
];

export default function LeaveRequestsLoading() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-9 w-36" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        {ROW_SKELETON_KEYS.map((key) => (
          <Skeleton key={key} className="h-12 w-full" />
        ))}
      </div>
      <div className="flex justify-end">
        <Skeleton className="h-9 w-48" />
      </div>
    </div>
  );
}
