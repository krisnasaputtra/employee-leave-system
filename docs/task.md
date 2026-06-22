# Task List

# Leave Request Management System — Supabase

## Usage Rules

- This file is the execution checklist for Antigravity CLI.
- Complete one phase at a time.
- Do not mark `[x]` based on intention.
- Mark `[x]` only after implementation and verification.
- Add evidence under completed tasks when useful.
- Do not skip security, RLS, migration, or testing tasks.
- Do not implement future phases opportunistically.
- Repository inspection is mandatory before code changes.

---

# Phase 0 — Repository Inspection and Baseline

## Repository Inspection

- [x] Confirm current working directory is `Training-VibeCode/employee-leave-system`
  - Evidence: `C:\Users\901544\Documents\BNI-Training\Training_VibeCode\employee-leave-system`
- [x] Identify package manager from lockfile
  - Evidence: **No lockfile exists.** Repository contains only 4 `.md` planning docs.
  - Template uses npm (`package-lock.json` on GitHub)
- [x] Read `package.json`
  - Evidence: **No `package.json` exists.** Template `package.json` verified on GitHub (v2.2.0)
- [x] Record exact Next.js, React, TypeScript, and Tailwind versions
  - Evidence: Template: next ^16.2.9, react ^19.2.7, typescript ^5.9.3, tailwindcss ^4.1.5
- [x] Confirm App Router usage
  - Evidence: Template uses `src/app/` with route groups `(external)` and `(main)`
- [x] Confirm whether the repository uses `src/`
  - Evidence: Template uses `src/`. Local repo has no `src/` — no source code at all.
- [ ] Read `components.json` — **BLOCKED: no source code exists**
- [ ] Read `tsconfig.json` — **BLOCKED: no source code exists**
- [ ] Read Next.js configuration — **BLOCKED: no source code exists**
- [ ] Read Biome configuration — **BLOCKED: no source code exists**
- [x] Inspect environment example files
  - Evidence: No `.env`, `.env.example`, or `.env.local` exists
- [x] List all application routes
  - Evidence: No routes exist locally. Template routes verified via GitHub API.
- [x] List all shared UI components
  - Evidence: No UI components exist locally. Template has `src/components/ui/` and `src/components/calendar/`
- [x] Identify sidebar and navigation config
  - Evidence: Template has `src/navigation/sidebar/` and `dashboard/_components/sidebar/`
- [x] Identify dashboard components
  - Evidence: Template has 15+ dashboard variants (default, crm, ecommerce, finance, analytics, etc.)
- [x] Identify authentication pages
  - Evidence: Template has `auth/v1/login`, `auth/v2/login`, `auth/v1/register`, `auth/v2/register`
- [x] Identify users/roles pages
  - Evidence: Template has `dashboard/users/` and `dashboard/roles/`
- [x] Identify TanStack Table abstractions
  - Evidence: Template has multiple table implementations (CRM, default, ecommerce, roles)
- [x] Identify FullCalendar components
  - Evidence: Template has `src/components/calendar/` and `dashboard/calendar/`
- [x] Identify existing server actions and route handlers
  - Evidence: Template has `src/server/` directory
- [x] Inspect existing Supabase files
  - Evidence: **No Supabase files exist** — no `supabase/` dir, no clients, no types
- [x] Inspect existing tests
  - Evidence: **No tests exist.** Template has no test infrastructure.

## System Environment

- [x] Node.js: v22.14.0
- [x] npm: 10.9.2
- [x] Git: 2.52.0
- [x] Docker: 29.1.3
- [x] pnpm: not installed
- [x] yarn: not installed
- [x] Supabase CLI: not installed (will use `npx supabase`)

## Baseline Verification

- [ ] Clone template into repository — **REQUIRED FIRST**
- [ ] Install dependencies using the existing lockfile
- [ ] Run existing lint/check command (`npm run check`)
- [ ] Run existing TypeScript check (`npx tsc --noEmit`)
- [ ] Run existing tests — **N/A: no test infrastructure in template**
- [ ] Run existing production build (`npm run build`)
- [ ] Record pre-existing failures without hiding them
- [x] Create a reusable-component mapping
  - Evidence: Documented in phase0-repository-inspection.md artifact
