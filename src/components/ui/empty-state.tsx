import { type LucideIcon, Inbox } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  children?: React.ReactNode;
}

export function EmptyState({ icon: Icon = Inbox, title, description, children }: EmptyStateProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-16">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Icon className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium text-foreground">{title}</p>
        {description && (
          <p className="mt-1 text-xs text-muted-foreground text-center max-w-sm">{description}</p>
        )}
        {children && <div className="mt-4">{children}</div>}
      </CardContent>
    </Card>
  );
}
