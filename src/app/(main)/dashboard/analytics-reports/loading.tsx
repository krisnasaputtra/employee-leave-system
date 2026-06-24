import { Skeleton } from "@/components/ui/skeleton";

export default function AnalyticsReportsLoading() {
  return (
    <div className="flex flex-1 flex-col gap-4 md:gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-72" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-28" />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full" />
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-[380px] w-full" />
        <Skeleton className="h-[380px] w-full" />
      </div>

      {/* Department Chart */}
      <Skeleton className="h-[320px] w-full" />

      {/* Tables */}
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-[400px] w-full" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    </div>
  );
}
