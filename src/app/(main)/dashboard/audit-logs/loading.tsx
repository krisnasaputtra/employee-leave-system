import { Skeleton } from "@/components/ui/skeleton";

const ROW_SKELETON_KEYS = [
  "audit-row-1",
  "audit-row-2",
  "audit-row-3",
  "audit-row-4",
  "audit-row-5",
  "audit-row-6",
  "audit-row-7",
  "audit-row-8",
  "audit-row-9",
  "audit-row-10",
];

export default function AuditLogsLoading() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-9 w-64" />
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
