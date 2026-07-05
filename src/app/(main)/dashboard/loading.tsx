import { Skeleton } from "@/components/ui/skeleton";

const SUMMARY_SKELETON_KEYS = ["summary-remaining", "summary-pending", "summary-approved", "summary-team"];

export default function DashboardLoading() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {SUMMARY_SKELETON_KEYS.map((key) => (
          <Skeleton key={key} className="h-28 w-full" />
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-80 w-full" />
        <Skeleton className="h-80 w-full" />
      </div>
    </div>
  );
}
