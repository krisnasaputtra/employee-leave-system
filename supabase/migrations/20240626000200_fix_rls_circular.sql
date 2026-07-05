-- Fix: employees_select_manager_department policy had circular RLS issue
-- The subquery selected from employees table which itself was under RLS,
-- causing auth lookups to fail for ALL users.
--
-- Solution: Use a security definer function to resolve the department_id
-- bypassing RLS for the lookup.

-- Helper function: resolve current user's department_id (bypasses RLS)
create or replace function public.current_employee_department_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select department_id from public.employees where auth_user_id = auth.uid()
$$;

-- Helper function: resolve current user's role (bypasses RLS)
create or replace function public.current_employee_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select role::text from public.employees where auth_user_id = auth.uid()
$$;

-- Drop the broken policy
drop policy if exists "employees_select_manager_department" on public.employees;

-- Recreate with safe function calls (no circular RLS)
create policy "employees_select_manager_department"
  on public.employees for select
  to authenticated
  using (
    public.current_employee_role() = 'MANAGER'
    and department_id = public.current_employee_department_id()
  );
