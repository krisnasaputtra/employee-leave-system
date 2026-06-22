# Product Requirement Document

# Leave Request Management System

## Working Title

```text
LeaveFlow
```

## Project Location

```text
Training-VibeCode/employee-leave-system
```

## UI and Starter Reference

Use this Vercel template as the primary UI and frontend architecture baseline:

```text
https://vercel.com/templates/next.js/next-js-and-shadcn-ui-admin-dashboard
```

Reuse the template's:

- Next.js App Router structure
- Responsive application shell
- Collapsible sidebar
- Header and command palette pattern
- Dashboard cards and charts
- Authentication layouts
- TanStack data tables
- Calendar layout
- Light and dark themes
- shadcn/ui visual language
- Colocation-first feature structure

Remove or replace irrelevant CRM, finance, customer, and e-commerce demo content.

---

# Overview

Build a production-oriented fullstack application for managing employees, authentication accounts, leave requests, approvals, leave balances, and an organization-wide leave calendar.

Primary flow:

```text
Administrator creates employee
→ Administrator optionally creates login account
→ Employee signs in
→ Employee views leave balance
→ Employee submits leave request
→ Manager or administrator reviews request
→ Request is approved or rejected
→ Approved request updates leave balance
→ Approved leave appears on shared calendar
```

Supabase Postgres is the application source of truth. Supabase Auth is the authentication source of truth. Do not use Local Storage for business data or sessions.

---

# Product Goals

The application must:

- Provide secure email/password authentication
- Support Admin, Manager, and Employee roles
- Allow Admin to create an employee and optional login account
- Support employee management
- Support leave request create, read, pending update, cancellation, approval, and rejection
- Maintain leave balances per employee, leave type, and year
- Prevent invalid, overlapping, and over-balance requests
- Show approved employee leave in a shared calendar
- Protect private leave information
- Follow the referenced Vercel dashboard design
- Be type-safe, testable, and suitable for Antigravity CLI vibecoding

---

# Non-Goals for MVP

- Payroll integration
- Attendance or timesheets
- Multi-company tenancy
- Multi-level approval
- Native mobile app
- Public employee registration
- Slack, Teams, or WhatsApp integration
- AI workforce forecasting
- Hard deletion of submitted leave history

---

# Recommended Product Decisions

## Separate Employee and Authentication User

An employee is a business record. A user is an authentication identity.

```text
Employee 1 ─── 0..1 User
```

An employee may exist without login access.

## No Hard Delete for Submitted Requests

Use `CANCELLED` instead of deleting submitted leave requests. Historical approval and balance activity must remain traceable.

## Privacy-Safe Shared Calendar

The shared calendar may show:

- Employee name
- Department
- Date range
- Public leave label

It must never expose:

- Leave reason
- Medical details
- Attachments
- Rejection reason
- Manager notes

Sensitive leave types must display `Out of Office`.

## Leave Balance Ledger

Do not maintain only one mutable remaining-balance number. Track entitlement, adjustments, pending reservations, usage, and reversals.

## Account Activation

For MVP, Admin may create a temporary password that must be changed on first login. Recommended Phase 2 behavior is a secure email activation link. Never email plain-text passwords.

---

# User Roles

## Administrator

Can:

- Manage employees and login access
- Assign roles
- Manage departments, leave types, holidays, and balances
- View all requests
- Approve or reject requests
- View calendar and audit logs

Cannot:

- Read passwords
- Recover original passwords
- Hard delete submitted history through normal UI

## Manager

Can:

- Submit personal leave requests
- View own balance and history
- View direct-report requests
- Approve or reject direct-report requests
- View team calendar and balance summaries

Cannot:

- Approve own request
- Manage global policies
- View unrelated private leave details

## Employee

Can:

- View dashboard and balances
- Create leave request
- View own request history
- Edit or cancel own Pending request
- View privacy-safe shared calendar
- Change password

Cannot:

- Approve requests
- Modify balances
- Manage other employees
- View other employees' private reasons

---

# Technology Stack

## Baseline from Reference Template

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

## Supabase Fullstack Stack

- Supabase Postgres Database
- Supabase Auth with email and password
- `@supabase/supabase-js`
- `@supabase/ssr` for cookie-based SSR authentication
- Supabase Row Level Security
- Supabase Storage for protected leave attachments
- Supabase Realtime only where it provides clear value
- Supabase CLI for local development, migrations, seed data, and type generation
- SQL migration files under `supabase/migrations`
- PostgreSQL functions exposed through Supabase RPC for atomic multi-table business operations
- Server Actions for internal application mutations
- Route Handlers only for auth callbacks, protected downloads, webhooks, or genuine HTTP endpoints
- Vitest for frontend and domain unit tests
- pgTAP or Supabase database tests for policies, functions, and constraints
- Playwright for critical end-to-end flows

