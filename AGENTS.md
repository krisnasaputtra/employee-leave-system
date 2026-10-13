# Agent Notes

## Structure and sources of truth

- This is a single npm package using Next.js 16 App Router; routes live in `src/app`. Route groups such as `(auth)`, `(main)`, and `(external)` do not appear in URLs; `(main)/dashboard` supplies the authenticated sidebar shell.
- `src/proxy.ts` refreshes sessions and is only a coarse cookie gate. Routes are protected by default unless listed in `PUBLIC_PATHS`; `(external)` does not mean public. `/consent-agreement` is an intentional public exception; it reads `CONSENT_AGREEMENT_URL`, which is sent to page visitors and must stay out of source control. Sensitive data/actions still need server-side authorization.
- Shared auth/domain code is in `src/lib`; shared server actions are in `src/server/server-actions.ts`; route-specific code stays colocated under `src/app`; SQL and schema changes belong in `supabase/migrations/`.
- Trust `package.json`, `package-lock.json`, and current source over stale layout/version prose: README says Next.js 15, but the installed dependency is Next.js 16. `docs/implementation-plan.md` says the source repository was unavailable and describes a proposed, not current, layout.
- `docs/leave-request-management-prd.md` defines product behavior; `docs/leave-request-management-project-rules.md` defines domain/security rules. `docs/task.md` is execution history (record verified work only); roadmap items are proposals, not approval.

## Security and data integrity

- Supabase Auth is the identity source and Postgres/RLS is the business-data authority. Keep the service-role key/admin client server-only; hidden navigation and the proxy are not authorization.
- Leave-day calculations, overlap checks, balances, and request-state transitions are database-authoritative. Multi-table mutations use Postgres RPC; schema/policy/function changes need a new versioned migration. Never hand-edit `src/types/database.types.ts`; regenerate it for the intended local or linked database. README and `docs/MIGRATION_GUIDE.md` disagree on `--local` versus `--linked`, so verify the target first. Do not rewrite applied migrations or reset a shared/production database.
- Local storage is for non-sensitive UI preferences only, not leave data, roles, or sessions.
- CSP and security headers are in `next.config.mjs`. Third-party iframe origins need an explicit `frame-src` allowlist, and the framed site must itself permit embedding; do not weaken `frame-ancestors` or `X-Frame-Options` to bypass that restriction.

## Commands and verification

- Use the existing stack; do not add parallel auth, ORM, form, table, calendar, or state libraries without approval. Prefer Server Components and existing shared UI/Tailwind patterns.
- `npm run check` and `npm run lint` run Biome; there is no typecheck script, so run `npx tsc --noEmit` separately. Focus a unit test with `npm test -- src/lib/leave-requests/__tests__/access.test.ts`. Vitest only discovers `src/**/__tests__/**/*.test.{ts,tsx}`.
- Playwright specs live in `e2e/`; run one with `npx playwright test e2e/<file>.spec.ts`. The config starts `npm run dev` at `localhost:3000`; E2E auth requires a reachable Supabase test project and accounts matching `e2e/helpers/auth.ts`.
- `npm run test:db` uses Supabase CLI/pgTAP against the local stack; start it with `npx supabase start` (Docker required). See `docs/MIGRATION_GUIDE.md` for migration operations and `docs/ENVIRONMENT.md` for required environment values.
