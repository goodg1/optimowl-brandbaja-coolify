# AGENTS.md — OptimOwl BrandBaja

> Last updated: 2026-05-29
> Working branch: `master`
> Source fork: `goodg1/optimowl-brandbaja` (Lovable-generated)
> Coolify fork: `goodg1/optimowl-brandbaja-coolify` (this repo)

---

## Architecture

```
┌─────────────────────┐      ┌──────────────────────────────────┐
│   Coolify VPS       │      │        Supabase Cloud             │
│                     │      │                                  │
│  nginx :80 (Docker) │─────▶│  Auth (GoTrue)                   │
│  React SPA (Vite)   │      │  PostgreSQL 17                   │
│  static files only  │      │  Storage (S3-compatible)         │
│                     │      │  Realtime (WebSocket CDC)        │
│                     │      │  Edge Functions (Deno)           │
│                     │      │  pg_cron + pg_net (scheduler)    │
└─────────────────────┘      └──────────────────────────────────┘
```

- **Frontend**: React 18 SPA, Vite 5, TypeScript, Tailwind 3, shadcn/ui (Radix primitives), React Router v6, TanStack Query 5
- **Backend**: 100% Supabase BaaS — no Node.js server, no custom API
- **Edge Functions**: 6 Deno functions deployed on Supabase infrastructure
- **Package manager**: npm (primary), Bun (lockfile present)
- **Dev server**: port 8080

## Environment Variables

### Frontend (Vite — `import.meta.env`)

| Variable | Required | Used in |
|----------|----------|---------|
| `VITE_SUPABASE_URL` | **Yes** | `src/integrations/supabase/client.ts`, AI assist button |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | **Yes** | `src/integrations/supabase/client.ts` |
| `VITE_SUPABASE_PROJECT_ID` | No | Not referenced in source — tooling only |

### Edge Functions (Deno — `Deno.env.get`)

| Variable | Required by | Purpose |
|----------|-------------|---------|
| `SUPABASE_URL` | All 6 functions | Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | scheduler-tick, publish-post | Admin DB access |
| `SUPABASE_ANON_KEY` | mark-posted-manually, fetch-platform-metrics, ai-content | User-scoped ops |
| `LOVABLE_API_KEY` | ai-content | Lovable AI Gateway |
| `META_APP_ID`, `META_APP_SECRET` | oauth-start (future) | Meta OAuth |
| `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET` | oauth-start (future) | LinkedIn OAuth |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | oauth-start (future) | Google Business OAuth |
| `TWITTER_CONSUMER_KEY`, `TWITTER_CONSUMER_SECRET` | oauth-start (future) | X/Twitter OAuth |

## Key Files

| File | What it does |
|------|-------------|
| `src/App.tsx` | Routes, query client, auth provider, brand provider |
| `src/contexts/AuthContext.tsx` | Supabase auth session, login/signup/logout |
| `src/contexts/BrandContext.tsx` | Selected brand, brand list, brand switching |
| `src/integrations/supabase/client.ts` | Supabase JS client singleton |
| `src/hooks/usePosts.ts` | CRUD for posts + approval workflow |
| `src/hooks/useNotifications.ts` | Real-time notification subscription |
| `src/hooks/useManualQueue.ts` | Manual posting queue with platform deep-links |
| `src/hooks/useAnalytics.ts` | Client-side analytics from post data (no external API) |
| `src/components/posts/CreatePostForm.tsx` | Post composer with AI assist, platform picker, scheduling |
| `supabase/functions/publish-post/index.ts` | **ALL PLATFORMS STUBBED** — throws NOT_CONFIGURED |
| `supabase/functions/ai-content/index.ts` | AI generation via Lovable Gateway, SSE streaming |
| `supabase/functions/scheduler-tick/index.ts` | Cron handler — finds due posts, dispatches publish-post |
| `supabase/functions/oauth-start/index.ts` | OAuth scaffold — checks for credentials, returns not-configured |
| `supabase/functions/fetch-platform-metrics/index.ts` | Stub — returns 501 |
| `supabase/migrations/20260430183419_...sql` | **BUG**: pg_cron calls hardcoded foreign Supabase project URL |
| `supabase/migrations/20260529000000_...sql` | Drops the broken cron (our fix) |
| `supabase/setup-cron.sql` | Manual SQL to recreate cron with correct project URL |
| `Dockerfile` | Multi-stage: Node 20 build → nginx:alpine serve |
| `nginx.conf` | SPA routing, security headers, asset caching |
| `docker-compose.yml` | Local Docker testing |

