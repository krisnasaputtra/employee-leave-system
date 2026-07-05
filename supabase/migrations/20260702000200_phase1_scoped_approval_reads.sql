-- Phase 1 hardening: approval read paths should not use the service-role key.
-- These read-only RPCs return minimal DTOs scoped to the current authenticated
-- actor, including manager delegation rules.

create or replace function public.get_pending_approval_requests()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_actor record;
  v_today date := current_date;
  v_result jsonb;
begin
  select id, role::text as role
  into v_actor
  from public.employees
  where auth_user_id = auth.uid()
    and status = 'ACTIVE'
  limit 1;

  if v_actor.id is null then
    raise exception 'Not authenticated or not an active employee';
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', lr.id,
        'request_number', lr.request_number,
        'start_date', lr.start_date,
        'end_date', lr.end_date,
        'requested_days', lr.requested_days,
        'created_at', lr.created_at,
        'employee_id', lr.employee_id,
        'leave_types', jsonb_build_object(
          'name', lt.name,
          'color', lt.color,
          'code', lt.code
        ),
        'employees', jsonb_build_object(
          'id', e.id,
          'full_name', e.full_name,
          'employee_code', e.employee_code,
          'department_id', e.department_id
        )
      )
      order by lr.created_at asc
    ),
    '[]'::jsonb
  )
  into v_result
  from public.leave_requests lr
  join public.employees e on e.id = lr.employee_id
  left join public.leave_types lt on lt.id = lr.leave_type_id
  where lr.status = 'PENDING'
    and lr.employee_id <> v_actor.id
    and (
      v_actor.role = 'ADMIN'
      or (v_actor.role = 'MANAGER' and e.manager_id = v_actor.id)
      or exists (
        select 1
        from public.approval_delegations ad
        where ad.delegate_id = v_actor.id
          and ad.delegator_id = e.manager_id
          and ad.is_active = true
          and ad.start_date <= v_today
          and ad.end_date >= v_today
      )
    );

  return v_result;
end;
$$;

revoke execute on function public.get_pending_approval_requests() from public;
grant execute on function public.get_pending_approval_requests() to authenticated;

create or replace function public.get_header_counts()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_actor record;
  v_today date := current_date;
  v_unread_notifications integer := 0;
  v_pending_approvals integer := 0;
begin
  select id, role::text as role
  into v_actor
  from public.employees
  where auth_user_id = auth.uid()
    and status = 'ACTIVE'
  limit 1;

  if v_actor.id is null then
    raise exception 'Not authenticated or not an active employee';
  end if;

  select count(*)::integer
  into v_unread_notifications
  from public.notifications n
  where n.employee_id = v_actor.id
    and n.is_read = false;

  select count(distinct lr.id)::integer
  into v_pending_approvals
  from public.leave_requests lr
  join public.employees e on e.id = lr.employee_id
  where lr.status = 'PENDING'
    and lr.employee_id <> v_actor.id
    and (
      v_actor.role = 'ADMIN'
      or (v_actor.role = 'MANAGER' and e.manager_id = v_actor.id)
      or exists (
        select 1
        from public.approval_delegations ad
        where ad.delegate_id = v_actor.id
          and ad.delegator_id = e.manager_id
          and ad.is_active = true
          and ad.start_date <= v_today
          and ad.end_date >= v_today
      )
    );

  return jsonb_build_object(
    'unreadNotifications', v_unread_notifications,
    'pendingApprovals', v_pending_approvals
  );
end;
$$;

revoke execute on function public.get_header_counts() from public;
grant execute on function public.get_header_counts() to authenticated;

