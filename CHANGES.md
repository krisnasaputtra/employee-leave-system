# 📝 Changelog

All notable changes to the LRM (Leave Request Management) system are documented in this file.

---

## [2026-06-26] — Team & Manager Auto-Assignment

### ✨ Added
- **Auto Manager Assignment** — When an employee is added to a team, `manager_id` is automatically set to the team's manager via DB trigger (`auto_assign_manager`)
- **Manager Propagation** — When a team's manager changes, all employees in that team are automatically re-assigned via DB trigger (`propagate_dept_manager`)
- **Grant Login Access** — Admin can grant login access to employees created without an auth account (edit employee page)
- **Reset Password** — Admin can reset any employee's password and generate a new temporary password (edit employee page)
- **Password Utility** — Shared `generateTempPassword()` function generates 10-char passwords with guaranteed uppercase, lowercase, digits, and special characters
- **RLS Helper Functions** — `current_employee_department_id()` and `current_employee_role()` as `SECURITY DEFINER` functions to prevent circular RLS dependency

### 🔄 Changed
- **UI Label: "Department" → "Team"** — All user-facing labels renamed from "Department" to "Team" across both EN and ID locales
- **Create Employee Form** — Removed manual Manager dropdown; manager is now auto-assigned based on selected team
- **Edit Employee Form** — Added Grant Login, Reset Password, and kept Manager override for admin
- **Team Page** — Manager now sees all employees in their team (department-based), not just direct reports
- **Delegation Dropdown** — Shows all team members instead of only direct reports
- **Manager RLS Policy** — Changed from `manager_id = self` to department-based access using `SECURITY DEFINER` functions
- **Rate Limit** — Increased from 10 to 60 req/min for auth routes (accommodates E2E testing)

### 🐛 Fixed
- **Circular RLS Dependency** — `employees_select_manager_department` policy had a subquery on `employees` table (under RLS itself), causing all user logins to fail. Fixed with `SECURITY DEFINER` helper functions
- **Team Page Empty for Manager** — Manager couldn't see team members because old RLS policy only allowed viewing direct reports (`manager_id = self`)
- **Delegation Dropdown Empty** — Same RLS issue prevented manager from seeing delegatable employees
- **Weak Password Generation** — Replaced `Temp{random}!{number}` pattern with cryptographically stronger generator that guarantees all character classes
- **Invalid Password on Grant Login** — Generated passwords sometimes didn't meet Supabase minimum requirements

### 📦 New SQL Migrations
| File | Purpose |
|------|---------|
| `20240626_fix_manager_employee_rls.sql` | Manager RLS: department-based access |
| `20240626_auto_assign_manager.sql` | Auto-assign triggers + backfill |
| `20240626_fix_rls_circular.sql` | Fix circular RLS with SECURITY DEFINER functions |

### 🧪 Tests
- **39/39 E2E tests passing** (was 37 before this session)
- All tests run in ~3.5 minutes

---

## [2026-06-26] — i18n & E2E Stabilization

### ✨ Added
- **Full i18n Coverage** — All dashboard components translated (EN + ID) using `useTranslation()` hook
- **Language Switcher** — Globe icon in header with improved contrast and padding

### 🐛 Fixed
- **E2E Flakiness** — Fixed 37/37 tests by increasing rate limit, adding `clearCookies()`, and improving `waitFor` selectors
- **Language Switcher Contrast** — Fixed low-contrast colors on the language toggle

---

## [2026-06-25] — Performance & Code Review

### ✨ Added
- **Code Review Page** — 425 checklist items across 16 categories at `/code-review`
- **TanStack React Query** — Client-side caching for sidebar badge counts, debounced search
- **Loading Skeletons** — 18 skeleton screens across all pages

### 🔄 Changed
- **Non-blocking Layout** — Sidebar badge counts load async via TanStack Query
- **Auth Optimization** — `React.cache()` deduplicates auth calls (layout + page = 1 DB call)

---

## [2026-06-24] — Email Notifications & Analytics

### ✨ Added
- **Resend Email Integration** — Notifications for leave submitted, approved, rejected, balance adjusted
- **Analytics Dashboard** — Organization-wide leave analytics with Recharts
- **CSV Export** — Export employees, requests, and audit logs

---

## [2026-06-23] — Core Feature Build

### ✨ Added
- **Leave Request CRUD** — Submit, edit, cancel with balance reservation
- **Approval Workflow** — Manager approve/reject with balance transfer
- **Delegation System** — Manager delegates approval authority
- **Calendar Integration** — FullCalendar with holidays and approved leaves
- **Balance Management** — Admin view, adjust, and bulk-manage balances
- **Audit Logs** — Complete audit trail with pagination
- **Holiday Management** — CRUD holidays with recurring support
- **Leave Policy Engine** — Configurable rules per leave type
- **Capacity Rules** — Team-level capacity constraints
- **3 Theme Presets** — Brutalist, Soft Pop, Tangerine
- **Dark Mode** — Full dark mode support

---

## [2026-06-22] — Initial Setup

### ✨ Added
- **Project Scaffolding** — Next.js 15, Supabase, Shadcn UI, Tailwind CSS v4
- **Database Schema** — 10 tables with RLS, RPC functions, indexes
- **Authentication** — Supabase Auth with role-based middleware
- **Employee Management** — CRUD with department and manager assignment
- **RBAC** — Admin, Manager, Employee role hierarchy
