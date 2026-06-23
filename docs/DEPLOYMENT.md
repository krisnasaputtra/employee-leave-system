# Deployment Guide

> Complete guide for deploying the Employee Leave System from local development to production.

---

## Table of Contents

- [Local Development Setup](#local-development-setup)
- [Supabase Setup](#supabase-setup)
- [Vercel Deployment](#vercel-deployment)
- [Supabase Auth Configuration](#supabase-auth-configuration)
- [Post-Deployment Checklist](#post-deployment-checklist)

---

## Local Development Setup

### Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| **Node.js** | 18+ | JavaScript runtime |
| **npm** | 9+ | Package manager (bundled with Node.js) |
| **Supabase CLI** | Latest | Local Supabase development & migrations |

> [!TIP]
> Install the Supabase CLI globally with `npm install -g supabase` or use `npx supabase` for on-demand execution.

### Steps

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd employee-leave-system
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment variables**

   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` and fill in the required values. See [ENVIRONMENT.md](./ENVIRONMENT.md) for a complete reference of all environment variables.

4. **Start the development server**

   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:3000`.

> [!NOTE]
> Ensure your Supabase project is configured and migrations are applied before starting the dev server. See [Supabase Setup](#supabase-setup) below.

---

## Supabase Setup

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Note your **Project Reference ID**, **Project URL**, and **API keys** from the project settings.

### 2. Link Your Local Project

```bash
npx supabase link --project-ref <your-project-ref>
```

You will be prompted for your database password.

### 3. Push Migrations

Apply all database migrations to your Supabase project:

```bash
npx supabase db push
```

This executes all migration files in `supabase/migrations/` in order. See [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) for details on individual migrations.

### 4. Regenerate TypeScript Types

After pushing migrations, regenerate the database type definitions:

```bash
npx supabase gen types --lang typescript --linked > src/types/database.types.ts
```

> [!IMPORTANT]
> Always regenerate types after modifying the database schema to keep your TypeScript definitions in sync.

### 5. Seed Data (Local Development Only)

```bash
npx supabase db reset
```

This resets the local database and applies seed data. The seed script populates departments, leave types, holidays, and sample data for development.

> [!CAUTION]
> **Never run `db reset` against a production database.** Seeding is intended for local development environments only.

---

## Vercel Deployment

### 1. Connect GitHub Repository

1. Log in to [vercel.com](https://vercel.com).
2. Click **"Add New Project"** and import your GitHub repository.
3. Select the **Next.js** framework preset (auto-detected).

### 2. Configure Environment Variables

Set the following environment variables in Vercel's project settings:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL (e.g., `https://xxxxx.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key |
| `NEXT_PUBLIC_APP_URL` | Your production URL (e.g., `https://your-app.vercel.app`) |

> [!WARNING]
> The `SUPABASE_SERVICE_ROLE_KEY` must **never** be prefixed with `NEXT_PUBLIC_`. This key grants full database access and must only be used server-side. See [ENVIRONMENT.md](./ENVIRONMENT.md) for security details.

### 3. Deploy

Click **"Deploy"**. Vercel will build and deploy your application automatically.

Subsequent pushes to the `main` branch will trigger automatic redeployments.

---

## Supabase Auth Configuration

After deployment, configure Supabase Authentication for your production environment:

### 1. Set Site URL

In your Supabase Dashboard → **Authentication** → **URL Configuration**:

- **Site URL**: Set to your production URL (e.g., `https://your-app.vercel.app`)

### 2. Configure Redirect URLs

Add the following to **Redirect URLs**:

```
https://your-app.vercel.app/auth/callback
```

For local development, also add:

```
http://localhost:3000/auth/callback
```

### 3. Disable Public Sign-Up

> [!CAUTION]
> This is a **critical security step**. The Employee Leave System uses admin-managed user accounts. Public sign-up must be disabled.

In your Supabase Dashboard → **Authentication** → **Settings**:

- **Enable sign up** → **OFF**

Users should only be created by administrators through the application's user management interface.

---

## Post-Deployment Checklist

Use this checklist to verify your production deployment is secure and functional:

### Security

- [ ] **Row Level Security (RLS)** is enabled on all tables
- [ ] **Storage buckets** are set to **private** (not public)
- [ ] **No default credentials** exist in the database
- [ ] **Public sign-up is disabled** in Supabase Auth settings
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is **not** exposed to the client

### Functionality

- [ ] Application loads at production URL
- [ ] Admin login works correctly
- [ ] Auth callback redirects function properly
- [ ] Database queries return expected data
- [ ] File uploads (if applicable) work with private storage

### Environment

- [ ] All 4 environment variables are set in Vercel
- [ ] `.env.local` is **not** committed to version control
- [ ] Site URL matches production URL in Supabase dashboard
- [ ] Redirect URLs are correctly configured

---

> [!NOTE]
> For environment variable details, see [ENVIRONMENT.md](./ENVIRONMENT.md).
> For database migration information, see [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md).
