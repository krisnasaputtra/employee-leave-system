import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const ROW_SKELETON_KEYS = ["policy-row-1", "policy-row-2", "policy-row-3", "policy-row-4", "policy-row-5"];

export default function PoliciesLoading() {
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
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-20" />
                <Skeleton className="ml-auto h-8 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
