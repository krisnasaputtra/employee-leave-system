# Implementation Plan

# Leave Request Management System — Supabase

## Document Status

This plan is derived from:

```text
leave-request-management-prd-supabase.md
leave-request-management-project-rules-supabase.md
```

Reference UI:

```text
https://vercel.com/templates/next.js/next-js-and-shadcn-ui-admin-dashboard
```

## Repository Inspection Status

The current source repository was not available during creation of this document.

The available workspace contained the PRD and Project Rules only. It did not contain:

```text
package.json
package-lock.json
pnpm-lock.yaml
yarn.lock
src/
app/
next.config.*
components.json
supabase/
```

Therefore:

- The target architecture below is based on the approved specification.
- Existing dependencies and files are not claimed as verified.
- Antigravity CLI must inspect the actual repository before editing code.
- Any conflict with the real repository must be reported before implementation.
- Do not assume that the Vercel starter has already been cloned.

---

# 1. Existing Technology and Folder Structure

## Verified Specification Baseline

The required frontend baseline is:

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS v4
- shadcn/ui
- React Hook Form
- Zod
- Zustand
- TanStack Table
- FullCalendar React
- date-fns
- Lucide React
- Sonner
- next-themes
- Biome
- Husky
- lint-staged

The required backend/platform baseline is:

- Supabase Postgres
- Supabase Auth
- `@supabase/supabase-js`
- `@supabase/ssr`
- Supabase Row Level Security
- Supabase Storage
- Supabase CLI
- PostgreSQL functions exposed through Supabase RPC
- Next.js Server Components
- Next.js Server Actions
- Route Handlers only where HTTP endpoints are justified

The referenced Vercel template currently advertises Next.js 16, TypeScript, Tailwind CSS v4, shadcn/ui, Zod, React Hook Form, Zustand, TanStack Table, Biome, Husky, responsive layouts, authentication screens, user and role management screens, and a calendar page.

## Required Repository Inspection Commands

Antigravity must run equivalent commands before coding:

```bash
pwd
find . -maxdepth 3 -type f | sort
cat package.json
cat components.json
cat tsconfig.json
cat next.config.*
cat biome.json*
cat .env.example 2>/dev/null || true
find src -maxdepth 4 -type f | sort
find app -maxdepth 4 -type f | sort 2>/dev/null || true
find supabase -maxdepth 4 -type f | sort 2>/dev/null || true
```

It must determine:

- Package manager and lockfile
- Exact Next.js and React versions
- Whether App Router is used
- Whether `src/` is used
- Existing route groups
- Existing sidebar/navigation configuration
- Existing auth pages
- Existing table and calendar components
- Existing Supabase configuration
- Existing environment variables
- Existing lint, test, and build scripts
- Existing design tokens and theme presets

## Target Folder Structure

The target is a colocation-first modular monolith:

```text
src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── change-password/
│   │       └── page.tsx
│   │
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── dashboard/
│   │   │   ├── page.tsx
│   │   │   ├── loading.tsx
│   │   │   └── _components/
│   │   ├── employees/
│   │   │   ├── page.tsx
│   │   │   ├── new/
│   │   │   ├── [id]/
│   │   │   ├── _components/
│   │   │   ├── _actions/
│   │   │   └── _schemas/
│   │   ├── leave/
│   │   │   ├── requests/
│   │   │   └── balances/
│   │   ├── approvals/
│   │   ├── calendar/
│   │   ├── notifications/
│   │   ├── audit-logs/
│   │   └── settings/
│   │       ├── departments/
│   │       ├── leave-types/
│   │       └── holidays/
│   │
│   ├── auth/
│   │   └── callback/
│   │       └── route.ts
│   ├── error.tsx
│   ├── not-found.tsx
│   └── layout.tsx
│
├── components/
│   ├── layout/
│   ├── shared/
│   └── ui/
│
├── features/
│   ├── auth/
│   ├── employees/
│   ├── leave-balances/
│   ├── leave-requests/
│   ├── approvals/
│   ├── calendar/
│   ├── notifications/
│   └── audit/
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   ├── admin.ts
│   │   └── middleware.ts
│   ├── permissions/
│   ├── result/
│   ├── validation/
│   └── dates/
│
├── server/
│   ├── actions/
│   ├── queries/
│   ├── services/
│   └── dto/
│
├── config/
├── types/
│   ├── database.types.ts
│   └── domain.ts
└── middleware.ts

supabase/
├── config.toml
├── migrations/
├── seed.sql
├── tests/
└── functions/
```