## Architecture

Use a modular monolith:

```text
Browser
  ↓
Next.js App Router
  ├── Server Components
  ├── Client Components
  ├── Server Actions
  ├── Supabase SSR Client
  ├── Supabase Auth
  ├── Domain Services
  └── Supabase Data API / RPC
        ↓
    Supabase Postgres
      ├── Tables and Constraints
      ├── Row Level Security
      ├── Database Functions
      ├── Triggers
      └── Audit and Balance Ledger
```

Use three explicit Supabase clients:

```text
Browser client
- Publishable key
- RLS enforced
- UI-safe queries only

Server request client
- Cookie-based authenticated session
- RLS enforced as the signed-in user

Server admin client
- Supabase secret key or legacy service-role key
- Server-only
- Bypasses RLS
- Used only for account provisioning and tightly scoped administration
```

Never expose the admin key to the browser.

---

# Authentication Module

## Login

URL:

```text
/login
```

Requirements:

- Supabase Auth email and password authentication
- Cookie-based SSR session using `@supabase/ssr`
- Public self-registration disabled in both UI and Supabase Auth configuration
- Custom UI based on the reference authentication layout
- Loading and safe error states
- Protected route redirects
- Active employee-account validation
- Server code must validate the current user using Supabase Auth APIs, not trust a client-provided user object
- Authentication refresh logic must follow the current Supabase SSR guidance

## First Login Password Change

URL:

```text
/change-password
```

Requirements:

- Required when `mustChangePassword` is true
- Main application inaccessible until completed
- Validate password and confirmation
- Never expose password hashes

## Employee Account Creation

The employee form contains:

```text
Create login account
```

When enabled, require:

- Unique work email
- Application role
- Temporary or generated password
- Active account status

Server-only provisioning flow:

```text
Authenticate current administrator
→ Validate and authorize input
→ Create Supabase Auth user through auth.admin.createUser()
→ Call a database function/RPC to create the linked employee record,
  role assignment, default balances, and audit entry
→ Set mustChangePassword
→ Return a safe result
```

Important constraints:

- The Supabase admin client must use a server-only secret key
- The secret key must never be imported into Client Components
- Role and employment status must be stored in protected public tables, not user-editable metadata
- `auth.users.id` is linked to `employees.auth_user_id`
- Public sign-up remains disabled
- Temporary passwords must never appear in logs or audit metadata
- Account creation through Supabase Auth and public-table creation are separate operations; do not falsely claim they are one database transaction
- If Auth user creation succeeds but the employee RPC fails, perform compensation by deleting or disabling the newly created Auth user
- Recommended production enhancement: use an invitation or password-recovery link instead of distributing a temporary password

---

# Dashboard Module

URL:

```text
/dashboard
```

## Employee Dashboard

- Remaining annual leave
- Pending leave days
- Approved days this year
- Next approved leave
- Recent requests
- Quick action: Create Leave Request

## Manager Dashboard

- Pending approvals
- Employees on leave today
- Upcoming team leave
- Team usage summary
- Recent requests

## Administrator Dashboard

- Active employees
- Pending requests
- Employees on leave today
- Leave utilization
- Request status distribution
- Recent account and leave activity

Use Supabase Postgres aggregate queries, views, or RPC functions rather than loading full datasets in the browser.

---

# Employee Management

## List Employees

URL:

```text
/employees
```

Features:

- Database-backed pagination
- Search by name, employee code, or email
- Filter by department, role, and status
- Sort by name, join date, or creation date
- View, edit, activate, or deactivate employee
- Show login-access status

Columns:

- Employee
- Employee Code
- Department
- Position
- Manager
- Login Access
- Employment Status
- Actions

## Create Employee

URL:

```text
/employees/new
```

Fields:

### Personal

- Employee Code
- Full Name
- Work Email
- Phone Number
- Join Date

### Organization

- Department
- Position
- Direct Manager
- Employment Status

### Authentication

- Create Login Account
- Application Role
- Temporary Password
- Generate Password
- Account Active

Validation:

- Employee code and email must be unique
- Name minimum 3 characters
- Department, position, and join date required
- Manager cannot be self
- Role and password required when account creation is enabled

