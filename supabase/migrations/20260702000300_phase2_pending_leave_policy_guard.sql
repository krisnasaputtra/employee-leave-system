-- =============================================================
-- Phase 2: Pending leave request policy guard
-- =============================================================
-- Enforces date and leave-policy rules at the database boundary so
-- authenticated clients cannot bypass server actions by calling Supabase
-- directly.
-- =============================================================

create or replace function public.enforce_pending_leave_request_policy()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_policy record;
  v_notice_days integer;
  v_calculated_days numeric(6,2);
begin
  if new.status != 'PENDING' then
    return new;
  end if;

  if new.start_date < current_date then
    raise exception 'Start date cannot be in the past';
  end if;

  if new.end_date < new.start_date then
    raise exception 'End date cannot be before start date';
  end if;

  select *
  into v_policy
  from public.leave_policies
  where leave_type_id = new.leave_type_id;

  if v_policy.id is not null then
    v_notice_days := new.start_date - current_date;

    if v_notice_days < v_policy.notice_period_days then
      raise exception 'Policy Violation: This leave type requires at least % days of notice. You provided % days.',
        v_policy.notice_period_days,
        v_notice_days;
    end if;

    if v_policy.max_consecutive_days is not null then
      v_calculated_days := public.calculate_leave_days(new.start_date, new.end_date, new.partial_day);

      if v_calculated_days > v_policy.max_consecutive_days then
        raise exception 'Policy Violation: This leave type allows a maximum of % consecutive working days.',
          v_policy.max_consecutive_days;
      end if;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_pending_leave_request_policy_trigger
  on public.leave_requests;

create trigger enforce_pending_leave_request_policy_trigger
  before insert or update of leave_type_id, start_date, end_date, partial_day, status
  on public.leave_requests
  for each row
  execute function public.enforce_pending_leave_request_policy();

revoke execute on function public.enforce_pending_leave_request_policy() from public;
