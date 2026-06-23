# Database Migration Guide

> Reference for all database migrations, commands, rollback strategies, and seed data in the Employee Leave System.

---

## Table of Contents

- [Migrations Overview](#migrations-overview)
- [Migration Commands](#migration-commands)
- [Rollback Strategy](#rollback-strategy)
- [Seed Data](#seed-data)

---

## Migrations Overview

All migrations are located in `supabase/migrations/` and are executed sequentially by the Supabase CLI. Each migration file is prefixed with a numeric identifier to ensure correct ordering.

### Migration Registry

| # | Migration File | Description |
|---|---------------|-------------|
| 00001 | `00001_initial_schema.sql` | Creates the foundational database schema including core tables (`employees`, `users`), enums, and base constraints |
| 00002 | `00002_departments.sql` | Adds the `departments` table with relationships to employees and organizational hierarchy support |
| 00003 | `00003_leave_types.sql` | Creates the `leave_types` table defining available leave categories (annual, sick, etc.) with default quotas and policies |
| 00004 | `00004_leave_requests.sql` | Implements the `leave_requests` table with status workflow (pending → approved/rejected), date ranges, and foreign key relationships |
| 00005 | `00005_leave_balances.sql` | Adds the `leave_balances` table tracking per-employee, per-type leave allocations and remaining balances for each fiscal year |
| 00006 | `00006_holidays.sql` | Creates the `holidays` table for company-wide public holidays and non-working days |
| 00007 | `00007_rls_policies.sql` | Configures Row Level Security (RLS) policies across all tables to enforce data access control based on user roles |
| 00008 | `00008_functions.sql` | Adds database functions and triggers for business logic (e.g., auto-deducting leave balances on approval, validation checks) |
| 00009 | `00009_storage.sql` | Sets up Supabase Storage buckets and access policies for file attachments (e.g., medical certificates) |

> [!NOTE]
> Migration files use timestamps or sequential numbering as prefixes. The exact filenames may vary — the numbers above (00001–00009) represent the logical execution order.

---

## Migration Commands

### Push Migrations to Remote Database

Apply all pending migrations to your linked Supabase project:

```bash
npx supabase db push
```

> [!IMPORTANT]
> This command applies migrations that have not yet been run on the remote database. It does **not** re-run previously applied migrations.

### Create a New Migration

Generate a new migration file with a timestamped prefix:

```bash
npx supabase migration new <migration_name>
```

**Example:**

```bash
npx supabase migration new add_employee_notes
```

This creates an empty SQL file in `supabase/migrations/` ready for your schema changes.

### Reset Local Database

Reset the local development database, reapply all migrations, and run seed data:

```bash
npx supabase db reset
```

> [!CAUTION]
> This command **destroys all data** in the local database. Never run this against a production environment.

### Regenerate TypeScript Types

After any schema change, regenerate the TypeScript type definitions:

```bash
npx supabase gen types --lang typescript --linked > src/types/database.types.ts
```

This ensures your application's type definitions stay in sync with the database schema.

### Check Migration Status

View which migrations have been applied:

```bash
npx supabase migration list
```

---

## Rollback Strategy

> [!WARNING]
> Supabase does **not** support automatic migration rollbacks. Once a migration is applied, it cannot be automatically reversed.

### Recommended Approaches

#### 1. Compensating Migrations (Preferred)

Create a new migration that undoes the changes made by the problematic migration. This is the safest approach as it maintains a clear audit trail.

**Example:** If migration `00010_add_column.sql` added an unwanted column:

```bash
npx supabase migration new rollback_add_column
```

```sql
-- supabase/migrations/<timestamp>_rollback_add_column.sql
ALTER TABLE employees DROP COLUMN IF EXISTS unwanted_column;
```

Then apply:

```bash
npx supabase db push
```

> [!TIP]
> When writing migrations, consider creating a corresponding rollback script in a `supabase/rollbacks/` directory for documentation purposes, even if you don't apply them automatically.

#### 2. Database Backup Restore (Emergency Only)

For critical failures, restore from a Supabase point-in-time backup:

1. Navigate to **Supabase Dashboard** → **Database** → **Backups**
2. Select a backup point **before** the problematic migration
3. Restore the backup

> [!CAUTION]
> Restoring a backup will **overwrite all data** created after the backup point. This should only be used as a last resort when compensating migrations are not feasible.

### Best Practices for Safe Migrations

| Practice | Description |
|----------|-------------|
| **Test locally first** | Always run `npx supabase db reset` locally to validate migrations before pushing |
| **Keep migrations small** | Each migration should make a single, focused change |
| **Use `IF EXISTS` / `IF NOT EXISTS`** | Make migrations idempotent where possible |
| **Back up before pushing** | Create a manual backup before applying migrations to production |
| **Review SQL carefully** | Destructive operations (`DROP`, `TRUNCATE`, `DELETE`) cannot be undone without a backup |

---

## Seed Data

Seed data is defined in `supabase/seed.sql` and is applied automatically when running `npx supabase db reset`. This data is intended for **local development only**.

> [!WARNING]
> Seed data should **never** be applied to production environments. It contains test data and default configurations suitable only for development.

### Seed Contents

#### Departments (4 records)

| Department | Description |
|-----------|-------------|
| Human Resources | Manages employee relations, recruitment, and company policies |
| Engineering | Software development, infrastructure, and technical operations |
| Finance | Financial planning, accounting, and budget management |
| Marketing | Brand management, campaigns, and market analysis |

#### Leave Types (4 records)

| Leave Type | Default Quota | Description |
|-----------|--------------|-------------|
| Annual Leave | 12 days/year | Standard paid time off for personal use |
| Sick Leave | 10 days/year | Medical-related absences with documentation |
| Personal Leave | 3 days/year | Short-notice leave for personal matters |
| Unpaid Leave | 0 days (unlimited) | Extended leave without pay, requires approval |

#### Public Holidays (3 records)

| Holiday | Date | Notes |
|---------|------|-------|
| New Year's Day | January 1 | National holiday |
| Independence Day | August 17 | National holiday |
| Christmas Day | December 25 | National holiday |

> [!NOTE]
> Holiday dates in the seed data are representative examples. Update them to match your organization's actual holiday calendar for the current fiscal year.

### Applying Seed Data

Seed data is automatically applied during a local database reset:

```bash
npx supabase db reset
```

To apply seed data manually (local development only):

```bash
npx supabase db seed
```

---

## Quick Reference

```bash
# Link to remote project
npx supabase link --project-ref <your-project-ref>

# Push migrations
npx supabase db push

# Create new migration
npx supabase migration new <name>

# Reset local database (with seed)
npx supabase db reset

# Regenerate types
npx supabase gen types --lang typescript --linked > src/types/database.types.ts

# List migration status
npx supabase migration list
```

---

> See [DEPLOYMENT.md](./DEPLOYMENT.md) for full deployment instructions.
> See [ENVIRONMENT.md](./ENVIRONMENT.md) for environment variable configuration.