## Employee Detail

URL:

```text
/employees/[id]
```

Display:

- Profile and organization information
- Account and role status
- Leave balances
- Recent leave history
- Upcoming approved leave
- Permission-aware actions

## Edit Employee

URL:

```text
/employees/[id]/edit
```

Rules:

- Preserve authentication identity
- Validate unique email and employee code
- Deactivation blocks login access
- Do not silently reset leave balances
- Do not hard delete employees with historical activity

---

# Department Management

URL:

```text
/settings/departments
```

Fields:

- Code
- Name
- Description
- Optional manager
- Active status

Rules:

- Code unique
- Prevent deletion while referenced
- Prefer deactivation

---

# Leave Type Management

URL:

```text
/settings/leave-types
```

Default types:

- Annual Leave
- Sick Leave
- Emergency Leave
- Unpaid Leave

Fields:

- Code
- Name
- Description
- Default annual entitlement
- Calendar color
- Deducts balance
- Allows negative balance
- Requires attachment
- Show type publicly on calendar
- Active status

Inactive types cannot be selected for new requests.

---

# Leave Balance Module

## My Balance

URL:

```text
/leave/balances
```

Display per leave type and year:

- Entitled
- Adjustments
- Used
- Pending
- Remaining
- Usage progress

Formula:

```text
remaining = entitled + adjustments - used
availableToRequest = remaining - pending
```

Recommended policy:

- Pending request reserves balance
- Approved request moves reservation to used
- Rejected or cancelled request releases reservation

## Manage Employee Balance

URL:

```text
/employees/[id]/balances
```

Admin can:

- Initialize yearly entitlement
- Add positive or negative adjustment
- Provide adjustment reason
- View balance transaction history

Every manual change must create a ledger record. Do not directly overwrite used days.

---

# Leave Request Module

## My Requests

URL:

```text
/leave/requests
```

Features:

- View own requests
- Search and filter by type, status, and year
- View detail
- Edit Pending request
- Cancel Pending request
- Create request

Statuses:

```text
PENDING
APPROVED
REJECTED
CANCELLED
```

## Create Request

URL:

```text
/leave/requests/new
```

Fields:

- Leave Type
- Start Date
- End Date
- Partial Day option
- Reason
- Attachment when required
- Optional emergency contact

Live display:

- Current balance
- Pending balance
- Requested working days
- Estimated remaining balance
- Conflict warning

Validation:

- Type and dates required
- End date cannot precede start date
- Requested days must be greater than zero
- No overlap with Pending or Approved request
- Cannot exceed available balance unless allowed
- Required attachment must exist
- Employee must be active
- Server recalculates requested days

Initial status:

```text
PENDING
```

## Leave-Day Calculation

Server-authoritative calculation:

- Include start and end date
- Exclude Saturdays and Sundays
- Exclude active holidays
- Support half day as `0.5`
- Use configured application timezone
- Ignore client-submitted total

## Edit Request

URL:

```text
/leave/requests/[id]/edit
```

Rules:

- Owner only
- Pending only
- Re-run validation and calculation
- Update pending reservation atomically
- Write audit entry

## Request Detail

URL:

```text
/leave/requests/[id]
```

Display:

- Request number
- Employee and type
- Date range and requested days
- Reason and attachment according to permission
- Status and approver
- Rejection reason when authorized
- Activity timeline

## Cancel Request

Rules:

- Employee may cancel only own Pending request
- Cancel releases pending balance
- Approved cancellation requires authorized administrative reversal
- Every cancellation writes audit history

---

# Approval Module

URL:

```text
/approvals
```

Manager sees direct reports only. Admin sees all Pending requests.

Features:

- Search and filter
- View balance and conflict summary
- View other team leave in requested period
- Approve
- Reject with required reason

Approval rules:

- Pending only
- No self-approval
- Manager limited to direct reports
- Revalidate balance and overlap before decision
- Update request and balance atomically
- Write ledger and audit entries
- Approved leave becomes calendar-visible

Rejection rules:

- Rejection reason required
- Release pending balance
- Store decision maker and timestamp
- Rejected leave does not appear on calendar

---

# Shared Leave Calendar

URL:

```text
/calendar
```

Views:

- Month
- Week
- List

Filters:

- Department
- Employee
- Public leave type
- Date range

Event display:

- Employee name
- Department
- Public leave label
- Date range
- Avatar or initials when suitable

Rules:

