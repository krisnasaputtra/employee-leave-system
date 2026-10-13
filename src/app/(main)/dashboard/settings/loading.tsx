import { Skeleton } from "@/components/ui/skeleton";

const ROW_SKELETON_KEYS = [
  "settings-row-1",
  "settings-row-2",
  "settings-row-3",
  "settings-row-4",
  "settings-row-5",
  "settings-row-6",
  "settings-row-7",
  "settings-row-8",
];

export default function SettingsLoading() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <Skeleton className="h-8 w-48" />
      <div className="space-y-2">
        {ROW_SKELETON_KEYS.map((key) => (
          <Skeleton key={key} className="h-12 w-full" />
        ))}
      </div>
    </div>
  );
}
