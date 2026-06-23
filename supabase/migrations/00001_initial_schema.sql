-- =============================================================
-- Initial Schema Migration
-- Leave Request Management System
-- =============================================================
-- Creates all core tables, enums, indexes, constraints,
-- triggers, and enables RLS on every business table.
-- =============================================================

-- ----- Extensions -----
create extension if not exists "pgcrypto" with schema "extensions";

-- ----- Enums -----

create type public.application_role as enum (
  'ADMIN',
  'MANAGER',
  'EMPLOYEE'
);

create type public.employment_status as enum (
  'ACTIVE',
  'INACTIVE',
  'TERMINATED'
);

create type public.leave_request_status as enum (
  'PENDING',
  'APPROVED',
  'REJECTED',
  'CANCELLED'
);

create type public.leave_partial_day as enum (
  'NONE',
  'FIRST_HALF',
  'SECOND_HALF'
);

create type public.balance_transaction_type as enum (
  'ENTITLEMENT',
  'ADJUSTMENT',
  'RESERVE',
  'RELEASE',
  'USE',
  'REVERSE'
);

-- ----- Updated-at trigger function -----

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =============================================================
-- TABLE: departments
-- =============================================================

create table public.departments (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  name text not null,
  description text,
  manager_employee_id uuid, -- FK added after employees table
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint departments_code_unique unique (code)
);

create trigger departments_updated_at
  before update on public.departments
  for each row execute function public.handle_updated_at();

-- =============================================================
-- TABLE: employees
-- =============================================================

create table public.employees (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique,
  employee_code text not null,
  full_name text not null,
  work_email text not null,
  phone_number text,
  department_id uuid not null,
  position text not null,
  manager_id uuid,
  join_date date not null,
  role public.application_role not null default 'EMPLOYEE',
  status public.employment_status not null default 'ACTIVE',
  must_change_password boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint employees_employee_code_unique unique (employee_code),
  constraint employees_work_email_unique unique (work_email),
  constraint employees_auth_user_id_fk
    foreign key (auth_user_id) references auth.users(id) on delete set null,
  constraint employees_department_id_fk
    foreign key (department_id) references public.departments(id) on delete restrict,
  constraint employees_manager_id_fk
    foreign key (manager_id) references public.employees(id) on delete set null,
  constraint employees_manager_not_self
    check (manager_id is null or manager_id <> id),
  constraint employees_full_name_min_length
    check (char_length(full_name) >= 3)
);

create trigger employees_updated_at
  before update on public.employees
  for each row execute function public.handle_updated_at();

-- Now add the deferred FK from departments to employees
alter table public.departments
  add constraint departments_manager_employee_id_fk
  foreign key (manager_employee_id) references public.employees(id)
  on delete set null;

-- =============================================================
-- TABLE: leave_types
-- =============================================================

create table public.leave_types (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  name text not null,
  description text,
  default_entitlement numeric(6,2) not null default 0,
  color text not null default '#3B82F6',
  deducts_balance boolean not null default true,
  allow_negative_balance boolean not null default false,
  requires_attachment boolean not null default false,
  show_type_on_calendar boolean not null default true,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint leave_types_code_unique unique (code),
  constraint leave_types_entitlement_non_negative
    check (default_entitlement >= 0)
);

create trigger leave_types_updated_at
  before update on public.leave_types
  for each row execute function public.handle_updated_at();

-- =============================================================
-- TABLE: holidays
-- =============================================================

