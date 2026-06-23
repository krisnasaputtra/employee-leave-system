-- =============================================================
-- Migration: Leave Request RPC Functions
-- Phase 6 — Leave Request CRUD
-- =============================================================
-- Creates four functions:
--   1. calculate_leave_days — authoritative working day calculation
--   2. create_leave_request — submit with balance reservation
--   3. update_pending_leave_request — edit pending with re-reservation
--   4. cancel_leave_request — cancel with balance release
-- =============================================================

-- ----- FUNCTION: calculate_leave_days -----
-- Calculates authoritative working days between two dates.
-- Excludes weekends (Saturday=6, Sunday=0) and active holidays.
-- Supports half-day values.

create or replace function public.calculate_leave_days(
  p_start_date date,
  p_end_date date,
  p_partial_day public.leave_partial_day default 'NONE'
)
returns numeric(6,2)
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_total numeric(6,2) := 0;
  v_current date;
  v_dow integer;
  v_is_holiday boolean;
begin
  if p_start_date > p_end_date then
    raise exception 'Start date cannot be after end date';
  end if;

  v_current := p_start_date;
  while v_current <= p_end_date loop
    -- Get day of week (0=Sunday, 6=Saturday)
    v_dow := extract(dow from v_current)::integer;

    -- Skip weekends
    if v_dow not in (0, 6) then
      -- Check for active holidays (exact date match or recurring month/day)
      select exists(
        select 1 from public.holidays
        where is_active = true
          and (
            holiday_date = v_current
            or (is_recurring = true and
                extract(month from holiday_date) = extract(month from v_current) and
                extract(day from holiday_date) = extract(day from v_current))
          )
      ) into v_is_holiday;

      if not v_is_holiday then
        v_total := v_total + 1;
      end if;
    end if;

    v_current := v_current + 1;
  end loop;

  -- Apply half-day: if partial_day is set and total > 0, subtract 0.5
  if p_partial_day in ('FIRST_HALF', 'SECOND_HALF') and v_total > 0 then
    v_total := v_total - 0.5;
  end if;

  return v_total;
end;
$$;


-- ----- FUNCTION: generate_request_number -----
-- Generates a unique request number like LR-2026-000001.

create or replace function public.generate_request_number()
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_year integer := extract(year from now())::integer;
  v_seq integer;
begin
  select count(*) + 1 into v_seq
  from public.leave_requests
  where extract(year from created_at) = v_year;

  return 'LR-' || v_year || '-' || lpad(v_seq::text, 6, '0');
end;
$$;


-- ----- RPC: create_leave_request -----
-- Transactional: creates request + reserves balance atomically.

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

  -- 4. Calculate days (server-authoritative, ignores client total)
  v_calculated_days := public.calculate_leave_days(p_start_date, p_end_date, p_partial_day);

  if v_calculated_days <= 0 then
    raise exception 'No working days in the selected date range';
  end if;

  -- 5. Detect overlap with PENDING or APPROVED requests
  select count(*) into v_overlap_count
  from public.leave_requests
  where employee_id = v_actor_id
    and status in ('PENDING', 'APPROVED')
    and p_start_date <= end_date
    and p_end_date >= start_date;

  if v_overlap_count > 0 then
    raise exception 'Date range overlaps with an existing Pending or Approved request';
  end if;

  -- 6. Determine balance year from start_date
  v_balance_year := extract(year from p_start_date)::integer;

  -- 7. Lock balance row (only for balance-deducting types)
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

  -- 11. Reserve balance (increment pending_days)
  if v_leave_type.deducts_balance and v_balance.id is not null then
    update public.leave_balances
    set pending_days = pending_days + v_calculated_days
    where id = v_balance.id;

    -- 12. Insert RESERVE ledger transaction
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

  -- 13. Notification to manager (if exists)
  declare
    v_manager_id uuid;
  begin
    select manager_employee_id into v_manager_id
    from public.employees
    where id = v_actor_id;

    if v_manager_id is not null then
      insert into public.notifications (employee_id, title, message)
      values (
        v_manager_id,
        'New Leave Request',
        v_actor.full_name || ' submitted a leave request (' || v_request_number || ') from '
        || p_start_date || ' to ' || p_end_date || ' (' || v_calculated_days || ' days).'
      );
    end if;
  end;

  -- 14. Audit log
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

  -- 15. Return result
  return jsonb_build_object(
    'success', true,
    'request_id', v_request_id,
    'request_number', v_request_number,
    'requested_days', v_calculated_days
  );
