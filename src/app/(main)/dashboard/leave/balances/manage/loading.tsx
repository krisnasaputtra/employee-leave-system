import { Skeleton } from "@/components/ui/skeleton";

const ROW_SKELETON_KEYS = [
  "manage-balance-row-1",
  "manage-balance-row-2",
  "manage-balance-row-3",
  "manage-balance-row-4",
  "manage-balance-row-5",
  "manage-balance-row-6",
  "manage-balance-row-7",
  "manage-balance-row-8",
  "manage-balance-row-9",
  "manage-balance-row-10",
];

export default function ManageBalancesLoading() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      {/* Filter bar */}
      <div className="flex gap-2">
        <Skeleton className="h-9 flex-1" />
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-9 w-20" />
      </div>
      {/* Table rows */}
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        {ROW_SKELETON_KEYS.map((key) => (
          <Skeleton key={key} className="h-12 w-full" />
        ))}
      </div>
      {/* Pagination */}
      <div className="flex justify-end">
        <Skeleton className="h-9 w-48" />
      </div>
    </div>
  );
}