## Database Schema (PostgreSQL via Supabase)

### Core tables:
- `profiles` — user profiles (trigger-created on auth signup)
- `user_roles` — RBAC: admin, manager, creator, client
- `brands` — multi-tenant brand accounts
- `brand_members` — user↔brand junction
- `brand_accounts` — OAuth-connected platform accounts per brand
- `posts` — content, platforms, status, scheduling
- `post_platform_attempts` — per-platform publish tracking
- `post_metrics` — engagement per post per platform
- `media_assets` — uploaded file metadata
- `notifications` — user notifications
- `approval_logs` — approval workflow audit
- `activity_logs` — general audit log
- `invitations` — email-based team invites

### Enums:
- `app_role`: admin, manager, creator, client
- `post_status`: draft → pending_manager → pending_client → approved → scheduled → published (or rejected)
- `platform_type`: facebook, instagram, threads, linkedin, google_business, x
- `platform_attempt_status`: pending, processing, published, needs_manual, failed, skipped

### Extensions used:
`pg_cron`, `pg_net`, `pg_graphql`, `pg_stat_statements`, `pgcrypto`, `uuid-ossp`, `supabase_vault`

## Page Routes

| Route | Page | Access |
|-------|------|--------|
| `/` | Redirect | → `/auth` or `/dashboard` |
| `/auth` | AuthPage | Public (login/signup) |
| `/dashboard` | DashboardPage | All authenticated |
| `/create` | CreatePostPage | Creator+ |
| `/drafts` | DraftsPage | Creator+ |
| `/pending` | PendingPage | All (approval queue) |
| `/scheduled` | ScheduledPage | All |
| `/manual-queue` | ManualQueuePage | Creator+ |
| `/published` | PublishedPage | All |
| `/calendar` | CalendarPage | All |
| `/media` | MediaPage | Creator+ |
| `/analytics` | AnalyticsPage | All |
| `/brands` | BrandsPage | Admin, Manager |
| `/team` | TeamPage | Admin, Manager |
| `/settings` | SettingsPage | All |
| `*` | NotFound | Public |

## Current State Assessment

### What works:
- Auth (email/password via Supabase)
- Multi-tenant brand management with RBAC
- Post creation with platform targeting, media attachments, hashtags
- Approval workflow (draft → pending → approved → scheduled)
- Scheduling (dates stored, cron triggers `scheduler-tick`)
- Manual posting queue with platform-specific deep-links
- Real-time in-app notifications
- Client-side analytics (post counts, status breakdowns, platform distribution)
- AI content generation (generate, rewrite, hashtag suggestions via Lovable)
- Media upload to Supabase Storage
- Calendar view (read-only)
- Dark/light theme

### What's stubbed / broken:
- **ALL platform publishing** — `publish-post` has 6 `NOT_CONFIGURED` stubs. No actual API calls.
- **External analytics** — `fetch-platform-metrics` returns 501
- **OAuth flows** — `oauth-start` checks for credentials but has no auth URL construction
- **Scheduler cron** — migration has hardcoded URL to wrong Supabase project (fixed in our migration + setup-cron.sql)
- **No billing/payments** — zero monetization
- **No email notifications** — in-app only
- **No error monitoring** — no Sentry, no logging
- **No tests** — zero test files anywhere
- **Client role** — exists in schema but has no dedicated UI
- **Threads platform** — Meta doesn't provide a public write API; will always be manual

### Security notes:
- RLS policies on all tables for multi-tenant isolation
- `has_brand_access(user_id, brand_id)` function gates brand data
- Edge functions validate JWT before processing
- `.env` was committed to original repo with live keys (removed from fork)

---

## Phased Implementation Plan

