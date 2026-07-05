import { Skeleton } from "@/components/ui/skeleton";

const ROW_SKELETON_KEYS = [
  "all-leave-row-1",
  "all-leave-row-2",
  "all-leave-row-3",
  "all-leave-row-4",
  "all-leave-row-5",
  "all-leave-row-6",
  "all-leave-row-7",
  "all-leave-row-8",
];

export default function AllRequestsLoading() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-9 w-32" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-9 w-32" />
      </div>
      <div className="space-y-2">
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
