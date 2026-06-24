import { Skeleton } from "@/components/ui/skeleton";

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
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
      {/* Pagination */}
      <div className="flex justify-end">
        <Skeleton className="h-9 w-48" />
      </div>
    </div>
  );
}
