-- Migration: Allow delegated employees to approve/reject leave requests
-- This modifies approve_leave_request and reject_leave_request RPCs
-- to check for active approval_delegations when the actor is an EMPLOYEE.

-- ----- RPC: approve_leave_request (delegation-aware) -----
create or replace function public.approve_leave_request(
  p_request_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid;
  v_actor record;
  v_request record;
  v_requester record;
  v_leave_type record;
  v_balance record;
  v_available numeric(6,2);
  v_recalculated_days numeric(6,2);
  v_overlap_count integer;
  v_is_delegate boolean := false;
  v_today date := current_date;
begin
  -- 1. Get actor
  select id, status, role::text as role, full_name
  into v_actor
  from public.employees
  where auth_user_id = auth.uid() and status = 'ACTIVE'
  limit 1;

  if v_actor.id is null then
    raise exception 'Not authenticated or not an active employee';
  end if;
  v_actor_id := v_actor.id;

  -- 2. Get request
  select * into v_request
  from public.leave_requests
  where id = p_request_id
  for update;

  if v_request.id is null then
    raise exception 'Leave request not found';
  end if;

  if v_request.status != 'PENDING' then
    raise exception 'Only Pending requests can be approved (current status: %)', v_request.status;
  end if;

  if v_request.employee_id = v_actor_id then
    raise exception 'You cannot approve your own request';
  end if;

  -- 3. Authorization: ADMIN can approve all, MANAGER direct reports, EMPLOYEE only via delegation
  if v_actor.role = 'ADMIN' then
    -- Admin can approve any request
    null;
  elsif v_actor.role = 'MANAGER' then
    -- Manager: must be the manager of the requester
    select * into v_requester
    from public.employees
    where id = v_request.employee_id;

    if v_requester.manager_id is null or v_requester.manager_id != v_actor_id then
      -- Check if manager has delegation for this request's manager
      select exists(
        select 1 from public.approval_delegations ad
        join public.employees e on e.manager_id = ad.delegator_id
        where ad.delegate_id = v_actor_id
          and ad.is_active = true
          and ad.start_date <= v_today
          and ad.end_date >= v_today
          and e.id = v_request.employee_id
      ) into v_is_delegate;

      if not v_is_delegate then
        raise exception 'Managers can only approve direct report requests';
      end if;
    end if;
  elsif v_actor.role = 'EMPLOYEE' then
    -- Employee: must have active delegation from the requester's manager
    select exists(
      select 1 from public.approval_delegations ad
      join public.employees e on e.manager_id = ad.delegator_id
      where ad.delegate_id = v_actor_id
        and ad.is_active = true
        and ad.start_date <= v_today
        and ad.end_date >= v_today
        and e.id = v_request.employee_id
    ) into v_is_delegate;

    if not v_is_delegate then
      raise exception 'You do not have delegation authority to approve this request';
    end if;
  else
    raise exception 'Insufficient permissions to approve requests';
  end if;

  -- 4. Get leave type
  select * into v_leave_type
  from public.leave_types
  where id = v_request.leave_type_id;

  -- 5. Recalculate days
  v_recalculated_days := public.calculate_leave_days(
    v_request.start_date, v_request.end_date, v_request.partial_day
  );

  -- 6. Check overlaps
  select count(*) into v_overlap_count
  from public.leave_requests
  where employee_id = v_request.employee_id
    and id != p_request_id
    and status in ('PENDING', 'APPROVED')
    and v_request.start_date <= end_date
    and v_request.end_date >= start_date;

  if v_overlap_count > 0 then
    raise exception 'Request dates now overlap with another Pending or Approved request';
  end if;

  -- 7. Balance check (if leave type deducts balance)
  if v_leave_type.deducts_balance then
    select * into v_balance
    from public.leave_balances
    where employee_id = v_request.employee_id
      and leave_type_id = v_request.leave_type_id
      and balance_year = extract(year from v_request.start_date)::integer
    for update;

    if v_balance.id is null then
      raise exception 'No leave balance found for this employee and leave type';
    end if;

    v_available := v_balance.entitled_days + v_balance.carried_over_days
                   - v_balance.used_days - v_balance.pending_days
                   + v_request.requested_days;

    if v_available < v_recalculated_days then
      raise exception 'Insufficient leave balance (available: % days, needed: % days)',
        v_available, v_recalculated_days;
    end if;

    -- Transfer: pending → used
    update public.leave_balances set
      pending_days = pending_days - v_request.requested_days,
      used_days = used_days + v_recalculated_days,
      updated_at = now()
    where id = v_balance.id;

    -- Ledger entry
    insert into public.leave_balance_transactions (
      leave_balance_id, transaction_type, days, description, performed_by
    ) values (
      v_balance.id, 'APPROVED', v_recalculated_days,
      'Leave request ' || coalesce(v_request.request_number, p_request_id::text) || ' approved',
      v_actor_id
    );
  end if;

  -- 8. Update request
  update public.leave_requests set
    status = 'APPROVED',
    approved_by = v_actor_id,
    approved_at = now(),
    requested_days = v_recalculated_days,
    updated_at = now()
  where id = p_request_id;

  -- 9. Notification
  insert into public.notifications (employee_id, title, message)
  values (
    v_request.employee_id,
    'Leave Request Approved',
    'Your leave request ' || coalesce(v_request.request_number, '') || ' has been approved by ' || v_actor.full_name
  );

  -- 10. Audit log
  insert into public.audit_logs (action, actor_id, target_type, target_id, metadata)
  values (
    'APPROVE_LEAVE',
    v_actor_id,
    'leave_request',
    p_request_id,
    jsonb_build_object(
      'request_number', v_request.request_number,
      'employee_id', v_request.employee_id,
      'days', v_recalculated_days
    )
  );

  return jsonb_build_object(
    'request_id', p_request_id,
    'request_number', v_request.request_number,
    'status', 'APPROVED'
  );
end;
$$;


-- ----- RPC: reject_leave_request (delegation-aware) -----
create or replace function public.reject_leave_request(
  p_request_id uuid,
  p_rejection_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid;
  v_actor record;
  v_request record;
  v_requester record;
  v_leave_type record;
  v_balance record;
  v_is_delegate boolean := false;
  v_today date := current_date;
begin
  -- 1. Validate reason
  if p_rejection_reason is null or length(trim(p_rejection_reason)) < 3 then
    raise exception 'Rejection reason is required (minimum 3 characters)';
  end if;

  -- 2. Get actor
  select id, status, role::text as role, full_name
  into v_actor
  from public.employees
  where auth_user_id = auth.uid() and status = 'ACTIVE'
  limit 1;

  if v_actor.id is null then
    raise exception 'Not authenticated or not an active employee';
  end if;
  v_actor_id := v_actor.id;

  -- 3. Get request
  select * into v_request
  from public.leave_requests
  where id = p_request_id
  for update;

  if v_request.id is null then
    raise exception 'Leave request not found';
  end if;

  if v_request.status != 'PENDING' then
    raise exception 'Only Pending requests can be rejected (current status: %)', v_request.status;
  end if;

  if v_request.employee_id = v_actor_id then
    raise exception 'You cannot reject your own request';
  end if;

  -- 4. Authorization: ADMIN can reject all, MANAGER direct reports, EMPLOYEE only via delegation
  if v_actor.role = 'ADMIN' then
    null;
  elsif v_actor.role = 'MANAGER' then
    select * into v_requester
    from public.employees
    where id = v_request.employee_id;

    if v_requester.manager_id is null or v_requester.manager_id != v_actor_id then
      select exists(
        select 1 from public.approval_delegations ad
        join public.employees e on e.manager_id = ad.delegator_id
        where ad.delegate_id = v_actor_id
          and ad.is_active = true
          and ad.start_date <= v_today
          and ad.end_date >= v_today
          and e.id = v_request.employee_id
      ) into v_is_delegate;

      if not v_is_delegate then
        raise exception 'Managers can only reject direct report requests';
      end if;
    end if;
  elsif v_actor.role = 'EMPLOYEE' then
    select exists(
      select 1 from public.approval_delegations ad
      join public.employees e on e.manager_id = ad.delegator_id
      where ad.delegate_id = v_actor_id
        and ad.is_active = true
        and ad.start_date <= v_today
        and ad.end_date >= v_today
        and e.id = v_request.employee_id
    ) into v_is_delegate;

    if not v_is_delegate then
      raise exception 'You do not have delegation authority to reject this request';
    end if;
  else
    raise exception 'Insufficient permissions to reject requests';
  end if;

  -- 5. Update request status
  update public.leave_requests set
    status = 'REJECTED',
    rejection_reason = p_rejection_reason,
    approved_by = v_actor_id,
    approved_at = now(),
    updated_at = now()
  where id = p_request_id;

  -- 6. Release pending balance
  select * into v_leave_type
  from public.leave_types
  where id = v_request.leave_type_id;

  if v_leave_type.deducts_balance then
    select * into v_balance
    from public.leave_balances
    where employee_id = v_request.employee_id
      and leave_type_id = v_request.leave_type_id
      and balance_year = extract(year from v_request.start_date)::integer
    for update;

    if v_balance.id is not null then
      update public.leave_balances set
        pending_days = greatest(0, pending_days - v_request.requested_days),
        updated_at = now()
      where id = v_balance.id;

      insert into public.leave_balance_transactions (
        leave_balance_id, transaction_type, days, description, performed_by
      ) values (
        v_balance.id, 'REJECTED', v_request.requested_days,
        'Leave request ' || coalesce(v_request.request_number, p_request_id::text) || ' rejected',
        v_actor_id
      );
    end if;
  end if;

  -- 7. Notification
  insert into public.notifications (employee_id, title, message)
  values (
    v_request.employee_id,
    'Leave Request Rejected',
    'Your leave request ' || coalesce(v_request.request_number, '') || ' has been rejected by ' || v_actor.full_name || '. Reason: ' || p_rejection_reason
  );

  -- 8. Audit log
  insert into public.audit_logs (action, actor_id, target_type, target_id, metadata)
  values (
    'REJECT_LEAVE',
    v_actor_id,
    'leave_request',
    p_request_id,
    jsonb_build_object(
      'request_number', v_request.request_number,
      'employee_id', v_request.employee_id,
      'reason', p_rejection_reason
    )
  );

  return jsonb_build_object(
    'request_id', p_request_id,
    'request_number', v_request.request_number,
    'status', 'REJECTED'
  );
end;
$$;

-- Permissions
revoke execute on function public.approve_leave_request(uuid) from public;
grant execute on function public.approve_leave_request(uuid) to authenticated;

revoke execute on function public.reject_leave_request(uuid, text) from public;
grant execute on function public.reject_leave_request(uuid, text) to authenticated;
