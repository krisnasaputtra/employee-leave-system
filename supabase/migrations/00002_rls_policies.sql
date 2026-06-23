-- =============================================================
-- Migration: Phase 3 — Employee RLS Policies and Helper Functions
-- =============================================================

-- ----- Helper Functions -----
-- These functions resolve the current user's identity and role
-- from the protected employees table, NOT from editable user_metadata.

-- Resolves the current employee ID from the authenticated auth.uid()
create or replace function public.current_employee_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select id from public.employees where auth_user_id = auth.uid()
$$;

-- Resolves the current application role from the protected employees table
create or replace function public.current_application_role()
returns public.application_role
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.employees where auth_user_id = auth.uid()
$$;

-- Checks if the current user is an ADMIN
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.employees
    where auth_user_id = auth.uid()
      and role = 'ADMIN'
      and status = 'ACTIVE'
  )
$$;

-- Checks if the current user is the manager of the target employee
create or replace function public.is_manager_of(target_employee_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.employees
    where id = target_employee_id
      and manager_id = public.current_employee_id()
  )
$$;

-- Revoke broad execute rights on helper functions
revoke execute on function public.current_employee_id() from public;
grant execute on function public.current_employee_id() to authenticated;

revoke execute on function public.current_application_role() from public;
grant execute on function public.current_application_role() to authenticated;

revoke execute on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

revoke execute on function public.is_manager_of(uuid) from public;
grant execute on function public.is_manager_of(uuid) to authenticated;

-- =============================================================
-- EMPLOYEES TABLE — RLS Policies
-- =============================================================

-- SELECT: Employees can read their own record
create policy "employees_select_own"
  on public.employees for select
  to authenticated
  using (auth_user_id = auth.uid());

-- SELECT: Admin can read all employees
create policy "employees_select_admin"
  on public.employees for select
  to authenticated
  using (public.is_admin());

-- SELECT: Manager can read direct reports
create policy "employees_select_manager_reports"
  on public.employees for select
  to authenticated
  using (manager_id = public.current_employee_id());

-- INSERT: Admin only
create policy "employees_insert_admin"
  on public.employees for insert
  to authenticated
  with check (public.is_admin());

-- UPDATE: Admin can update any employee
create policy "employees_update_admin"
  on public.employees for update
  to authenticated
  using (public.is_admin());

-- UPDATE: Employees can update only safe own fields (NOT role, NOT status)
-- This policy allows the update to proceed; the actual field restriction
-- is enforced by the application layer (server actions validate which
-- fields are permitted). The RLS check ensures they can only target their own row.
create policy "employees_update_own_safe"
  on public.employees for update
  to authenticated
  using (auth_user_id = auth.uid())
  with check (
    auth_user_id = auth.uid()
    -- Prevent role self-escalation: role must not change
    and role = (select e.role from public.employees e where e.id = id)
    -- Prevent status self-update: status must not change
    and status = (select e.status from public.employees e where e.id = id)
  );

-- =============================================================
-- DEPARTMENTS TABLE — RLS Policies
-- =============================================================

-- SELECT: All authenticated users can read departments
create policy "departments_select_authenticated"
  on public.departments for select
  to authenticated
  using (true);

-- INSERT/UPDATE: Admin only
create policy "departments_insert_admin"
  on public.departments for insert
  to authenticated
  with check (public.is_admin());

create policy "departments_update_admin"
  on public.departments for update
  to authenticated
  using (public.is_admin());

-- =============================================================
-- LEAVE_TYPES TABLE — RLS Policies
-- =============================================================

-- SELECT: All authenticated users can read active leave types
create policy "leave_types_select_authenticated"
  on public.leave_types for select
  to authenticated
  using (true);

-- INSERT/UPDATE: Admin only
create policy "leave_types_insert_admin"
  on public.leave_types for insert
  to authenticated
  with check (public.is_admin());

create policy "leave_types_update_admin"
  on public.leave_types for update
  to authenticated
  using (public.is_admin());

-- =============================================================
-- HOLIDAYS TABLE — RLS Policies
-- =============================================================

-- SELECT: All authenticated can read
create policy "holidays_select_authenticated"
  on public.holidays for select
  to authenticated
  using (true);

-- INSERT/UPDATE: Admin only
create policy "holidays_insert_admin"
  on public.holidays for insert
  to authenticated
  with check (public.is_admin());

