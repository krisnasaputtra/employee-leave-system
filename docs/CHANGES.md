# CHANGES.md — Employee Leave System

Catatan lengkap seluruh perubahan selama pengembangan.

---

## 2026-06-22 — Project Initialization

### `551748a` Initial commit from Create Next App
- Scaffolding Next.js project menggunakan Create Next App
- Setup awal dengan TypeScript, Tailwind CSS, ESLint

### `58110a8` initial commit
- Setup Supabase backend (auth, database, RLS policies)
- Database schema: `employees`, `departments`, `leave_types`, `leave_requests`, `leave_balances`, `holidays`, `notifications`, `audit_logs`
- 12 SQL migration files di `supabase/migrations/`
- Supabase RPC functions: `create_leave_request`, `approve_leave_request`, `reject_leave_request`, `calculate_leave_days`, `check_department_capacity`
- Authentication flow: login, change password, cookie-based session
- Middleware: auth guard, session refresh, public path whitelist
- Dashboard layout: sidebar navigation, theme switcher (Brutalist/Soft Pop/Tangerine)
- Role-based access: ADMIN, MANAGER, EMPLOYEE
- Basic CRUD: employee management, leave types, departments

---

## 2026-06-23 — Phase 13-14: UI & Feature Build

### `516ada2` feat: Phase 13-14 + UI fixes + code review page + Playwright E2E
**Fitur baru:**
- Settings pages: Leave Types, Departments, Holidays (full CRUD dengan form dialogs)
- Bulk Approve/Reject pada halaman Approvals
- Code Review page (`/code-review`) — 425-item checklist interaktif
- Playwright E2E initial setup + `critical-flow.spec.ts` (20 tests)
- Audit Logs page (read-only)
- Badge variants system (`src/lib/ui/badge-variants.ts`)
- Empty state component (`src/components/ui/empty-state.tsx`)
- Format date utility (`src/lib/utils/format-date.ts`)
- Sanitize search utility (`src/lib/utils/sanitize-search.ts`)
- Error sanitization (`src/lib/utils/sanitize-error.ts`)

**Files baru (selected):**
- `src/app/code-review/page.tsx` — 2500+ line review checklist
- `src/app/(main)/dashboard/settings/leave-types/page.tsx`
- `src/app/(main)/dashboard/settings/departments/page.tsx`
- `src/app/(main)/dashboard/settings/holidays/page.tsx`
- `src/app/(main)/dashboard/audit-logs/page.tsx`
- `e2e/critical-flow.spec.ts`
- `vitest.config.ts`
- Unit tests di `src/lib/`

---

## 2026-06-24 — Phase 15: Complete Feature Set

### `8a6b2c6` feat: Phase 15 complete + P3 backlog items
**Fitur baru:**
- Leave Analytics Dashboard (`/dashboard/analytics-reports`) — 3 charts + export
- Email Notifications via Resend API (`src/lib/email/`)
- Delegation/Proxy Approval system (`/dashboard/delegations`)
- Leave Request Comments (`comment-section.tsx`)
- Attachment support pada leave requests
- Leave Balances manage page (`/dashboard/leave/balances/manage`)
- Settings: Policies page + Capacity Rules page
- Team page (`/dashboard/team`) — manager view
- Calendar page (`/dashboard/calendar`) — FullCalendar integration
- Profile page (`/dashboard/profile`)
- Notification system (in-app + email)
- Dashboard overview page with stat cards

**Files baru (selected):**
- `src/lib/email/client.ts`, `send.ts`, `templates.ts`
- `src/lib/delegations/check-delegation.ts`, `schemas.ts`
- `src/app/(main)/dashboard/analytics-reports/page.tsx`
- `src/app/(main)/dashboard/delegations/page.tsx`
- `src/app/(main)/dashboard/calendar/page.tsx`
- `src/app/(main)/dashboard/team/page.tsx`
- `src/app/(main)/dashboard/profile/page.tsx`
- `src/app/(main)/dashboard/notifications/page.tsx`
- `supabase/migrations/20240624_add_delegation_support.sql`
- `supabase/migrations/20240625_add_policy_capacity.sql`

---

## 2026-06-25 — Phase 16-19: Polish & Production Readiness

### `b400133` feat: Phase 16 Leave Policy Engine & Capacity Rules + Code Review Fixes
- Leave Policy Engine dengan configurable rules
- Capacity Rules per department
- Code review fixes: DRY patterns, explicit selects

### `765f5b5` feat: Calendar UI/UX improvements
- `dayMaxEvents` limit untuk compact calendar
- Popover for overflow events
- Responsive calendar rendering

### `1b57db6` feat: Quick Wins — Employee Lifecycle & Team Visibility
- Employee activate/deactivate workflow
- Team visibility improvements
- All Leave Requests page (`/dashboard/leave/all`)

### `0586fcb` refactor: Code review fixes
- DRY `UUID_RE` constant
- Explicit Supabase selects (no more `select("*")`)
- Batch capacity checks (Promise.allSettled)

