-- Migration: Delegation-aware notifications for create_leave_request and cancel_leave_request
-- When a manager has delegated approval to an employee, notifications are sent to BOTH
-- the manager AND the active delegate(s).

-- ----- RPC: create_leave_request (delegation-aware notifications) -----
create or replace function public.create_leave_request(
  p_leave_type_id uuid,
  p_start_date date,
  p_end_date date,
  p_partial_day public.leave_partial_day default 'NONE',
  p_reason text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid;
  v_actor record;
  v_leave_type record;
  v_calculated_days numeric(6,2);
  v_overlap_count integer;
  v_balance record;
  v_available numeric(6,2);
  v_request_number text;
  v_request_id uuid;
  v_balance_year integer;
  v_manager_id uuid;
  v_delegate record;
  v_today date := current_date;
  v_notif_message text;
begin
  -- 1. Resolve actor
  select id, status, role::text as role, full_name
  into v_actor
  from public.employees
  where auth_user_id = auth.uid() and status = 'ACTIVE'
  limit 1;

  if v_actor.id is null then
    raise exception 'Not authenticated or not an active employee';
  end if;
  v_actor_id := v_actor.id;

  -- 2. Validate leave type
  select * into v_leave_type
  from public.leave_types
  where id = p_leave_type_id and is_active = true;

  if v_leave_type.id is null then
    raise exception 'Leave type not found or inactive';
  end if;

  -- 3. Validate dates
  if p_start_date > p_end_date then
    raise exception 'Start date cannot be after end date';
  end if;

  -- 4. Calculate days (server-authoritative)
  v_calculated_days := public.calculate_leave_days(p_start_date, p_end_date, p_partial_day);

  if v_calculated_days <= 0 then
    raise exception 'No working days in the selected date range';
  end if;

  -- 5. Detect overlap
  select count(*) into v_overlap_count
  from public.leave_requests
  where employee_id = v_actor_id
    and status in ('PENDING', 'APPROVED')
    and p_start_date <= end_date
    and p_end_date >= start_date;

  if v_overlap_count > 0 then
    raise exception 'Date range overlaps with an existing Pending or Approved request';
  end if;

  -- 6. Determine balance year
  v_balance_year := extract(year from p_start_date)::integer;

  -- 7. Lock balance row
  if v_leave_type.deducts_balance then
    select * into v_balance
    from public.leave_balances
    where employee_id = v_actor_id
      and leave_type_id = p_leave_type_id
      and balance_year = v_balance_year
    for update;

    if v_balance.id is null then
      raise exception 'No balance record found for this leave type and year. Please contact your administrator.';
    end if;

    -- 8. Check available balance
    v_available := v_balance.entitled_days + v_balance.adjustment_days
                   - v_balance.used_days - v_balance.pending_days;

    if v_calculated_days > v_available and (v_leave_type.allow_negative_balance is null or v_leave_type.allow_negative_balance = false) then
      raise exception 'Insufficient balance. Available: % days, Requested: % days', v_available, v_calculated_days;
    end if;
  end if;

  -- 9. Generate request number
  v_request_number := public.generate_request_number();

  -- 10. Insert Pending request
  insert into public.leave_requests (
    request_number, employee_id, leave_type_id,
    start_date, end_date, requested_days, partial_day,
    reason, status
  ) values (
    v_request_number, v_actor_id, p_leave_type_id,
    p_start_date, p_end_date, v_calculated_days, p_partial_day,
    coalesce(trim(p_reason), ''), 'PENDING'
  )
  returning id into v_request_id;

  -- 11. Reserve balance
  if v_leave_type.deducts_balance and v_balance.id is not null then
    update public.leave_balances
    set pending_days = pending_days + v_calculated_days
    where id = v_balance.id;

    insert into public.leave_balance_transactions (
      leave_balance_id, leave_request_id, transaction_type,
      days, reason, actor_employee_id
    ) values (
      v_balance.id, v_request_id, 'RESERVE',
      v_calculated_days,
      'Reserved for request ' || v_request_number,
      v_actor_id
    );
  end if;

  -- 12. Build notification message
  v_notif_message := v_actor.full_name || ' submitted a leave request (' || v_request_number || ') from '
    || p_start_date || ' to ' || p_end_date || ' (' || v_calculated_days || ' days).';

  -- 13. Notification to manager
  select manager_id into v_manager_id
  from public.employees
  where id = v_actor_id;

  if v_manager_id is not null then
    insert into public.notifications (employee_id, title, message)
    values (v_manager_id, 'New Leave Request', v_notif_message);

    -- 14. ALSO notify active delegates of this manager
    for v_delegate in
      select delegate_id from public.approval_delegations
      where delegator_id = v_manager_id
        and is_active = true
        and start_date <= v_today
        and end_date >= v_today
        and delegate_id != v_actor_id  -- don't notify the requester if they are somehow a delegate
    loop
      insert into public.notifications (employee_id, title, message)
      values (v_delegate.delegate_id, 'New Leave Request (Delegated)', v_notif_message);
    end loop;
  end if;

  -- 15. Audit log
  insert into public.audit_logs (
    actor_employee_id, action, entity_type, entity_id, metadata
  ) values (
    v_actor_id, 'LEAVE_REQUEST_CREATED', 'leave_request', v_request_id,
    jsonb_build_object(
      'request_number', v_request_number,
      'leave_type_id', p_leave_type_id,
      'start_date', p_start_date,
      'end_date', p_end_date,
      'requested_days', v_calculated_days,
      'partial_day', p_partial_day::text
    )
  );

  return jsonb_build_object(
    'success', true,
    'request_id', v_request_id,
    'request_number', v_request_number,
    'requested_days', v_calculated_days
  );
end;
$$;


-- ----- RPC: cancel_leave_request (delegation-aware notifications) -----
create or replace function public.cancel_leave_request(
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
  v_leave_type record;
  v_balance record;
  v_manager_id uuid;
  v_delegate record;
  v_today date := current_date;
begin
  select id, full_name
  into v_actor
  from public.employees
  where auth_user_id = auth.uid() and status = 'ACTIVE'
  limit 1;

  v_actor_id := v_actor.id;

  if v_actor_id is null then
    raise exception 'Not authenticated or not an active employee';
  end if;

  select * into v_request
  from public.leave_requests
  where id = p_request_id
  for update;

  if v_request.id is null then
    raise exception 'Leave request not found';
  end if;

  if v_request.employee_id != v_actor_id then
    raise exception 'You can only cancel your own requests';
  end if;
  if v_request.status != 'PENDING' then
    raise exception 'Only Pending requests can be cancelled';
  end if;

  update public.leave_requests set
    status = 'CANCELLED',
    cancelled_at = now()
  where id = p_request_id;

  select * into v_leave_type
  from public.leave_types where id = v_request.leave_type_id;

  if v_leave_type.deducts_balance then
    select * into v_balance
    from public.leave_balances
    where employee_id = v_actor_id
      and leave_type_id = v_request.leave_type_id
      and balance_year = extract(year from v_request.start_date)::integer
    for update;

    if v_balance.id is not null then
      update public.leave_balances
      set pending_days = greatest(pending_days - v_request.requested_days, 0)
      where id = v_balance.id;

      insert into public.leave_balance_transactions (
        leave_balance_id, leave_request_id, transaction_type,
        days, reason, actor_employee_id
      ) values (
        v_balance.id, p_request_id, 'RELEASE',
        v_request.requested_days,
        'Released: request ' || v_request.request_number || ' cancelled',
        v_actor_id
      );
    end if;
  end if;

  -- Notification to manager
  select manager_id into v_manager_id
  from public.employees where id = v_actor_id;

  if v_manager_id is not null then
    insert into public.notifications (employee_id, title, message)
    values (
      v_manager_id,
      'Leave Request Cancelled',
      'Request ' || v_request.request_number || ' has been cancelled by ' || v_actor.full_name || '.'
    );

    -- ALSO notify active delegates
    for v_delegate in
      select delegate_id from public.approval_delegations
      where delegator_id = v_manager_id
        and is_active = true
        and start_date <= v_today
        and end_date >= v_today
        and delegate_id != v_actor_id
    loop
      insert into public.notifications (employee_id, title, message)
      values (
        v_delegate.delegate_id,
        'Leave Request Cancelled (Delegated)',
        'Request ' || v_request.request_number || ' has been cancelled by ' || v_actor.full_name || '.'
      );
    end loop;
  end if;

  insert into public.audit_logs (
    actor_employee_id, action, entity_type, entity_id, metadata
  ) values (
    v_actor_id, 'LEAVE_REQUEST_CANCELLED', 'leave_request', p_request_id,
    jsonb_build_object(
      'request_number', v_request.request_number,
      'requested_days', v_request.requested_days,
      'leave_type_id', v_request.leave_type_id
    )
  );

  return jsonb_build_object(
    'success', true,
    'request_id', p_request_id,
    'request_number', v_request.request_number
  );
end;
$$;

-- Permissions
revoke execute on function public.create_leave_request(uuid, date, date, public.leave_partial_day, text) from public;
grant execute on function public.create_leave_request(uuid, date, date, public.leave_partial_day, text) to authenticated;

revoke execute on function public.cancel_leave_request(uuid) from public;
grant execute on function public.cancel_leave_request(uuid) to authenticated;
