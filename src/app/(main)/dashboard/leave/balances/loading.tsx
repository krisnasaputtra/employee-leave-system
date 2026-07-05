import { Skeleton } from "@/components/ui/skeleton";

const BALANCE_CARD_SKELETON_KEYS = [
  "balance-card-1",
  "balance-card-2",
  "balance-card-3",
  "balance-card-4",
  "balance-card-5",
  "balance-card-6",
];

export default function BalancesLoading() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-9 w-32" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {BALANCE_CARD_SKELETON_KEYS.map((key) => (
          <Skeleton key={key} className="h-32 w-full" />
        ))}
      </div>
    </div>
  );
}