Do not force this exact layout if the cloned template already has a sensible equivalent. Preserve the template's colocation pattern.

---

# 2. Reusable Components from the Vercel Admin Template

## Reuse Without Rebuilding

The following template capabilities should be reused when present:

### Application Shell

- Collapsible sidebar
- Mobile navigation drawer
- Dashboard header
- Breadcrumbs
- Page container
- User profile menu
- Theme switcher
- Layout preference controls
- Command palette/search pattern

### Dashboard Components

- Metric cards
- Chart containers
- Date-range selectors
- Recent activity layout
- Dashboard grid system
- Skeleton loading states

### Data Management Components

- TanStack data table wrapper
- Column visibility control
- Sorting
- Filtering
- Pagination
- Row action dropdown
- Empty state
- Search input

### Authentication Components

- Login layout
- Authentication card
- Password input
- Form error presentation
- Redirect-safe auth flow patterns

### User and Role Management Patterns

- User list screen
- User detail or edit form patterns
- Role badge
- Status badge
- Avatar and identity display

### Calendar Components

- FullCalendar wrapper
- Month, week, and list views
- Event styling
- Event detail dialog or drawer
- Calendar toolbar
- Responsive calendar behavior

### Shared shadcn/ui Components

- Button
- Card
- Badge
- Form
- Input
- Select
- Textarea
- Dialog
- AlertDialog
- Sheet
- DropdownMenu
- Tabs
- Tooltip
- Skeleton
- Table
- Avatar
- Progress
- Popover
- Calendar/date picker
- Sonner toast

## Replace Demo Domain Content

Remove or replace:

- Revenue metrics
- CRM leads
- Finance transactions
- E-commerce orders
- Customer or invoice demo entities
- Fake production analytics

Map the template to this domain:

```text
Users screen        → Employees
Roles screen        → Application roles and permissions
Calendar screen     → Approved employee leave
Dashboard metrics   → Leave and workforce metrics
Recent activity     → Leave and account audit activity
```

---

# 3. Missing Dependencies

## Dependencies Expected from the Template

Verify before adding:

```text
next
react
react-dom
typescript
tailwindcss
zod
react-hook-form
@hookform/resolvers
zustand
@tanstack/react-table
@fullcalendar/react
@fullcalendar/daygrid
@fullcalendar/timegrid
@fullcalendar/list
date-fns
lucide-react
sonner
next-themes
```

## Supabase Dependencies Likely Missing

Add only if absent:

```bash
npm install @supabase/supabase-js @supabase/ssr
```

## Testing Dependencies Likely Missing

Add only if absent and approved by the real repository:

```bash
npm install -D vitest @vitest/coverage-v8
npm install -D @playwright/test
```

Supabase database testing uses the Supabase CLI and pgTAP support rather than a duplicate JavaScript database framework.

## Tooling to Verify

Check whether the template already includes:

```text
@biomejs/biome
husky
lint-staged
```

## Do Not Add

- Prisma
- Drizzle
- Better Auth
- NextAuth/Auth.js
- Axios
- A second table library
- A second form library
- A second validation library
- A second calendar library
- Redux unless explicitly approved
- Express
- GraphQL

---

# 4. Supabase Auth and SSR Implementation Plan

## 4.1 Environment Configuration

Create or update:

```text
.env.example
```

Required variables:

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Legacy key names may be supported only if the project already uses them:

```text
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Rules:

- Never expose the secret/service-role key.
- Never prefix a secret with `NEXT_PUBLIC_`.
- Validate environment variables at startup.
- Do not print secret values.

## 4.2 Supabase Client Separation

Implement:

```text
src/lib/supabase/client.ts
```

Purpose:

- Browser client
- Publishable key
- RLS enforced

Implement:

```text
src/lib/supabase/server.ts
```

Purpose:

- Server request client
- Reads and writes auth cookies
- Acts as current authenticated user
- RLS enforced

Implement:

```text
src/lib/supabase/admin.ts
```

Purpose:

- Server-only admin client
- Secret/service-role key
- Used only for employee account provisioning, account ban/unban, and tightly scoped administration
- Must import `server-only`

Implement:

```text
src/lib/supabase/middleware.ts
```

Purpose:

- Refresh auth state according to current Supabase SSR guidance
- Avoid trusting stale cookies
- Preserve response cookies

## 4.3 Login Flow

```text
POST credentials
→ Supabase Auth signInWithPassword
→ Refresh/validate authenticated user
→ Load employee application profile
→ Verify employment status and account status
→ Verify must_change_password
→ Redirect to change-password or role-aware dashboard
```

Do not expose whether an arbitrary email exists.

## 4.4 Protected Routing

Middleware may perform coarse redirect checks, but it is not the authorization layer.

Every protected Server Component, query, and Server Action must:

1. Validate the current Supabase user.
2. Load the linked employee/profile record.
3. Verify active status.
4. Verify role and resource scope.
5. Return or redirect safely.

## 4.5 Account Provisioning

Admin creates employee with optional account:

```text
Validate admin
→ Validate employee form
→ auth.admin.createUser()
→ Call create_employee_profile RPC
→ Initialize balances
→ Set role and must_change_password in protected public record
→ Write audit entry
→ Return generated temporary credential once, or use invitation flow
```

Because Auth user creation and public database mutation are not one transaction:

- If the RPC fails after Auth user creation, delete or ban the Auth user.
- Log a sanitized reference ID.
- Do not leave an orphan active account.

## 4.6 First Login Password Change

Use:

```text
/change-password
```

Requirements:

- Block main app when `must_change_password = true`.
- Call Supabase Auth password update.
- Update protected application flag through server/RPC.
- Revalidate the session.
- Never store the temporary password.

## 4.7 Logout and Deactivation

Logout:

- Supabase Auth sign-out
- Clear session cookies
- Redirect to `/login`

Employee deactivation:

- Update employee status
- Ban or disable the Auth user through admin API
- Revoke access according to supported Supabase behavior
- Write audit entry

---

# 5. Supabase SQL Schema and Relationship Plan

## 5.1 Required Extensions and Enums

Suggested extensions:

```sql
create extension if not exists pgcrypto;
```

Suggested enums:

```text
application_role
employment_status
leave_request_status
leave_partial_day
balance_transaction_type
```

Use SQL enums only if the team accepts migration friction. Otherwise use text columns with check constraints. Pick one approach consistently.

## 5.2 Tables

### `departments`

Key fields:

```text
id uuid primary key
code text unique
name text
description text nullable
manager_employee_id uuid nullable
is_active boolean
created_at timestamptz
updated_at timestamptz
```

### `employees`

Key fields:

```text
id uuid primary key
auth_user_id uuid unique nullable references auth.users(id)
employee_code text unique
full_name text
work_email text unique
phone_number text nullable
department_id uuid
position text
manager_id uuid nullable references employees(id)
join_date date
role application_role
status employment_status
must_change_password boolean
created_at timestamptz
updated_at timestamptz
```

Rules:

- `auth_user_id` optional because employee may exist without login.
- Employee cannot manage their own role.
- Manager cannot reference self.
- Work email and employee code unique.

### `leave_types`

Key fields:

```text
id uuid primary key
code text unique
name text
description text nullable
default_entitlement numeric(6,2)
color text
deducts_balance boolean
allow_negative_balance boolean
requires_attachment boolean
show_type_on_calendar boolean
is_active boolean
created_at timestamptz
updated_at timestamptz
```

### `holidays`

Key fields:

```text
id uuid primary key
name text
holiday_date date
is_recurring boolean
is_active boolean
created_at timestamptz
updated_at timestamptz
```

### `leave_balances`

Key fields:

```text
id uuid primary key
employee_id uuid
leave_type_id uuid
balance_year integer
entitled_days numeric(6,2)
adjustment_days numeric(6,2)
used_days numeric(6,2)
pending_days numeric(6,2)
created_at timestamptz
updated_at timestamptz
```

Unique:

```text
employee_id + leave_type_id + balance_year
```

Derived:

```text
remaining = entitled + adjustment - used
available = remaining - pending
```

### `leave_requests`

Key fields:

```text
id uuid primary key
request_number text unique
employee_id uuid
leave_type_id uuid
start_date date
end_date date
requested_days numeric(6,2)
partial_day leave_partial_day
reason text
status leave_request_status
approver_employee_id uuid nullable
rejection_reason text nullable
decided_at timestamptz nullable
cancelled_at timestamptz nullable
created_at timestamptz
updated_at timestamptz
```

### `leave_balance_transactions`

Key fields:

```text
id uuid primary key
leave_balance_id uuid
leave_request_id uuid nullable
transaction_type balance_transaction_type
days numeric(6,2)
reason text
actor_employee_id uuid nullable
created_at timestamptz
```

This is append-only through normal application flows.

### `notifications`

Key fields:

```text
id uuid primary key
employee_id uuid
notification_type text
title text
message text
is_read boolean
created_at timestamptz
```

### `audit_logs`

Key fields:

```text
id uuid primary key
actor_auth_user_id uuid nullable
actor_employee_id uuid nullable
action text
entity_type text
entity_id uuid nullable
metadata jsonb
created_at timestamptz
```

Audit metadata must be sanitized.

### `leave_attachments`

Phase 2:

```text
id uuid primary key
leave_request_id uuid
storage_bucket text
storage_path text
original_name text
mime_type text
size_bytes bigint
uploaded_by_employee_id uuid
created_at timestamptz
```

## 5.3 Views

### `public_leave_calendar_events`

Privacy-safe view or RPC output:

```text
request_id
employee_id
employee_name
department_id
department_name
start_date
end_date
public_label
color
```

Must never expose:

- reason
- attachment
- rejection reason
- balance
- manager note

### Dashboard Aggregate Views or RPCs

Potential aggregates:

- employee dashboard summary
- manager dashboard summary
- admin dashboard summary
- leave usage trend
- employees on leave today

Do not overbuild materialized views for the MVP.

## 5.4 Indexes

Create indexes for:

```text
employees(auth_user_id)
employees(manager_id)
employees(department_id)
employees(status)

