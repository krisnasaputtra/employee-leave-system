-- =============================================================
-- pgTAP Tests: Cloud SQL Editor Compatible Version
-- =============================================================
-- INSTRUCTIONS:
-- 1. Buka Supabase Dashboard → SQL Editor
-- 2. Jalankan: create extension if not exists pgtap;
-- 3. Paste & jalankan script ini
-- 4. Semua data test di-ROLLBACK di akhir (tidak ada sisa)
--
-- CATATAN:
-- - SQL Editor jalan sebagai postgres (superuser) → bypass RLS
-- - Test RLS yang butuh role switching TIDAK bisa di cloud
-- - Script ini fokus pada RPC LOGIC tests (SECURITY DEFINER)
-- - RPC secara internal set_config & cek auth context
-- =============================================================

begin;

-- Enable pgTAP
create extension if not exists pgtap;

select plan(30);

-- =============================================================
-- Setup: Create test data
-- =============================================================

-- Create test auth users
insert into auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
values
  ('a0000000-0000-0000-0000-000000000001', 'admin_test@test.com', crypt('password123', gen_salt('bf')), now(), '{}'),
  ('a0000000-0000-0000-0000-000000000002', 'manager_test@test.com', crypt('password123', gen_salt('bf')), now(), '{}'),
  ('a0000000-0000-0000-0000-000000000003', 'employee_test@test.com', crypt('password123', gen_salt('bf')), now(), '{}'),
  ('a0000000-0000-0000-0000-000000000004', 'unrelated_test@test.com', crypt('password123', gen_salt('bf')), now(), '{}');

-- Create department
insert into public.departments (id, name, code, is_active)
values ('d0000000-0000-0000-0000-000000000001', 'Test Engineering', 'TENG', true);

-- Create leave type
insert into public.leave_types (id, code, name, color, default_days, deducts_balance, is_active, requires_attachment)
values ('lt000000-0000-0000-0000-000000000001', 'TEST_ANN', 'Test Annual Leave', '#4CAF50', 12, true, true, false);