create policy "holidays_update_admin"
  on public.holidays for update
  to authenticated
  using (public.is_admin());

-- =============================================================
-- LEAVE_BALANCES TABLE — RLS Policies
-- =============================================================

-- SELECT: Employee reads own balances
create policy "leave_balances_select_own"
  on public.leave_balances for select
  to authenticated
  using (employee_id = public.current_employee_id());

-- SELECT: Admin reads all
create policy "leave_balances_select_admin"
  on public.leave_balances for select
  to authenticated
  using (public.is_admin());

-- SELECT: Manager reads direct report balances
create policy "leave_balances_select_manager"
  on public.leave_balances for select
  to authenticated
  using (public.is_manager_of(employee_id));

-- INSERT/UPDATE: Admin only
create policy "leave_balances_insert_admin"
  on public.leave_balances for insert
  to authenticated
  with check (public.is_admin());

create policy "leave_balances_update_admin"
  on public.leave_balances for update
  to authenticated
  using (public.is_admin());

-- =============================================================
-- LEAVE_REQUESTS TABLE — RLS Policies
-- =============================================================

-- SELECT: Employee reads own requests
create policy "leave_requests_select_own"
  on public.leave_requests for select
  to authenticated
  using (employee_id = public.current_employee_id());

-- SELECT: Admin reads all
create policy "leave_requests_select_admin"
  on public.leave_requests for select
  to authenticated
  using (public.is_admin());

-- SELECT: Manager reads direct report requests
create policy "leave_requests_select_manager"
  on public.leave_requests for select
  to authenticated
  using (public.is_manager_of(employee_id));

-- INSERT: Authenticated users create own requests only
create policy "leave_requests_insert_own"
  on public.leave_requests for insert
  to authenticated
  with check (employee_id = public.current_employee_id());

-- UPDATE: Owner can update own PENDING request
create policy "leave_requests_update_own_pending"
  on public.leave_requests for update
  to authenticated
  using (
    employee_id = public.current_employee_id()
    and status = 'PENDING'
  );

-- UPDATE: Admin can update any request (for approval/rejection)
create policy "leave_requests_update_admin"
  on public.leave_requests for update
  to authenticated
  using (public.is_admin());

-- UPDATE: Manager can update direct report requests (for approval/rejection)
create policy "leave_requests_update_manager"
  on public.leave_requests for update
  to authenticated
  using (public.is_manager_of(employee_id));

-- =============================================================
-- LEAVE_BALANCE_TRANSACTIONS TABLE — RLS Policies
-- =============================================================

-- SELECT: Employee reads own transactions (via leave_balance)
create policy "lbt_select_own"
  on public.leave_balance_transactions for select
  to authenticated
  using (
    exists (
      select 1 from public.leave_balances lb
      where lb.id = leave_balance_id
        and lb.employee_id = public.current_employee_id()
    )
  );

-- SELECT: Admin reads all
create policy "lbt_select_admin"
  on public.leave_balance_transactions for select
  to authenticated
  using (public.is_admin());

-- INSERT: Admin only (via service)
create policy "lbt_insert_admin"
  on public.leave_balance_transactions for insert
  to authenticated
  with check (public.is_admin());

-- =============================================================
-- NOTIFICATIONS TABLE — RLS Policies
-- =============================================================

-- SELECT: Employee reads own notifications
create policy "notifications_select_own"
  on public.notifications for select
  to authenticated
  using (employee_id = public.current_employee_id());

-- INSERT: Admin or system (via admin client typically)
create policy "notifications_insert_admin"
  on public.notifications for insert
  to authenticated
  with check (public.is_admin());

-- UPDATE: Employee can mark own notifications as read
create policy "notifications_update_own"
  on public.notifications for update
  to authenticated
  using (employee_id = public.current_employee_id());

-- =============================================================
-- AUDIT_LOGS TABLE — RLS Policies
-- =============================================================

-- SELECT: Admin only
create policy "audit_logs_select_admin"
  on public.audit_logs for select
  to authenticated
  using (public.is_admin());

-- INSERT: All authenticated can write audit logs
-- (typically done by server actions, not direct client writes)
create policy "audit_logs_insert_authenticated"
  on public.audit_logs for insert
  to authenticated
  with check (true);
