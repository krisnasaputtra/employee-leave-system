import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const ROW_SKELETON_KEYS = ["holiday-row-1", "holiday-row-2", "holiday-row-3", "holiday-row-4", "holiday-row-5"];

export default function HolidaysLoading() {
  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-9 w-36" />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {ROW_SKELETON_KEYS.map((key) => (
              <div key={key} className="flex items-center gap-4 px-4 py-3">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-5 w-28" />
                <Skeleton className="hidden h-5 w-16 md:block" />
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
