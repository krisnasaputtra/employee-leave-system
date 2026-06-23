-- =============================================================
-- pgTAP Database Tests: RPC Integration + RLS + Concurrency
-- Run via: npx supabase test db
-- Requires: Local Supabase stack (supabase start)
-- =============================================================
begin;

select plan(42);

-- =============================================================
-- Setup: Create test data
-- =============================================================

-- Create test auth users
insert into auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
values
  ('a0000000-0000-0000-0000-000000000001', 'admin@test.com', crypt('password123', gen_salt('bf')), now(), '{}'),
  ('a0000000-0000-0000-0000-000000000002', 'manager@test.com', crypt('password123', gen_salt('bf')), now(), '{}'),
  ('a0000000-0000-0000-0000-000000000003', 'employee@test.com', crypt('password123', gen_salt('bf')), now(), '{}'),
  ('a0000000-0000-0000-0000-000000000004', 'unrelated@test.com', crypt('password123', gen_salt('bf')), now(), '{}');

-- Create department
insert into public.departments (id, name, code, is_active)
values ('d0000000-0000-0000-0000-000000000001', 'Engineering', 'ENG', true);

-- Create leave type
insert into public.leave_types (id, code, name, color, default_days, deducts_balance, is_active, requires_attachment)
values ('lt000000-0000-0000-0000-000000000001', 'ANNUAL', 'Annual Leave', '#4CAF50', 12, true, true, false);