- [x] Create a repository-vs-plan gap analysis
  - Evidence: Documented in phase0-repository-inspection.md artifact
- [ ] Confirm Phase 1 scope before coding — **PENDING user review**

---

# Phase 1 — Supabase Foundation

## Dependencies and Configuration

- [ ] Add `@supabase/supabase-js` if missing
- [ ] Add `@supabase/ssr` if missing
- [ ] Initialize Supabase CLI if absent
- [ ] Create or update `.env.example`
- [ ] Add environment validation
- [ ] Confirm no secret uses `NEXT_PUBLIC_`
- [ ] Confirm admin key is never imported by client code

## Supabase Clients

- [ ] Create browser Supabase client
- [ ] Create request-scoped server Supabase client
- [ ] Create server-only admin Supabase client
- [ ] Create SSR auth-refresh helper
- [ ] Integrate middleware/proxy according to the actual Next.js/Supabase setup
- [ ] Add tests or static checks for server/client boundaries

## Initial Database

- [ ] Create initial SQL migration
- [ ] Create enums or check constraints
- [ ] Create `departments`
- [ ] Create `employees`
- [ ] Create `leave_types`
- [ ] Create `holidays`
- [ ] Create `leave_balances`
- [ ] Create `leave_requests`
- [ ] Create `leave_balance_transactions`
- [ ] Create `notifications`
- [ ] Create `audit_logs`
- [ ] Add primary keys
- [ ] Add unique constraints
- [ ] Add foreign keys
- [ ] Add check constraints
- [ ] Add required indexes
- [ ] Add updated-at strategy
- [ ] Enable RLS on every exposed table
- [ ] Create seed structure
- [ ] Apply migration locally
- [ ] Generate `database.types.ts`
- [ ] Run production build

---

# Phase 2 — Authentication and Role-Aware Shell

## Authentication

- [ ] Adapt the template login screen
- [ ] Implement email/password login
- [ ] Implement safe generic auth errors
- [ ] Implement logout
- [ ] Implement current authenticated user validation
- [ ] Implement linked employee/profile loader
- [ ] Enforce active employment/account status
- [ ] Implement `/change-password`
- [ ] Enforce `must_change_password`
- [ ] Add safe redirect validation
- [ ] Disable public self-registration in UI
- [ ] Document required Supabase Auth configuration

## Permissions

- [ ] Create centralized role types
- [ ] Create `canManageEmployees`
- [ ] Create `canViewEmployee`
- [ ] Create `canManageLeaveBalance`
- [ ] Create `canCreateLeaveRequest`
- [ ] Create `canEditLeaveRequest`
- [ ] Create `canApproveLeaveRequest`
- [ ] Create `canViewAuditLogs`
- [ ] Add unit tests for permission functions

## App Shell

- [ ] Adapt sidebar navigation config
- [ ] Add Employee navigation
- [ ] Add Manager navigation
- [ ] Add Admin navigation
- [ ] Hide unauthorized navigation items
- [ ] Enforce server authorization separately
- [ ] Preserve mobile navigation behavior
- [ ] Preserve light and dark modes
- [ ] Replace irrelevant demo navigation
- [ ] Run lint, typecheck, tests, and build

---

# Phase 3 — Employee and Account Management

## Database and RLS

- [ ] Implement employee self-read policy
- [ ] Implement safe employee directory policy
- [ ] Implement manager direct-report policy
- [ ] Implement Admin employee-management policy
- [ ] Prevent employee role self-update
- [ ] Prevent employee status self-update
- [ ] Add RLS tests for anonymous
- [ ] Add RLS tests for Employee
- [ ] Add RLS tests for Manager
- [ ] Add RLS tests for Admin

## Employee Queries and UI

- [ ] Implement employee list query
- [ ] Implement database-backed pagination
- [ ] Implement search by name, code, and email
- [ ] Implement department filter
- [ ] Implement role filter
- [ ] Implement status filter
- [ ] Adapt template TanStack Table
- [ ] Implement employee detail
- [ ] Implement employee edit
- [ ] Add loading state
- [ ] Add empty state
- [ ] Add error state
- [ ] Add responsive table behavior

## Employee Creation

