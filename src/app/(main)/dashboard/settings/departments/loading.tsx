import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const ROW_SKELETON_KEYS = [
  "department-row-1",
  "department-row-2",
  "department-row-3",
  "department-row-4",
  "department-row-5",
];

export default function DepartmentsLoading() {
  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-9 w-40" />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {ROW_SKELETON_KEYS.map((key) => (
              <div key={key} className="flex items-center gap-4 px-4 py-3">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-28" />
                <Skeleton className="hidden h-5 w-40 md:block" />
                <Skeleton className="hidden h-5 w-24 lg:block" />
                <Skeleton className="h-5 w-16" />
                <Skeleton className="ml-auto h-8 w-24" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
