-- Migration: Fix manager RLS policy to allow department-based access
-- Previously managers could only see direct reports (manager_id = self).
-- Now managers can see all employees in the same department.

-- Drop the old policy
drop policy if exists "employees_select_manager_reports" on public.employees;

-- Create new policy: Manager can read all employees in same department
create policy "employees_select_manager_department"
  on public.employees for select
  to authenticated
  using (
    department_id = (
      select e.department_id
      from public.employees e
      where e.auth_user_id = auth.uid()
      and e.role = 'MANAGER'
    )
  );