- [ ] Create employee Zod schema
- [ ] Create employee form
- [ ] Add optional `Create login account`
- [ ] Add role selection
- [ ] Add temporary password generation
- [ ] Ensure password is displayed only once
- [ ] Create server-only account-provisioning service
- [ ] Implement `create_employee_profile` RPC
- [ ] Initialize current-year balances
- [ ] Write audit log
- [ ] Implement compensation cleanup after partial failure
- [ ] Test employee creation without account
- [ ] Test employee creation with account
- [ ] Test duplicate email
- [ ] Test duplicate employee code
- [ ] Test partial failure cleanup

## Employee Deactivation

- [ ] Implement employee deactivation
- [ ] Ban/disable linked Supabase Auth user
- [ ] Verify deactivated user cannot access app
- [ ] Write audit log
- [ ] Add confirmation dialog
- [ ] Run all verification commands

---

# Phase 4 — Departments, Leave Types, and Holidays

## Departments

- [ ] Implement department list
- [ ] Implement create department
- [ ] Implement edit department
- [ ] Implement activate/deactivate department
- [ ] Prevent destructive deletion when referenced
- [ ] Add Admin-only RLS
- [ ] Add validation and tests

## Leave Types

- [ ] Seed Annual Leave
- [ ] Seed Sick Leave
- [ ] Seed Emergency Leave
- [ ] Seed Unpaid Leave
- [ ] Implement leave type list
- [ ] Implement create leave type
- [ ] Implement edit leave type
- [ ] Implement activate/deactivate leave type
- [ ] Implement allowed color handling
- [ ] Implement balance-deduction settings
- [ ] Implement calendar privacy setting
- [ ] Prevent destructive deletion when referenced
- [ ] Add Admin-only RLS
- [ ] Add tests

## Holidays

- [ ] Implement holiday list
- [ ] Implement create holiday
- [ ] Implement edit holiday
- [ ] Implement activate/deactivate holiday
- [ ] Add recurring-year option if retained in MVP
- [ ] Add Admin-only RLS
- [ ] Add tests
- [ ] Run all verification commands

---

# Phase 5 — Leave Balance and Ledger

## Schema and Policies

- [ ] Confirm balance unique constraint
- [ ] Confirm numeric precision
- [ ] Prevent direct browser mutation of balances
- [ ] Prevent direct browser mutation of ledger
- [ ] Implement own-balance select policy
- [ ] Implement manager direct-report balance policy
- [ ] Implement Admin balance access
- [ ] Add RLS tests

## RPC Functions

- [ ] Implement `initialize_employee_balances`
- [ ] Implement `adjust_leave_balance`
- [ ] Lock affected balance row
- [ ] Require adjustment reason
- [ ] Write `ADJUSTMENT` ledger record
- [ ] Write notification
- [ ] Write audit entry
- [ ] Add database tests

## UI

- [ ] Implement personal balance cards
- [ ] Show entitled days
- [ ] Show adjustment days
- [ ] Show used days
- [ ] Show pending days
- [ ] Show remaining days
- [ ] Show available-to-request days
- [ ] Implement Admin balance adjustment form
- [ ] Implement balance transaction history
- [ ] Add loading, empty, error, and responsive states
- [ ] Run all verification commands

---

# Phase 6 — Leave Request CRUD

## Calculation and Validation

- [ ] Implement `calculate_leave_days`
- [ ] Exclude Saturdays
- [ ] Exclude Sundays
- [ ] Exclude active holidays
- [ ] Support half day
- [ ] Add date-boundary tests
- [ ] Add weekend tests
- [ ] Add holiday tests
- [ ] Add half-day tests
- [ ] Implement overlap detection
- [ ] Test inclusive overlap boundaries

## Create Request RPC

- [ ] Implement `create_leave_request`
- [ ] Resolve employee from `auth.uid()`
- [ ] Verify active employee
- [ ] Validate active leave type
- [ ] Calculate requested days on server
- [ ] Ignore client requested-day total
- [ ] Detect overlap
- [ ] Lock balance row
- [ ] Validate available balance
- [ ] Insert Pending request
- [ ] Increment pending balance
- [ ] Insert `RESERVE` ledger transaction
- [ ] Write notification
- [ ] Write audit log
- [ ] Add RPC tests

