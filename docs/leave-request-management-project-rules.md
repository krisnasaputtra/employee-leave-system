# Project Rules for AI Coding Assistant

# Leave Request Management System

## Purpose

This document defines mandatory rules for Antigravity CLI or any AI coding assistant modifying this project.

Project:

```text
Training-VibeCode/employee-leave-system
```

Read together with:

```text
leave-request-management-prd-supabase.md
```

---

# Rule Priority

When instructions conflict, use this order:

1. Security and data integrity
2. Product Requirement Document
3. This Project Rules document
4. Existing project architecture
5. Current implementation request
6. General AI suggestions

Report conflicts. Do not silently choose the weaker rule.

---

# Reference Template

```text
https://vercel.com/templates/next.js/next-js-and-shadcn-ui-admin-dashboard
```

Rules:

- Reuse the template's shell, sidebar, header, theme, forms, tables, auth, dashboard, and calendar patterns
- Preserve its colocation-first architecture
- Remove irrelevant demo content
- Do not replace the template wholesale
- Do not rebuild an existing component without a concrete reason

---

# Required Stack

## Frontend

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

## Backend and Platform

- Next.js Server Components
- Server Actions for internal mutations
- Route Handlers only where HTTP endpoints are required
- Supabase Postgres Database
- Supabase Auth
- `@supabase/supabase-js`
- `@supabase/ssr`
- Supabase Row Level Security
- Supabase Storage for protected attachments
- Supabase CLI
- PostgreSQL functions exposed through Supabase RPC for atomic business operations

## Tooling

- Biome
- Husky
- lint-staged
- Vitest
- pgTAP or Supabase database tests
- Playwright

Do not replace the required stack without explicit approval.

---

# Dependency Rules

- Inspect `package.json` and lockfile first
- Prefer libraries already included in the template
- Do not add a second calendar, table, validation, auth, ORM, or state library
- Do not add Axios when framework APIs or native fetch are sufficient
- Do not perform unrelated dependency upgrades
- Explain every added runtime dependency
- Remove dependencies that become unused
- Preserve the repository lockfile

---

# General Coding Standards

- Use strict TypeScript
- Never use `any`
- Use `unknown` and narrow it safely
- Do not use `@ts-ignore`
- Do not disable checks to hide an error
- Prefer async/await
- Keep functions small and focused
- Apply Single Responsibility Principle
- Avoid speculative abstractions
- Do not duplicate business rules
- Do not leave placeholders or fake API data
- Remove dead code and unused imports
- Comments explain why, not obvious syntax

---

# Sources of Truth

- Supabase Postgres: application business data
- Supabase Auth: authentication identities and sessions
- SQL migrations under `supabase/migrations`: database structure, constraints, functions, grants, and RLS policies
- Generated `database.types.ts`: database query typing
- Zod: application input contracts
- Server domain services and database functions: business rules
- PRD: product behavior
- Shared design tokens and variants: UI styling

Local Storage may only store non-sensitive UI preferences such as theme or sidebar state. It must not store employees, requests, balances, approvals, roles, or sessions.

---

# Architecture Rules

Use a modular monolith:

```text
Page or Component
→ Server Action or Server Query
→ Domain Service
→ Supabase Server Client or RPC
→ Supabase Postgres with RLS
```

Rules:

- Database logic must not live in pages or Client Components
- Supabase server/admin clients and server auth modules must never be imported by Client Components
- Business rules must not live inside JSX
- Route-specific code may be colocated
- Shared domain logic belongs in feature/server modules
- Shared UI belongs in shared components
- Do not create a generic dumping-ground `utils.ts`
- Do not introduce microservices, Express, or GraphQL

---

# Next.js Rules

- App Router only
- Server Components by default
- Add `"use client"` only when necessary
- Keep Client Component boundaries small
- Use Server Actions for authenticated internal mutations
- Use Route Handlers for auth, uploads, webhooks, or external APIs
- Use `loading.tsx`, `error.tsx`, and `not-found.tsx` appropriately
- Revalidate affected routes after mutation
- Do not fetch initial server data through client effects
- Do not call internal API routes from Server Components when a server function can be called directly
- Middleware is not the only authorization layer
- Every sensitive query and mutation must authorize again on the server

---

# Server/Client Boundary

Never expose:

- Supabase secret key or legacy service-role key
- Database connection credentials
- Server admin client
- Passwords
- Access tokens, refresh tokens, recovery tokens, or OTP values
- Private audit metadata
- Other employees' private leave reasons
- Private Storage paths or unrestricted signed URLs

The Supabase publishable key may be used in the browser only with correctly enabled RLS and grants.

Client Components receive only the minimum serialized DTO needed to render.

---

# Authentication Rules

Use Supabase Auth with:

- Email and password authentication
- Cookie-based SSR using `@supabase/ssr`
- Public sign-up disabled
- Server-side user validation
- Protected active-account check
- First-login password-change flow
- Safe redirect handling
- Auth callback route where required

Use separate clients:

```text
Browser client:
- publishable key
- RLS enforced

Server request client:
- cookie session
- RLS enforced as signed-in user

Server admin client:
- secret key or legacy service-role key
- server-only
- bypasses RLS
- used only for tightly scoped administration
```

Never:

- Expose the admin key to the browser
- Create a custom session system
- Store session data in Local Storage
- Log passwords, tokens, OTPs, or recovery links
- Allow users to assign their own roles
- Put trusted authorization roles in editable user metadata
- Use `getSession()` alone as the authoritative server identity without validating the user according to current Supabase SSR guidance
- Expose detailed account-enumeration errors

Deactivating an employee must block application access and, when required, revoke or ban the Supabase Auth user through the server admin API.

---

# Authorization Rules

Roles:

```typescript
type ApplicationRole = "ADMIN" | "MANAGER" | "EMPLOYEE";
```

Authorization is server-side and resource-aware:

- Employee reads private data for self only
- Employee edits/cancels own Pending request only
- Manager approves direct reports only
- Manager cannot approve self
- Admin manages employees and configuration
- Shared calendar exposes approved, privacy-safe data only
- Hidden navigation is not authorization

Centralize permission functions, for example:

```typescript
canManageEmployees()
canReadLeaveRequest()
canEditLeaveRequest()
canApproveLeaveRequest()
canManageLeaveBalance()
canViewAuditLogs()
```

Do not scatter raw role-string checks across components.

---

# Employee and Account Provisioning

Employee and Supabase Auth user are separate records. `employees.auth_user_id` is optional and unique.

One server-only orchestration service must:

1. Authenticate and authorize Admin
2. Validate employee input
3. Validate unique employee code and email
4. Create the Supabase Auth user through `auth.admin.createUser()` when requested
5. Call an RPC or server mutation to create the linked employee record
6. Create default current-year balances
7. Set `must_change_password`
8. Write audit log
9. Return a safe result

Failure handling:

- Supabase Auth admin creation and public-table creation are not automatically one transaction
- Do not falsely describe them as atomic
- If Auth user creation succeeds and employee creation fails, delete, ban, or disable the created Auth user as compensation
- Never include temporary passwords in logs or audit metadata
- Use invitation/recovery links instead of plain-text password distribution when production email is configured

Do not hard delete an employee with history.

---

# Supabase Database Rules

- Use Supabase CLI migrations
- Every schema, constraint, grant, RLS, trigger, view, or database-function change requires a versioned SQL migration
- Do not use the hosted SQL editor as the only source of schema truth
- Review migration SQL
- Run migrations locally before remote deployment
- Generate TypeScript database types from the actual schema
- Do not manually edit generated types except through the documented generation process
- Add primary keys, unique constraints, foreign keys, checks, and indexes
- Enable RLS on every exposed business table
- Define explicit grants as well as RLS policies
- Restrict deletion of historical records
- Use views or RPC functions for privacy-safe calendar and aggregate data
- Avoid dynamic SQL
- Never interpolate untrusted input into SQL
- Use parameterized RPC calls
- Map PostgREST, Auth, Storage, and PostgreSQL errors into safe application errors

## Database Function Rules

Use PostgreSQL functions for multi-table transactional operations:

- reserve leave balance
- edit leave reservation
- approve request
- reject request
- cancel request
- reverse approved request
- adjust balance and write ledger

Functions must:

- validate the actor using `auth.uid()`
- verify role and resource scope
- verify status transition
- recalculate requested days and available balance
- lock affected rows when race conditions are possible
- update request, balance, ledger, notification, and audit records atomically
- return minimal data

Use `security invoker` by default.

If `security definer` is required:

- set a safe and explicit `search_path`
- fully qualify referenced objects
- revoke broad execute privileges
- grant execution only to required roles
- perform explicit authorization inside the function

