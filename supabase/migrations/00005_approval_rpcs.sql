-- =============================================================
-- Migration: Approval Workflow RPC Functions
-- Phase 7 — Approval Workflow
-- =============================================================
-- Creates two functions:
--   1. approve_leave_request — approve with balance transfer
--   2. reject_leave_request — reject with balance release
-- =============================================================

-- ----- RPC: approve_leave_request -----
-- Transactional: moves pending days to used days atomically.
-- Manager can approve direct reports. Admin can approve all.
-- No self-approval. Revalidates balance and overlap before committing.

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

  -- 2. Verify actor is ADMIN or MANAGER
  if v_actor.role not in ('ADMIN', 'MANAGER') then
    raise exception 'Only Managers and Admins can approve requests';
  end if;

  -- 3. Lock and load request
  select * into v_request
  from public.leave_requests
  where id = p_request_id
  for update;

  if v_request.id is null then
    raise exception 'Leave request not found';
  end if;

  -- 4. Verify Pending status
  if v_request.status != 'PENDING' then
    raise exception 'Only Pending requests can be approved (current status: %)', v_request.status;
  end if;

  -- 5. Prevent self-approval
  if v_request.employee_id = v_actor_id then
    raise exception 'You cannot approve your own request';
  end if;

  -- 6. Verify scope for MANAGER (direct reports only)
  if v_actor.role = 'MANAGER' then
    select * into v_requester
    from public.employees
    where id = v_request.employee_id;

    if v_requester.manager_employee_id is null or v_requester.manager_employee_id != v_actor_id then
      raise exception 'Managers can only approve direct report requests';
    end if;
  end if;

  -- 7. Load leave type
  select * into v_leave_type
  from public.leave_types
  where id = v_request.leave_type_id;

  -- 8. Revalidate: recalculate days
  v_recalculated_days := public.calculate_leave_days(
    v_request.start_date, v_request.end_date, v_request.partial_day
  );

  -- 9. Revalidate: overlap check (exclude this request)
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

  -- 10. Lock and validate balance (for balance-deducting types)
  if v_leave_type.deducts_balance then
    select * into v_balance
    from public.leave_balances
    where employee_id = v_request.employee_id
      and leave_type_id = v_request.leave_type_id
      and balance_year = extract(year from v_request.start_date)::integer
    for update;

    if v_balance.id is null then
      raise exception 'No balance record found for this leave type and year';
    end if;

    -- Revalidate available balance (entitled + adjustment - used)
    -- We don't subtract pending here because we're about to convert pending to used
    v_available := v_balance.entitled_days + v_balance.adjustment_days - v_balance.used_days;

    if v_recalculated_days > v_available
       and (v_leave_type.allow_negative_balance is null or v_leave_type.allow_negative_balance = false) then
      raise exception 'Insufficient balance to approve. Available: % days, Required: % days',
        v_available, v_recalculated_days;
    end if;

    -- 11. Move pending to used atomically
    update public.leave_balances set
      pending_days = greatest(pending_days - v_request.requested_days, 0),
      used_days = used_days + v_recalculated_days
    where id = v_balance.id;

    -- 12. Insert USE ledger transaction
    insert into public.leave_balance_transactions (
      leave_balance_id, leave_request_id, transaction_type,
      days, reason, actor_employee_id
    ) values (
      v_balance.id, p_request_id, 'USE',
      v_recalculated_days,
      'Approved: request ' || v_request.request_number,
      v_actor_id
    );
  end if;

  -- 13. Update request status
  update public.leave_requests set
    status = 'APPROVED',
    approver_employee_id = v_actor_id,
    decided_at = now(),
    requested_days = v_recalculated_days
  where id = p_request_id;

  -- 14. Notify employee
  insert into public.notifications (employee_id, title, message)
  values (
    v_request.employee_id,
    'Leave Request Approved',
    'Your leave request ' || v_request.request_number || ' has been approved by '
    || v_actor.full_name || '.'
  );

  -- 15. Audit log
  insert into public.audit_logs (
    actor_employee_id, action, entity_type, entity_id, metadata
  ) values (
    v_actor_id, 'LEAVE_REQUEST_APPROVED', 'leave_request', p_request_id,
    jsonb_build_object(
      'request_number', v_request.request_number,
      'employee_id', v_request.employee_id,
      'leave_type_id', v_request.leave_type_id,
      'requested_days', v_recalculated_days,
      'start_date', v_request.start_date,
      'end_date', v_request.end_date
    )
  );

  -- 16. Return result
  return jsonb_build_object(
    'success', true,
    'request_id', p_request_id,
    'request_number', v_request.request_number,
    'approved_days', v_recalculated_days
  );