### `23fc89c` feat: Searchable Combobox selects + Export CSV
- **Combobox component** (`src/components/ui/combobox.tsx`) — searchable select dropdowns
- **Export CSV** (`src/lib/utils/export-csv.ts`) — page-level + full data export
- `ExportButton` + `ExportCSVButton` components
- Applied to: employee forms (department, manager selects), leave request form (leave type)

### `6378baa` feat: Employee self-edit profile page
- Profile edit form (`src/app/(main)/dashboard/profile/_components/profile-edit-form.tsx`)
- Server action for profile update (`src/app/(main)/dashboard/profile/actions.ts`)

### `0dbe9e7` feat: TanStack React Query integration
**Files baru:**
- `src/providers/query-provider.tsx` — QueryClientProvider (1min stale, no refetch-on-focus)
- `src/hooks/use-notifications.ts` — `useMarkNotificationRead`, `useMarkAllNotificationsRead`
- `src/hooks/use-approval-mutations.ts` — `useApproveLeaveRequest`, `useRejectLeaveRequest`, `useBulkApprove`, `useBulkReject`
- `src/hooks/use-comment-mutation.ts` — `useAddComment`

**Files diubah:**
- `src/app/layout.tsx` — wrapped dengan `<QueryProvider>`
- `src/app/(main)/dashboard/notifications/_components/notification-list.tsx` — refactored ke TanStack mutations
- `src/app/(main)/dashboard/approvals/_components/approval-actions.tsx` — refactored ke TanStack mutations

### `7321383` fix: Code review page — 425/425 (100%) reviewed
- Auto-check ALL items yang punya review note (bukan hanya pass/fixed)
- Update summary table counts (330 pass, 31 fixed, 5 warn, 59 info)

### `877db31` feat: TanStack Query — proper integration with debounced search
**Files baru:**
- `src/hooks/use-debounce.ts` — generic debounce hook (300ms default)
- `src/app/(main)/dashboard/employees/fetch-employees.ts` — server action data fetcher
- `src/app/(main)/dashboard/employees/_components/employee-list-client.tsx` — client component with useQuery

**Files diubah:**
- `src/app/(main)/dashboard/employees/page.tsx` — thin Server Component → client useQuery
- `src/providers/query-provider.tsx` — added React Query DevTools

**Arsitektur:**
```
page.tsx (Server Component) → fetchXxx() SSR
  └── <XxxClient initialData={...} />
        ├── useQuery(queryKey, queryFn, { initialData, placeholderData })
        ├── useDebounce(search, 300)
        └── Client-side filters & pagination
```

### `530376c` feat: TanStack Query for Approvals, My Requests, All Requests
**Files baru:**
- `src/app/(main)/dashboard/approvals/fetch-approvals.ts`
- `src/app/(main)/dashboard/approvals/_components/approvals-page-client.tsx`
- `src/app/(main)/dashboard/leave/all/fetch-all-requests.ts`
- `src/app/(main)/dashboard/leave/all/_components/all-requests-client.tsx`
- `src/app/(main)/dashboard/leave/requests/fetch-my-requests.ts`
- `src/app/(main)/dashboard/leave/requests/_components/my-requests-client.tsx`

**Files diubah:**
- `src/app/(main)/dashboard/approvals/page.tsx` — thin server component
- `src/app/(main)/dashboard/leave/all/page.tsx` — thin server component
- `src/app/(main)/dashboard/leave/requests/page.tsx` — thin server component

### `190618d` perf: Fix slow search in All Requests
- **Problem:** searching on joined column (`employees.full_name`) via `.or()` caused full table scan
- **Solution:** 2-step query — first find matching employee IDs, then filter leave_requests
- Also: explicit column select instead of `select("*")`

### `80b5263` feat: Security Hardening + Performance Audit

**Security — files baru:**
- `src/lib/security/rate-limit.ts` — in-memory sliding window rate limiter

**Security — files diubah:**
- `next.config.mjs` — added 6 security headers:
  - `Content-Security-Policy` (CSP)
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `X-DNS-Prefetch-Control: on`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- `src/middleware.ts` — rate limiting (10 req/min) for `/login`, `/change-password`, `/auth/signout`

**Performance — files baru:**
- 18× `loading.tsx` skeleton files across all dashboard pages

**Performance — files diubah:**
- 10 Supabase queries: `select("*")` → explicit columns
- `src/app/(main)/dashboard/approvals/actions.ts` — `bulkApproveAction` & `bulkRejectAction` refactored from sequential loop → `Promise.allSettled`

**Audit results:**
- Input sanitization: all server actions use Zod validation ✅
- Images: all using Next.js `<Image>` component ✅
- No N+1 queries remaining ✅

### `795ff0d` feat: i18n (EN/ID) + Accessibility (WCAG 2.1) audit