---

# Row Level Security Rules

RLS is mandatory defense in depth.

Enable RLS on:

- employees
- departments
- leave_types
- leave_balances
- leave_balance_transactions
- leave_requests
- holidays
- notifications
- audit_logs
- attachment metadata
- Storage objects through Storage policies

Rules:

- Employee reads own private data only
- Employee inserts requests only for self
- Employee edits/cancels own Pending request only
- Manager accesses direct-report scope only
- Manager cannot approve self
- Admin access is explicit
- Calendar access uses a privacy-safe view or RPC
- Ordinary users cannot modify roles, manager assignments, used balance, ledger, or audit rows
- Do not write recursive policies that create uncontrolled policy recursion
- Test policies as anonymous, employee, manager, and admin roles
- Service/admin key bypass is not a substitute for RLS

---

# Leave Request States

```text
PENDING
APPROVED
REJECTED
CANCELLED
```

Allowed transitions:

```text
PENDING → APPROVED
PENDING → REJECTED
PENDING → CANCELLED
APPROVED → CANCELLED only through authorized reversal
```

Forbidden:

```text
REJECTED → APPROVED
CANCELLED → APPROVED
APPROVED → PENDING
```

Centralize transition validation.

---

# Leave Calculation Rules

The server is authoritative.

Default calculation:

- Include start and end date
- Exclude Saturday and Sunday
- Exclude active holidays
- Support half day as `0.5`
- Use configured timezone
- Normalize dates safely

Never trust `requestedDays` from client input. Recalculate on create, edit, and immediately before approval.

Use one date library. Add tests for weekends, holidays, boundaries, half day, and timezone behavior.

---

# Overlap Rules

Overlap exists when:

```text
newStart <= existingEnd
AND
newEnd >= existingStart
```

Check against:

```text
PENDING
APPROVED
```

Ignore:

```text
REJECTED
CANCELLED
```

Server validation and unit tests are mandatory.

---

# Leave Balance Rules

Fields:

```text
entitledDays
adjustmentDays
usedDays
pendingDays
```

Derived values:

```text
remaining = entitledDays + adjustmentDays - usedDays
availableToRequest = remaining - pendingDays
```

Rules:

- Do not store derived remaining values without need
- Do not directly edit used days from a form
- Every adjustment creates a ledger transaction
- Pending request reserves balance
- Approval converts pending to used
- Rejection or cancellation releases pending
- Approved cancellation reverses used balance
- Request status and balance update must be atomic inside one PostgreSQL function/RPC transaction
- Revalidate balance immediately before approval
- Prevent negative balance unless leave type allows it

---

# Calendar Rules

Use the calendar implementation already available in the template.

- Query only the visible date range
- Approved requests only
- Filter server-side
- Return privacy-safe event DTOs
- Never return reasons, attachments, medical data, or rejection data to ordinary calendar users
- Sensitive leave types display `Out of Office`
- Use list or compact view on mobile
- Event colors come from validated leave-type configuration

Do not send sensitive data and hide it with CSS.

---

# Form Rules

- React Hook Form
- Zod
- shadcn/ui Form components where available
- Clear defaults, labels, descriptions, and field errors
- Disabled/loading submit state
- Prevent duplicate submission
- Preserve input after recoverable failures
- Use confirmation dialogs for reject, cancel, deactivate, and balance adjustment
- Visibility of a button is not authorization

Schema naming:

```typescript
employeeCreateSchema
employeeUpdateSchema
leaveRequestCreateSchema
leaveRequestUpdateSchema
leaveRejectionSchema
leaveBalanceAdjustmentSchema
```

---

# Server Action Rules

Every mutation follows:

```text
Authenticate
→ Authorize
→ Parse and validate
→ Load current state
→ Enforce business rules
→ Execute transaction
→ Write audit log
→ Revalidate routes
→ Return typed result
```

Recommended result:

```typescript
type ActionResult<T> =
  | { success: true; data: T }
  | {
      success: false;
      error: {
        code: string;
        message: string;
        fieldErrors?: Record<string, string[]>;
        referenceId?: string;
      };
    };
```

Do not throw raw internal errors into Client Components.

---

# UI Rules

