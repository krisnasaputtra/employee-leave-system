import Link from "next/link";

import { Settings, Wallet } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Separator } from "@/components/ui/separator";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { canManageLeaveBalance } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";

export default async function MyLeaveBalancesPage() {
  const { employee: actor } = await getAuthenticatedUser();
  const supabase = await createClient();
  const currentYear = new Date().getFullYear();

  const { data: balances, error } = await supabase
    .from("leave_balances")
    .select("*, leave_types(code, name, color, allow_negative_balance)")
    .eq("employee_id", actor.id)
    .eq("balance_year", currentYear)
    .order("leave_type_id");

  const isAdmin = canManageLeaveBalance(actor.role);

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="font-semibold text-2xl tracking-tight">My Leave Balances</h1>
          <Badge variant="secondary">{currentYear}</Badge>
        </div>
        {isAdmin && (
          <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/leave/balances/${actor.id}`}>
              <Settings className="mr-2 h-4 w-4" />
              Manage Balances
            </Link>
          </Button>
        )}
      </div>

      {error ? (
        <div className="flex flex-col items-center justify-center gap-2 py-20">
          <p className="text-destructive text-sm">Failed to load balances.</p>
          <p className="text-muted-foreground text-xs">Something went wrong while loading data. Please try again later.</p>
        </div>
      ) : !balances || balances.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title={`No leave balances found for ${currentYear}`}
          description="Contact your administrator to initialize your balances."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {balances.map((balance) => {
            const entitled = balance.entitled_days + balance.adjustment_days;
            const remaining = entitled - balance.used_days;
            const available = remaining - balance.pending_days;
            const usagePercent = entitled > 0 ? (balance.used_days / entitled) * 100 : 0;

            return (
              <Card key={balance.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{
                        backgroundColor: balance.leave_types?.color ?? "#888",
                      }}
                    />
                    <CardTitle className="text-base">{balance.leave_types?.name ?? "Unknown"}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Entitled</span>
                      <span>{balance.entitled_days}</span>
                    </div>
                    {balance.adjustment_days !== 0 && (
                      <div className="flex justify-between">
                        <span>Adjustments</span>
                        <span>
                          {balance.adjustment_days > 0 ? "+" : ""}
                          {balance.adjustment_days}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Used</span>
                      <span>{balance.used_days}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pending</span>
                      <span>{balance.pending_days}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-medium">
                      <span>Remaining</span>
                      <span>{remaining}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Available to request</span>
                      <span>{available}</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-primary"
                        style={{
                          width: `${Math.min(usagePercent, 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