- Approved requests only
- Never expose reasons, attachments, medical details, or rejection data
- Sensitive types show `Out of Office`
- Query only the visible date range
- Use existing FullCalendar implementation from the template where possible
- Mobile uses a usable compact or list view

---

# Holiday Management — Strongly Recommended

URL:

```text
/settings/holidays
```

Without holiday data, working-day and leave-balance calculations will be inaccurate.

Fields:

- Holiday name
- Date
- Recurring yearly flag
- Active status

Holiday changes must not silently modify historical approved requests. Recalculation must be an explicit administrative action.

---

# Notifications

MVP in-app notifications:

- Employee account created
- Leave submitted
- Leave approved
- Leave rejected
- Leave cancelled
- Balance adjusted

Use a header notification dropdown and notification list. Email is Phase 2.

---

# Audit Logs

URL:

```text
/audit-logs
```

Admin-only.

Track:

- Employee and account changes
- Role and access changes
- Request create/edit/approve/reject/cancel
- Balance adjustments
- Leave type and holiday changes

Never log passwords, session tokens, secrets, or attachment contents.

---

# Navigation

## Employee

```text
Dashboard
My Leave
  - Requests
  - Balances
Calendar
Notifications
Profile
```

## Manager

```text
Dashboard
My Leave
Approvals
Team
Calendar
Notifications
Profile
```

## Administrator

```text
Dashboard
Employees
Leave Requests
Approvals
Calendar
Settings
  - Departments
  - Leave Types
  - Holidays
Audit Logs
Notifications
```

Navigation must be config-driven and role-aware.

---

# Core Data Model

## Employee

```typescript
type Employee = {
  id: string;
  userId: string | null;
  employeeCode: string;
  fullName: string;
  workEmail: string;
  phoneNumber: string | null;
  departmentId: string;
  position: string;
  managerId: string | null;
  joinDate: Date;
  status: "ACTIVE" | "INACTIVE" | "TERMINATED";
  createdAt: Date;
  updatedAt: Date;
};
```

## LeaveType

```typescript
type LeaveType = {
  id: string;
  code: string;
  name: string;
  defaultEntitlement: number;
  color: string;
  deductsBalance: boolean;
  allowNegativeBalance: boolean;
  requiresAttachment: boolean;
  showTypeOnCalendar: boolean;
  isActive: boolean;
};
```

## LeaveBalance

```typescript
type LeaveBalance = {
  id: string;
  employeeId: string;
  leaveTypeId: string;
  year: number;
  entitledDays: number;
  adjustmentDays: number;
  usedDays: number;
  pendingDays: number;
};
```

Unique constraint:

```text
employeeId + leaveTypeId + year
```

## LeaveBalanceTransaction

```typescript
type LeaveBalanceTransaction = {
  id: string;
  leaveBalanceId: string;
  leaveRequestId: string | null;
  transactionType:
    | "ENTITLEMENT"
    | "ADJUSTMENT"
    | "RESERVE"
    | "RELEASE"
    | "USE"
    | "REVERSE";
  days: number;
  reason: string;
  createdByUserId: string;
  createdAt: Date;
};
```

## LeaveRequest

```typescript
type LeaveRequest = {
  id: string;
  requestNumber: string;
  employeeId: string;
  leaveTypeId: string;
  startDate: Date;
  endDate: Date;
  requestedDays: number;
  partialDay: "NONE" | "FIRST_HALF" | "SECOND_HALF";
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  approverId: string | null;
  rejectionReason: string | null;
  decidedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};
```

Also implement:

- Supabase Auth users in the managed `auth.users` schema
- A protected public employee/profile record linked by `auth_user_id`
- Application-role and account-status fields protected from employee self-modification
- Department
- Holiday
- Notification
- AuditLog
- Storage attachment metadata when attachment upload is implemented

---

# Database Constraints and Indexes

Enforce:

- Unique employee code and work email
- Unique department and leave-type codes
- Unique balance per employee, type, and year
- Valid foreign keys
- Restricted deletion for historical data
- Index request status, employee, start date, and end date
- Index employee department and manager
- Index notification user and read status

Use database constraints in addition to Zod validation.

---

# Suggested Route and Supabase Structure