## Request UI

- [ ] Implement request form
- [ ] Show current balance
- [ ] Show pending balance
- [ ] Show calculated preview
- [ ] Show estimated remaining balance
- [ ] Show overlap/conflict error
- [ ] Implement own request table
- [ ] Implement filters
- [ ] Implement request detail
- [ ] Implement loading, empty, error, and responsive states

## Update and Cancel

- [ ] Implement `update_pending_leave_request`
- [ ] Release old reservation
- [ ] Apply new reservation
- [ ] Re-run all validations
- [ ] Implement edit page
- [ ] Implement `cancel_leave_request`
- [ ] Release pending reservation
- [ ] Insert `RELEASE` ledger transaction
- [ ] Add confirmation dialog
- [ ] Add RLS tests
- [ ] Add E2E employee-request flow
- [ ] Run all verification commands

---

# Phase 7 — Approval Workflow

## Approval Policies

- [ ] Implement Manager direct-report request access
- [ ] Implement Admin all-request access
- [ ] Prevent Employee approval
- [ ] Prevent self-approval
- [ ] Add RLS/database tests

## Approval Inbox

- [ ] Implement pending approval query
- [ ] Add search
- [ ] Add filters
- [ ] Show employee balance summary
- [ ] Show team conflicts
- [ ] Show request detail
- [ ] Adapt template table and dialogs
- [ ] Add loading, empty, error, and responsive states

## Approve RPC

- [ ] Implement `approve_leave_request`
- [ ] Lock request
- [ ] Verify Pending status
- [ ] Verify actor scope
- [ ] Prevent self-approval
- [ ] Lock balance
- [ ] Revalidate balance
- [ ] Revalidate overlap
- [ ] Move pending days to used days
- [ ] Set approver and timestamp
- [ ] Insert `USE` ledger transaction
- [ ] Notify employee
- [ ] Write audit log
- [ ] Test concurrent approval behavior

## Reject RPC

- [ ] Implement `reject_leave_request`
- [ ] Require rejection reason
- [ ] Verify actor scope
- [ ] Release pending days
- [ ] Insert `RELEASE` transaction
- [ ] Set status and decision fields
- [ ] Notify employee
- [ ] Write audit log
- [ ] Add E2E approval flow
- [ ] Run all verification commands

---

# Phase 8 — Shared Leave Calendar

## Privacy-Safe Data

- [ ] Create calendar event view or RPC
- [ ] Return Approved requests only
- [ ] Accept visible start and end range
- [ ] Add department filter
- [ ] Add employee filter
- [ ] Add leave-type filter where allowed
- [ ] Mask sensitive leave types as `Out of Office`
- [ ] Exclude reason
- [ ] Exclude attachment metadata
- [ ] Exclude rejection data
- [ ] Add privacy tests

## UI

- [ ] Adapt template FullCalendar page
- [ ] Implement month view
- [ ] Implement week view
- [ ] Implement list view
- [ ] Implement mobile list fallback
- [ ] Implement safe event detail dialog/drawer
- [ ] Use validated leave-type colors
- [ ] Query only visible date range
- [ ] Add loading, empty, and error states
- [ ] Verify keyboard accessibility
- [ ] Run all verification commands

---

# Phase 9 — Dashboards, Notifications, and Audit

## Employee Dashboard

- [ ] Remaining leave card
- [ ] Pending leave card
- [ ] Approved days card
- [ ] Next approved leave
- [ ] Recent requests
- [ ] Upcoming team leave
- [ ] Quick create action

## Manager Dashboard

- [ ] Pending approvals
- [ ] Employees on leave today
- [ ] Upcoming team leave
- [ ] Team leave usage
- [ ] Recent requests
- [ ] Quick approval/calendar actions

## Admin Dashboard

- [ ] Active employee count
- [ ] Pending request count
- [ ] Employees on leave today
- [ ] Leave utilization
- [ ] Status distribution
- [ ] Usage trend
- [ ] Recent audit activity
- [ ] Remove all fake production data

## Notifications

- [ ] Implement notification dropdown
- [ ] Implement unread count
- [ ] Implement notification list page
- [ ] Implement mark-as-read
- [ ] Add own-notification RLS
- [ ] Add tests

