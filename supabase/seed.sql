-- =============================================================
-- Seed Data for Local Development
-- Leave Request Management System
-- =============================================================
-- This file is for LOCAL DEVELOPMENT ONLY.
-- Production seeds must NOT contain known default credentials.
-- =============================================================

-- ----- Departments -----

insert into public.departments (id, code, name, description, is_active) values
  ('d0000000-0000-0000-0000-000000000001', 'ENG', 'Engineering', 'Software engineering department', true),
  ('d0000000-0000-0000-0000-000000000002', 'HR', 'Human Resources', 'Human resources department', true),
  ('d0000000-0000-0000-0000-000000000003', 'FIN', 'Finance', 'Finance and accounting department', true),
  ('d0000000-0000-0000-0000-000000000004', 'MKT', 'Marketing', 'Marketing department', true)
on conflict (code) do nothing;

-- ----- Leave Types -----

insert into public.leave_types (id, code, name, description, default_entitlement, color, deducts_balance, allow_negative_balance, requires_attachment, show_type_on_calendar, is_active) values
  ('a1000000-0000-0000-0000-000000000001', 'ANNUAL', 'Annual Leave', 'Standard paid annual leave', 12, '#3B82F6', true, false, false, true, true),
  ('a1000000-0000-0000-0000-000000000002', 'SICK', 'Sick Leave', 'Paid sick leave', 10, '#EF4444', true, false, false, false, true),
  ('a1000000-0000-0000-0000-000000000003', 'EMERGENCY', 'Emergency Leave', 'Emergency personal leave', 3, '#F59E0B', true, false, false, true, true),
  ('a1000000-0000-0000-0000-000000000004', 'UNPAID', 'Unpaid Leave', 'Unpaid leave of absence', 0, '#6B7280', false, true, false, true, true)
on conflict (code) do nothing;

-- ----- Holidays (example for current year) -----

insert into public.holidays (name, holiday_date, is_recurring, is_active) values
  ('New Year''s Day', '2026-01-01', true, true),
  ('Independence Day', '2026-08-17', true, true),
  ('Christmas Day', '2026-12-25', true, true)
on conflict do nothing;

-- =============================================================
-- NOTE: Employee and auth user seeds should be created through
-- the application's account provisioning flow, not raw SQL inserts,
-- to ensure auth.users and public.employees stay consistent.
--
-- For local testing, use `supabase start` and create test users
-- through the Supabase Studio UI or the admin API.
-- =============================================================