### Phase 0 — Foundation (current week)
**Goal: production-ready infrastructure**

- [x] Dockerize for Coolify deployment
- [x] Fix broken scheduler cron URL
- [x] Self-healing cron in scheduler-tick edge function
- [x] `.env.example` and deployment docs
- [ ] Add Sentry error monitoring to all edge functions
- [ ] Add Sentry to frontend (error boundary in App.tsx)
- [ ] Set up Supabase branching for dev/staging/prod
- [ ] Add health check endpoint to scheduler-tick (return `{ok:true, last_run:...}`)

### Phase 1 — v1 Launch (weeks 1-3)
**Goal: sellable product — clients can schedule and auto-publish**

#### 1.1 — Stripe Billing (3 days)
- Create `subscriptions` table: `id, user_id, stripe_customer_id, stripe_subscription_id, plan_tier, status, current_period_end, brand_limit, post_limit_per_month, posts_used_this_month, created_at`
- Add Stripe Checkout to `/settings` page
- Create `stripe-webhook` edge function to handle `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
- Create `check-limits` edge function called before createPost/createBrand/uploadFile
- Plans:
  - Free: 1 brand, 5 posts/mo, 10 media uploads
  - Pro ($29/mo): 5 brands, unlimited posts, 100 media
  - Agency ($99/mo): 20 brands, unlimited everything, white-label

#### 1.2 — Meta API Integration (5 days)
**Covers Facebook + Instagram in one OAuth flow.**
- Implement OAuth flow in `oauth-start/index.ts`:
  - Construct Meta OAuth URL with proper scopes (`pages_manage_posts`, `instagram_basic`, `instagram_content_publish`)
  - Handle callback in new `oauth-callback/index.ts` edge function
  - Exchange code for token, store in `brand_accounts`
  - Long-lived token exchange + refresh logic
- Implement Facebook `Publisher` in `publish-post/index.ts`:
  - Text post → `/{page-id}/feed` with `message`
  - Image post → first upload to `/{page-id}/photos`, then post
  - Multi-image → `/{page-id}/feed` with `attached_media`
- Implement Instagram `Publisher`:
  - Single image → `/{ig-user-id}/media` (create container) → `/{ig-user-id}/media_publish`
  - Carousel → create containers → `/{ig-user-id}/media_publish` with `children`
  - Reels/video same flow with `media_type: "REELS"`
- Update `post_platform_attempts.external_post_id` and `external_url` with real values
- Handle token expiry: edge function checks `token_expires_at`, refreshes if needed

#### 1.3 — Email Notifications (2 days)
- Add Resend API key to edge function secrets
- Create `send-email` utility in edge functions
- Trigger emails from database webhook or edge function:
  - `post_status` → `pending_client`: email client with approve/reject link
  - `post_status` → `rejected`: email creator
  - `post_platform_attempts.status` → `needs_manual`: email creator
  - Weekly digest (new cron job): summary of published posts
- Add unsubscribe token to `profiles` table

#### 1.4 — Client Portal (2 days)
- New route: `/client/:brandId` — stripped-down view
- Shows only: pending approval posts (approve/reject), published posts (read-only), basic analytics
- No sidebar links to brands, team, settings, create
- Client role users redirect to `/client/:brandId` on login
- Client invitation flow: admin invites → client receives email → signs up → auto-assigned to brand

### Phase 2 — v1.1 (weeks 4-5)
**Goal: more platforms, real analytics**

#### 2.1 — LinkedIn API Integration (3 days)
- OAuth: `openid`, `profile`, `w_member_social`, `w_organization_social` scopes
- Organization post → `POST /rest/posts` with URN
- Image upload → `POST /images?action=initializeUpload` → upload binary → finalize
- Multi-image carousel support
- Company page selection UI in brand settings

#### 2.2 — Google Business Profile Integration (2 days)
- OAuth: `https://www.googleapis.com/auth/business.manage`
- List locations → `GET /v1/accounts/{accountId}/locations`
- Create post → `POST /v1/{locationName}/localPosts`
- Types: standard, event, offer (match to post content)
- Media: upload via Google Photos or direct URL

