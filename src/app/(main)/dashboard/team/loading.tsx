import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function TeamLoading() {
  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      {/* Header skeleton */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1.5">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-44" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-24 rounded-full" />
          <Skeleton className="h-5 w-24 rounded-full" />
        </div>
      </div>

      {/* Summary cards skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-20" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-3 w-40" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-56" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Table header */}
            <div className="flex gap-4 border-b pb-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-20" />
            </div>
            {/* Table rows */}
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 py-2">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-4 w-8" />
                <Skeleton className="h-4 w-8" />
                <Skeleton className="h-4 w-8" />
                <Skeleton className="h-4 w-8" />
                <Skeleton className="h-8 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
