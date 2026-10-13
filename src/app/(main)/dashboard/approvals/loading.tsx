import { Skeleton } from "@/components/ui/skeleton";

const ROW_SKELETON_KEYS = [
  "approval-row-1",
  "approval-row-2",
  "approval-row-3",
  "approval-row-4",
  "approval-row-5",
  "approval-row-6",
  "approval-row-7",
  "approval-row-8",
];

export default function ApprovalsLoading() {
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