-- Create employees
insert into public.employees (id, auth_user_id, employee_code, full_name, email, role, department_id, status)
values
  ('e0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'TADM01', 'Test Admin', 'admin_test@test.com', 'ADMIN', 'd0000000-0000-0000-0000-000000000001', 'ACTIVE'),
  ('e0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 'TMGR01', 'Test Manager', 'manager_test@test.com', 'MANAGER', 'd0000000-0000-0000-0000-000000000001', 'ACTIVE'),
  ('e0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000003', 'TEMP01', 'Test Employee', 'employee_test@test.com', 'EMPLOYEE', 'd0000000-0000-0000-0000-000000000001', 'ACTIVE'),
  ('e0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000004', 'TEMP02', 'Test Unrelated', 'unrelated_test@test.com', 'EMPLOYEE', 'd0000000-0000-0000-0000-000000000001', 'ACTIVE');

-- Set manager for employees
update public.employees set manager_id = 'e0000000-0000-0000-0000-000000000002'
where id in ('e0000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000004');

-- =============================================================
-- Helper: simulate auth context (same as RPC internals use)
-- =============================================================
create or replace function pg_temp.set_auth(p_user_id uuid)
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

-- =============================================================
-- TEST 1: current_employee_id returns correct employee
-- =============================================================
select pg_temp.set_auth('a0000000-0000-0000-0000-000000000003');

select is(
  public.current_employee_id(),
  'e0000000-0000-0000-0000-000000000003'::uuid,
  'TEST 1: current_employee_id returns correct employee'
);

-- =============================================================
-- TEST 2-3: is_admin helper
-- =============================================================
select pg_temp.set_auth('a0000000-0000-0000-0000-000000000001');

select ok(
  public.is_admin(),
  'TEST 2: is_admin = true for ADMIN'
);

select pg_temp.set_auth('a0000000-0000-0000-0000-000000000003');

select ok(
  not public.is_admin(),
  'TEST 3: is_admin = false for EMPLOYEE'
);

-- =============================================================
-- TEST 4-6: initialize_employee_balances RPC
-- =============================================================
select pg_temp.set_auth('a0000000-0000-0000-0000-000000000001');

select lives_ok(
  $$ select public.initialize_employee_balances(
    'e0000000-0000-0000-0000-000000000003'::uuid,
    extract(year from current_date)::integer
  ) $$,
  'TEST 4: Admin can initialize employee balances'
);

select is(
  (select count(*)::integer from public.leave_balances
   where employee_id = 'e0000000-0000-0000-0000-000000000003'
     and balance_year = extract(year from current_date)::integer),
  1,
  'TEST 5: Balance record created'
);

select is(
  (select entitled_days from public.leave_balances
   where employee_id = 'e0000000-0000-0000-0000-000000000003'
     and balance_year = extract(year from current_date)::integer
     and leave_type_id = 'lt000000-0000-0000-0000-000000000001'),
  12::numeric,
  'TEST 6: Entitled days = 12 (matches leave type default)'
);

-- =============================================================
-- TEST 7: Employee CANNOT initialize own balances
-- =============================================================
select pg_temp.set_auth('a0000000-0000-0000-0000-000000000003');

select throws_ok(
  $$ select public.initialize_employee_balances(
    'e0000000-0000-0000-0000-000000000003'::uuid,
    extract(year from current_date)::integer
  ) $$,
  null,
  null,
  'TEST 7: Employee cannot initialize own balances'
);

-- =============================================================
-- TEST 8-9: adjust_leave_balance RPC
-- =============================================================
select pg_temp.set_auth('a0000000-0000-0000-0000-000000000001');

select lives_ok(
  $$ select public.adjust_leave_balance(
    'e0000000-0000-0000-0000-000000000003'::uuid,
    'lt000000-0000-0000-0000-000000000001'::uuid,
    extract(year from current_date)::integer,
    2,
    'Bonus days test'
  ) $$,
  'TEST 8: Admin can adjust leave balance'
);

select is(
  (select adjustment_days from public.leave_balances
   where employee_id = 'e0000000-0000-0000-0000-000000000003'
     and balance_year = extract(year from current_date)::integer
     and leave_type_id = 'lt000000-0000-0000-0000-000000000001'),
  2::numeric,
  'TEST 9: Adjustment days = 2'
);

-- =============================================================
-- TEST 10: Ledger entry created for adjustment
-- =============================================================
select is(
  (select count(*)::integer from public.leave_balance_transactions
   where employee_id = 'e0000000-0000-0000-0000-000000000003'
     and transaction_type = 'ADJUSTMENT'),
  1,
  'TEST 10: Ledger entry created for adjustment'
);

-- =============================================================
-- TEST 11-13: create_leave_request RPC
-- =============================================================
select pg_temp.set_auth('a0000000-0000-0000-0000-000000000003');

select lives_ok(
  $$ select public.create_leave_request(
    'lt000000-0000-0000-0000-000000000001'::uuid,
    (current_date + interval '1 day')::date,
    (current_date + interval '3 days')::date,
    'NONE',
    'Test reason for leave'
  ) $$,
  'TEST 11: Employee can create leave request'
);

select is(
  (select status from public.leave_requests
   where employee_id = 'e0000000-0000-0000-0000-000000000003'
   order by created_at desc limit 1),
  'PENDING'::public.leave_request_status,
  'TEST 12: Request created with PENDING status'
);

select ok(
  (select pending_days > 0 from public.leave_balances
   where employee_id = 'e0000000-0000-0000-0000-000000000003'
     and leave_type_id = 'lt000000-0000-0000-0000-000000000001'
     and balance_year = extract(year from current_date)::integer),
  'TEST 13: Pending days reserved in balance'
);

-- =============================================================
-- TEST 14: Self-approval BLOCKED
-- =============================================================

-- Init manager balances and create manager request
select pg_temp.set_auth('a0000000-0000-0000-0000-000000000001');
select public.initialize_employee_balances(
  'e0000000-0000-0000-0000-000000000002'::uuid,
  extract(year from current_date)::integer
);

select pg_temp.set_auth('a0000000-0000-0000-0000-000000000002');
select public.create_leave_request(
  'lt000000-0000-0000-0000-000000000001'::uuid,
  (current_date + interval '15 days')::date,
  (current_date + interval '16 days')::date,
  'NONE',
  'Manager self leave'
);

do $$ declare v_req_id uuid; begin
  select id into v_req_id from public.leave_requests
  where employee_id = 'e0000000-0000-0000-0000-000000000002'
  order by created_at desc limit 1;
  perform set_config('test.manager_req', v_req_id::text, false);
end $$;

select throws_ok(
  format(
    $q$ select public.approve_leave_request('%s'::uuid) $q$,
    current_setting('test.manager_req')
  ),
  null,
  null,
  'TEST 14: Manager CANNOT approve own request'
);

-- =============================================================
-- TEST 15-20: approve_leave_request RPC
-- =============================================================

-- Get employee request ID & pre-approval balance
do $$ declare v_req_id uuid; v_used numeric; v_pending numeric; begin
  select id into v_req_id from public.leave_requests
  where employee_id = 'e0000000-0000-0000-0000-000000000003'
  order by created_at desc limit 1;
  perform set_config('test.emp_req', v_req_id::text, false);

  select used_days, pending_days into v_used, v_pending from public.leave_balances
  where employee_id = 'e0000000-0000-0000-0000-000000000003'
    and leave_type_id = 'lt000000-0000-0000-0000-000000000001'
    and balance_year = extract(year from current_date)::integer;
  perform set_config('test.pre_used', v_used::text, false);
  perform set_config('test.pre_pending', v_pending::text, false);
end $$;

select pg_temp.set_auth('a0000000-0000-0000-0000-000000000002');

select lives_ok(
  format(
    $q$ select public.approve_leave_request('%s'::uuid) $q$,
    current_setting('test.emp_req')
  ),
  'TEST 15: Manager can approve direct report request'
);

select is(
  (select status from public.leave_requests
   where id = current_setting('test.emp_req')::uuid),
  'APPROVED'::public.leave_request_status,
  'TEST 16: Status changed to APPROVED'
);

select ok(
  (select used_days > current_setting('test.pre_used')::numeric from public.leave_balances
   where employee_id = 'e0000000-0000-0000-0000-000000000003'
     and leave_type_id = 'lt000000-0000-0000-0000-000000000001'
     and balance_year = extract(year from current_date)::integer),
  'TEST 17: Used days INCREASED after approval'
);

select ok(
  (select pending_days < current_setting('test.pre_pending')::numeric from public.leave_balances
   where employee_id = 'e0000000-0000-0000-0000-000000000003'
     and leave_type_id = 'lt000000-0000-0000-0000-000000000001'
     and balance_year = extract(year from current_date)::integer),
  'TEST 18: Pending days DECREASED after approval'
);

select ok(
  (select count(*) > 0 from public.notifications
   where employee_id = 'e0000000-0000-0000-0000-000000000003'
     and title ilike '%approved%'),
  'TEST 19: Notification created after approval'
);

select ok(
  (select count(*) > 0 from public.audit_logs
   where action = 'LEAVE_APPROVED'),
  'TEST 20: Audit log created for approval'
);

-- =============================================================
-- TEST 21: Duplicate approval BLOCKED
-- =============================================================
select throws_ok(
  format(
    $q$ select public.approve_leave_request('%s'::uuid) $q$,
    current_setting('test.emp_req')
  ),
  null,
  null,
  'TEST 21: Cannot approve already-approved request'
);

-- =============================================================
-- TEST 22: Calendar shows approved leave
-- =============================================================
select pg_temp.set_auth('a0000000-0000-0000-0000-000000000004');

select ok(
  (select count(*) > 0 from public.get_calendar_events(
    (current_date - interval '1 day')::date,
    (current_date + interval '30 days')::date,
    null, null, null
  )),
  'TEST 22: Approved leave visible in calendar'
);

-- =============================================================
-- TEST 23-25: reject_leave_request RPC
-- =============================================================
select pg_temp.set_auth('a0000000-0000-0000-0000-000000000003');
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
  perform set_config('test.reject_req', v_req_id::text, false);
end $$;

select pg_temp.set_auth('a0000000-0000-0000-0000-000000000002');

select lives_ok(
  format(
    $q$ select public.reject_leave_request('%s'::uuid, 'Not enough coverage') $q$,
    current_setting('test.reject_req')
  ),
  'TEST 23: Manager can reject leave request'
);

select is(
  (select status from public.leave_requests
   where id = current_setting('test.reject_req')::uuid),
  'REJECTED'::public.leave_request_status,
  'TEST 24: Status changed to REJECTED'
);

select ok(
  (select count(*) > 0 from public.notifications
   where employee_id = 'e0000000-0000-0000-0000-000000000003'
     and title ilike '%rejected%'),
  'TEST 25: Rejection notification created'
);

-- =============================================================
-- TEST 26-28: cancel_leave_request RPC
-- =============================================================
select pg_temp.set_auth('a0000000-0000-0000-0000-000000000003');
select public.create_leave_request(
  'lt000000-0000-0000-0000-000000000001'::uuid,
  (current_date + interval '25 days')::date,
  (current_date + interval '26 days')::date,
  'NONE',
  'Request to cancel'
);

do $$ declare v_req_id uuid; v_pending numeric; begin
  select id into v_req_id from public.leave_requests
  where employee_id = 'e0000000-0000-0000-0000-000000000003'
    and status = 'PENDING'
  order by created_at desc limit 1;
  perform set_config('test.cancel_req', v_req_id::text, false);

  select pending_days into v_pending from public.leave_balances
  where employee_id = 'e0000000-0000-0000-0000-000000000003'
    and leave_type_id = 'lt000000-0000-0000-0000-000000000001'
    and balance_year = extract(year from current_date)::integer;
  perform set_config('test.pre_cancel_pending', v_pending::text, false);
end $$;

select lives_ok(
  format(
    $q$ select public.cancel_leave_request('%s'::uuid) $q$,
    current_setting('test.cancel_req')
  ),
  'TEST 26: Employee can cancel own pending request'
);

select is(
  (select status from public.leave_requests
   where id = current_setting('test.cancel_req')::uuid),
  'CANCELLED'::public.leave_request_status,
  'TEST 27: Status changed to CANCELLED'
);

select ok(
  (select pending_days < current_setting('test.pre_cancel_pending')::numeric from public.leave_balances
   where employee_id = 'e0000000-0000-0000-0000-000000000003'
     and leave_type_id = 'lt000000-0000-0000-0000-000000000001'
     and balance_year = extract(year from current_date)::integer),
  'TEST 28: Pending days released after cancellation'
);

-- =============================================================
-- TEST 29-30: Unrelated employee cannot use RPCs on others
-- =============================================================
select pg_temp.set_auth('a0000000-0000-0000-0000-000000000004');

-- Unrelated employee cannot approve
select throws_ok(
  format(
    $q$ select public.approve_leave_request('%s'::uuid) $q$,
    current_setting('test.manager_req')
  ),
  null,
  null,
  'TEST 29: Unrelated employee cannot approve requests'
);

-- Unrelated employee cannot cancel other's request
-- (Manager's request is still PENDING)
select throws_ok(
  format(
    $q$ select public.cancel_leave_request('%s'::uuid) $q$,
    current_setting('test.manager_req')
  ),
  null,
  null,
  'TEST 30: Unrelated employee cannot cancel others request'
);

-- =============================================================
-- Results + ROLLBACK (no test data persisted)
-- =============================================================
select * from finish();
rollback;
