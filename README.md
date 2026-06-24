<div align="center">

# 🏦 BNI Leave Management System

**A full-featured Employee Leave Request & Management system built with Next.js 16, Supabase, and Shadcn UI.**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3FCF8E?logo=supabase&logoColor=white)](https://supabase.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Playwright](https://img.shields.io/badge/Playwright-E2E-2EAD33?logo=playwright&logoColor=white)](https://playwright.dev)

</div>

---

## 📋 Overview

BNI Leave Management System is a comprehensive, production-ready employee leave request & management application. It features role-based access control (RBAC), automated approval workflows, leave balance tracking, calendar integration, email notifications, and analytics dashboards — all built on a modern React/Next.js stack with Supabase as the backend.

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
- **Team Overview** — View direct reports' leave balances and usage
- **Delegation** — Delegate approval authority to another manager during absence
- **Analytics & Reports** — Charts and insights on team leave patterns

### 🔧 Admin Features
- **Employee Management** — CRUD employees with Supabase Auth integration
- **Department & Leave Type Configuration** — Manage organizational settings
- **Holiday Management** — Configure public holidays (shown on calendar)
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

### 🔒 Security
- Row-Level Security (RLS) on all Supabase tables
- Server-side authentication & authorization on every action
- Zod validation on all inputs
- CSRF-safe Server Actions
- No sensitive data exposed to client

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|-----------|
| **Framework** | [Next.js 16](https://nextjs.org) (App Router, React 19, React Compiler) |
| **Language** | [TypeScript 5.9](https://typescriptlang.org) |
| **Backend** | [Supabase](https://supabase.com) (PostgreSQL, Auth, Storage, RLS, RPC) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com) |
| **UI Components** | [Shadcn UI](https://ui.shadcn.com) + [Radix UI](https://radix-ui.com) |
| **Charts** | [Recharts 3](https://recharts.org) |
| **Calendar** | [FullCalendar 7](https://fullcalendar.io) |
| **Forms** | [React Hook Form](https://react-hook-form.com) + [Zod 4](https://zod.dev) |
| **Email** | [Resend](https://resend.com) |
| **State** | [Zustand](https://zustand-demo.pmnd.rs) |
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
│   │   ├── settings/              # Departments, Leave Types, Holidays
│   │   ├── audit-logs/            # Audit trail
│   │   └── notifications/         # In-app notifications
│   └── code-review/               # Code review checklist (425 items)
├── components/ui/                 # Shadcn UI components
├── lib/
│   ├── auth/                      # Authentication helpers
│   ├── supabase/                  # Supabase client (browser/server/admin)
│   ├── email/                     # Resend email service & templates
│   ├── permissions/               # RBAC helpers
│   ├── delegations/               # Delegation logic
│   └── utils/                     # Shared utilities
├── navigation/                    # Sidebar navigation config
└── types/                         # Generated Supabase types
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
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJhbGci...
SUPABASE_SECRET_KEY=eyJhbGci...

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Email Notifications (optional — emails skip gracefully if not set)
RESEND_API_KEY=re_xxxxxxxxxxxx
EMAIL_FROM=BNI Leave System <noreply@yourdomain.com>
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
npm run test:e2e                    # Headless
npx playwright test --headed        # With browser visible
npx playwright show-report          # View HTML report
```

**Coverage:** 23 E2E tests across 7 critical flows:
1. Authentication (login, redirect, role-based access)
2. Employee Management (list, detail)
3. Admin Settings (departments, leave types, holidays)
4. Balance Management
5. Leave Request Flow (create, view, cancel)
6. Manager Approvals
7. Page Load Verification

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
employees ──────── departments
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
```

Key RPC functions:
- `create_leave_request` — Atomic request creation with balance check
- `approve_leave_request` — Approve with balance update + audit + notification
- `reject_leave_request` — Reject with audit + notification
- `cancel_leave_request` — Cancel with balance rollback
- `adjust_leave_balance` — Admin balance adjustment with ledger
- `initialize_employee_balances` — Bulk balance setup for new year

---

## 🔧 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm test` | Run unit tests (Vitest) |
| `npm run test:e2e` | Run E2E tests (Playwright) |
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
