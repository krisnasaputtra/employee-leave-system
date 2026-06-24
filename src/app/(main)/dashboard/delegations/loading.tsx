import { Skeleton } from "@/components/ui/skeleton";

export default function DelegationsLoading() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
      </div>
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-8 w-48" />
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </div>
  );
}
