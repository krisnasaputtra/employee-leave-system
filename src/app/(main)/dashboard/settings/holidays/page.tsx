import { redirect } from "next/navigation";

import { Pencil, Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { canManageConfiguration } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";

import { HolidayFormDialog } from "./_components/holiday-form-dialog";
import { HolidayToggleButton } from "./_components/holiday-toggle-button";

export default async function HolidaysPage() {
  const { employee: actor } = await getAuthenticatedUser();
  if (!canManageConfiguration(actor.role)) redirect("/dashboard");

  const supabase = await createClient();

  const { data: holidays } = await supabase.from("holidays").select("*").order("holiday_date", { ascending: false });

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">Holidays</h1>
          <p className="text-muted-foreground text-sm">Manage organization holidays</p>
        </div>
        <HolidayFormDialog
          mode="create"
          trigger={
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Holiday
            </Button>
          }
        />
      </div>

      {!holidays || holidays.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border bg-card py-20">
          <p className="text-muted-foreground text-sm">No holidays found.</p>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="hidden md:table-cell">Recurring</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {holidays.map((h) => (
                  <TableRow key={h.id}>
                    <TableCell className="font-medium">{h.name}</TableCell>
                    <TableCell>
                      {new Date(`${h.holiday_date}T00:00:00`).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant={h.is_recurring ? "default" : "outline"}>{h.is_recurring ? "Yes" : "No"}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={h.is_active ? "default" : "secondary"}>
                        {h.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <HolidayFormDialog
                          mode="edit"
                          holiday={h}
                          trigger={
                            <Button variant="ghost" size="sm">
                              <Pencil className="mr-1 h-3 w-3" />
                              Edit
                            </Button>
                          }
                        />
                        <HolidayToggleButton holidayId={h.id} isActive={h.is_active} name={h.name} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