- Functional components only
- Reuse shadcn/ui before custom equivalents
- Tailwind CSS and shared variants
- Use `cn()` for conditional classes
- Avoid arbitrary styling when tokens exist
- Use Lucide icons
- Use Sonner for toast
- Card for dashboard widgets
- AlertDialog for destructive confirmation
- Skeleton for loading
- Badge for status
- DropdownMenu for row actions
- Tooltip or accessible label for icon-only buttons

Follow the template's sidebar, header, content width, typography, radius, borders, table density, form spacing, and themes.

Do not use random gradients, colors, radii, or shadows.

---

# State Management Rules

- Server state stays on the server
- Form state uses React Hook Form
- Table search/filter/sort/pagination should use URL state when appropriate
- Zustand only for cross-component UI state
- Local state for local interactions
- No business data in Local Storage
- Do not add another global state library
- Do not mirror the whole database into Zustand

---

# Table Rules

Use TanStack Table with:

- Typed columns
- Stable row IDs
- Loading and empty states
- Pagination
- Search, filters, and sorting
- Accessible row actions
- Mobile strategy
- Authorization-aware actions

For growing datasets, filtering, sorting, and pagination must occur in Supabase Postgres. Do not fetch all rows and call it server pagination.

---

# Error Handling

Standard codes:

```text
VALIDATION_ERROR
UNAUTHENTICATED
FORBIDDEN
NOT_FOUND
CONFLICT
BUSINESS_RULE_ERROR
INTERNAL_ERROR
```

Rules:

- Do not expose raw Supabase, PostgREST, PostgreSQL, Auth, or Storage errors
- Do not expose stack traces
- Generate reference ID for unexpected errors
- Log sanitized debugging context
- Use route error boundaries
- Differentiate conflict from validation error

---

# Logging and Audit

Application logs and audit logs are separate.

Never log:

- Passwords or hashes
- Session/reset tokens
- Authentication secrets
- Connection strings
- Medical attachments

Audit logs contain actor, action, entity, timestamp, and sanitized metadata. Normal UI must not modify audit history.

---

# Security Rules

- Validate all untrusted input
- Enforce server-side authorization
- Disable public sign-up
- Prevent IDOR, mass assignment, self-role escalation, and self-approval
- Use Supabase Auth cookie-based SSR and framework protections
- Configure trusted origins
- Rate-limit login and sensitive admin actions
- Keep secrets in environment variables
- Validate uploads by type, size, and ownership
- Do not render untrusted HTML
- Validate redirect targets
- Client-side hidden controls are not security controls

---

# Privacy Rules

Ordinary employees cannot access other employees':

- Leave reasons
- Medical details
- Attachments
- Rejection reasons
- Manager notes
- Balance details

Shared calendar returns only approved public fields. Sensitive types show `Out of Office`.

---

# Accessibility and Responsive Rules

- Semantic HTML
- Real buttons and links
- Input labels
- Accessible icon buttons
- Dialog focus management
- Table headers
- Visible focus states
- Status not based on color alone
- Keyboard navigation
- Reduced-motion support
- Minimum width support: 360px
- Mobile sidebar, form, table, dialog, and calendar behavior
- No page-level horizontal overflow

---

# Performance Rules

- Server Components by default
- Minimize Client Components
- Select only required database fields
- Use database aggregates
- Add indexes
- Paginate large lists
- Query calendar by visible range
- Avoid N+1 and duplicate queries
- Avoid unnecessary Zustand subscriptions
- Avoid large client bundles
- Reuse template components

---

# Naming Conventions

## Components

```typescript
EmployeeForm.tsx
EmployeeDataTable.tsx
LeaveRequestForm.tsx
LeaveBalanceCard.tsx
ApprovalActions.tsx
SharedLeaveCalendar.tsx
```

## Actions

```typescript
createEmployeeAction()
updateEmployeeAction()
createLeaveRequestAction()
approveLeaveRequestAction()
rejectLeaveRequestAction()
adjustLeaveBalanceAction()
```

## Services

```typescript
createEmployeeWithAccount()
calculateLeaveDays()
validateLeaveOverlap()
reserveLeaveBalance()
approveLeaveRequest()
cancelLeaveRequest()
```

## Files

Use kebab-case for non-component files:

```text
leave-request.service.ts
leave-calculation.ts
permission-map.ts
action-result.ts
```

Follow existing repository conventions where they differ.

---

# Environment Variables

Provide `.env.example` and never commit `.env` or `.env.local`.