create table public.holidays (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  holiday_date date not null,
  is_recurring boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger holidays_updated_at
  before update on public.holidays
  for each row execute function public.handle_updated_at();

-- =============================================================
-- TABLE: leave_balances
-- =============================================================

create table public.leave_balances (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null,
  leave_type_id uuid not null,
  balance_year integer not null,
  entitled_days numeric(6,2) not null default 0,
  adjustment_days numeric(6,2) not null default 0,
  used_days numeric(6,2) not null default 0,
  pending_days numeric(6,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint leave_balances_employee_type_year_unique
    unique (employee_id, leave_type_id, balance_year),
  constraint leave_balances_employee_id_fk
    foreign key (employee_id) references public.employees(id) on delete restrict,
  constraint leave_balances_leave_type_id_fk
    foreign key (leave_type_id) references public.leave_types(id) on delete restrict,
  constraint leave_balances_year_reasonable
    check (balance_year >= 2000 and balance_year <= 2100),
  constraint leave_balances_entitled_non_negative
    check (entitled_days >= 0),
  constraint leave_balances_used_non_negative
    check (used_days >= 0),
  constraint leave_balances_pending_non_negative
    check (pending_days >= 0)
);

create trigger leave_balances_updated_at
  before update on public.leave_balances
  for each row execute function public.handle_updated_at();

-- =============================================================
-- TABLE: leave_requests
-- =============================================================

create table public.leave_requests (
  id uuid primary key default gen_random_uuid(),
  request_number text not null,
  employee_id uuid not null,
  leave_type_id uuid not null,
  start_date date not null,
  end_date date not null,
  requested_days numeric(6,2) not null,
  partial_day public.leave_partial_day not null default 'NONE',
  reason text not null default '',
  status public.leave_request_status not null default 'PENDING',
  approver_employee_id uuid,
  rejection_reason text,
  decided_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint leave_requests_request_number_unique unique (request_number),
  constraint leave_requests_employee_id_fk
    foreign key (employee_id) references public.employees(id) on delete restrict,
  constraint leave_requests_leave_type_id_fk
    foreign key (leave_type_id) references public.leave_types(id) on delete restrict,
  constraint leave_requests_approver_employee_id_fk
    foreign key (approver_employee_id) references public.employees(id) on delete set null,
  constraint leave_requests_end_after_start
    check (end_date >= start_date),
  constraint leave_requests_days_positive
    check (requested_days > 0),
  constraint leave_requests_no_self_approval
    check (approver_employee_id is null or approver_employee_id <> employee_id)
);

create trigger leave_requests_updated_at
  before update on public.leave_requests
  for each row execute function public.handle_updated_at();

-- =============================================================
-- TABLE: leave_balance_transactions (append-only ledger)
-- =============================================================

create table public.leave_balance_transactions (
  id uuid primary key default gen_random_uuid(),
  leave_balance_id uuid not null,
  leave_request_id uuid,
  transaction_type public.balance_transaction_type not null,
  days numeric(6,2) not null,
  reason text not null default '',
  actor_employee_id uuid,
  created_at timestamptz not null default now(),

  constraint lbt_leave_balance_id_fk
    foreign key (leave_balance_id) references public.leave_balances(id) on delete restrict,
  constraint lbt_leave_request_id_fk
    foreign key (leave_request_id) references public.leave_requests(id) on delete restrict,
  constraint lbt_actor_employee_id_fk
    foreign key (actor_employee_id) references public.employees(id) on delete set null
);
-- No updated_at trigger — this table is append-only.

-- =============================================================
-- TABLE: notifications
-- =============================================================

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null,
  notification_type text not null,
  title text not null,
  message text not null default '',
  is_read boolean not null default false,
  created_at timestamptz not null default now(),

  constraint notifications_employee_id_fk
    foreign key (employee_id) references public.employees(id) on delete cascade
);

-- =============================================================
-- TABLE: audit_logs (append-only)
-- =============================================================

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_auth_user_id uuid,
  actor_employee_id uuid,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),

  constraint audit_logs_actor_employee_id_fk
    foreign key (actor_employee_id) references public.employees(id) on delete set null
);
-- No updated_at trigger — this table is append-only.

-- =============================================================
-- INDEXES
-- =============================================================

-- employees
create index idx_employees_auth_user_id on public.employees(auth_user_id);
create index idx_employees_manager_id on public.employees(manager_id);
create index idx_employees_department_id on public.employees(department_id);
create index idx_employees_status on public.employees(status);

-- leave_requests
create index idx_leave_requests_employee_id on public.leave_requests(employee_id);
create index idx_leave_requests_status on public.leave_requests(status);
create index idx_leave_requests_start_date on public.leave_requests(start_date);
create index idx_leave_requests_end_date on public.leave_requests(end_date);
create index idx_leave_requests_composite
  on public.leave_requests(employee_id, status, start_date, end_date);

-- leave_balances
create index idx_leave_balances_employee_year
  on public.leave_balances(employee_id, balance_year);

-- notifications
create index idx_notifications_employee_read
  on public.notifications(employee_id, is_read);

-- audit_logs
create index idx_audit_logs_created_at on public.audit_logs(created_at);

-- leave_balance_transactions
create index idx_lbt_leave_balance_id
  on public.leave_balance_transactions(leave_balance_id);
create index idx_lbt_leave_request_id
  on public.leave_balance_transactions(leave_request_id);

-- =============================================================
-- ROW LEVEL SECURITY — Enable on all tables
-- =============================================================
-- Phase 1 only ENABLES RLS. Actual policies are added in later phases.
-- With RLS enabled and no policies, only the service-role key can
-- access data. This is the safe default.
-- =============================================================

alter table public.departments enable row level security;
alter table public.employees enable row level security;
alter table public.leave_types enable row level security;
alter table public.holidays enable row level security;
alter table public.leave_balances enable row level security;
alter table public.leave_requests enable row level security;
alter table public.leave_balance_transactions enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;
