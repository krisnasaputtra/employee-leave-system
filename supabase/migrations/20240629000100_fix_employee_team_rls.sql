-- Fix: Allow employees to see colleagues in same department (for Team page)
-- Currently only ADMIN and MANAGER can see other employees.

drop policy if exists "employees_select_same_department" on public.employees;

create policy "employees_select_same_department"
  on public.employees for select
  to authenticated
  using (
    department_id = public.current_employee_department_id()
  );