leave_requests(employee_id)
leave_requests(status)
leave_requests(start_date)
leave_requests(end_date)
leave_requests(employee_id, status, start_date, end_date)

leave_balances(employee_id, balance_year)
notifications(employee_id, is_read)
audit_logs(created_at)
```

## 5.5 Referential and Deletion Rules

- Do not cascade-delete historical leave requests.
- Restrict deletion of leave types referenced by requests.
- Restrict deletion of employees with history.
- Use activation/deactivation instead.
- Allow safe cascade only for genuinely dependent temporary records.
- Storage objects require explicit retention/deletion behavior.

---

# 6. RLS Policy Matrix

RLS must be enabled on every exposed business table.

Legend:

```text
A = Allowed
S = Allowed only within scoped condition
D = Denied
```

| Resource / Operation | Anonymous | Employee | Manager | Admin |
|---|---:|---:|---:|---:|
| Own employee profile — select | D | S | S | A |
| Other employee public directory fields — select | D | S | S | A |
| Employee private fields — select | D | D | S: direct reports | A |
| Employee create | D | D | D | A |
| Employee role/status update | D | D | D | A |
| Own safe profile update | D | S | S | A |
| Departments — select active | D | A | A | A |
| Departments — mutate | D | D | D | A |
| Leave types — select active | D | A | A | A |
| Leave types — mutate | D | D | D | A |
| Holidays — select active | D | A | A | A |
| Holidays — mutate | D | D | D | A |
| Own leave balance — select | D | S | S | A |
| Direct-report balance — select | D | D | S | A |
| Balance direct insert/update/delete | D | D | D | D |
| Balance adjustment RPC | D | D | D | A |
| Own leave requests — select | D | S | S | A |
| Direct-report requests — select | D | D | S | A |
| Own request create | D | S | S | A |
| Own Pending request edit | D | S | S | A |
| Own Pending request cancel | D | S | S | A |
| Approve own request | D | D | D | D |
| Approve direct-report request | D | D | S | A |
| Reject direct-report request | D | D | S | A |
| Shared approved calendar — select | D | S | S | A |
| Other employee private reason — select | D | D | S: direct reports only | A |
| Own notifications — select/update read | D | S | S | A |
| Other notifications — select | D | D | D | A only if required |
| Audit logs — select | D | D | D | A |
| Audit logs — direct mutate | D | D | D | D |
| Private Storage attachment — own request | D | S | S | A |
| Direct-report attachment — read | D | D | S if authorized | A |
| Storage public access | D | D | D | D |

## RLS Implementation Guidance

Use helper functions carefully, for example:

```text
current_employee_id()
current_application_role()
is_admin()
is_manager_of(target_employee_id)
```

Requirements:

- Trusted role comes from protected tables, not editable user metadata.
- Avoid uncontrolled recursive policy queries.
- Use `security definer` helper functions only when justified.
- Set safe `search_path`.
- Revoke broad execute rights.
- Test as anonymous, employee, manager, and admin.

---

# 7. PostgreSQL RPC / Function Plan

## 7.1 `calculate_leave_days`

Purpose:

- Calculate authoritative working days.
- Include start and end.
- Exclude weekends.
- Exclude active holidays.
- Support half day.
- Use application timezone assumptions consistently.

Inputs:

```text
start_date
end_date
partial_day
```

Output:

```text
numeric requested_days
```

## 7.2 `create_leave_request`

Transaction:

1. Validate `auth.uid()`.
2. Resolve current employee.
3. Verify active status.
4. Validate leave type.
5. Calculate days.
6. Detect overlap with Pending or Approved requests.
7. Lock relevant balance row.
8. Verify available balance.
9. Insert Pending request.
10. Increment `pending_days`.
11. Insert `RESERVE` ledger transaction.
12. Insert notification.
13. Insert audit log.
14. Return minimal request DTO.

## 7.3 `update_pending_leave_request`

Transaction:

1. Verify owner and Pending status.
2. Lock request and balance row.
3. Release old reservation.
4. Recalculate dates/days.
5. Re-run overlap and balance checks.
6. Apply new reservation.
7. Update request.
8. Write ledger transactions.
9. Write audit log.

## 7.4 `cancel_leave_request`

Modes:

- Employee cancels own Pending request.
- Admin cancels Approved request through separate authorized path.

Pending cancellation:

- Lock request and balance.
- Change status to Cancelled.
- Release `pending_days`.
- Add `RELEASE` transaction.
- Notify relevant users.
- Audit.

Approved reversal:

- Strict Admin permission.
- Change status to Cancelled.
- Decrement used days.
- Add `REVERSE` transaction.
- Notify.
- Audit.

## 7.5 `approve_leave_request`

Transaction:

1. Validate actor.
2. Resolve manager/admin role.
3. Lock request.
4. Verify Pending.
5. Prevent self-approval.
6. Verify direct-report scope for manager.
7. Lock balance.
8. Revalidate days, overlap, and balance.
9. Move days from pending to used.
10. Change status to Approved.
11. Set approver and decision timestamp.
12. Add `USE` ledger transaction.
13. Add notifications.
14. Add audit log.
15. Return minimal DTO.

## 7.6 `reject_leave_request`

Transaction:

1. Validate actor and scope.
2. Lock Pending request.
3. Require rejection reason.
4. Release pending balance.
5. Set Rejected status.
6. Add `RELEASE` ledger transaction.
7. Notify employee.
8. Audit.

## 7.7 `adjust_leave_balance`

Admin-only:

1. Validate admin.
2. Lock balance.
3. Validate amount and reason.
4. Update `adjustment_days`.
5. Insert `ADJUSTMENT` ledger entry.
6. Notify employee.
7. Audit.

## 7.8 `initialize_employee_balances`

Admin/account provisioning use:

- Create one current-year balance per active balance-deducting leave type.
- Idempotent through unique constraint and conflict handling.
- Write entitlement ledger rows where appropriate.

## 7.9 `create_employee_profile`

Server-admin orchestration use:

- Create employee profile linked to `auth.users.id`.
- Validate unique email and employee code.
- Initialize balances.
- Write audit log.
- Does not create the Auth user itself.

## 7.10 Dashboard and Calendar RPCs

Read-only functions may provide:

```text
get_employee_dashboard()
get_manager_dashboard()
get_admin_dashboard()
get_public_leave_calendar(start_date, end_date, department_id)
```

Use privacy-safe output types.

---

# 8. Supabase Storage Policy Plan

## Bucket

Create private bucket:

```text
leave-attachments
```

## Object Path

Recommended path:

```text
{employee_id}/{leave_request_id}/{uuid}-{sanitized_filename}
```

Do not trust original filename as the storage key.

## Upload Rules

Allowed when:

- Authenticated employee owns the request.
- Request is still editable/Pending.
- Leave type requires or permits attachment.
- File type and size pass validation.

Recommended initial restrictions:

```text
Allowed MIME:
application/pdf
image/jpeg
image/png

