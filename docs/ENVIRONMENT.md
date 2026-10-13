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
| `CONSENT_AGREEMENT_URL` | Consent route only | ❌ No | URL loaded by the public `/consent-agreement` page |

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

#### `CONSENT_AGREEMENT_URL`

Set this to the full consent URL for `/consent-agreement`. Do not prefix it with `NEXT_PUBLIC_`; the app reads it server-side and adds only its origin to the Content Security Policy. Configure it in each Vercel environment that uses the page, then redeploy so the CSP is rebuilt. If it is unset, the page shows an unconfigured state.

The route is public, so the URL is still sent to visitors as the iframe source. Keeping it in an environment variable prevents it from being committed to GitHub, but does not hide it from people who can access the page. HTTP URLs are allowed for testing; browsers block HTTP iframe content on an HTTPS Vercel page, so production requires an HTTPS target.

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

Environment variables are validated with [Zod](https://zod.dev/) in two scoped modules:

- `src/lib/client-env.ts` validates public variables that are safe in browser code.
- `src/lib/server-env.ts` validates server-only variables, including secrets.

```typescript
// src/lib/client-env.ts - simplified example
const clientEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().min(1).default("http://localhost:3000"),
});

// src/lib/server-env.ts - simplified example
const serverEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().min(1).default("http://localhost:3000"),
});
```

If any required variable is missing or invalid, the application will fail to start with a descriptive error message. This ensures misconfigured deployments are caught immediately.

### 3. Service Role Key Isolation

The `SUPABASE_SERVICE_ROLE_KEY` is only exposed through `src/lib/server-env.ts` and used by `src/lib/supabase/admin.ts`, both server-only paths.

```typescript
// src/lib/supabase/admin.ts
import "server-only";

import { createClient } from "@supabase/supabase-js";

import { getServerEnv } from "@/lib/server-env";

const env = getServerEnv();
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

Set the required variables, plus `CONSENT_AGREEMENT_URL` in environments where the consent page is used:

**Project Settings** → **Environment Variables**

| Variable | Environments |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | Production, Preview, Development |
| `NEXT_PUBLIC_APP_URL` | Production, Preview |
| `CONSENT_AGREEMENT_URL` | Production, Preview, Development (where needed) |

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