```text
src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── change-password/
│   ├── (dashboard)/
│   │   ├── dashboard/
│   │   ├── employees/
│   │   ├── leave/
│   │   ├── approvals/
│   │   ├── calendar/
│   │   ├── notifications/
│   │   ├── audit-logs/
│   │   └── settings/
│   └── auth/
│       └── callback/
├── components/
│   ├── layout/
│   ├── shared/
│   └── ui/
├── features/
│   ├── auth/
│   ├── employees/
│   ├── leave-balances/
│   ├── leave-requests/
│   ├── approvals/
│   ├── calendar/
│   └── audit/
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   ├── admin.ts
│   │   └── middleware.ts
│   ├── permissions/
│   ├── result/
│   └── validation/
├── server/
│   ├── actions/
│   ├── services/
│   ├── queries/
│   └── dto/
├── types/
│   ├── database.types.ts
│   └── domain.ts
└── config/

supabase/
├── config.toml
├── migrations/
├── seed.sql
├── tests/
└── functions/
```

Rules:

- Generate `database.types.ts` from the actual Supabase schema
- Do not manually maintain a conflicting duplicate database type file
- Keep SQL migrations and RLS policies in version control
- Follow the existing template structure when it differs
- Do not restructure the whole repository without a concrete reason

---

# UI Requirements

Follow the Vercel template's:

- Neutral shadcn theme
- Responsive sidebar
- Clean page headers
- Statistic cards
- Subtle borders and controlled shadows
- Consistent radius and spacing
- Geist typography when already configured
- Dark mode
- Data-table and calendar patterns

Do not add random gradients, neon colors, excessive glassmorphism, or inconsistent card styles.

Forms must include:

- React Hook Form and Zod
- Labels and descriptions
- Inline errors
- Loading and disabled states
- Success/error toast
- Confirmation for sensitive actions

Tables must include:

- TanStack Table
- Pagination
- Search, filters, and sorting
- Loading and empty states
- Mobile strategy
- Authorization-aware actions

---


# Supabase Database and Security Model

## Public Schema Relationship

Use the following core relationship:

```text
auth.users.id
    ↓ one-to-zero-or-one
public.employees.auth_user_id
```

Rules:

- Never expose the managed `auth` schema directly through application queries
- Application profile data belongs in protected public tables
- `employees.auth_user_id` must be unique and nullable
- Application roles must be protected from employee self-update
- RLS helper functions must not trust editable `user_metadata`

## Row Level Security

RLS must be enabled on every exposed table, including:

- employees
- departments
- leave_types
- leave_balances
- leave_balance_transactions
- leave_requests
- holidays
- notifications
- audit_logs
- attachment metadata tables

Policy intent:

```text
Employee:
- read own employee record
- read own private leave requests and balances
- create own leave requests
- edit or cancel own Pending requests only
- read privacy-safe approved calendar view

Manager:
- employee permissions
- read direct-report requests and approved team calendar data
- approve or reject direct-report Pending requests
- never approve own request

Administrator:
- manage employees and configuration
- manage balances
- read and process all requests
- read audit logs
```

Use RLS as defense in depth. Server-side permission checks are still required.

## Database Functions and Atomicity

Use PostgreSQL functions called through Supabase RPC for operations requiring one transaction, including:

- create leave request and reserve pending balance
- edit request and recalculate reservation
- cancel request and release or reverse balance
- approve request and move pending days to used days
- reject request and release pending days
- adjust leave balance and write ledger entry

Functions must:

- validate the authenticated actor
- validate allowed status transitions
- lock or otherwise protect affected balance rows
- recalculate authoritative values
- write ledger and audit records
- return a minimal typed result
- use `security invoker` by default
- use `security definer` only when necessary, with a safe `search_path` and explicit authorization

## Supabase Storage

When leave attachments are implemented:

- Use a private bucket
- Store only file metadata in Postgres
- Use RLS-based Storage policies
- Limit MIME types and file size
- Use signed URLs or authenticated downloads
- Never expose medical attachments in shared calendar responses
- Delete or retain files according to an explicit retention rule

## Realtime

Supabase Realtime is optional.

Reasonable use:

- refresh notification count
- refresh approval inbox
- refresh calendar after an approval

Do not use Realtime as a replacement for database consistency, transactions, or route revalidation.

---

# Security and Privacy Requirements

- Public registration disabled
- Every server mutation authenticates and authorizes
- Never trust user ID, role, employee ID, requested days, or balance from client input
- Never expose raw Supabase, PostgREST, PostgreSQL, Auth, or Storage errors or stack traces
- Store secrets only in environment variables
- Never log passwords or tokens
- Prevent IDOR and mass assignment
- Prevent self-role escalation and self-approval
- Revoke or block access when employee becomes inactive
- Validate attachment type, size, and ownership when implemented
- Shared calendar returns a privacy-safe DTO only