**i18n — files baru:**
- `src/locales/en.json` — English translations (142 keys)
- `src/locales/id.json` — Bahasa Indonesia translations (142 keys)
- `src/providers/locale-provider.tsx` — `LocaleProvider`, `useLocale()`, `useTranslation()` hooks
- `src/components/language-switcher.tsx` — Globe dropdown (🇺🇸 EN / 🇮🇩 ID)

**i18n — files diubah:**
- `src/app/layout.tsx` — wrapped dengan `<LocaleProvider>`
- `src/app/(main)/dashboard/layout.tsx` — added `<LanguageSwitcher />`
- `src/navigation/sidebar/sidebar-items.ts` — added `SIDEBAR_I18N_MAP`
- `src/app/(main)/dashboard/_components/sidebar/nav-main.tsx` — translated sidebar items
- `src/app/(main)/dashboard/_components/sidebar/nav-user.tsx` — translated user menu

**Accessibility — files diubah (12 files):**
- `src/components/ui/calendar.tsx` — `aria-label` on CalendarDayButton
- `src/app/(main)/dashboard/employees/new/employee-create-form.tsx` — `role="alert"`, `htmlFor`/`id`, `aria-required`, `autoComplete`
- `src/app/(main)/dashboard/employees/[id]/edit/employee-edit-form.tsx` — same fixes
- `src/app/(main)/dashboard/leave/requests/_components/leave-request-form.tsx` — `role="alert"`
- `src/app/(main)/dashboard/profile/_components/profile-edit-form.tsx` — `role="alert"`
- 5× settings form dialogs — `role="alert"` on error messages
- `src/app/(main)/dashboard/notifications/_components/notification-list.tsx` — `role="button"`, `tabIndex`, keyboard handler
- `src/lib/ui/badge-variants.ts` — improved dark-mode contrast (3 badges)
- `src/styles/presets/tangerine.css` — improved dark muted-foreground contrast

### `cf5dd7c` feat: E2E Testing with Playwright — 16 tests
**Files baru:**
- `e2e/helpers/auth.ts` — reusable login helpers (`login`, `loginAsAdmin`, `loginAsManager`, `loginAsEmployee`)
- `e2e/auth.spec.ts` — 3 tests (login page, redirect, invalid credentials)
- `e2e/navigation.spec.ts` — 7 tests (dashboard, employees, leave, approvals, calendar, notifications, settings)
- `e2e/employees.spec.ts` — 3 tests (list, search without refresh, add employee)
- `e2e/role-access.spec.ts` — 3 tests (admin access control)

**Files diubah:**
- `package.json` — added `test:e2e:ui`, `test:e2e:headed` scripts
- `.gitignore` — added `/blob-report/`, `/playwright/.cache/`
- `playwright.config.ts` — updated config

**Total E2E tests:** 36 (16 new + 20 existing in `critical-flow.spec.ts`)

---

## Summary Statistics

| Metric | Value |
|--------|-------|
| Total commits | 22 |
| Total files in project | 322 |
| Files changed (vs initial) | 393 |
| Lines added | 30,082 |
| Lines removed | 23,679 |
| Net new lines | +6,403 |
| Code review items | 425/425 (100%) |
| E2E test count | 36 |
| Supabase migrations | 12 |
| Supported languages | 2 (EN, ID) |
| Theme presets | 3 (Brutalist, Soft Pop, Tangerine) |
| Security headers | 6 |
| Loading skeletons | 18 |

### `3f5e920` docs: Add comprehensive CHANGES.md
- Changelog lengkap seluruh 22 commits

### `6a66b3f` perf: Critical performance fix — React cache() deduplication
**Problem:** Setiap page navigation memicu 3 sequential Supabase round-trip:
1. Middleware: `supabase.auth.getUser()` (~200-500ms)
2. Layout: `getAuthenticatedUser()` → `getUser()` + employees query (~200-500ms)
3. Page: `getAuthenticatedUser()` LAGI (~200-500ms)

**Total delay: 800-2000ms per navigasi!**

**Fix:**
- `src/lib/auth/get-authenticated-user.ts` — wrap dengan `React.cache()` → deduplicate calls dalam 1 request
- `src/lib/supabase/server.ts` — wrap `createClient()` dengan `React.cache()` → reuse client instance

**Before:** 3x `getUser()` + 3x `createClient()` per navigasi
**After:** 1x `getUser()` + 1x `createClient()` per navigasi
**Estimated improvement:** ~400-800ms lebih cepat per page navigation


---

## Tech Stack Final

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS v4, shadcn/ui, CSS custom properties |
| State | TanStack React Query v5, React Context |
| Backend | Supabase (PostgreSQL), Server Actions, RLS |
| Auth | Supabase Auth (cookie-based, middleware guard) |
| Email | Resend API |
| Testing | Playwright (E2E), Vitest (unit) |
| i18n | Custom React Context (EN/ID) |
| Security | CSP, rate limiting, Zod validation |
