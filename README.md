# OptimOwl BrandBaja — Coolify Edition

Fork of the original Lovable project, configured for self-hosted deployment via [Coolify](https://coolify.io/) on a VPS while keeping **Supabase** as the managed backend.

## Architecture

```
┌─────────────────┐     ┌──────────────────────────────────┐
│  Coolify VPS    │     │        Supabase Cloud             │
│                 │     │                                  │
│  nginx (Docker) │────▶│  Auth  │  Postgres  │  Storage   │
│  React SPA      │     │  Edge Functions  │  Realtime    │
│  (static files) │     │  pg_cron         │  pg_net      │
└─────────────────┘     └──────────────────────────────────┘
```

The frontend is a static React SPA built with Vite and served by nginx. The entire backend (auth, database, storage, edge functions, real-time, cron) lives on Supabase. No Node.js server to manage on your VPS.

## Prerequisites

- A [Supabase](https://supabase.com) project (free tier works)
- A VPS with [Coolify](https://coolify.io) installed
- Docker running on the VPS (Coolify handles this)

## Quick Deploy on Coolify

### 1. Set up Supabase

Create a Supabase project or use your existing one. You'll need three values from **Supabase Dashboard > Settings > API**:

| Variable | Where to find it |
|----------|-----------------|
| `VITE_SUPABASE_URL` | Project URL (e.g. `https://abc123.supabase.co`) |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `anon public` key |
| `VITE_SUPABASE_PROJECT_ID` | The project ref (e.g. `abc123`) |

### 2. Run Database Migrations

In your Supabase SQL Editor, run these in order:

1. All `.sql` files in `supabase/migrations/` (oldest first)
2. Run `supabase/setup-cron.sql` — **replace** `YOUR_PROJECT_REF` and `YOUR_SERVICE_ROLE_KEY` with your actual values, then execute

### 3. Deploy Edge Functions

From this repo's root, with the [Supabase CLI](https://supabase.com/docs/guides/cli) installed:

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF

# Deploy all edge functions
supabase functions deploy ai-content
supabase functions deploy fetch-platform-metrics
supabase functions deploy mark-posted-manually
supabase functions deploy oauth-start
supabase functions deploy publish-post
supabase functions deploy scheduler-tick
```

### 4. Set Edge Function Secrets

In Supabase Dashboard > Settings > Edge Functions, add these secrets:

| Secret | Required by | Notes |
|--------|-------------|-------|
| `SUPABASE_URL` | All functions | Same as VITE_SUPABASE_URL |
| `SUPABASE_SERVICE_ROLE_KEY` | scheduler-tick, publish-post | Found in Settings > API |
| `SUPABASE_ANON_KEY` | mark-posted-manually, fetch-platform-metrics, ai-content | Same as publishable key |
| `LOVABLE_API_KEY` | ai-content | Required for AI assist. Get from [Lovable](https://lovable.dev) workspace settings |

### 5. Deploy to Coolify

1. In Coolify, create a new **Application** pointing to this repository
2. Set the build pack to **Dockerfile**
3. Add build arguments:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `VITE_SUPABASE_PROJECT_ID`
4. Set port to `80`
5. Deploy

The Dockerfile will validate that the required env vars are set and will fail the build if they're missing.

## Local Development

```bash
# Create .env from example
cp .env.example .env
# Edit .env with your Supabase values

# Install dependencies
npm install

# Dev server (port 8080)
npm run dev

# Production build
npm run build
npm run preview
```

### Local Docker Testing

```bash
# Set env vars then build and run
docker compose up --build
# App available at http://localhost:3000
```

## What Was Changed from the Original

| Change | Why |
|--------|-----|
| Added `Dockerfile` | Multi-stage build (Node + nginx) for Coolify |
| Added `nginx.conf` | SPA-friendly nginx config with security headers |
| Added `.env.example` | Template for required env vars |
| Added `docker-compose.yml` | Local Docker testing |
| Added migration `20260529000000` | Drops the broken cron job that was hardcoded to a different Supabase project |
| Added `setup-cron.sql` | One-time SQL to create the cron with your URL |
| Updated `scheduler-tick` edge function | Self-healing: auto-creates the cron job on first run if missing |
| Removed `.env` | Live keys removed from the repo |

## AI Content Feature

The AI content generation (`/create` page) routes through a Supabase edge function that calls the [Lovable AI Gateway](https://ai.gateway.lovable.dev). You'll need a `LOVABLE_API_KEY` from your Lovable workspace to use this feature. Without it, the AI assist button will return an error.

## Database Extensions

The following PostgreSQL extensions are used and must be enabled in your Supabase project (they are by default):

- `pg_cron` — scheduled jobs (runs `scheduler-tick` every minute)
- `pg_net` — HTTP calls from within PostgreSQL
- `pg_graphql` — GraphQL schema introspection
- `pgcrypto` — cryptographic functions
- `uuid-ossp` — UUID generation
