import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function SidebarSupportCard() {
  return (
    <Card size="sm" className="overflow-hidden shadow-none group-data-[collapsible=icon]:hidden">
      <CardHeader className="min-w-0 px-4">
        <CardTitle className="truncate text-sm">LRM</CardTitle>
        <CardDescription className="line-clamp-2">
          Leave Request Management
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