#### 2.3 — Real Analytics (3 days)
- Implement `fetch-platform-metrics` for Meta:
  - `/{post-id}/insights` with metrics: `post_impressions`, `post_engagements`, `post_reactions_by_type_total`
  - Store in `post_metrics` table
- Implement for LinkedIn: `GET /rest/organizationalEntityShareStatistics`
- Implement for Google: `GET /v1/{postName}/insights`
- Add "refresh metrics" button to published posts
- Update Analytics page with real engagement charts
- Add brand-level aggregate metrics (total reach, engagement rate, follower growth)

#### 2.4 — AI Multi-Provider (1 day)
- Refactor `ai-content/index.ts`:
  - Accept `provider` param: `lovable` (default), `openai`, `anthropic`, `gemini`
  - Read provider-specific API keys from env vars
  - Abstract streaming logic behind provider interface
- Add "AI Provider" section to `/settings` page

### Phase 3 — v1.5 (weeks 6-8)
**Goal: agency features, differentiation**

#### 3.1 — Bulk Import / CSV Scheduling (2 days)
- New page: `/bulk-import`
- CSV template download button
- Upload CSV → parse → validate → create draft posts in batch
- CSV columns: `date, time, platform, content, media_url, hashtags`
- UI: preview table before confirm, row-level validation errors

#### 3.2 — Content Calendar v2 (3 days)
- Drag-and-drop rescheduling (react-dnd or @dnd-kit)
- Click post on calendar → inline preview card
- "Gap filler" — highlights empty days and offers to generate AI posts
- Week/Month toggle
- Filter by platform, status
- Color-coding by brand (multi-brand calendar)

#### 3.3 — Best Time to Post (2 days)
- Analyze `post_metrics` table for engagement patterns
- Group by hour of day, day of week
- Simple scoring: `engagement_rate = (likes + comments + shares) / impressions`
- Surface recommendations in CreatePostForm: "Best times for Instagram: Tue 10am, Wed 2pm"
- Auto-suggest scheduling slot

#### 3.4 — White-Label / Custom Domain (3 days)
- Per-brand: custom CNAME, logo, primary color
- `brands` table: add `custom_domain`, `logo_url`, `primary_color`, `is_white_label`
- Nginx/Docker: accept `X-Brand-Domain` header or subdomain routing
- Frontend: load brand config from URL, apply theme
- Client portal at `client.theirbrand.com` shows only their brand
- Agency branding: "Powered by OptimOwl" toggle in settings

### Phase 4 — v2.0 (beyond)
- X/Twitter API integration (when API situation stabilizes)
- TikTok integration
- YouTube Shorts scheduling
- AI content calendar — "generate 30 days of posts for my brand"
- Competitor analysis — track competitor posts and engagement
- Custom reporting — PDF export, scheduled report emails
- Team comments/annotations on post drafts
- Post templates library
- Link in bio tool
- Hashtag research tool (analyze hashtag performance)
- Mobile PWA
- Zapier/Make integration (webhooks)

---

## Gotchas & Notes for Future Work

### Deployment
- **Dockerfile**: env vars are build-time args. Changing Supabase project requires rebuild.
- **Scheduler cron**: After deploying edge functions, must run `supabase/setup-cron.sql` with correct project URL + service role key. The self-healing in `scheduler-tick` will auto-create it on first invocation as a safety net, but don't rely on that.
- **Edge function deploy**: Use `supabase functions deploy <name>`. All 6 must be deployed before the app is fully functional.
- **Vite dev port**: 8080 (configured in `vite.config.ts`)

### Database
- **First user is auto-admin**: Database trigger `handle_new_user()` makes the first signup an admin. Subsequent users get `creator` role. Test with fresh database.
- **RLS everywhere**: Every table has row-level security via `has_brand_access()`. When writing new queries, always filter by brand or use the helper function.
- **pg_cron runs inside PostgreSQL**: The `scheduler-tick-every-minute` job calls the edge function via `net.http_post`. If pg_net extension is missing, cron fails silently.
- **Migrations must be run in order**: They're timestamp-prefixed. Our fix migration `20260529000000` must run AFTER `20260430183419` (the broken one it fixes).

