import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { canManageLeaveBalance } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

import { BalanceAdjustmentDialog } from "./_components/balance-adjustment-dialog";
import { InitializeBalancesButton } from "./_components/initialize-balances-button";

type BalanceTransactionType = Database["public"]["Enums"]["balance_transaction_type"];

const transactionBadgeVariant = (type: BalanceTransactionType) => {
  switch (type) {
    case "ENTITLEMENT":
      return "default" as const;
    case "ADJUSTMENT":
      return "secondary" as const;
    case "RESERVE":
      return "outline" as const;
    case "USE":
      return "destructive" as const;
    case "RELEASE":
      return "secondary" as const;
    case "REVERSE":
      return "destructive" as const;
    default:
      return "outline" as const;
  }
};

export default async function EmployeeBalancesPage({ params }: { params: Promise<{ employeeId: string }> }) {
  const { employee: actor } = await getAuthenticatedUser();

  if (!canManageLeaveBalance(actor.role)) {
    redirect("/dashboard/leave/balances");
  }

  const { employeeId } = await params;
  const supabase = await createClient();
  const currentYear = new Date().getFullYear();

  // Get target employee
  const { data: employee, error: employeeError } = await supabase
    .from("employees")
    .select("id, full_name, employee_code, department_id")
    .eq("id", employeeId)
    .single();

  if (employeeError || !employee) {
    redirect("/dashboard/employees");
  }

  // Get balances
  const { data: balances } = await supabase
    .from("leave_balances")
    .select("*, leave_types(code, name, color, allow_negative_balance)")
    .eq("employee_id", employeeId)
    .eq("balance_year", currentYear)
    .order("leave_type_id");

  // Get transactions
  const { data: transactions } = await supabase
    .from("leave_balance_transactions")
    .select("*, leave_balances!inner(employee_id, leave_type_id, balance_year, leave_types(name))")
    .eq("leave_balances.employee_id", employeeId)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="@container/main flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">{employee.full_name} — Leave Balances</h1>
          <p className="text-muted-foreground text-sm">
            {employee.employee_code} · {currentYear}
          </p>
        </div>
        <InitializeBalancesButton employeeId={employee.id} employeeName={employee.full_name} />
      </div>

      {/* Balance Cards */}
      {!balances || balances.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border bg-card py-20">
          <p className="text-muted-foreground text-sm">No leave balances found for {currentYear}.</p>
          <p className="text-muted-foreground mt-1 text-xs">Click &quot;Initialize Balances&quot; to create them.</p>
        </div>
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
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{
                          backgroundColor: balance.leave_types?.color ?? "#888",
                        }}
                      />
                      <CardTitle className="text-base">{balance.leave_types?.name ?? "Unknown"}</CardTitle>
                    </div>
                    <BalanceAdjustmentDialog
                      balanceId={balance.id}
                      leaveTypeName={balance.leave_types?.name ?? "Unknown"}
                      currentAdjustment={balance.adjustment_days}
                      trigger={
                        <Button variant="outline" size="sm">
                          Adjust
                        </Button>
                      }
                    />
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

      {/* Transaction History */}
      <div>
        <h2 className="mb-4 font-semibold text-lg">Transaction History</h2>
        {!transactions || transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border bg-card py-12">
            <p className="text-muted-foreground text-sm">No transactions found.</p>
          </div>
        ) : (
          <div className="rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Leave Type</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Days</TableHead>
                  <TableHead>Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="text-nowrap text-sm">
                      {new Date(tx.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </TableCell>
                    <TableCell className="text-sm">
                      {(
                        tx.leave_balances as {
                          leave_types: {
                            name: string;
                          } | null;
                        }
                      )?.leave_types?.name ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={transactionBadgeVariant(tx.transaction_type as BalanceTransactionType)}>
                        {tx.transaction_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {tx.days > 0 ? `+${tx.days}` : tx.days}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-muted-foreground text-sm">
                      {tx.reason ?? "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
