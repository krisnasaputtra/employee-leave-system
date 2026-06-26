<div align="center">

# 🏦 LRM — Leave Request Management

**A full-featured Employee Leave Request & Management system built with Next.js 15, Supabase, and Shadcn UI.**

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3FCF8E?logo=supabase&logoColor=white)](https://supabase.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Playwright](https://img.shields.io/badge/Playwright-E2E-2EAD33?logo=playwright&logoColor=white)](https://playwright.dev)
[![TanStack Query](https://img.shields.io/badge/TanStack_Query-v5-FF4154?logo=reactquery&logoColor=white)](https://tanstack.com/query)

</div>

---

## 📋 Overview

LRM (Leave Request Management) is a comprehensive, production-ready employee leave request & management application. It features role-based access control (RBAC), automated approval workflows, leave balance tracking, calendar integration, email notifications, analytics dashboards, multi-language support (EN/ID), and 3 theme presets — all built on a modern React/Next.js stack with Supabase as the backend.

---

## 🔑 Demo Accounts

> Use these credentials to explore the application with different roles:

| Role | Email | Password | Access Level |
|------|-------|----------|-------------|
| 🔴 **Admin** | `admin@company.com` | `Admin123!` | Full system access — manage employees, settings, balances, audit logs |
| 🟢 **Employee** | `employee@test.com` | `Test12345!` | Submit leave requests, view balances, edit profile |
| 🟡 **Manager** | `manager@test.com` | `Test12345!` | Approve/reject team requests, view team dashboard, delegate approvals |

> [!NOTE]
> Demo accounts are pre-seeded with sample data including leave requests, balances, and approval history.

---

## ✨ Features

### 👤 Employee Features
- **Submit Leave Requests** — Select leave type, date range, half-day support, file attachments
- **View Leave Balances** — Real-time entitled, used, pending, and remaining days
- **My Requests** — Track request status (Pending → Approved/Rejected/Cancelled)
- **Edit Profile** — Update personal information
- **Calendar View** — Visual calendar with approved leaves and holidays
- **Notifications** — In-app notifications for status changes
- **Export CSV** — Download leave data for personal records

### 👨‍💼 Manager Features
- **Approval Dashboard** — Review and process pending leave requests
- **Bulk Approve/Reject** — Multi-select and batch action for efficiency
- **Team Overview** — View all team members' leave balances and usage
- **Delegation** — Delegate approval authority within same team during absence
- **Analytics & Reports** — Charts and insights on team leave patterns

### 🔧 Admin Features
- **Employee Management** — CRUD employees with Supabase Auth integration
- **Grant Login Access** — Grant login to employees created without auth account
- **Reset Password** — Generate new temporary password for any employee
- **Auto Manager Assignment** — Employees are automatically assigned to their team's manager
- **Team & Leave Type Configuration** — Manage organizational settings
- **Holiday Management** — Configure public holidays (shown on calendar)
- **Leave Policy Engine** — Configurable rules per leave type
- **Capacity Rules** — Team-level capacity constraints
- **Balance Management** — View, adjust, and bulk-manage all employee balances
- **All Requests View** — Global view of every leave request with filters
- **Audit Logs** — Complete audit trail of all system actions
- **Analytics Dashboard** — Organization-wide leave analytics with charts
- **CSV Export** — Export employees, requests, and audit logs

### 📧 Email Notifications (Resend)
- Leave request submitted → Manager notified
- Leave approved → Employee notified
- Leave rejected → Employee notified (with reason)
- Balance adjusted → Employee notified

### 🌐 i18n — Multi-Language Support
- 🇺🇸 **English** (default)
- 🇮🇩 **Bahasa Indonesia**
- Language switcher (Globe icon) in header
- Sidebar navigation, user menu fully translated
- `useTranslation()` hook for client components

### 🎨 Theme System
- **3 built-in presets:** Brutalist, Soft Pop, Tangerine
- Light/Dark mode toggle
- Layout customization (sidebar variant, collapsible, content width, navbar style)

### 🔒 Security
- **Content Security Policy (CSP)** + 5 security headers
- **Rate Limiting** — 60 req/min on auth routes (login, change password, signout)
- **Row-Level Security (RLS)** on all Supabase tables
- Server-side authentication & authorization on every action
- **Zod validation** on all inputs
- CSRF-safe Server Actions
- No sensitive data exposed to client

### ⚡ Performance
- **TanStack React Query** — Client-side caching, debounced search, no browser refresh
- **React.cache()** — Deduplicated auth calls (layout + page = 1 DB call)
- **Non-blocking layout** — Badge counts load async via TanStack Query
- **18 loading skeletons** across all pages
- **Optimized queries** — Explicit column selects, no N+1

### ♿ Accessibility (WCAG 2.1)
- `aria-label` on all icon-only buttons
- `role="alert"` on all error messages
- `htmlFor`/`id` form label associations
- Keyboard navigation on interactive elements
- Dark mode contrast improvements

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|-----------|
| **Framework** | [Next.js 15](https://nextjs.org) (App Router, React 19, React Compiler) |
| **Language** | [TypeScript 5.9](https://typescriptlang.org) |
| **Backend** | [Supabase](https://supabase.com) (PostgreSQL, Auth, Storage, RLS, RPC) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com) |
| **UI Components** | [Shadcn UI](https://ui.shadcn.com) + [Radix UI](https://radix-ui.com) |
| **State** | [TanStack React Query v5](https://tanstack.com/query) + [Zustand](https://zustand-demo.pmnd.rs) |
| **Charts** | [Recharts 3](https://recharts.org) |
| **Calendar** | [FullCalendar 7](https://fullcalendar.io) |
| **Forms** | [React Hook Form](https://react-hook-form.com) + [Zod 4](https://zod.dev) |
| **Email** | [Resend](https://resend.com) |
| **i18n** | Custom React Context (EN/ID) |
| **Testing** | [Vitest](https://vitest.dev) (Unit) + [Playwright](https://playwright.dev) (E2E) |
| **Linting** | [Biome](https://biomejs.dev) |

---

## 📁 Project Structure

```
src/
├── app/
│   ├── (auth)/login/              # Authentication pages
│   ├── (main)/dashboard/
│   │   ├── page.tsx               # Dashboard home
│   │   ├── employees/             # Employee management (Admin)
│   │   ├── leave/
│   │   │   ├── requests/          # Leave request CRUD
│   │   │   ├── balances/          # Balance view & management
│   │   │   └── all/               # All requests (Admin)
│   │   ├── approvals/             # Approval workflow
│   │   ├── delegations/           # Delegation management
│   │   ├── calendar/              # FullCalendar with holidays
│   │   ├── analytics-reports/     # Charts & analytics
│   │   ├── team/                  # Manager team view
│   │   ├── profile/               # Self-edit profile
│   │   ├── settings/              # Teams, Leave Types, Holidays,
│   │   │                          # Leave Policies, Capacity Rules
│   │   ├── audit-logs/            # Audit trail
│   │   └── notifications/         # In-app notifications
│   └── code-review/               # Code review checklist (425 items)
├── components/ui/                 # Shadcn UI components
├── hooks/                         # useDebounce, TanStack Query hooks
├── providers/                     # QueryProvider, LocaleProvider
├── locales/                       # en.json, id.json
├── lib/
│   ├── auth/                      # Authentication helpers (React.cache)
│   ├── supabase/                  # Supabase client (browser/server/admin)
│   ├── email/                     # Resend email service & templates
│   ├── permissions/               # RBAC helpers
│   ├── security/                  # Rate limiting
│   ├── delegations/               # Delegation logic
│   └── utils/                     # Shared utilities
├── navigation/                    # Sidebar navigation config + i18n map
├── styles/presets/                # Theme CSS presets
└── types/                         # Generated Supabase types

supabase/
├── migrations/                    # 17 SQL migration files
├── tests/                         # pgTAP integration tests
└── seed.sql                       # Demo data seeder

e2e/                               # Playwright E2E tests (39 tests)
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9
- **Supabase** project (local or cloud)

### 1. Clone the repository

```bash
git clone https://github.com/krisnasaputtra/employee-leave-system.git
cd employee-leave-system
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

Create `.env.local` in the project root:

```env
# Supabase (required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Email Notifications (optional — emails skip gracefully if not set)
RESEND_API_KEY=re_xxxxxxxxxxxx
EMAIL_FROM=LRM <noreply@yourdomain.com>
```

### 4. Setup database

```bash
# Start local Supabase
supabase start

# Apply migrations
supabase db reset

# Generate TypeScript types
supabase gen types typescript --local > src/types/database.types.ts
```

### 5. Start development server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

---

## 🧪 Testing

### Unit Tests (Vitest)

```bash
npm test              # Run once
npm run test:watch    # Watch mode
```

**Coverage:** 4 test suites, 68 tests
- Leave day calculation (21 tests)
- Permission/role helpers (33 tests)
- Auth redirect safety (8 tests)
- Approval schemas (6 tests)

### E2E Tests (Playwright)

```bash
npm run test:e2e          # Headless
npm run test:e2e:headed   # With browser visible
npm run test:e2e:ui       # Interactive UI mode
```

**Coverage:** 39 E2E tests across critical flows:
1. Authentication (login, redirect, invalid credentials)
2. Dashboard navigation (7 pages)
3. Employee management (list, search, add)
4. Role-based access control
5. Leave request flow (create, view, cancel)
6. Manager approvals
7. Settings pages

> [!TIP]
> Update test credentials in `e2e/helpers/auth.ts` before running.

### Database Tests

```bash
npm run test:db       # Supabase pgTAP tests
```

---

## 📊 Code Review

The project includes a comprehensive code review page at `/code-review` with:

- **425 checklist items** across 16 categories
- **100% coverage** — all items reviewed and annotated
- Categories: Functional Correctness, Security (OWASP), Performance, Architecture, Maintainability, Type Safety, Error Handling, Validation, UI/UX, Accessibility, Dependencies, Logging, AI-Generated Code, Database, Tests, Deployment

---

## 🗄️ Database Schema

```
employees ──────── departments (teams)
    │
    ├── leave_requests ──── leave_types
    │       │
    │       ├── leave_request_attachments
    │       └── audit_logs
    │
    ├── leave_balances ──── leave_balance_transactions
    │
    ├── approval_delegations
    │
    └── notifications

holidays (standalone)
leave_policies ──── leave_types
capacity_rules ──── departments (teams)
```

Key RPC functions:
- `create_leave_request` — Atomic request creation with balance check
- `approve_leave_request` — Approve with balance update + audit + notification
- `reject_leave_request` — Reject with audit + notification
- `cancel_leave_request` — Cancel with balance rollback
- `adjust_leave_balance` — Admin balance adjustment with ledger
- `initialize_employee_balances` — Bulk balance setup for new year

---

## ⚙️ Deployment (Vercel)

```json
// vercel.json — set region to match Supabase
{
  "regions": ["syd1"]
}
```

> [!IMPORTANT]
> Set Vercel function region to the **same region** as your Supabase project to minimize latency. Check via: Vercel Dashboard → Settings → Functions → Function Region.

---

## 🔧 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm test` | Run unit tests (Vitest) |
| `npm run test:e2e` | Run E2E tests (Playwright, headless) |
| `npm run test:e2e:ui` | Run E2E tests (interactive UI) |
| `npm run test:e2e:headed` | Run E2E tests (visible browser) |
| `npm run test:db` | Run database tests (pgTAP) |
| `npm run lint` | Lint with Biome |
| `npm run format` | Format with Biome |
| `npm run check:fix` | Lint + format + organize imports |

---

## 📄 License

This project is private and proprietary.

---

<div align="center">

**Built with ❤️ for BNI Training Program**

</div>
