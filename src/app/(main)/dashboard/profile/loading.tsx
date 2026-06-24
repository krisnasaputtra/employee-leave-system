import { Skeleton } from "@/components/ui/skeleton";

export default function ProfileLoading() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4">
      <div>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-2 h-4 w-72" />
      </div>
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <Skeleton className="h-48 w-full rounded-lg" />
        <Skeleton className="h-32 w-full rounded-lg" />
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  );
}