Maximum size:
5 MB
```

Exact limit must be configurable.

## Read Rules

- Owner can read own attachment.
- Direct manager can read when reviewing that request.
- Admin can read.
- Other employees cannot read.
- Shared calendar never reads or exposes attachment data.

## Delete Rules

- Owner can remove attachment only while request is Pending.
- Admin may remove under explicit retention policy.
- Cancellation does not automatically delete evidence unless policy says so.
- Database row and Storage object deletion must be coordinated.

## Download

Use:

- Short-lived signed URL, or
- Authenticated Route Handler streaming the object

Never expose unrestricted public URLs.

---

# 9. Route and Permission Map

| Route | Employee | Manager | Admin | Notes |
|---|---:|---:|---:|---|
| `/login` | Public | Public | Public | Redirect authenticated users |
| `/change-password` | Own | Own | Own | Required on first login |
| `/dashboard` | A | A | A | Role-aware content |
| `/employees` | D | S | A | Manager may see direct reports/team directory only |
| `/employees/new` | D | D | A | Optional account creation |
| `/employees/[id]` | S: own | S: direct report/self | A | DTO must be role-aware |
| `/employees/[id]/edit` | S: safe own fields | S: safe own fields | A | Role/status Admin-only |
| `/employees/[id]/balances` | S: own | S: direct report | A | Adjustment Admin-only |
| `/leave/requests` | S: own | S: own | A/all | Manager approvals use separate route |
| `/leave/requests/new` | A | A | A | Creates for current employee only unless explicit admin flow |
| `/leave/requests/[id]` | S: own | S: own/direct report | A | Private fields scoped |
| `/leave/requests/[id]/edit` | S: own Pending | S: own Pending | A by defined policy | Re-run validations |
| `/leave/balances` | S: own | S: own | A | Personal balance page |
| `/approvals` | D | S: direct reports | A | Prevent self-approval |
| `/calendar` | A | A | A | Privacy-safe Approved leave only |
| `/notifications` | S: own | S: own | S: own | Admin does not need arbitrary user notifications |
| `/settings/departments` | D | D | A | Configuration |
| `/settings/leave-types` | D | D | A | Configuration |
| `/settings/holidays` | D | D | A | Configuration |
| `/audit-logs` | D | D | A | Read-only normal UI |
| `/profile` | S: own | S: own | S: own | Safe fields only |

Navigation visibility must be config-driven, but hidden navigation is not authorization.

---

# 10. Phase-by-Phase Implementation Plan

## Phase 0 — Repository and Template Baseline

Goal:

- Establish verified baseline before domain implementation.

Tasks:

- Inspect actual repository and lockfile.
- Confirm template version and scripts.
- Run existing install, lint/check, and build.
- Record existing failures before modifications.
- Identify reusable shell, table, auth, calendar, and user-management components.
- Remove no demo files yet.
- Create architecture decision notes.
- Create `.env.example`.
- Initialize Supabase CLI only if absent.

Exit criteria:

- Existing repository documented.
- Baseline commands executed.
- Reusable components mapped.
- No feature code implemented.

## Phase 1 — Supabase Foundation

Goal:

- Establish local Supabase, auth clients, schema foundation, and generated types.

Tasks:

- Add Supabase packages if absent.
- Initialize local Supabase.
- Create initial enums/tables migration.
- Add constraints and indexes.
- Add baseline RLS enablement.
- Add seed structure.
- Add browser/server/admin clients.
- Add SSR middleware integration.
- Generate `database.types.ts`.
- Add environment validation.

Exit criteria:

- Local Supabase starts.
- Migration applies cleanly.
- Types generate.
- App still builds.
- Secret key cannot reach client bundle.

## Phase 2 — Authentication and Role-Aware App Shell

Goal:

- Make login, logout, first-password change, route protection, and navigation work.

Tasks:

- Adapt template auth layout.
- Implement login.
- Implement logout.
- Implement protected route helper.
- Implement current employee/profile query.
- Implement active-account validation.
- Implement role-aware navigation.
- Implement first-login password change.
- Add auth and permission tests.

Exit criteria:

- Admin, manager, and employee can authenticate.
- Inactive user cannot access app.
- Role navigation is correct.
- Server authorization exists beyond middleware.

## Phase 3 — Employee and Account Management

Goal:

- Admin can manage employees and optional Supabase Auth accounts.

Tasks:

- Employee SQL/RLS policies.
- Employee list with server-backed pagination/filtering.
- Create employee form.
- Admin Auth-user provisioning service.
- `create_employee_profile` RPC.
- Compensation cleanup for partial failure.
- Employee detail and edit.
- Activate/deactivate account.
- Default balance initialization.
- Audit logging.

Exit criteria:

- Employee with and without login can be created.
- Duplicate email/code blocked.
- Deactivation blocks access.
- No orphan active Auth user after failed profile creation.

## Phase 4 — Leave Configuration

Goal:

- Admin can manage prerequisite master data.

Tasks:

- Departments CRUD.
- Leave types CRUD.
- Holidays CRUD.
- Prevent destructive deletion of referenced data.
- Add active/inactive handling.
- Add validation and RLS tests.

Exit criteria:

- Active leave types and holidays are queryable.
- Inactive options cannot be selected for new requests.
- Historical references remain valid.

## Phase 5 — Leave Balance

Goal:

- Provide traceable yearly balance management.

Tasks:

- Balance and ledger RLS.
- Employee balance display.
- Admin balance management.
- `initialize_employee_balances` RPC.
- `adjust_leave_balance` RPC.
- Balance progress cards.
- Ledger history.
- Race-condition and numeric tests.

Exit criteria:

- Balance is derived correctly.
- Manual adjustment always creates ledger entry.
- Direct balance mutation from browser is denied.

## Phase 6 — Leave Request CRUD

Goal:

- Employee can create, view, edit, and cancel Pending requests safely.

Tasks:

- `calculate_leave_days`.
- Overlap validation.
- `create_leave_request`.
- Request form.
- Own request table/detail.
- `update_pending_leave_request`.
- `cancel_leave_request`.
- Pending reservation behavior.
- Loading/error/empty states.
- Unit, RPC, RLS, and E2E tests.

Exit criteria:

- Weekend and holiday exclusions work.
- Overlap blocked.
- Balance overuse blocked.
- Pending reservation is correct.
- Client-submitted requested-day total is ignored.

## Phase 7 — Approval Workflow

Goal:

- Manager/Admin can approve or reject safely.

Tasks:

- Approval inbox.
- Manager direct-report scope.
- Conflict summary.
- `approve_leave_request`.
- `reject_leave_request`.
- Self-approval prevention.
- Notifications.
- Audit timeline.
- Concurrent approval test.

Exit criteria:

- Only correct actor can decide.
- Status and balance change atomically.
- Rejected request releases pending reservation.
- Approved request moves pending to used.

## Phase 8 — Shared Calendar

Goal:

- Show privacy-safe approved leave.

Tasks:

- Public calendar view/RPC.
- Visible-range query.
- Department and employee filters.
- Adapt template FullCalendar.
- Month/week/list views.
- Mobile list fallback.
- Safe event drawer/dialog.
- Sensitive type masking.
- Calendar RLS/privacy tests.

Exit criteria:

- Only Approved leave appears.
- No reason or attachment reaches unauthorized client.
- Visible date range limits query.

## Phase 9 — Dashboards, Notifications, and Audit

Goal:

- Replace demo dashboard with real role-aware metrics.

Tasks:

- Employee dashboard RPC/query.
- Manager dashboard RPC/query.
- Admin dashboard RPC/query.
- Replace fake charts.
- Notification center.
- Audit log screen.
- Pagination and filters.
- Empty/loading/error states.

Exit criteria:

- No fake production data.
- Aggregate queries are server/database backed.
- Audit screen is Admin-only.

## Phase 10 — Storage Attachments

Goal:

- Support protected evidence attachments.

Tasks:

- Private bucket migration/configuration.
- Storage policies.
- Attachment metadata table.
- Upload validation.
- Signed/authenticated download.
- Request form integration.
- Retention rules.
- Security tests.

Exit criteria:

- Unauthorized download denied.
- Shared calendar never exposes attachment.
- File and metadata remain consistent.

## Phase 11 — Quality and Deployment

Goal:

- Harden and prepare for deployment.

Tasks:

- Full unit suite.
- pgTAP/RLS suite.
- Integration tests.
- Playwright critical flow.
- Accessibility audit.
- Responsive review.
- Security review.
- Performance review.
- Production build.
- Vercel environment setup.
- Supabase migration deployment documentation.
- Backup and rollback notes.

Exit criteria:

- Biome passes.
- TypeScript passes.
- Tests pass.
- Production build passes.
- Known limitations documented.

---

# 11. Risks and Assumptions

## Repository Availability Risk

Risk:

- This document could not verify the actual source repository.

Mitigation:

- Phase 0 is mandatory.
- Antigravity must not code before inspection.
- Actual package scripts and structure override assumptions when compatible with PRD.

## Template Drift

Risk:

- The Vercel template is updated frequently and may differ from the version cloned.

Mitigation:

- Inspect actual version.
- Reuse patterns, not fragile file paths.
- Avoid mass upgrades during feature work.

## Supabase Auth Provisioning Atomicity

Risk:

- Creating an Auth user and public employee record is not one database transaction.

Mitigation:

- Use compensation cleanup.
- Prefer invitation flow later.
- Log sanitized reference IDs.

## RLS Complexity

Risk:

- Incorrect RLS can either leak data or block legitimate operations.

Mitigation:

- Build policy matrix before SQL.
- Use pgTAP tests.
- Test anonymous, employee, manager, and admin.
- Keep admin client usage narrow.

## Balance Race Conditions

Risk:

- Concurrent request or approval can overspend balance.

Mitigation:

- Use transactional PostgreSQL functions.
- Lock affected balance and request rows.
- Revalidate immediately before mutation.

## Date and Timezone Errors

Risk:

- JavaScript date parsing may shift dates or miscount leave.

Mitigation:

- Use SQL `date` for leave dates.
- Recalculate on server/database.
- Test timezone boundaries.
- Avoid converting date-only values through ambiguous UTC strings.

## Privacy Leakage

Risk:

- Calendar or dashboard can expose leave reason or medical information.

Mitigation:

- Use dedicated privacy-safe DTO/view/RPC.
- Do not fetch private columns and hide them with CSS.
- Test response payloads.

## Service-Role Overuse

Risk:

- Using admin client for normal queries bypasses RLS.

Mitigation:

- Separate admin module.
- Import `server-only`.
- Use authenticated server client by default.
- Review every admin-client call.

## Scope Expansion

Risk:

- Multi-level approval, email, advanced analytics, and attachment features may delay core quality.

Mitigation:

- Complete Phases 0–9 first.
- Treat Storage as later unless required.
- Do not add Phase 2 recommendations early.

## AI-Generated Code Quality

Risk:

- Antigravity may generate broad refactors, duplicate logic, or fake command results.

Mitigation:

- Execute one phase at a time.
- Use `task.md`.
- Require real command output.
- Review migrations and RLS manually.
- Commit after each stable phase.

---

# Antigravity Execution Prompt

```text
Read these files completely:

- leave-request-management-prd-supabase.md
- leave-request-management-project-rules-supabase.md
- implementation-plan-supabase.md
- task.md

Inspect the actual repository before changing code.

Do not code yet.

Return:
1. Actual package manager and dependency versions
2. Actual folder and route structure
3. Existing reusable template components
4. Existing Supabase configuration
5. Differences between repository and implementation plan
6. Files proposed for Phase 0
7. Commands that will be run
8. Risks or conflicts

Update task.md only after the repository inspection is complete.
Do not mark a task complete unless the related code and verification have actually been performed.
```
