import { redirect } from "next/navigation";

import { ShieldAlert } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { createClient } from "@/lib/supabase/server";

function truncateJson(value: unknown, maxLen = 80): string {
  const str = JSON.stringify(value);
  if (str.length <= maxLen) return str;
  return `${str.slice(0, maxLen)}…`;
}

export default async function AuditLogsPage() {
  const { employee } = await getAuthenticatedUser();

  if (employee.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const supabase = await createClient();

  const { data: logs, error } = await supabase
    .from("audit_logs")
    .select(
      "id, action, entity_type, metadata, created_at, actor_employee_id, employees!audit_logs_actor_employee_id_fk(full_name)",
    )
    .order("created_at", { ascending: false })
    .limit(50);

  const items = logs ?? [];

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <div className="flex items-center gap-3">
        <ShieldAlert className="h-5 w-5 text-muted-foreground" />
        <h1 className="font-semibold text-2xl tracking-tight">Audit Logs</h1>
        <Badge variant="secondary">{items.length}</Badge>
      </div>

      {error ? (
        <div className="flex flex-col items-center justify-center gap-2 py-20">
          <p className="text-destructive text-sm">Failed to load audit logs.</p>
          <p className="text-muted-foreground text-xs">{error.message}</p>
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-20">
            <p className="text-muted-foreground text-sm">No audit log entries found.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity Type</TableHead>
                  <TableHead>Metadata</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((log) => {
                  const actor = log.employees as { full_name: string } | null;

                  return (
                    <TableRow key={log.id}>
                      <TableCell className="text-muted-foreground">
                        {new Date(log.created_at).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </TableCell>
                      <TableCell className="font-medium">{actor?.full_name ?? "System"}</TableCell>
                      <TableCell>{log.action}</TableCell>
                      <TableCell>{log.entity_type}</TableCell>
                      <TableCell className="max-w-[200px] truncate font-mono text-muted-foreground text-xs">
                        {truncateJson(log.metadata)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
