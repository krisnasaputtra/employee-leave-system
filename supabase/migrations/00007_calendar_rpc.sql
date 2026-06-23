-- =============================================================
-- Migration: Privacy-Safe Calendar RPC
-- Phase 8 — Shared Leave Calendar
-- =============================================================
-- Creates a function that returns approved leave requests
-- in a privacy-safe format for the shared calendar.
-- Sensitive leave types are masked as "Out of Office".
-- Private fields (reason, attachments, rejection data) are never returned.
-- =============================================================

create or replace function public.get_calendar_events(
  p_start_date date,
  p_end_date date,
  p_department_id uuid default null,
  p_employee_id uuid default null,
  p_leave_type_id uuid default null
)
returns table (
  request_id uuid,
  employee_id uuid,
  employee_name text,
  department_id uuid,
  department_name text,
  start_date date,
  end_date date,
  requested_days numeric(6,2),
  public_label text,
  color text,
  leave_type_id uuid,
  leave_type_code text,
  partial_day text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  -- Validate date range (max 93 days ~= 3 months)
  if p_end_date - p_start_date > 93 then
    raise exception 'Calendar date range must not exceed 93 days';
  end if;

  return query
  select
    lr.id as request_id,
    lr.employee_id,
    e.full_name as employee_name,
    e.department_id,
    d.name as department_name,
    lr.start_date,
    lr.end_date,
    lr.requested_days,
    -- Privacy masking: hide actual type name when show_type_on_calendar is false
    case
      when lt.show_type_on_calendar then lt.name
      else 'Out of Office'
    end as public_label,
    case
      when lt.show_type_on_calendar then lt.color
      else '#6B7280'  -- neutral gray for masked types
    end as color,
    case
      when lt.show_type_on_calendar then lt.id
      else null
    end as leave_type_id,
    case
      when lt.show_type_on_calendar then lt.code
      else 'OOO'
    end as leave_type_code,
    lr.partial_day::text
  from public.leave_requests lr
  inner join public.employees e on e.id = lr.employee_id
  inner join public.leave_types lt on lt.id = lr.leave_type_id
  left join public.departments d on d.id = e.department_id
  where lr.status = 'APPROVED'
    and lr.start_date <= p_end_date
    and lr.end_date >= p_start_date
    -- Optional filters
    and (p_department_id is null or e.department_id = p_department_id)
    and (p_employee_id is null or lr.employee_id = p_employee_id)
    and (p_leave_type_id is null or lr.leave_type_id = p_leave_type_id)
  order by lr.start_date, e.full_name;
end;
$$;

-- All authenticated users can view the shared calendar
revoke execute on function public.get_calendar_events(date, date, uuid, uuid, uuid) from public;
grant execute on function public.get_calendar_events(date, date, uuid, uuid, uuid) to authenticated;