end;
$$;

revoke execute on function public.approve_leave_request(uuid) from public;
grant execute on function public.approve_leave_request(uuid) to authenticated;


-- ----- RPC: reject_leave_request -----
-- Transactional: releases pending balance and sets rejection reason.

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
begin
  -- 1. Validate rejection reason
  if p_rejection_reason is null or length(trim(p_rejection_reason)) < 3 then
    raise exception 'Rejection reason is required (minimum 3 characters)';
  end if;

  -- 2. Resolve actor
  select id, status, role::text as role, full_name
  into v_actor
  from public.employees
  where auth_user_id = auth.uid() and status = 'ACTIVE'
  limit 1;

  if v_actor.id is null then
    raise exception 'Not authenticated or not an active employee';
  end if;
  v_actor_id := v_actor.id;

  -- 3. Verify actor is ADMIN or MANAGER
  if v_actor.role not in ('ADMIN', 'MANAGER') then
    raise exception 'Only Managers and Admins can reject requests';
  end if;

  -- 4. Lock and load request
  select * into v_request
  from public.leave_requests
  where id = p_request_id
  for update;

  if v_request.id is null then
    raise exception 'Leave request not found';
  end if;

  -- 5. Verify Pending status
  if v_request.status != 'PENDING' then
    raise exception 'Only Pending requests can be rejected (current status: %)', v_request.status;
  end if;

  -- 6. Prevent self-rejection (same rule as self-approval)
  if v_request.employee_id = v_actor_id then
    raise exception 'You cannot reject your own request';
  end if;

  -- 7. Verify scope for MANAGER
  if v_actor.role = 'MANAGER' then
    select * into v_requester
    from public.employees
    where id = v_request.employee_id;

    if v_requester.manager_employee_id is null or v_requester.manager_employee_id != v_actor_id then
      raise exception 'Managers can only reject direct report requests';
    end if;
  end if;

  -- 8. Update request status
  update public.leave_requests set
    status = 'REJECTED',
    approver_employee_id = v_actor_id,
    decided_at = now(),
    rejection_reason = trim(p_rejection_reason)
  where id = p_request_id;

  -- 9. Release pending balance
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
      update public.leave_balances
      set pending_days = greatest(pending_days - v_request.requested_days, 0)
      where id = v_balance.id;

      -- 10. Insert RELEASE ledger transaction
      insert into public.leave_balance_transactions (
        leave_balance_id, leave_request_id, transaction_type,
        days, reason, actor_employee_id
      ) values (
        v_balance.id, p_request_id, 'RELEASE',
        v_request.requested_days,
        'Rejected: ' || trim(p_rejection_reason),
        v_actor_id
      );
    end if;
  end if;

  -- 11. Notify employee
  insert into public.notifications (employee_id, title, message)
  values (
    v_request.employee_id,
    'Leave Request Rejected',
    'Your leave request ' || v_request.request_number || ' has been rejected by '
    || v_actor.full_name || '. Reason: ' || trim(p_rejection_reason)
  );

  -- 12. Audit log
  insert into public.audit_logs (
    actor_employee_id, action, entity_type, entity_id, metadata
  ) values (
    v_actor_id, 'LEAVE_REQUEST_REJECTED', 'leave_request', p_request_id,
    jsonb_build_object(
      'request_number', v_request.request_number,
      'employee_id', v_request.employee_id,
      'rejection_reason', trim(p_rejection_reason),
      'requested_days', v_request.requested_days
    )
  );

  -- 13. Return result
  return jsonb_build_object(
    'success', true,
    'request_id', p_request_id,
    'request_number', v_request.request_number
  );
end;
$$;

revoke execute on function public.reject_leave_request(uuid, text) from public;
grant execute on function public.reject_leave_request(uuid, text) to authenticated;