Expected variables:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
SUPABASE_SECRET_KEY
NEXT_PUBLIC_APP_URL
```

A project using legacy key naming may temporarily use:

```text
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

Rules:

- Prefer current publishable and secret keys for new projects
- The secret or service-role key is server-only
- Never prefix a secret with `NEXT_PUBLIC_`
- Validate environment variables at startup
- Never log environment values
- Never create an admin client in a browser-importable module

---

# Migration and Seed Rules

- Use Supabase CLI
- Initialize the project with `supabase init`
- Store schema changes in `supabase/migrations`
- Use meaningful migration names
- Review SQL before applying
- Do not rewrite migrations already applied to shared environments
- Use `supabase/seed.sql` or configured seed files for reproducible local data
- Test migrations with local Supabase
- Use `supabase db reset` only against local development unless explicitly understood and authorized
- Generate database types after schema changes
- Document local, staging, and production migration commands
- Production seed must not create known default credentials

---

# Testing Rules

## Unit Tests

Required for:

- Leave-day calculation
- Weekend and holiday exclusion
- Half day
- Overlap detection
- Status transitions
- Balance formula
- Permission functions

## Database and RLS Tests

Use pgTAP or Supabase database tests for:

- RLS policies for employee, manager, and admin
- Anonymous access denial
- Role-escalation prevention
- Calendar privacy view/RPC
- Approval and balance transaction functions
- Forbidden status transitions
- Constraints and indexes where testable

## Integration Tests

Required for:

- Employee with/without account creation
- Duplicate email and employee code
- Request balance reservation
- Approval balance update
- Rejection release
- Cancellation reversal
- Manager scope
- Self-approval prevention

## End-to-End Tests

Critical flow:

```text
Admin creates employee account
→ Employee changes password
→ Employee submits request
→ Manager approves
→ Balance updates
→ Leave appears on calendar
→ Unrelated employee cannot see private reason
```

---

# Required Verification

Inspect `package.json` and use exact scripts. Expected commands may include:

```bash
npm run lint
npm run check
npm run test
npm run test:e2e
npm run build
```

The assistant must:

- Run available checks
- Report exact results
- Fix failures introduced by its changes
- Never fake command output
- Never delete tests to make a build pass
- Never weaken TypeScript settings

---

# AI Output Requirements

Before coding, provide:

1. Relevant existing files
2. Reusable template components
3. Scoped implementation plan
4. Database impact
5. Authorization impact
6. Test plan
7. Risks and assumptions

After coding, provide:

1. Files created, modified, and deleted
2. Dependencies changed
3. Environment variables added
4. Supabase SQL migrations, RLS policies, functions, generated types, and Storage policies
5. Features implemented
6. Tests added
7. Commands run and actual results
8. Known limitations
9. Manual verification steps

---

# Prohibited AI Behavior

The assistant must not:

- Code before inspecting the repository
- Replace the template wholesale
- Invent successful command output
- Hide build errors
- Use `any` as an escape hatch
- Add an ORM or a second authentication framework without explicit approval
- Store business data in Local Storage
- Enable public registration
- Trust role, employee ID, requested days, or balance from client payload
- Hard delete submitted leave requests
- Expose private reasons on calendar
- Allow self-approval
- Update request and balance outside one database function/RPC transaction
- Log passwords or secrets
- Commit environment secrets
- Expose the Supabase secret or service-role key
- Disable RLS to make a feature work
- Use the admin client for ordinary end-user queries
- Trust editable user metadata for authorization
- Perform unrelated mass refactors
- Add packages without explanation
- Leave TODO placeholders as completed work
- Claim production readiness without tests

---

# Antigravity CLI Workflow

For every phase:

```text
1. Read PRD and Project Rules
2. Inspect relevant existing code
3. Produce a scoped plan
4. Implement one coherent slice
5. Add or update tests
6. Run checks
7. Fix introduced issues
8. Report actual changes and risks
```

Recommended phase prompt:

```text
Read leave-request-management-prd-supabase.md and
leave-request-management-project-rules-supabase.md.

Implement only Phase <NUMBER>: <PHASE NAME>.

Before coding:
- inspect the repository
- identify reusable template components
- list files to change
- explain database and authorization impact
- explain the test plan

Then implement the phase.

After coding:
- run available checks
- report exact command results
- list changed files
- list migrations and environment variables
- explain manual test steps
- disclose unresolved risks

Do not implement later phases.
Do not refactor unrelated code.
```
