-- =============================================================
-- Migration: Dashboard RPCs + Notification helpers
-- Phase 9 — Dashboards, Notifications, and Audit
-- =============================================================

-- -------------------------------------------------------
-- 1. Employee Dashboard Summary
-- -------------------------------------------------------
create or replace function public.get_employee_dashboard()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_employee_id uuid;
  v_current_year integer := extract(year from current_date)::integer;
  v_remaining_leave numeric(6,2) := 0;
  v_pending_days numeric(6,2) := 0;
  v_used_days numeric(6,2) := 0;
  v_next_leave jsonb := null;
  v_recent_requests jsonb := '[]'::jsonb;
  v_unread_notifications integer := 0;
begin
  -- Resolve actor
  select id into v_employee_id
  from public.employees
  where auth_user_id = auth.uid() and status = 'ACTIVE'
  limit 1;

  if v_employee_id is null then
    raise exception 'Not authenticated or not an active employee';
  end if;

  -- Aggregated balance
  select
    coalesce(sum(entitled_days + adjustment_days - used_days - pending_days), 0),
    coalesce(sum(pending_days), 0),
    coalesce(sum(used_days), 0)
  into v_remaining_leave, v_pending_days, v_used_days
  from public.leave_balances
  where employee_id = v_employee_id and balance_year = v_current_year;

  -- Next approved leave
  select jsonb_build_object(
    'start_date', lr.start_date,
    'end_date', lr.end_date,
    'leave_type', lt.name,
    'days', lr.requested_days
  ) into v_next_leave
  from public.leave_requests lr
  join public.leave_types lt on lt.id = lr.leave_type_id
  where lr.employee_id = v_employee_id
    and lr.status = 'APPROVED'
    and lr.start_date >= current_date
  order by lr.start_date
  limit 1;

  -- Recent requests (last 5)
  select coalesce(jsonb_agg(row_to_json(t)::jsonb), '[]'::jsonb)
  into v_recent_requests
  from (
    select lr.id, lr.request_number, lr.status, lr.start_date, lr.end_date,
           lr.requested_days, lt.name as leave_type, lt.color
    from public.leave_requests lr
    join public.leave_types lt on lt.id = lr.leave_type_id
    where lr.employee_id = v_employee_id
    order by lr.created_at desc
    limit 5
  ) t;

  -- Unread notifications
  select count(*) into v_unread_notifications
  from public.notifications
  where employee_id = v_employee_id and is_read = false;

  return jsonb_build_object(
    'remaining_leave', v_remaining_leave,
    'pending_days', v_pending_days,
    'used_days', v_used_days,
    'next_leave', v_next_leave,
    'recent_requests', v_recent_requests,
    'unread_notifications', v_unread_notifications,
    'year', v_current_year
  );
end;
$$;

revoke execute on function public.get_employee_dashboard() from public;
grant execute on function public.get_employee_dashboard() to authenticated;


-- -------------------------------------------------------
-- 2. Manager Dashboard Summary
-- -------------------------------------------------------
create or replace function public.get_manager_dashboard()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_employee_id uuid;
  v_role text;
  v_pending_count integer := 0;
  v_on_leave_today integer := 0;
  v_upcoming_leave jsonb := '[]'::jsonb;
  v_recent_requests jsonb := '[]'::jsonb;
begin
  select id, role::text into v_employee_id, v_role
  from public.employees
  where auth_user_id = auth.uid() and status = 'ACTIVE'
  limit 1;

  if v_employee_id is null then
    raise exception 'Not authenticated or not an active employee';
  end if;

  if v_role not in ('ADMIN', 'MANAGER') then
    raise exception 'Only managers and admins can access this dashboard';
  end if;

  -- Pending approvals (direct reports for manager)
  select count(*) into v_pending_count
  from public.leave_requests lr
  join public.employees e on e.id = lr.employee_id
  where lr.status = 'PENDING'
    and lr.employee_id != v_employee_id
    and (v_role = 'ADMIN' or e.manager_id = v_employee_id);

  -- Employees on leave today
  select count(distinct lr.employee_id) into v_on_leave_today
  from public.leave_requests lr
  join public.employees e on e.id = lr.employee_id
  where lr.status = 'APPROVED'
    and current_date between lr.start_date and lr.end_date
    and (v_role = 'ADMIN' or e.manager_id = v_employee_id);

  -- Upcoming team leave (next 14 days)
  select coalesce(jsonb_agg(row_to_json(t)::jsonb), '[]'::jsonb)
  into v_upcoming_leave
  from (
    select e.full_name as employee_name, lt.name as leave_type, lt.color,
           lr.start_date, lr.end_date, lr.requested_days
    from public.leave_requests lr
    join public.employees e on e.id = lr.employee_id
    join public.leave_types lt on lt.id = lr.leave_type_id
    where lr.status = 'APPROVED'
      and lr.start_date <= current_date + 14
      and lr.end_date >= current_date
      and (v_role = 'ADMIN' or e.manager_id = v_employee_id)
    order by lr.start_date
    limit 10
  ) t;

  -- Recent team requests (last 10)
  select coalesce(jsonb_agg(row_to_json(t)::jsonb), '[]'::jsonb)
  into v_recent_requests
  from (
    select lr.id, lr.request_number, lr.status, lr.start_date, lr.end_date,
           lr.requested_days, lt.name as leave_type, lt.color,
           e.full_name as employee_name
    from public.leave_requests lr
    join public.employees e on e.id = lr.employee_id
    join public.leave_types lt on lt.id = lr.leave_type_id
    where (v_role = 'ADMIN' or e.manager_id = v_employee_id)
      and lr.employee_id != v_employee_id
    order by lr.created_at desc
    limit 10
  ) t;

  return jsonb_build_object(
    'pending_approvals', v_pending_count,
    'on_leave_today', v_on_leave_today,
    'upcoming_leave', v_upcoming_leave,
    'recent_requests', v_recent_requests
  );