### Code Conventions
- **Components**: Feature-based folders under `src/components/`. UI primitives in `src/components/ui/` (shadcn pattern).
- **Hooks**: Data-fetching hooks in `src/hooks/`. They use direct Supabase calls (not TanStack Query despite the provider being set up).
- **Types**: Database types in `src/types/database.ts`. Platform enums shared across app.
- **Styling**: Tailwind with CSS variables for theming. Dark/light mode via `next-themes`.
- **Path alias**: `@/` maps to `src/` (configured in `vite.config.ts` and `tsconfig.json`).

### Platform APIs
- **Meta token expiry**: Short-lived tokens expire in hours. Must implement refresh with long-lived tokens. Store `token_expires_at` in `brand_accounts` and check before each publish.
- **Instagram publishing**: Requires a Facebook Page connected to an Instagram Business/Creator account. The OAuth flow must request both `pages_manage_posts` and `instagram_content_publish`.
- **LinkedIn rate limits**: Tight quotas on the Marketing API. Implement exponential backoff with jitter.
- **Google Business**: Posts can be STANDARD, EVENT, or OFFER types. Need UI to let user choose type.
- **Threads API**: As of 2026, no public write API exists from Meta. The Threads checkbox should be removed or explicitly marked "Manual Only" until Meta ships it.

### AI Feature
- **Streaming**: `ai-content` edge function streams SSE. Frontend `AIAssistButton.tsx` reads the stream token-by-token. When adding new providers, maintain SSE compatibility.
- **Rate limits**: Lovable gateway returns 402 (credits exhausted) and 429 (rate limited). Already handled in the edge function. Same codes should be handled for new providers.
- **Prompt engineering**: The system prompts in `buildMessages()` are platform-aware. When adding providers, test that prompt quality doesn't degrade.

### Security Hardening Needed
- Rate limiting on auth endpoints (currently none)
- CSRF protection (no token rotation)
- File upload validation: check mime types server-side, scan for malware (currently client-side only)
- Edge function timeout: Deno functions have a 400s limit — long video uploads may need chunking
- Secrets rotation: no mechanism to rotate OAuth tokens or API keys

### Production Monitoring (Phase 0)
- Sentry DSN as edge function secret
- Log every `publish-post` attempt: platform, success/fail, duration, error
- Monitor `post_platform_attempts.status = 'failed'` count
- Alert if scheduler hasn't run in 5 minutes (check `activity_logs` or add heartbeat table)

---

## Testing

No tests exist. When adding tests:

- **Frontend**: Vitest + React Testing Library (Vite-native)
- **Edge functions**: Deno.test in function directory (or Supabase local dev)
- **Critical paths to test first**:
  1. Auth flow (login, signup, session refresh)
  2. Post lifecycle (create → approve → schedule → publish)
  3. RLS policies (user A cannot see brand B's posts)
  4. Billing webhook handler (all Stripe events)

## Useful Commands

```bash
# Dev
npm run dev              # Vite dev server on :8080
npm run build            # Production build
npm run preview          # Preview production build

# Docker
docker compose up --build   # Build and run locally on :3000
docker compose down         # Stop

# Supabase
supabase link --project-ref <ref>          # Link to project
supabase functions deploy <name>           # Deploy one function
supabase functions deploy ai-content       # Deploy all (repeat for each)
supabase db push                           # Push local migrations
supabase secrets set --env-file .env       # Set edge function secrets

# Database (in Supabase SQL Editor)
# Run setup-cron.sql after deploying edge functions
# Replace YOUR_PROJECT_REF and YOUR_SERVICE_ROLE_KEY first
```

## Original vs Fork

Original: `D:\dev\tools\optimowl-brandbaja\optimowl-brandbaja\`
Coolify Fork: `D:\dev\tools\optimowl-brandbaja-coolify\`

Changes in fork:
- Added Dockerfile, nginx.conf, .env.example, docker-compose.yml
- Added migration to fix broken cron URL
- Added self-healing to scheduler-tick edge function
- Updated index.html meta tags, README, .gitignore
- Removed .env with live keys
