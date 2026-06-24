import { redirect } from "next/navigation";

import { ArrowLeftRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils/format-date";

import { DelegationForm } from "./_components/delegation-form";
import { RevokeButton } from "./_components/revoke-button";

export default async function DelegationsPage() {
  const { employee: actor } = await getAuthenticatedUser();

  if (actor.role === "EMPLOYEE") {
    redirect("/dashboard");
  }

  const supabase = await createClient();

  // Active delegations FROM me
  const { data: myDelegations } = await supabase
    .from("approval_delegations")
    .select("*, delegate:employees!approval_delegations_delegate_id_fkey(id, full_name, employee_code)")
    .eq("delegator_id", actor.id)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  // Active delegations TO me
  const { data: delegationsToMe } = await supabase
    .from("approval_delegations")
    .select("*, delegator:employees!approval_delegations_delegator_id_fkey(id, full_name, employee_code)")
    .eq("delegate_id", actor.id)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  // Get employees for delegation form (exclude self, only active employees)
  const { data: employees } = await supabase
    .from("employees")
    .select("id, full_name, employee_code")
    .neq("id", actor.id)
    .eq("status", "ACTIVE")
    .order("full_name");

  const safeDelegations = myDelegations ?? [];
  const safeDelegationsToMe = delegationsToMe ?? [];
  const safeEmployees = employees ?? [];

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <div className="flex items-center gap-3">
        <h1 className="font-semibold text-2xl tracking-tight">Approval Delegations</h1>
      </div>

      {/* Create Delegation */}
      <Card>
        <CardHeader>
          <CardTitle>Create Delegation</CardTitle>
          <CardDescription>
            Delegate your approval authority to another employee for a specific period.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DelegationForm employees={safeEmployees} />
        </CardContent>
      </Card>

      {/* My Delegations (FROM me) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            My Active Delegations
            <Badge variant="secondary">{safeDelegations.length}</Badge>
          </CardTitle>
          <CardDescription>
            People who can approve leave requests on your behalf.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {safeDelegations.length === 0 ? (
            <EmptyState
              icon={ArrowLeftRight}
              title="No Active Delegations"
              description="You haven't delegated your approval authority to anyone."
            />
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Delegate</TableHead>
                    <TableHead>Date Range</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {safeDelegations.map((d) => {
                    const delegate = d.delegate as { id: string; full_name: string; employee_code: string } | null;
                    return (
                      <TableRow key={d.id}>
                        <TableCell>
                          <div className="font-medium">{delegate?.full_name ?? "Unknown"}</div>
                          <div className="text-muted-foreground text-sm">
                            {delegate?.employee_code ?? ""}
                          </div>
                        </TableCell>
                        <TableCell>
                          {formatDate(d.start_date)} — {formatDate(d.end_date)}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {d.reason || "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <RevokeButton
                            delegationId={d.id}
                            delegateName={delegate?.full_name ?? "this delegate"}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delegations TO me */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Delegated to Me
            <Badge variant="secondary">{safeDelegationsToMe.length}</Badge>
          </CardTitle>
          <CardDescription>
            Managers who have delegated their approval authority to you.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {safeDelegationsToMe.length === 0 ? (
            <EmptyState
              icon={ArrowLeftRight}
              title="No Delegations to You"
              description="No one has delegated their approval authority to you."
            />
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Delegator</TableHead>
                    <TableHead>Date Range</TableHead>
                    <TableHead>Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {safeDelegationsToMe.map((d) => {
                    const delegator = d.delegator as { id: string; full_name: string; employee_code: string } | null;
                    return (
                      <TableRow key={d.id}>
                        <TableCell>
                          <div className="font-medium">{delegator?.full_name ?? "Unknown"}</div>
                          <div className="text-muted-foreground text-sm">
                            {delegator?.employee_code ?? ""}
                          </div>
                        </TableCell>
                        <TableCell>
                          {formatDate(d.start_date)} — {formatDate(d.end_date)}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {d.reason || "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
