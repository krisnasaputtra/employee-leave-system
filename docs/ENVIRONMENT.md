# Environment Variables Reference

> Complete reference for all environment variables used by the Employee Leave System.

---

## Variables

| Variable | Required | Public | Description |
|----------|----------|--------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ Yes | ✅ Yes | Supabase project URL (e.g., `https://xxxxx.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ Yes | ✅ Yes | Supabase anonymous/public API key for client-side requests |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Yes | ❌ No | Supabase service role key for server-side admin operations |
| `NEXT_PUBLIC_APP_URL` | ✅ Yes | ✅ Yes | Application URL (e.g., `https://your-app.vercel.app`) |

### Variable Details

#### `NEXT_PUBLIC_SUPABASE_URL`

The base URL of your Supabase project. Found in your Supabase Dashboard under **Settings** → **API** → **Project URL**.

```
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
```

#### `NEXT_PUBLIC_SUPABASE_ANON_KEY`

The anonymous (public) API key for your Supabase project. This key is safe to expose in the browser as it respects Row Level Security (RLS) policies. Found in **Settings** → **API** → **Project API keys** → `anon` `public`.

```
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...
```

#### `SUPABASE_SERVICE_ROLE_KEY`

The service role key grants **full access** to your database, bypassing all RLS policies. This key must only be used on the server side.

```
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...
```

> [!CAUTION]
> **NEVER** prefix this variable with `NEXT_PUBLIC_`. Doing so would expose the key to the client browser, granting unrestricted database access to anyone.

#### `NEXT_PUBLIC_APP_URL`

The publicly accessible URL of your application. Used for generating absolute URLs, auth callbacks, and email links.

```
# Production
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app

# Local development
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Security Rules

### 1. Never Commit `.env.local`

The `.env.local` file contains sensitive credentials and must **never** be committed to version control.

Ensure `.env.local` is listed in your `.gitignore`:

```gitignore
# Environment variables
.env.local
.env*.local
```

> [!WARNING]
> If `.env.local` has been accidentally committed, immediately rotate all exposed keys in your Supabase Dashboard under **Settings** → **API**.

### 2. Startup Validation with Zod

All environment variables are validated at application startup using [Zod](https://zod.dev/) schema validation in `src/lib/env.ts`.

```typescript
// src/lib/env.ts — Simplified example
import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().url(),
});

export const env = envSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
});
```

If any required variable is missing or invalid, the application will fail to start with a descriptive error message. This ensures misconfigured deployments are caught immediately.

### 3. Service Role Key Isolation

The `SUPABASE_SERVICE_ROLE_KEY` is only used in `src/lib/supabase/admin.ts`, which imports the `server-only` package to guarantee it cannot be bundled into client-side code.

```typescript
// src/lib/supabase/admin.ts
import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { env } from '@/lib/env';

export const supabaseAdmin = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
);
```

> [!IMPORTANT]
> The `server-only` import causes a **build-time error** if any client component attempts to import from this module. This is an intentional safety mechanism to prevent accidental exposure of the service role key.

---

## Environment Setup by Context

### Local Development

```bash
cp .env.example .env.local
# Edit .env.local with your Supabase project values
```

### Vercel (Production / Preview)

Set all four variables in the Vercel Dashboard:

**Project Settings** → **Environment Variables**

| Variable | Environments |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | Production, Preview, Development |
| `NEXT_PUBLIC_APP_URL` | Production, Preview |

> [!TIP]
> For preview deployments, consider using a separate Supabase project to avoid polluting production data.

---

## Troubleshooting

| Symptom | Cause | Solution |
|---------|-------|----------|
| App fails to start with Zod error | Missing or invalid env var | Check `.env.local` against this reference |
| `server-only` build error | Client component importing admin client | Move the import to a Server Component or API route |
| Auth redirects fail | `NEXT_PUBLIC_APP_URL` mismatch | Ensure URL matches Supabase redirect config |
| RLS policy errors | Using anon key without auth | Ensure user is authenticated before making requests |

---

> See [DEPLOYMENT.md](./DEPLOYMENT.md) for full deployment instructions.
