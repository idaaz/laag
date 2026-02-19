# LAAG — Life As A Game

Production-ready MVP scaffold for a ruthless discipline operating system.

## Stack
- Next.js App Router + TypeScript
- Supabase (Auth + Postgres + RLS), no custom backend service
- TailwindCSS + shadcn-style UI primitives
- TanStack Query
- Framer Motion
- Recharts
- Vitest

## Core MVP Coverage
- Auth (Supabase email/password)
- Strict per-user RLS on all tables
- Dashboard with XP, level, discipline score, streaks, recovery mode, truth flags
- Tasks CRUD with XP awarding + deadline reminder creation + anti-cheat reason capture
- Habits CRUD + streak basics + XP awarding
- Daily logs quick entry + optional client-side encrypted journal
- Notifications in-app + Browser Notifications API persistence model
- Analytics: XP line, radar life balance, heatmap, mood/productivity, screen-vs-study
- Pomodoro/deep-work timer with XP awarding hook
- Lock mode PIN hash setup + unlock gate
- CSV export utility with re-auth confirmation

## Folder Skeleton
```txt
app/
  (auth)/auth/{login,signup}/page.tsx
  (protected)/
    {dashboard,tasks,habits,daily-logs,analytics,achievements,settings}/page.tsx
  api/{notifications,export}/route.ts
components/
  ui/*, charts/*, dashboard/*, tasks/*, timer/*, lock/*
hooks/
  useAuth.ts, useXP.ts, useHabits.ts, useNotifications.ts, useAnalytics.ts, useTimers.ts
lib/
  engines/*, notifications/*, lock/*, export/*, supabase/*, config/*, validators/*
supabase/
  migrations/0001..0005.sql
  seed/seed.sql
scripts/seed.ts
tests/xpEngine.test.ts, tests/streakUtils.test.ts
```

## Quick Start
1. Install dependencies:
```bash
pnpm install
```
2. Copy env:
```bash
cp .env.example .env.local
```
3. Fill env keys in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SEED_USER_EMAIL`
- `NEXT_PUBLIC_APP_NAME`
- `NEXT_PUBLIC_DEFAULT_TIMEZONE`
4. Run SQL migrations in order:
- `supabase/migrations/0001_extensions_enums.sql`
- `supabase/migrations/0002_tables.sql`
- `supabase/migrations/0003_functions_triggers.sql`
- `supabase/migrations/0004_rls.sql`
- `supabase/migrations/0005_indexes_analytics.sql`
5. Start dev server:
```bash
pnpm dev
```
6. Sign up first through `http://localhost:3000/auth/signup`.
7. Seed demo data (recommended TS path):
```bash
pnpm db:seed
```

## Supabase Setup Notes
- Keep RLS enabled on all `public` tables.
- Auth source of truth is `auth.users`.
- App profile table is `public.users` keyed by auth UUID.
- RLS rule pattern:
  - `users`: `id = auth.uid()`
  - all other tables: `user_id = auth.uid()`
- Trigger highlights:
  - `set_updated_at` for mutable tables
  - `enforce_daily_log_truth`: blocks retro edits without reason
  - `increment_truth_mode_count`: increments `users.truth_mode_count` on override usage

## Seeding Options
- TS seed (preferred): `pnpm db:seed`
  - Resolves real auth user by `SEED_USER_EMAIL`
  - Upserts profile/settings
  - Clears user domain tables
  - Inserts deterministic demo records
- SQL seed (manual):
  - open `supabase/seed/seed.sql`
  - replace `{{USER_ID}}`
  - run in SQL editor

## Scripts
- `pnpm dev`
- `pnpm build`
- `pnpm start`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm test:watch`
- `pnpm db:migrate`
- `pnpm db:seed`
- `pnpm db:types`

## Testing
Unit tests included:
- `tests/xpEngine.test.ts`
- `tests/streakUtils.test.ts`

Run:
```bash
pnpm test
```

## Accessibility + UX Baseline
- Keyboard-accessible nav/buttons/forms
- Dialog and sheet focus-safe wrappers
- Aria labels on chart regions
- Responsive layout for mobile + desktop
- Modest Framer Motion transitions only on section/card entry

## Security + Privacy
- Strict RLS by auth user ID
- PIN hashed client-side with PBKDF2 (`lib/lock/crypto.ts`)
- Lock mode hash stored in `settings.lock_mode` and local cache
- Optional journal encryption client-side before upload
- CSV export requires re-auth confirmation

## Performance + Scalability Notes
- Aggregation indexes in `0005_indexes_analytics.sql`
- `analytics_cache` used for expensive dashboard chart payloads
- Query pagination pattern present on high-volume entities
- LocalStorage timer persistence and lightweight offline tolerance
- SaaS-ready schema direction: add workspace/org layer later without rewriting core user tables

## Browser Extension Integration Notes (screen logging)
- MVP supports manual screen logs.
- Future extension should post authenticated usage payloads into `screen_logs`:
  - `user_id`
  - `log_date`
  - `source='extension'`
  - `minutes`

## Desktop/Mobile Packaging Notes
- Tauri:
  - best lightweight desktop shell
  - direct web app reuse
  - low memory overhead
- Electron:
  - broad native API/plugin support
  - heavier runtime footprint
- Capacitor:
  - wrap for iOS/Android
  - adapt notification and background constraints per platform policy

## AI Hook Roadmap
- `lib/ai/README.md` includes TODO entry points.
- Planned outputs:
  - discipline trajectory forecast
  - relapse risk scoring API
  - anomaly ranking for truth-mode panel

## Manual QA Checklist
1. Signup + login + session redirect on protected routes.
2. Create task, complete task, verify `xp_events` and dashboard total XP change.
3. Create past-dated daily log without reason and confirm rejection.
4. Drop discipline score below threshold and verify recovery mode panel.
5. Confirm browser notification permission flow and in-app notification feed.
6. Run timer completion and verify timer + XP entries.
7. Configure lock PIN and verify unlock gate behavior.
8. Run CSV export with password confirmation and size warning.

## Repo Layout
See scaffold in the implementation plan. Main high-value paths:
- `app/(protected)/*`
- `hooks/*`
- `lib/engines/*`
- `supabase/migrations/*`
- `scripts/seed.ts`
- `tests/*`