end;
$$;

revoke execute on function public.get_manager_dashboard() from public;
grant execute on function public.get_manager_dashboard() to authenticated;


-- -------------------------------------------------------
-- 3. Admin Dashboard Summary
-- -------------------------------------------------------
create or replace function public.get_admin_dashboard()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_employee_id uuid;
  v_role text;
  v_active_employees integer := 0;
  v_pending_requests integer := 0;
  v_on_leave_today integer := 0;
  v_current_year integer := extract(year from current_date)::integer;
  v_total_entitled numeric := 0;
  v_total_used numeric := 0;
  v_utilization_pct numeric := 0;
  v_status_dist jsonb := '[]'::jsonb;
  v_monthly_trend jsonb := '[]'::jsonb;
  v_recent_audit jsonb := '[]'::jsonb;
begin
  select id, role::text into v_employee_id, v_role
  from public.employees
  where auth_user_id = auth.uid() and status = 'ACTIVE'
  limit 1;

  if v_employee_id is null or v_role != 'ADMIN' then
    raise exception 'Only admins can access this dashboard';
  end if;

  -- Active employees
  select count(*) into v_active_employees
  from public.employees where status = 'ACTIVE';

  -- Pending requests
  select count(*) into v_pending_requests
  from public.leave_requests where status = 'PENDING';

  -- On leave today
  select count(distinct employee_id) into v_on_leave_today
  from public.leave_requests
  where status = 'APPROVED'
    and current_date between start_date and end_date;

  -- Leave utilization
  select coalesce(sum(entitled_days + adjustment_days), 0),
         coalesce(sum(used_days), 0)
  into v_total_entitled, v_total_used
  from public.leave_balances
  where balance_year = v_current_year;

  if v_total_entitled > 0 then
    v_utilization_pct := round((v_total_used / v_total_entitled) * 100, 1);
  end if;

  -- Status distribution (this year)
  select coalesce(jsonb_agg(row_to_json(t)::jsonb), '[]'::jsonb)
  into v_status_dist
  from (
    select status, count(*)::integer as count
    from public.leave_requests
    where extract(year from created_at) = v_current_year
    group by status
    order by status
  ) t;

  -- Monthly trend (approved days per month, this year)
  select coalesce(jsonb_agg(row_to_json(t)::jsonb), '[]'::jsonb)
  into v_monthly_trend
  from (
    select extract(month from start_date)::integer as month,
           sum(requested_days)::numeric(10,2) as total_days
    from public.leave_requests
    where status = 'APPROVED'
      and extract(year from start_date) = v_current_year
    group by extract(month from start_date)
    order by month
  ) t;

  -- Recent audit activity (last 10)
  select coalesce(jsonb_agg(row_to_json(t)::jsonb), '[]'::jsonb)
  into v_recent_audit
  from (
    select al.id, al.action, al.entity_type, al.created_at,
           e.full_name as actor_name
    from public.audit_logs al
    left join public.employees e on e.id = al.actor_employee_id
    order by al.created_at desc
    limit 10
  ) t;

  return jsonb_build_object(
    'active_employees', v_active_employees,
    'pending_requests', v_pending_requests,
    'on_leave_today', v_on_leave_today,
    'utilization_pct', v_utilization_pct,
    'total_entitled', v_total_entitled,
    'total_used', v_total_used,
    'status_distribution', v_status_dist,
    'monthly_trend', v_monthly_trend,
    'recent_audit', v_recent_audit,
    'year', v_current_year
  );
end;
$$;

revoke execute on function public.get_admin_dashboard() from public;
grant execute on function public.get_admin_dashboard() to authenticated;


-- -------------------------------------------------------
-- 4. Mark notification as read
-- -------------------------------------------------------
create or replace function public.mark_notification_read(p_notification_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_employee_id uuid;
begin
  select id into v_employee_id
  from public.employees
  where auth_user_id = auth.uid() and status = 'ACTIVE'
  limit 1;

  if v_employee_id is null then
    raise exception 'Not authenticated';
  end if;

  update public.notifications
  set is_read = true
  where id = p_notification_id
    and employee_id = v_employee_id;
end;
$$;

revoke execute on function public.mark_notification_read(uuid) from public;
grant execute on function public.mark_notification_read(uuid) to authenticated;


-- -------------------------------------------------------
-- 5. Mark all notifications as read
-- -------------------------------------------------------
create or replace function public.mark_all_notifications_read()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_employee_id uuid;
begin
  select id into v_employee_id
  from public.employees
  where auth_user_id = auth.uid() and status = 'ACTIVE'
  limit 1;

  if v_employee_id is null then
    raise exception 'Not authenticated';
  end if;

  update public.notifications
  set is_read = true
  where employee_id = v_employee_id and is_read = false;
end;
$$;

revoke execute on function public.mark_all_notifications_read() from public;
grant execute on function public.mark_all_notifications_read() to authenticated;
