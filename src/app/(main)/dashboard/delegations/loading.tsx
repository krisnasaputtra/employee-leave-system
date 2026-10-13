import { Skeleton } from "@/components/ui/skeleton";

const ROW_SKELETON_KEYS = ["delegation-row-1", "delegation-row-2", "delegation-row-3", "delegation-row-4"];

export default function DelegationsLoading() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
      </div>
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-8 w-48" />
      <div className="space-y-2">
        {ROW_SKELETON_KEYS.map((key) => (
          <Skeleton key={key} className="h-12 w-full" />
        ))}
      </div>
    </div>
  );
}
