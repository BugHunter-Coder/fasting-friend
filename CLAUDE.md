# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run dev          # Start Vite dev server
npm run build        # Production build
npm run lint         # ESLint check
npm run preview      # Preview production build

# Testing
npm run test         # Run tests once (vitest)
npm run test:watch   # Run tests in watch mode

# Mobile (Capacitor)
npm run mobile:sync  # Build and sync to native platforms
npm run mobile:ios   # Build and open in Xcode
npm run mobile:android # Build and open in Android Studio
```

Tests live in `src/**/*.{test,spec}.{ts,tsx}` and use jsdom. The setup file is `src/test/setup.ts`.

## Architecture

This is **FastFlow** — a fasting tracker PWA/mobile app built with Vite + React + TypeScript, targeting both web and native iOS/Android via Capacitor. It was scaffolded with Lovable.

### Tech Stack
- **UI**: React 18, shadcn/ui (Radix primitives + Tailwind), Framer Motion for animations
- **Routing**: React Router v6 with `ProtectedRoute` wrapper in `src/App.tsx`
- **Data fetching**: TanStack React Query + direct Supabase client calls
- **Backend**: Supabase (auth, Postgres, realtime) — project ID `rzloqyabysucwyqoixex`
- **Mobile**: Capacitor 8 — app ID `com.fastflow.app`, `webDir: dist`
- **Path alias**: `@/` maps to `src/`

### Auth Flow
`useAuth` hook (`src/hooks/useAuth.tsx`) wraps Supabase auth state. `App.tsx` defines a `ProtectedRoute` component that redirects unauthenticated users to `/`. Routes: `/` (landing), `/auth`, `/reset-password`, then protected: `/dashboard`, `/history`, `/weight`, `/meals`, `/insights`, `/profile`, `/admin`.

### Database Schema (Supabase)
Types are auto-generated in `src/integrations/supabase/types.ts`. Key tables:
- `fasts` — fasting sessions with `started_at`, `ended_at`, `fasting_hours`, `schedule_type`, `status`
- `profiles` — user settings including `role` (admin check), `preferred_schedule`, `healthkit_connected`, `health_data`
- `weight_entries` — weight logs
- `meal_logs` — meal records, optionally linked to a `fast_id`
- `health_snapshots` — daily health metric snapshots (steps, weight, heart rate, active energy)

Admin access is checked by querying `profiles.role === 'admin'` in `AppLayout.tsx`.

### Layout & Navigation
`AppLayout` (`src/components/AppLayout.tsx`) provides the shell: sticky header with logo + user controls, bottom tab nav on mobile, left sidebar on desktop (md+). Uses `env(safe-area-inset-*)` CSS for iOS notch/home bar support.

### Mobile / Native Integrations
- **Haptics**: `useHaptics` hook — wraps `@capacitor/haptics`, no-ops on web
- **HealthKit** (iOS only): `useHealthKit` hook — requests authorization via `@perfood/capacitor-healthkit`, syncs steps/weight/active energy/heart rate to `health_snapshots` and `profiles.health_data`
- **Google Fit** (Android): `useGoogleFit` hook — similar pattern
- **Status bar**: initialized in `src/main.tsx` on native platforms

### Fasting Logic
`FastingTimer` (`src/components/FastingTimer.tsx`) is the core component. Schedules: 16:8, 18:6, 20:4 (OMAD), Custom. Fasting stages (blood sugar, fat burning, ketosis, autophagy) are defined as hour thresholds. Active fast state is persisted to the `fasts` Supabase table.
