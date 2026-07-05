import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const ROW_SKELETON_KEYS = ["capacity-row-1", "capacity-row-2", "capacity-row-3", "capacity-row-4", "capacity-row-5"];

export default function CapacityLoading() {
  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {ROW_SKELETON_KEYS.map((key) => (
              <div key={key} className="flex items-center gap-4 px-4 py-3">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-24" />
                <Skeleton className="ml-auto h-8 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
