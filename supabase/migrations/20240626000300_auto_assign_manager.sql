-- =============================================================
-- Migration: Auto-assign manager & propagate department manager
-- =============================================================
-- 1. Trigger: auto_assign_manager
--    When employee is created or department changes → set manager_id
--    to departments.manager_employee_id automatically
--
-- 2. Trigger: propagate_dept_manager
--    When departments.manager_employee_id changes → update all
--    employees in that department to point to the new manager
-- =============================================================

-- ----- FUNCTION: auto_assign_manager -----
create or replace function public.auto_assign_manager()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_dept_manager_id uuid;
begin
  -- Look up the department's manager
  select manager_employee_id into v_dept_manager_id
  from public.departments
  where id = NEW.department_id;

  -- Assign if found and not self
  if v_dept_manager_id is not null and v_dept_manager_id != NEW.id then
    NEW.manager_id := v_dept_manager_id;
  end if;

  return NEW;
end;
$$;

-- Fire on INSERT or when department_id changes
-- Only auto-assign if manager_id is not explicitly set (NULL)
drop trigger if exists trg_auto_assign_manager on public.employees;
create trigger trg_auto_assign_manager
  before insert on public.employees
  for each row
  when (NEW.manager_id is null)
  execute function public.auto_assign_manager();

-- Also fire when department changes (always re-assign)
drop trigger if exists trg_auto_assign_manager_on_dept_change on public.employees;
create trigger trg_auto_assign_manager_on_dept_change
  before update of department_id on public.employees
  for each row
  when (OLD.department_id is distinct from NEW.department_id)
  execute function public.auto_assign_manager();


-- ----- FUNCTION: propagate_dept_manager -----
create or replace function public.propagate_dept_manager()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- When a department's manager changes, update all employees in that dept
  if NEW.manager_employee_id is distinct from OLD.manager_employee_id
     and NEW.manager_employee_id is not null then
    update public.employees
    set manager_id = NEW.manager_employee_id
    where department_id = NEW.id
      and id != NEW.manager_employee_id  -- manager doesn't report to self
      and status = 'ACTIVE';
  end if;

  return NEW;
end;
$$;

drop trigger if exists trg_propagate_dept_manager on public.departments;
create trigger trg_propagate_dept_manager
  after update of manager_employee_id on public.departments
  for each row
  execute function public.propagate_dept_manager();


-- ----- BACKFILL: Set manager_id for existing employees -----
-- For each active employee without a manager_id, set it to their department's manager
update public.employees e
set manager_id = d.manager_employee_id
from public.departments d
where e.department_id = d.id
  and e.manager_id is null
  and d.manager_employee_id is not null
  and e.id != d.manager_employee_id;
