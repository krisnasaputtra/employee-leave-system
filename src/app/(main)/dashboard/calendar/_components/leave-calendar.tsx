"use client";

import * as React from "react";

import type { EventClickInfo, EventDisplayInfo, EventInput } from "@fullcalendar/react";
import { useCalendarController } from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/react/daygrid";
import interactionPlugin from "@fullcalendar/react/interaction";
import listPlugin from "@fullcalendar/react/list";
import multiMonthPlugin from "@fullcalendar/react/multimonth";
import timeGridPlugin from "@fullcalendar/react/timegrid";
import { addDays, differenceInCalendarDays, format } from "date-fns";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Users, XIcon } from "lucide-react";

import { EventCalendarViews } from "@/components/calendar/event-calendar-views";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";

interface CalendarEvent {
  request_id: string;
  employee_id: string;
  employee_name: string;
  department_id: string | null;
  department_name: string | null;
  start_date: string;
  end_date: string;
  requested_days: number;
  public_label: string;
  color: string;
  leave_type_id: string | null;
  leave_type_code: string | null;
  partial_day: string;
}

interface Holiday {
  id: string;
  name: string;
  holiday_date: string;
  is_recurring: boolean;
}

interface LeaveCalendarProps {
  departments: { id: string; name: string }[];
  leaveTypes: { id: string; name: string; color: string; code: string }[];
  holidays: Holiday[];
}

const views = [
  { key: "dayGridMonth", label: "Month" },
  { key: "timeGridWeek", label: "Week" },
  { key: "listWeek", label: "List" },
];

const plugins = [dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin, multiMonthPlugin];