end;
$$;

revoke execute on function public.create_leave_request(uuid, date, date, public.leave_partial_day, text) from public;
grant execute on function public.create_leave_request(uuid, date, date, public.leave_partial_day, text) to authenticated;


-- ----- RPC: update_pending_leave_request -----
-- Transactional: releases old reservation, applies new one.

create or replace function public.update_pending_leave_request(
  p_request_id uuid,
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
  v_request record;
  v_old_leave_type record;
  v_new_leave_type record;
  v_old_balance record;
  v_new_balance record;
  v_calculated_days numeric(6,2);
  v_overlap_count integer;
  v_available numeric(6,2);
  v_balance_year integer;
begin
  -- 1. Resolve actor
  v_actor_id := (
    select id from public.employees
    where auth_user_id = auth.uid() and status = 'ACTIVE'
    limit 1
  );
  if v_actor_id is null then
    raise exception 'Not authenticated or not an active employee';
  end if;

  -- 2. Load and lock request
  select * into v_request
  from public.leave_requests
  where id = p_request_id
  for update;

  if v_request.id is null then
    raise exception 'Leave request not found';
  end if;

  -- 3. Verify ownership and status
  if v_request.employee_id != v_actor_id then
    raise exception 'You can only edit your own requests';
  end if;
  if v_request.status != 'PENDING' then
    raise exception 'Only Pending requests can be edited';
  end if;

  -- 4. Validate new leave type
  select * into v_new_leave_type
  from public.leave_types
  where id = p_leave_type_id and is_active = true;

  if v_new_leave_type.id is null then
    raise exception 'Leave type not found or inactive';
  end if;

  -- 5. Validate dates
  if p_start_date > p_end_date then
    raise exception 'Start date cannot be after end date';
  end if;

  -- 6. Calculate new days
  v_calculated_days := public.calculate_leave_days(p_start_date, p_end_date, p_partial_day);
  if v_calculated_days <= 0 then
    raise exception 'No working days in the selected date range';
  end if;

  -- 7. Overlap detection (exclude this request)
  select count(*) into v_overlap_count
  from public.leave_requests
  where employee_id = v_actor_id
    and id != p_request_id
    and status in ('PENDING', 'APPROVED')
    and p_start_date <= end_date
    and p_end_date >= start_date;

  if v_overlap_count > 0 then
    raise exception 'Date range overlaps with an existing Pending or Approved request';
  end if;

  -- 8. Release old reservation (if old type deducts balance)
  select * into v_old_leave_type
  from public.leave_types where id = v_request.leave_type_id;

  if v_old_leave_type.deducts_balance then
    select * into v_old_balance
    from public.leave_balances
    where employee_id = v_actor_id
      and leave_type_id = v_request.leave_type_id
      and balance_year = extract(year from v_request.start_date)::integer
    for update;

    if v_old_balance.id is not null then
      update public.leave_balances
      set pending_days = greatest(pending_days - v_request.requested_days, 0)
      where id = v_old_balance.id;

      insert into public.leave_balance_transactions (
        leave_balance_id, leave_request_id, transaction_type,
        days, reason, actor_employee_id
      ) values (
        v_old_balance.id, p_request_id, 'RELEASE',
        v_request.requested_days,
        'Released for request update (old reservation)',
        v_actor_id
      );
    end if;
  end if;

  -- 9. Apply new reservation
  v_balance_year := extract(year from p_start_date)::integer;

  if v_new_leave_type.deducts_balance then
    select * into v_new_balance
    from public.leave_balances
    where employee_id = v_actor_id
      and leave_type_id = p_leave_type_id
      and balance_year = v_balance_year
    for update;

    if v_new_balance.id is null then
      raise exception 'No balance record found for this leave type and year';
    end if;

    v_available := v_new_balance.entitled_days + v_new_balance.adjustment_days
                   - v_new_balance.used_days - v_new_balance.pending_days;

    if v_calculated_days > v_available and (v_new_leave_type.allow_negative_balance is null or v_new_leave_type.allow_negative_balance = false) then
      raise exception 'Insufficient balance. Available: % days, Requested: % days', v_available, v_calculated_days;
    end if;

    update public.leave_balances
    set pending_days = pending_days + v_calculated_days
    where id = v_new_balance.id;

    insert into public.leave_balance_transactions (
      leave_balance_id, leave_request_id, transaction_type,
      days, reason, actor_employee_id
    ) values (
      v_new_balance.id, p_request_id, 'RESERVE',
      v_calculated_days,
      'Reserved for updated request',
      v_actor_id
    );
  end if;

  -- 10. Update request
  update public.leave_requests set
    leave_type_id = p_leave_type_id,
    start_date = p_start_date,
    end_date = p_end_date,
    requested_days = v_calculated_days,
    partial_day = p_partial_day,
    reason = coalesce(trim(p_reason), '')
  where id = p_request_id;

  -- 11. Audit log
  insert into public.audit_logs (
    actor_employee_id, action, entity_type, entity_id, metadata
  ) values (
    v_actor_id, 'LEAVE_REQUEST_UPDATED', 'leave_request', p_request_id,
    jsonb_build_object(
      'old_leave_type_id', v_request.leave_type_id,
      'new_leave_type_id', p_leave_type_id,
      'old_days', v_request.requested_days,
      'new_days', v_calculated_days,
      'old_start_date', v_request.start_date,
      'new_start_date', p_start_date
    )
  );

  return jsonb_build_object(
    'success', true,
    'request_id', p_request_id,
    'requested_days', v_calculated_days
  );
end;
$$;

revoke execute on function public.update_pending_leave_request(uuid, uuid, date, date, public.leave_partial_day, text) from public;
grant execute on function public.update_pending_leave_request(uuid, uuid, date, date, public.leave_partial_day, text) to authenticated;


-- ----- RPC: cancel_leave_request -----
-- Cancels a Pending request and releases balance reservation.

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
  v_request record;
  v_leave_type record;
  v_balance record;
begin
  -- 1. Resolve actor
  v_actor_id := (
    select id from public.employees
    where auth_user_id = auth.uid() and status = 'ACTIVE'
    limit 1
  );
  if v_actor_id is null then
    raise exception 'Not authenticated or not an active employee';
  end if;

  -- 2. Load and lock request
  select * into v_request
  from public.leave_requests
  where id = p_request_id
  for update;

  if v_request.id is null then
    raise exception 'Leave request not found';
  end if;

  -- 3. Verify ownership and status
  if v_request.employee_id != v_actor_id then
    raise exception 'You can only cancel your own requests';
  end if;
  if v_request.status != 'PENDING' then
    raise exception 'Only Pending requests can be cancelled';
  end if;

  -- 4. Update request status
  update public.leave_requests set
    status = 'CANCELLED',
    cancelled_at = now()
  where id = p_request_id;

  -- 5. Release balance reservation
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

  -- 6. Notification to manager
  declare
    v_manager_id uuid;
  begin
    select manager_employee_id into v_manager_id
    from public.employees where id = v_actor_id;

    if v_manager_id is not null then
      insert into public.notifications (employee_id, title, message)
      values (
        v_manager_id,
        'Leave Request Cancelled',
        'Request ' || v_request.request_number || ' has been cancelled.'
      );
    end if;
  end;

  -- 7. Audit log
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
    'request_id', p_request_id
  );
end;
$$;

revoke execute on function public.cancel_leave_request(uuid) from public;
grant execute on function public.cancel_leave_request(uuid) to authenticated;