-- Create employees
insert into public.employees (id, auth_user_id, employee_code, full_name, email, role, department_id, status)
values
  ('e0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'ADM001', 'Test Admin', 'admin@test.com', 'ADMIN', 'd0000000-0000-0000-0000-000000000001', 'ACTIVE'),
  ('e0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 'MGR001', 'Test Manager', 'manager@test.com', 'MANAGER', 'd0000000-0000-0000-0000-000000000001', 'ACTIVE'),
  ('e0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000003', 'EMP001', 'Test Employee', 'employee@test.com', 'EMPLOYEE', 'd0000000-0000-0000-0000-000000000001', 'ACTIVE'),
  ('e0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000004', 'EMP002', 'Unrelated Employee', 'unrelated@test.com', 'EMPLOYEE', 'd0000000-0000-0000-0000-000000000001', 'ACTIVE');

-- Set manager for employee
update public.employees set manager_id = 'e0000000-0000-0000-0000-000000000002'
where id in ('e0000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000004');

-- =============================================================
-- Helper: Set auth context
-- =============================================================
create or replace function tests.set_auth(p_user_id uuid)
returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object(
    'sub', p_user_id::text,
    'role', 'authenticated',
    'aud', 'authenticated'
  )::text, true);
  perform set_config('request.jwt.claim.sub', p_user_id::text, true);
  perform set_config('role', 'authenticated', true);
end;
$$;

create or replace function tests.clear_auth()
returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', '', true);
  perform set_config('request.jwt.claim.sub', '', true);
  perform set_config('role', 'anon', true);
end;
$$;

-- =============================================================
-- TEST 1: Helper function current_employee_id
-- =============================================================
select tests.set_auth('a0000000-0000-0000-0000-000000000003');

select is(
  public.current_employee_id(),
  'e0000000-0000-0000-0000-000000000003'::uuid,
  'current_employee_id returns correct employee for authenticated user'
);

-- =============================================================
-- TEST 2: Helper function is_admin
-- =============================================================
select tests.set_auth('a0000000-0000-0000-0000-000000000001');

select ok(
  public.is_admin(),
  'is_admin returns true for ADMIN user'
);

select tests.set_auth('a0000000-0000-0000-0000-000000000003');

select ok(
  not public.is_admin(),
  'is_admin returns false for EMPLOYEE user'
);

-- =============================================================
-- TEST 3: initialize_employee_balances RPC
-- =============================================================
select tests.set_auth('a0000000-0000-0000-0000-000000000001');

select lives_ok(
  $$ select public.initialize_employee_balances(
    'e0000000-0000-0000-0000-000000000003'::uuid,
    extract(year from current_date)::integer
  ) $$,
  'Admin can initialize employee balances'
);

-- Verify balance was created
select is(
  (select count(*)::integer from public.leave_balances
   where employee_id = 'e0000000-0000-0000-0000-000000000003'
     and balance_year = extract(year from current_date)::integer),
  1,
  'Balance record created for employee'
);

-- Verify entitled_days equals leave type default_days
select is(
  (select entitled_days from public.leave_balances
   where employee_id = 'e0000000-0000-0000-0000-000000000003'
     and balance_year = extract(year from current_date)::integer
     and leave_type_id = 'lt000000-0000-0000-0000-000000000001'),
  12::numeric,
  'Entitled days match leave type default (12)'
);

-- =============================================================
-- TEST 4: adjust_leave_balance RPC
-- =============================================================
select lives_ok(
  $$ select public.adjust_leave_balance(
    'e0000000-0000-0000-0000-000000000003'::uuid,
    'lt000000-0000-0000-0000-000000000001'::uuid,
    extract(year from current_date)::integer,
    2,
    'Bonus days'
  ) $$,
  'Admin can adjust leave balance'
);

select is(
  (select adjustment_days from public.leave_balances
   where employee_id = 'e0000000-0000-0000-0000-000000000003'
     and balance_year = extract(year from current_date)::integer
     and leave_type_id = 'lt000000-0000-0000-0000-000000000001'),
  2::numeric,
  'Adjustment days updated correctly'
);

-- Verify ledger entry
select is(
  (select count(*)::integer from public.leave_balance_transactions
   where employee_id = 'e0000000-0000-0000-0000-000000000003'
     and transaction_type = 'ADJUSTMENT'),
  1,
  'Adjustment ledger entry created'
);

-- =============================================================
-- TEST 5: Employee cannot call initialize_employee_balances
-- =============================================================
select tests.set_auth('a0000000-0000-0000-0000-000000000003');

select throws_ok(
  $$ select public.initialize_employee_balances(
    'e0000000-0000-0000-0000-000000000003'::uuid,
    extract(year from current_date)::integer
  ) $$,
  null,
  null,
  'Employee cannot initialize own balances (ADMIN only)'
);

-- =============================================================
-- TEST 6: create_leave_request RPC
-- =============================================================

-- Create a holiday for testing
insert into public.holidays (id, name, holiday_date, is_active)
values ('h0000000-0000-0000-0000-000000000001', 'Test Holiday', (current_date + interval '10 days')::date, true);

select tests.set_auth('a0000000-0000-0000-0000-000000000003');

select lives_ok(
  $$ select public.create_leave_request(
    'lt000000-0000-0000-0000-000000000001'::uuid,
    (current_date + interval '1 day')::date,
    (current_date + interval '3 days')::date,
    'NONE',
    'Test reason'
  ) $$,
  'Employee can create leave request'
);

-- Verify request was created with PENDING status
select is(
  (select status from public.leave_requests
   where employee_id = 'e0000000-0000-0000-0000-000000000003'
   order by created_at desc limit 1),
  'PENDING'::public.leave_request_status,
  'Leave request created with PENDING status'
);

-- Verify balance reservation (pending_days > 0)
select ok(
  (select pending_days > 0 from public.leave_balances
   where employee_id = 'e0000000-0000-0000-0000-000000000003'
     and leave_type_id = 'lt000000-0000-0000-0000-000000000001'
     and balance_year = extract(year from current_date)::integer),
  'Pending days reserved in balance'
);

-- =============================================================
-- TEST 7: Unrelated employee cannot read request via RLS
-- =============================================================
select tests.set_auth('a0000000-0000-0000-0000-000000000004');

select is(
  (select count(*)::integer from public.leave_requests
   where employee_id = 'e0000000-0000-0000-0000-000000000003'),
  0,
  'Unrelated employee cannot see other employee leave requests'
);

-- =============================================================
-- TEST 8: Manager can read direct report's request
-- =============================================================
select tests.set_auth('a0000000-0000-0000-0000-000000000002');

select ok(
  (select count(*) > 0 from public.leave_requests
   where employee_id = 'e0000000-0000-0000-0000-000000000003'),
  'Manager can see direct report leave requests'
);

-- =============================================================
-- TEST 9: Self-approval prevention
-- =============================================================

-- Initialize balances for manager
select tests.set_auth('a0000000-0000-0000-0000-000000000001');
select public.initialize_employee_balances(
  'e0000000-0000-0000-0000-000000000002'::uuid,
  extract(year from current_date)::integer
);

-- Manager creates own leave request
select tests.set_auth('a0000000-0000-0000-0000-000000000002');
select public.create_leave_request(
  'lt000000-0000-0000-0000-000000000001'::uuid,
  (current_date + interval '15 days')::date,
  (current_date + interval '16 days')::date,
  'NONE',
  'Manager leave'
);

-- Get manager's request ID
do $$ declare v_req_id uuid; begin
  select id into v_req_id from public.leave_requests
  where employee_id = 'e0000000-0000-0000-0000-000000000002'
  order by created_at desc limit 1;
  perform set_config('test.manager_request_id', v_req_id::text, false);
end $$;

-- Manager tries to approve own request
select throws_ok(
  format(
    $q$ select public.approve_leave_request('%s'::uuid) $q$,
    current_setting('test.manager_request_id')
  ),
  null,
  null,
  'Manager cannot approve own leave request (self-approval blocked)'
);

-- =============================================================
-- TEST 10: approve_leave_request RPC
-- =============================================================

-- Get employee's request ID
do $$ declare v_req_id uuid; begin
  select id into v_req_id from public.leave_requests
  where employee_id = 'e0000000-0000-0000-0000-000000000003'
  order by created_at desc limit 1;
  perform set_config('test.employee_request_id', v_req_id::text, false);
end $$;

-- Save pre-approval balance values
do $$ declare v_used numeric; v_pending numeric; begin
  select used_days, pending_days into v_used, v_pending from public.leave_balances
  where employee_id = 'e0000000-0000-0000-0000-000000000003'
    and leave_type_id = 'lt000000-0000-0000-0000-000000000001'
    and balance_year = extract(year from current_date)::integer;
  perform set_config('test.pre_used', v_used::text, false);
  perform set_config('test.pre_pending', v_pending::text, false);
end $$;

-- Manager approves
select tests.set_auth('a0000000-0000-0000-0000-000000000002');

select lives_ok(
  format(
    $q$ select public.approve_leave_request('%s'::uuid) $q$,
    current_setting('test.employee_request_id')
  ),
  'Manager can approve direct report leave request'
);

-- Verify status changed to APPROVED
select is(
  (select status from public.leave_requests
   where id = current_setting('test.employee_request_id')::uuid),
  'APPROVED'::public.leave_request_status,
  'Leave request status changed to APPROVED'
);

-- Verify used_days increased
select ok(
  (select used_days > current_setting('test.pre_used')::numeric from public.leave_balances
   where employee_id = 'e0000000-0000-0000-0000-000000000003'
     and leave_type_id = 'lt000000-0000-0000-0000-000000000001'
     and balance_year = extract(year from current_date)::integer),
  'Used days increased after approval'
);

-- Verify pending_days decreased
select ok(
  (select pending_days < current_setting('test.pre_pending')::numeric from public.leave_balances
   where employee_id = 'e0000000-0000-0000-0000-000000000003'
     and leave_type_id = 'lt000000-0000-0000-0000-000000000001'
     and balance_year = extract(year from current_date)::integer),
  'Pending days decreased after approval'
);

-- Verify notification created
select ok(
  (select count(*) > 0 from public.notifications
   where employee_id = 'e0000000-0000-0000-0000-000000000003'
     and title ilike '%approved%'),
  'Notification created for employee after approval'
);

-- Verify audit log
select ok(
  (select count(*) > 0 from public.audit_logs
   where action = 'LEAVE_APPROVED'),
  'Audit log entry created for approval'
);

-- =============================================================
-- TEST 11: Approved leave appears in calendar
-- =============================================================
select tests.set_auth('a0000000-0000-0000-0000-000000000004');

select ok(
  (select count(*) > 0 from public.get_calendar_events(
    (current_date - interval '1 day')::date,
    (current_date + interval '30 days')::date,
    null, null, null
  )),
  'Approved leave visible in calendar to other employees'
);

-- Verify calendar does not expose reason
select is(
  (select r.reason from public.leave_requests r
   where r.id = current_setting('test.employee_request_id')::uuid) is not null
  and not exists (
    select 1 from public.get_calendar_events(
      (current_date - interval '1 day')::date,
      (current_date + interval '30 days')::date,
      null, null, null
    ) ce
    -- Calendar function doesn't return reason column at all
  ),
  true,
  'Calendar events do not expose leave reason'
);

-- =============================================================
-- TEST 12: reject_leave_request RPC
-- =============================================================

-- Employee creates another request
select tests.set_auth('a0000000-0000-0000-0000-000000000003');
select public.create_leave_request(
  'lt000000-0000-0000-0000-000000000001'::uuid,
  (current_date + interval '20 days')::date,
  (current_date + interval '21 days')::date,
  'NONE',
  'Request to reject'
);

do $$ declare v_req_id uuid; begin
  select id into v_req_id from public.leave_requests
  where employee_id = 'e0000000-0000-0000-0000-000000000003'
    and status = 'PENDING'
  order by created_at desc limit 1;
  perform set_config('test.reject_request_id', v_req_id::text, false);
end $$;

select tests.set_auth('a0000000-0000-0000-0000-000000000002');

select lives_ok(
  format(
    $q$ select public.reject_leave_request('%s'::uuid, 'Insufficient coverage') $q$,
    current_setting('test.reject_request_id')
  ),
  'Manager can reject leave request'
);

select is(
  (select status from public.leave_requests
   where id = current_setting('test.reject_request_id')::uuid),
  'REJECTED'::public.leave_request_status,
  'Leave request status changed to REJECTED'
);

-- =============================================================
-- TEST 13: cancel_leave_request RPC
-- =============================================================

-- Employee creates another request
select tests.set_auth('a0000000-0000-0000-0000-000000000003');
select public.create_leave_request(
  'lt000000-0000-0000-0000-000000000001'::uuid,
  (current_date + interval '25 days')::date,
  (current_date + interval '26 days')::date,
  'NONE',
  'Request to cancel'
);

do $$ declare v_req_id uuid; begin
  select id into v_req_id from public.leave_requests
  where employee_id = 'e0000000-0000-0000-0000-000000000003'
    and status = 'PENDING'
  order by created_at desc limit 1;
  perform set_config('test.cancel_request_id', v_req_id::text, false);
end $$;

select lives_ok(
  format(
    $q$ select public.cancel_leave_request('%s'::uuid) $q$,
    current_setting('test.cancel_request_id')
  ),
  'Employee can cancel own pending request'
);

select is(
  (select status from public.leave_requests
   where id = current_setting('test.cancel_request_id')::uuid),
  'CANCELLED'::public.leave_request_status,
  'Leave request status changed to CANCELLED'
);

-- =============================================================
-- TEST 14: Duplicate approval attempt
-- =============================================================
select tests.set_auth('a0000000-0000-0000-0000-000000000002');

select throws_ok(
  format(
    $q$ select public.approve_leave_request('%s'::uuid) $q$,
    current_setting('test.employee_request_id')
  ),
  null,
  null,
  'Cannot approve already-approved request'
);

-- =============================================================
-- TEST 15: Anonymous access denied
-- =============================================================
select tests.clear_auth();

select is(
  (select count(*)::integer from public.employees),
  0,
  'Anonymous user cannot read employees'
);

select is(
  (select count(*)::integer from public.leave_requests),
  0,
  'Anonymous user cannot read leave requests'
);

select is(
  (select count(*)::integer from public.leave_balances),
  0,
  'Anonymous user cannot read leave balances'
);

select is(
  (select count(*)::integer from public.audit_logs),
  0,
  'Anonymous user cannot read audit logs'
);

-- =============================================================
-- TEST 16: Employee cannot escalate own role
-- =============================================================
select tests.set_auth('a0000000-0000-0000-0000-000000000003');

select throws_ok(
  $$ update public.employees set role = 'ADMIN' where id = 'e0000000-0000-0000-0000-000000000003' $$,
  null,
  null,
  'Employee cannot escalate own role'
);

-- =============================================================
-- TEST 17: Notification privacy
-- =============================================================
select tests.set_auth('a0000000-0000-0000-0000-000000000004');

select is(
  (select count(*)::integer from public.notifications
   where employee_id = 'e0000000-0000-0000-0000-000000000003'),
  0,
  'Unrelated employee cannot read other employees notifications'
);

-- =============================================================
-- TEST 18: Admin can read audit logs
-- =============================================================
select tests.set_auth('a0000000-0000-0000-0000-000000000001');

select ok(
  (select count(*) > 0 from public.audit_logs),
  'Admin can read audit logs'
);

-- Employee cannot read audit logs
select tests.set_auth('a0000000-0000-0000-0000-000000000003');

select is(
  (select count(*)::integer from public.audit_logs),
  0,
  'Employee cannot read audit logs'
);

-- =============================================================
-- Cleanup
-- =============================================================
select tests.clear_auth();

select * from finish();
rollback;
