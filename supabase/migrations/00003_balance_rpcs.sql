-- =============================================================
-- Migration: Leave Balance RPC Functions
-- Phase 5 — Leave Balance and Ledger
-- =============================================================
-- Creates two RPC functions:
--   1. initialize_employee_balances — idempotent balance init
--   2. adjust_leave_balance — admin balance adjustment with ledger
-- =============================================================

-- ----- RPC: initialize_employee_balances -----
-- Called during employee provisioning or yearly reset.
-- Creates one balance row per active, balance-deducting leave type
-- for the given employee and year. Idempotent via ON CONFLICT.
-- Also creates ENTITLEMENT ledger entries for audit trail.

create or replace function public.initialize_employee_balances(
  p_employee_id uuid,
  p_year integer default extract(year from now())::integer
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer := 0;
  v_lt record;
  v_balance_id uuid;
begin
  -- Validate year
  if p_year < 2000 or p_year > 2100 then
    raise exception 'Year must be between 2000 and 2100';
  end if;

  -- Validate employee exists and is active
  if not exists (
    select 1 from public.employees
    where id = p_employee_id and status = 'ACTIVE'
  ) then
    raise exception 'Employee not found or not active';
  end if;

  -- Create balance for each active, balance-deducting leave type
  for v_lt in
    select id, default_entitlement
    from public.leave_types
    where is_active = true and deducts_balance = true
  loop
    insert into public.leave_balances (
      employee_id, leave_type_id, balance_year,
      entitled_days, adjustment_days, used_days, pending_days
    ) values (
      p_employee_id, v_lt.id, p_year,
      v_lt.default_entitlement, 0, 0, 0
    )
    on conflict (employee_id, leave_type_id, balance_year) do nothing
    returning id into v_balance_id;

    -- Only create ledger entry if a new row was inserted
    if v_balance_id is not null then
      insert into public.leave_balance_transactions (
        leave_balance_id, transaction_type, days, reason, actor_employee_id
      ) values (
        v_balance_id, 'ENTITLEMENT', v_lt.default_entitlement,
        'Initial entitlement for year ' || p_year,
        p_employee_id
      );
      v_count := v_count + 1;
    end if;
  end loop;

  return v_count;
end;
$$;

-- Restrict access
revoke execute on function public.initialize_employee_balances(uuid, integer) from public;
grant execute on function public.initialize_employee_balances(uuid, integer) to authenticated;


-- ----- RPC: adjust_leave_balance -----
-- Admin-only adjustment with row locking, ledger entry, notification, and audit.
-- p_days can be positive (add) or negative (deduct).

create or replace function public.adjust_leave_balance(
  p_balance_id uuid,
  p_days numeric(6,2),
  p_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid;
  v_actor_role text;
  v_balance record;
  v_new_adjustment numeric(6,2);
begin
  -- 1. Get actor identity
  v_actor_id := (
    select id from public.employees
    where auth_user_id = auth.uid() and status = 'ACTIVE'
    limit 1
  );
  if v_actor_id is null then
    raise exception 'Not authenticated or not an active employee';
  end if;

  -- 2. Verify admin role
  v_actor_role := (
    select role::text from public.employees
    where id = v_actor_id
  );
  if v_actor_role != 'ADMIN' then
    raise exception 'Only administrators can adjust balances';
  end if;

  -- 3. Validate inputs
  if p_days = 0 then
    raise exception 'Adjustment days cannot be zero';
  end if;
  if p_reason is null or length(trim(p_reason)) < 3 then
    raise exception 'Adjustment reason is required (minimum 3 characters)';
  end if;

  -- 4. Lock and load the balance row
  select * into v_balance
  from public.leave_balances
  where id = p_balance_id
  for update;

  if not found then
    raise exception 'Balance record not found';
  end if;

  -- 5. Calculate new adjustment total
  v_new_adjustment := v_balance.adjustment_days + p_days;

  -- 6. Check if negative balance is allowed
  declare
    v_remaining numeric(6,2);
    v_allow_negative boolean;
  begin
    v_remaining := v_balance.entitled_days + v_new_adjustment - v_balance.used_days;

    select allow_negative_balance into v_allow_negative
    from public.leave_types
    where id = v_balance.leave_type_id;

    if v_remaining < 0 and (v_allow_negative is null or v_allow_negative = false) then
      raise exception 'Adjustment would result in negative balance (%) and this leave type does not allow negative balances', v_remaining;
    end if;
  end;

  -- 7. Update balance
  update public.leave_balances
  set adjustment_days = v_new_adjustment
  where id = p_balance_id;

  -- 8. Write ADJUSTMENT ledger entry
  insert into public.leave_balance_transactions (
    leave_balance_id, transaction_type, days, reason, actor_employee_id
  ) values (
    p_balance_id, 'ADJUSTMENT', p_days, trim(p_reason), v_actor_id
  );

  -- 9. Write notification to employee
  insert into public.notifications (
    employee_id, title, message
  ) values (
    v_balance.employee_id,
    'Leave Balance Adjusted',
    'Your leave balance has been adjusted by ' || p_days || ' day(s). Reason: ' || trim(p_reason)
  );

  -- 10. Write audit log
  insert into public.audit_logs (
    actor_employee_id, action, entity_type, entity_id, metadata
  ) values (
    v_actor_id,
    'BALANCE_ADJUSTED',
    'leave_balance',
    p_balance_id,
    jsonb_build_object(
      'employee_id', v_balance.employee_id,
      'leave_type_id', v_balance.leave_type_id,
      'balance_year', v_balance.balance_year,
      'adjustment_days', p_days,
      'previous_adjustment_total', v_balance.adjustment_days,
      'new_adjustment_total', v_new_adjustment,
      'reason', trim(p_reason)
    )
  );

  -- 11. Return result
  return jsonb_build_object(
    'success', true,
    'balance_id', p_balance_id,
    'new_adjustment_total', v_new_adjustment
  );
end;
$$;

-- Restrict access
revoke execute on function public.adjust_leave_balance(uuid, numeric, text) from public;
grant execute on function public.adjust_leave_balance(uuid, numeric, text) to authenticated;