## Audit Logs

- [ ] Implement Admin-only audit list
- [ ] Add pagination
- [ ] Add action filter
- [ ] Add entity filter
- [ ] Sanitize metadata output
- [ ] Prevent normal UI mutation
- [ ] Add tests
- [ ] Run all verification commands

---

# Phase 10 — Supabase Storage Attachments

- [ ] Create private `leave-attachments` bucket
- [ ] Create attachment metadata migration
- [ ] Add Storage RLS policies
- [ ] Implement sanitized object path
- [ ] Restrict MIME types
- [ ] Restrict file size
- [ ] Implement Pending-request upload
- [ ] Implement Pending-request remove
- [ ] Implement signed/authenticated download
- [ ] Permit direct manager review
- [ ] Permit Admin review
- [ ] Deny unrelated employees
- [ ] Keep calendar payload attachment-free
- [ ] Define retention policy
- [ ] Test unauthorized access
- [ ] Run all verification commands

---

# Phase 11 — Quality, Security, and Deployment

## Automated Verification

- [ ] All unit tests pass
- [ ] All pgTAP/RLS tests pass
- [ ] All integration tests pass
- [ ] All Playwright critical flows pass
- [ ] Biome passes
- [ ] TypeScript passes
- [ ] Production build passes

## Security Review

- [ ] Public self-registration disabled
- [ ] No service-role key in client bundle
- [ ] RLS enabled on all exposed tables
- [ ] All server mutations authorize
- [ ] No IDOR paths
- [ ] No role self-escalation
- [ ] No self-approval
- [ ] No private reason in shared calendar
- [ ] No raw Supabase/Postgres errors exposed
- [ ] No password/token logging
- [ ] Storage access tested
- [ ] Rate limiting strategy documented

## UX and Accessibility

- [ ] Mobile 360px review
- [ ] Tablet review
- [ ] Desktop review
- [ ] Dark mode review
- [ ] Keyboard navigation review
- [ ] Focus visibility review
- [ ] Screen-reader label review
- [ ] Table mobile behavior review
- [ ] Calendar mobile behavior review
- [ ] Empty/loading/error states reviewed

## Deployment

- [ ] Document local Supabase startup
- [ ] Document migration workflow
- [ ] Document type-generation workflow
- [ ] Document seed workflow
- [ ] Configure Vercel environment variables
- [ ] Configure Supabase Auth URLs
- [ ] Configure trusted redirect URLs
- [ ] Apply production migrations
- [ ] Confirm production RLS
- [ ] Confirm no default production credentials
- [ ] Document backup and rollback approach
- [ ] Document known limitations

---

# Critical End-to-End Acceptance Flow

- [ ] Admin signs in
- [ ] Admin creates department
- [ ] Admin creates employee with login account
- [ ] Employee changes temporary password
- [ ] Admin confirms initial leave balance
- [ ] Employee signs in
- [ ] Employee submits leave request
- [ ] Pending balance is reserved
- [ ] Manager signs in
- [ ] Manager sees only direct-report request
- [ ] Manager cannot approve own request
- [ ] Manager approves employee request
- [ ] Pending balance moves to used
- [ ] Employee receives notification
- [ ] Approved leave appears in shared calendar
- [ ] Another employee cannot see private leave reason
- [ ] Audit log records the critical operations

---

# Current Blocker

- [x] ~~Attach or open the actual `Training-VibeCode/employee-leave-system` repository~~
  - Evidence: Repository inspected. Contains only 4 planning documents, no source code.
- [ ] Clone the reference template (`arhamkhnz/next-shadcn-admin-dashboard`) into the repository
  - Requires: Moving existing `.md` docs to `docs/` first (non-empty directory conflict)
  - Command: `npx -y create-next-app@latest ./ --example "https://github.com/arhamkhnz/next-shadcn-admin-dashboard" --use-npm`
- [ ] Verify baseline build passes (check, typecheck, build)
- [ ] Create `.env.example` with required Supabase variables
- [x] Complete Phase 0 repository inspection
  - Evidence: Full inspection documented in phase0-repository-inspection.md artifact
- [ ] Get user approval to proceed with template cloning
