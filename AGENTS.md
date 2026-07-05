# AGENTS.md

Guidance for AI coding agents working in this repository.

## Project Context

This is the BNI Employee Leave System, a production-oriented leave request management application.

Primary references live in `docs/`:

- `docs/leave-request-management-prd.md` defines product behavior.
- `docs/leave-request-management-project-rules.md` defines mandatory engineering rules.
- `docs/implementation-plan.md` defines approved implementation structure and governance.
- `docs/task.md` records phase execution history and must only be updated with verified work.
- `docs/comprehensive-code-review-checklist-leave-management.md` defines review criteria.
- `docs/code-review-report-latest.md` records known review findings and deferred risks.
- `docs/DEPLOYMENT.md`, `docs/ENVIRONMENT.md`, `docs/MIGRATION_GUIDE.md`, `docs/SMOKE_TEST.md`, and `docs/E2E_TEST_CASES.md` define operations and verification guidance.
- `docs/future-development-roadmap.md` contains proposed future work only.
- `docs/evidence-error/` and `docs/evidence-ui/` contain screenshot evidence for UI/error/performance context.

If instructions conflict, use this priority:

1. Security and data integrity
2. Product Requirement Document
3. Project Rules
4. Existing project architecture
5. Current user request
6. General AI suggestions

Report conflicts. Do not silently choose the weaker rule.

## Current Stack

Use the stack already present in `package.json`:

- Next.js App Router, React, TypeScript, Tailwind CSS v4
- shadcn/ui style components, Lucide React, Sonner, next-themes
- React Hook Form and Zod
- TanStack Table and TanStack React Query where already used
- FullCalendar React for calendar behavior
- Supabase Postgres, Supabase Auth, Supabase SSR, RLS, Storage, and RPC functions
- Biome, Vitest, Playwright, Supabase database tests

Do not add a second auth framework, ORM, form library, validation library, table library, calendar library, global state library, HTTP client, Express server, or GraphQL layer without explicit approval.

## Architecture Rules

Default flow:

```text
Page or Component
-> Server Action or Server Query
-> Domain/service function
-> Supabase server client or RPC
-> Supabase Postgres with RLS
```

Rules:

- Server Components by default; add `"use client"` only for real interactivity.
- Keep Client Component boundaries small.
- Do not put database logic, authorization logic, or business rules in JSX.
- Do not import server/admin Supabase clients into Client Components.
- Use Server Actions for internal authenticated mutations.
- Use Route Handlers only for auth callbacks, protected downloads, webhooks, or real HTTP endpoints.
- Keep route-specific code colocated where that is the existing pattern.
- Avoid dumping unrelated helpers into generic `utils.ts` files.
- Preserve the existing template shell, sidebar, header, dashboard, table, form, theme, and calendar patterns unless there is a concrete reason to change them.

## Supabase and Security

Supabase Postgres is the business-data source of truth. Supabase Auth is the authentication source of truth.

Required practices:

- Validate current users server-side with Supabase Auth APIs.
- Use cookie-based SSR through `@supabase/ssr`.
- Keep public sign-up disabled.
- Keep RLS enabled on exposed business tables and Storage objects.
- Use protected public tables for application roles and account status; never trust editable user metadata.
- Use separate browser, server request, and admin Supabase clients.
- Use the admin client only for tightly scoped administration such as account provisioning, ban/unban, and approved maintenance.
- Keep `SUPABASE_SERVICE_ROLE_KEY` server-only. Never prefix secrets with `NEXT_PUBLIC_`.
- Use the repo's current env names: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_APP_URL`.
- Do not store business data, roles, balances, requests, employees, approvals, or sessions in Local Storage.
- Never log passwords, temporary passwords, tokens, OTPs, recovery links, service keys, medical attachments, or private leave details.
- Do not expose raw Supabase, PostgREST, PostgreSQL, Auth, Storage, or stack-trace errors to users.

## Authorization and Business Rules

Roles are:

```typescript
type ApplicationRole = "ADMIN" | "MANAGER" | "EMPLOYEE";
```

Authorization must be server-side and resource-aware:

- Employees can read and mutate only their own allowed leave data.
- Employees can edit or cancel only their own `PENDING` requests.
- Managers can approve only authorized direct-report or delegated requests.
- Managers cannot approve their own requests.
- Admins manage employees, configuration, balances, approvals, and audit logs.
- Hidden navigation is not authorization.

Centralize permission logic. Do not scatter raw role-string checks across components.

Leave request states:

```text
PENDING -> APPROVED
PENDING -> REJECTED
PENDING -> CANCELLED
APPROVED -> CANCELLED only through authorized reversal
```

Never allow rejected/cancelled requests to be approved or approved requests to return to pending.

The server/database is authoritative for:

- requested leave days
- weekend and holiday exclusion
- half-day handling
- overlap detection
- leave balance reservation/use/release/reversal
- approval/rejection/cancellation state transitions

Use PostgreSQL functions/RPC for multi-table transactional operations that touch requests, balances, ledgers, notifications, and audit logs.

## Database and Migrations

- Every schema, constraint, grant, RLS policy, trigger, view, function, or Storage policy change requires a versioned SQL migration under `supabase/migrations/`.
- Do not manually edit generated database types except through the documented generation process.
- Regenerate `src/types/database.types.ts` after schema changes.
- Review migration SQL before applying it.
- Use compensating migrations for rollback. Do not rewrite migrations already applied to shared environments.
- Never run `supabase db reset` against production or shared remote databases.
- Prefer explicit column selects. Avoid `select("*")`.
- Use explicit Supabase relationship hints when relationships are ambiguous.
- Never interpolate untrusted input into SQL or dynamic SQL.

## UI and Product Rules

The UI should remain a BNI-branded admin dashboard, not a marketing site.

- Reuse shadcn/ui-style components and existing shared components.
- Use Tailwind tokens and shared variants instead of one-off styling.
- Use `cn()` for conditional classes.
- Use Lucide icons for icon buttons.
- Use Card for dashboard widgets, Badge for statuses, DropdownMenu for row actions, AlertDialog for destructive confirmations, Skeleton for loading states, Tooltip or accessible labels for icon-only controls.
- Preserve responsive behavior from 360px upward.
- Keep table filtering, sorting, and pagination database-backed for growing datasets.
- Shared calendar must return approved, privacy-safe data only. Do not fetch private fields and hide them with CSS.
- Do not change routes, database, RLS, RPC, auth, or business behavior during theme-only work.

## Coding Standards

- Strict TypeScript.
- Do not use `any`, `as any`, or `@ts-ignore` as an escape hatch.
- Prefer `unknown` with safe narrowing.
- Keep functions focused.
- Avoid speculative abstractions.
- Remove dead code and unused imports.
- Do not leave placeholder code or fake API data.
- Do not perform unrelated mass refactors.
- Add comments only when they explain non-obvious why.

## Testing and Verification

Inspect `package.json` and run exact available scripts appropriate to the change. Current scripts include:

```bash
npm run check
npm run lint
npm run test
npm run test:e2e
npm run test:db
npm run build
```

Expected minimum for code changes:

- Run Biome/type-related checks through the repo's scripts.
- Run focused unit tests for changed logic.
- Run `npm run build` for broad app or routing changes.
- Run Playwright or manual smoke tests for changed user flows when feasible.
- Run Supabase database tests or document why they were not run for RLS/RPC changes.

Never invent command results. Report exact commands run and actual outcomes.

## Documentation and Task Governance

- `docs/task.md` is an execution record. Mark items complete only after implementation and verification.
- `docs/future-development-roadmap.md` is not approval to implement. Roadmap work must be approved before tasks are added to `docs/task.md`.
- Stabilization and Critical/High review findings take priority over new features.
- When adding new product work, update the relevant docs only as needed and keep the scope to the approved phase.

## Before Coding

For non-trivial changes, first identify:

- relevant existing files and reusable components
- scoped implementation plan
- database and migration impact
- authorization and privacy impact
- test plan
- risks and assumptions

Then implement one coherent slice. Do not implement later phases opportunistically.

## After Coding

Report:

- files created, modified, and deleted
- dependencies changed
- environment variables changed
- migrations, RLS policies, RPC functions, generated types, and Storage policies changed
- features implemented
- tests added or updated
- commands run and exact results
- known limitations and manual verification steps