export function LeaveCalendar({ departments, leaveTypes, holidays }: LeaveCalendarProps) {
  const controller = useCalendarController();
  const [events, setEvents] = React.useState<EventInput[]>([]);
  const [eventCount, setEventCount] = React.useState(0);
  const [selectedDepartment, setSelectedDepartment] = React.useState("all");
  const [selectedLeaveType, setSelectedLeaveType] = React.useState("all");
  const [loading, setLoading] = React.useState(false);
  const [selectedEvent, setSelectedEvent] = React.useState<CalendarEvent | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [dateInfo, setDateInfo] = React.useState(() => {
    const now = new Date();
    return {
      title: format(now, "MMMM yyyy"),
      days: 30,
    };
  });

  // Track current visible range for refetching on filter change
  const currentRangeRef = React.useRef<{ start: Date; end: Date } | null>(null);

  const fetchEvents = React.useCallback(
    async (start: Date, end: Date) => {
      setLoading(true);
      try {
        const supabase = createClient();
        const startStr = format(start, "yyyy-MM-dd");
        const endStr = format(end, "yyyy-MM-dd");

        const { data, error } = await supabase.rpc("get_calendar_events", {
          p_start_date: startStr,
          p_end_date: endStr,
          p_department_id: selectedDepartment === "all" ? undefined : selectedDepartment,
          p_employee_id: undefined,
          p_leave_type_id: selectedLeaveType === "all" ? undefined : selectedLeaveType,
        });

        if (error) {
          console.error("Failed to fetch calendar events:", error.message);
          setEvents([]);
          setEventCount(0);
          return;
        }

        const calendarEvents: EventInput[] = ((data as CalendarEvent[] | null) ?? []).map((evt) => ({
          id: evt.request_id,
          title: `${evt.employee_name} — ${evt.public_label}`,
          start: `${evt.start_date}T00:00:00`,
          // FullCalendar exclusive end: add 1 day for all-day events
          end: addDays(new Date(`${evt.end_date}T00:00:00`), 1)
            .toISOString()
            .split("T")[0],
          allDay: true,
          backgroundColor: evt.color,
          borderColor: evt.color,
          extendedProps: evt,
        }));

        setEvents(calendarEvents);
        setEventCount(calendarEvents.length);
      } catch (err) {
        console.error("Calendar fetch error:", err);
        setEvents([]);
        setEventCount(0);
      } finally {
        setLoading(false);
      }
    },
    [selectedDepartment, selectedLeaveType],
  );

  // Refetch when filters change
  React.useEffect(() => {
    if (currentRangeRef.current) {
      void fetchEvents(currentRangeRef.current.start, currentRangeRef.current.end);
    }
  }, [fetchEvents]);

  const handleEventClick = React.useCallback((info: EventClickInfo) => {
    // Skip click for holiday events
    if (info.event.extendedProps?.isHoliday) return;
    const props = info.event.extendedProps as CalendarEvent;
    setSelectedEvent(props);
    setDialogOpen(true);
  }, []);

  // Custom compact event renderer — shows color dot + employee name + leave type
  const renderEventContent = React.useCallback((arg: EventDisplayInfo) => {
    const props = arg.event.extendedProps as CalendarEvent & { isHoliday?: boolean };
    if (props.isHoliday) return undefined; // Use default for holidays

    return (
      <div className="flex w-full items-center gap-1 overflow-hidden px-1 py-0.5 text-xs">
        <span
          className="inline-block size-2 shrink-0 rounded-full"
          style={{ backgroundColor: props.color }}
        />
        <span className="truncate font-medium">{props.employee_name}</span>
        <span className="hidden truncate text-[0.65rem] opacity-75 sm:inline">
          {props.public_label}
        </span>
      </div>
    );
  }, []);

  const formatDate = (dateStr: string) => {
    return new Date(`${dateStr}T00:00:00`).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Convert holidays to FullCalendar events
  const holidayEvents = React.useMemo<EventInput[]>(() => {
    return holidays.map((holiday) => ({
      id: `holiday-${holiday.id}`,
      title: holiday.name,
      start: holiday.holiday_date,
      allDay: true,
      display: "background" as const,
      backgroundColor: "#dc2626",
      borderColor: "#dc2626",
      classNames: ["holiday-event"],
      extendedProps: { isHoliday: true, holidayName: holiday.name },
    }));
  }, [holidays]);

  // Merge leave events with holiday events
  const allEvents = React.useMemo<EventInput[]>(() => {
    return [...events, ...holidayEvents];
  }, [events, holidayEvents]);

  return (
    <>
      <div className="flex flex-col overflow-hidden rounded-md border">
        <div className="flex flex-col gap-4 border-b bg-sidebar p-4 text-sidebar-foreground lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 shrink-0 flex-col gap-1">
            <div className="font-medium text-lg leading-none">{dateInfo.title}</div>
            <p className="text-muted-foreground text-sm">
              {dateInfo.days} days — {eventCount} leave event
              {eventCount !== 1 ? "s" : ""}
              {loading ? " (loading…)" : ""}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Department filter */}
            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger className="w-full sm:w-44">
                <Users className="mr-1 size-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectGroup>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>

            {/* Leave type filter */}
            {leaveTypes.length > 0 && (
              <Select value={selectedLeaveType} onValueChange={setSelectedLeaveType}>
                <SelectTrigger className="w-full sm:w-40">
                  <CalendarIcon className="mr-1 size-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper">
                  <SelectGroup>
                    <SelectItem value="all">All Types</SelectItem>
                    {leaveTypes.map((lt) => (
                      <SelectItem key={lt.id} value={lt.id}>
                        <span
                          className="mr-1.5 inline-block size-2 rounded-full"
                          style={{ backgroundColor: lt.color }}
                        />
                        {lt.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            )}

            {/* Navigation */}
            <ButtonGroup>
              <Button size="icon" variant="outline" onClick={() => controller.prev()}>
                <ChevronLeft />
              </Button>
              <Button variant="outline" onClick={() => controller.today()}>
                Today
              </Button>
              <Button size="icon" variant="outline" onClick={() => controller.next()}>
                <ChevronRight />
              </Button>
            </ButtonGroup>

            {/* View selector */}
            <Select
              value={controller.view?.type ?? views[0].key}
              onValueChange={(value) => controller.changeView(value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end">
                <SelectGroup>
                  {views.map((v) => (
                    <SelectItem key={v.key} value={v.key}>
                      {v.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 border-b px-4 py-2 text-xs text-muted-foreground">
          {leaveTypes.map((lt) => (
            <div key={lt.id} className="flex items-center gap-1.5">
              <span
                className="inline-block size-2.5 rounded-full"
                style={{ backgroundColor: lt.color }}
              />
              {lt.name}
            </div>
          ))}
          <div className="flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-full bg-red-600" />
            Holiday
          </div>
        </div>

        <EventCalendarViews
          controller={controller}
          initialView={views[0].key}
          plugins={[...plugins]}
          popoverCloseContent={() => <XIcon className="size-5 text-muted-foreground group-hover:text-foreground" />}
          events={allEvents}
          eventClick={handleEventClick}
          eventContent={renderEventContent}
          dayMaxEvents={3}
          moreLinkClick="popover"
          nowIndicator
          datesSet={(info) => {
            currentRangeRef.current = { start: info.start, end: info.end };
            setDateInfo({
              title: info.view.title,
              days: differenceInCalendarDays(info.view.currentEnd, info.view.currentStart),
            });
            void fetchEvents(info.start, info.end);
          }}
        />
      </div>

      {/* Event detail dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedEvent?.public_label ?? "Leave"}</DialogTitle>
            <DialogDescription>{selectedEvent?.employee_name ?? "Employee"}</DialogDescription>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="inline-block size-3 rounded-full" style={{ backgroundColor: selectedEvent.color }} />
                <span className="font-medium">{selectedEvent.public_label}</span>
                {selectedEvent.partial_day !== "NONE" && (
                  <Badge variant="secondary">
                    {selectedEvent.partial_day === "FIRST_HALF" ? "Morning" : "Afternoon"}
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-muted-foreground">From</div>
                  <div className="font-medium">{formatDate(selectedEvent.start_date)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">To</div>
                  <div className="font-medium">{formatDate(selectedEvent.end_date)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Duration</div>
                  <div className="font-medium">
                    {selectedEvent.requested_days} day
                    {selectedEvent.requested_days !== 1 ? "s" : ""}
                  </div>
                </div>
                {selectedEvent.department_name && (
                  <div>
                    <div className="text-muted-foreground">Department</div>
                    <div className="font-medium">{selectedEvent.department_name}</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