---

# Performance Requirements

- Server Components by default
- Small Client Component boundaries
- Database aggregation for dashboard cards
- Pagination for growing tables
- Query calendar by visible range
- Select only required fields
- Add indexes for common queries
- Avoid N+1 queries
- Revalidate affected routes after mutations

---

# Accessibility Requirements

- Keyboard navigation
- Visible focus states
- Proper labels
- Accessible icon buttons
- Dialog focus management
- Status not represented by color alone
- Field-associated error messages
- Calendar keyboard alternative
- Responsive support from 360px upward

---

# Recommended Implementation Phases

## Phase 0 — Bootstrap

- Start from the reference template
- Remove irrelevant demo screens
- Preserve shell, theme, tables, auth, and calendar patterns
- Configure environment validation
- Initialize Supabase CLI and local development
- Configure Supabase Auth SSR clients
- Create SQL migrations, RLS policies, database functions, and seed data
- Generate TypeScript database types

## Phase 1 — Authentication and Employees

- Login and logout
- Route protection
- Role-aware navigation
- Employee CRUD
- Optional account creation
- Account deactivation
- First-login password change

## Phase 2 — Configuration and Balances

- Departments
- Leave types
- Holidays
- Balance initialization
- Balance adjustment ledger

## Phase 3 — Leave Request CRUD

- Create request
- Working-day calculation
- Balance and overlap validation
- List and detail
- Edit Pending
- Cancel Pending

## Phase 4 — Approval Workflow

- Manager approval inbox
- Approve and reject
- Atomic balance update
- Notifications and audit entries

## Phase 5 — Calendar and Dashboards

- Shared approved-leave calendar
- Privacy filters
- Role-aware dashboard metrics
- Real database aggregations

## Phase 6 — Quality

- Unit, integration, and E2E tests
- Accessibility review
- Security review
- Performance review
- Production build and deployment docs

---

# Additional Feature Recommendations

## Strongly Recommended for MVP

1. Manager approval workflow
2. Holiday management
3. Overlap validation
4. Audit logs
5. Account deactivation
6. Privacy-safe shared calendar
7. In-app notifications

## Recommended for Phase 2

1. Email invitation and password reset
2. Medical attachment upload
3. CSV reports
4. Carry-forward policy
5. Scheduled yearly balance initialization
6. Delegate approver
7. Department-specific holiday calendars

## Avoid Until Core Is Stable

1. Multi-level approval
2. Payroll integration
3. AI leave recommendations
4. Complex forecasting
5. Multi-tenant SaaS architecture

---

# Acceptance Criteria

The application must:

- Use the referenced Vercel dashboard as UI baseline
- Use Next.js App Router and strict TypeScript
- Persist business data in Supabase Postgres
- Use Supabase Auth with cookie-based SSR
- Disable public self-registration
- Enable and test RLS on every exposed business table
- Support Admin, Manager, and Employee authorization
- Allow Admin to create employee with optional login account
- Require temporary-password change on first login
- Support safe employee CRUD and deactivation
- Manage departments, leave types, holidays, and balances
- Maintain a balance transaction ledger
- Support leave create, read, pending edit, and cancellation
- Support approve and reject
- Prevent self-approval
- Prevent overlap and over-balance requests
- Calculate requested days on the server
- Show Approved leave on shared calendar
- Protect private leave data
- Write audit logs
- Be responsive and accessible
- Pass Biome, TypeScript, tests, and production build

---

# Definition of Done

A feature is done only when:

- UI and server logic are implemented
- Server authorization is enforced
- Zod validation exists
- Database constraints exist where applicable
- Loading, empty, success, and error states exist
- Audit and balance behavior are correct
- Critical tests are included
- Biome passes
- TypeScript passes
- Production build passes
- Manual verification steps are documented

---

# Antigravity CLI First Prompt

```text
Read leave-request-management-prd-supabase.md and
leave-request-management-project-rules-supabase.md completely.

Inspect the current repository and compare it with the required architecture.
Do not code yet.

Return:
1. Existing technology and folder structure
2. Reusable components from the Vercel admin template
3. Missing dependencies
4. Database and authentication implementation plan
5. Supabase SQL schema, RLS-policy, database-function, and generated-type plan
6. Route and permission map
7. Phase-by-phase implementation plan
8. Risks and assumptions

After the plan, wait for the next implementation instruction.
```
