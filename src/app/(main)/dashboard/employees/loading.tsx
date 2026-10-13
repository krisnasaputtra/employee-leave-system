import { Skeleton } from "@/components/ui/skeleton";

const ROW_SKELETON_KEYS = [
  "employee-row-1",
  "employee-row-2",
  "employee-row-3",
  "employee-row-4",
  "employee-row-5",
  "employee-row-6",
  "employee-row-7",
  "employee-row-8",
];

export default function EmployeesLoading() {
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
