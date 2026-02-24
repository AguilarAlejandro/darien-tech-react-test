# Frontend Implementation Plan — Coworking Reservation System

> Status legend: ⬜ Not started | 🔄 In progress | ✅ Done

---

## Overview

Next.js 15 (App Router) + TypeScript + Tailwind CSS v4 + shadcn/ui + Axios + SSE.
Follows patterns from `XXX` (structure, hooks, route groups, Tailwind theming).

---

## Key Decisions

| Decision | Choice |
|---|---|
| **UI Components** | shadcn/ui + Tailwind CSS v4 |
| **Color scheme** | Teal/green — `teal-600` primary, `emerald-500` accent, `stone-50` background |
| **Data fetching** | Axios wrapper — typed HTTP methods with base URL + x-api-key interceptor |
| **Auth** | Login page with API key input. Key stored in cookie, role in React context. |
| **Real-time** | SSE (EventSource) for IoT admin dashboard |
| **Optimistic UI** | Delete operations and simple state toggles; forms use standard submit flow |
| **State management** | React hooks only — no external state library |

---

## Color Scheme

```
Primary:        teal-600  (#0d9488) — buttons, active states, links
Primary hover:  teal-700  (#0f766e)
Accent:         emerald-500 (#10b981) — success, badges
Danger:         red-500 / red-600
Warning:        amber-500 / amber-600
Background:     stone-50  (#fafaf9) — main bg
Surface:        white — cards, modals
Text primary:   stone-900
Text secondary: stone-500
Border:         stone-200
```

Applied via Tailwind CSS v4 `@theme inline` custom properties in `app/globals.css`.

---

## Project Structure

```
darien-tech-react-test/
├── docker-compose.yml
├── Dockerfile
├── .env.example
├── .env.local
├── .gitignore
├── package.json
├── tsconfig.json
├── next.config.ts
├── postcss.config.mjs
├── components.json            # shadcn/ui config
├── README.md
├── public/
│   └── favicon.ico
├── src/
│   ├── lib/
│   │   ├── api/
│   │   │   ├── client.ts      # Axios instance + interceptors
│   │   │   ├── auth.api.ts
│   │   │   ├── lugares.api.ts
│   │   │   ├── espacios.api.ts
│   │   │   ├── reservas.api.ts
│   │   │   └── iot.api.ts
│   │   ├── hooks/
│   │   │   ├── use-api.ts     # Generic data-fetching hook
│   │   │   ├── use-lugares.ts
│   │   │   ├── use-espacios.ts
│   │   │   ├── use-reservas.ts
│   │   │   ├── use-iot-sse.ts # SSE hook for admin dashboard
│   │   │   ├── use-auth.ts
│   │   │   └── use-toast.ts
│   │   ├── types/
│   │   │   ├── lugar.ts
│   │   │   ├── espacio.ts
│   │   │   ├── reserva.ts
│   │   │   ├── iot.ts
│   │   │   ├── pagination.ts
│   │   │   └── auth.ts
│   │   ├── utils/
│   │   │   ├── cn.ts          # clsx + tailwind-merge
│   │   │   ├── format-date.ts
│   │   │   └── format-time.ts
│   │   └── constants/
│   │       ├── routes.ts
│   │       └── config.ts
│   ├── components/
│   │   ├── ui/                # shadcn/ui components
│   │   ├── layout/
│   │   │   ├── Navbar.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── PageHeader.tsx
│   │   ├── shared/
│   │   │   ├── LoadingSpinner.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   ├── ErrorMessage.tsx
│   │   │   ├── ConfirmDialog.tsx
│   │   │   ├── Pagination.tsx
│   │   │   └── StatusBadge.tsx
│   │   ├── lugares/
│   │   │   ├── LugarCard.tsx
│   │   │   ├── LugarForm.tsx
│   │   │   └── LugarList.tsx
│   │   ├── espacios/
│   │   │   ├── EspacioCard.tsx
│   │   │   ├── EspacioForm.tsx
│   │   │   ├── EspacioList.tsx
│   │   │   └── EspacioDetail.tsx
│   │   ├── reservas/
│   │   │   ├── ReservaForm.tsx
│   │   │   ├── ReservaTable.tsx
│   │   │   └── ReservaFilters.tsx
│   │   └── iot/
│   │       ├── TelemetryCard.tsx
│   │       ├── TelemetryChart.tsx
│   │       ├── AlertsList.tsx
│   │       ├── AlertBadge.tsx
│   │       ├── DigitalTwinCard.tsx
│   │       ├── DesiredConfigForm.tsx
│   │       ├── OfficeHoursCard.tsx
│   │       └── OfficeDashboard.tsx
│   ├── contexts/
│   │   └── AuthContext.tsx
│   └── app/
│       ├── globals.css
│       ├── layout.tsx
│       ├── page.tsx           # Redirect to /login or /espacios
│       ├── not-found.tsx
│       ├── login/
│       │   ├── page.tsx
│       │   └── layout.tsx
│       └── (app)/
│           ├── layout.tsx     # Protected layout (Navbar + auth check)
│           ├── espacios/
│           │   ├── page.tsx
│           │   └── [id]/
│           │       └── page.tsx
│           ├── reservas/
│           │   ├── page.tsx
│           │   └── nueva/
│           │       └── page.tsx
│           ├── lugares/
│           │   ├── page.tsx
│           │   └── [id]/
│           │       └── page.tsx
│           └── admin/
│               ├── layout.tsx  # Admin-only guard
│               ├── page.tsx    # IoT overview (all offices)
│               └── oficinas/
│                   └── [id]/
│                       └── page.tsx  # Single office IoT detail
```

---

## Phase 1: Project Scaffolding ✅

- [x] **1.1** Initialize Next.js 15 project (TypeScript, App Router, Tailwind)
- [x] **1.2** Configure `package.json` — all dependencies and scripts
- [x] **1.3** Configure `tsconfig.json` — strict, path aliases `@/*` → `src/*`
- [x] **1.4** Configure `next.config.ts`
- [x] **1.5** Set up Tailwind CSS v4 with `postcss.config.mjs`
- [x] **1.6** Initialize shadcn/ui (`components.json`, base components)
- [x] **1.7** Install shadcn/ui components: Button, Card, Input, Label, Dialog, Table, Badge, Select, Tabs
- [x] **1.8** Create `Dockerfile` — multi-stage (deps → build → runner)
- [x] **1.9** Create `docker-compose.yml` — frontend service, configurable port
- [x] **1.10** Create `.env.example`
- [x] **1.11** Create `.gitignore`

## Phase 2: Theme & Layout ✅

- [x] **2.1** `app/globals.css` — teal/green CSS vars via `@theme inline`
- [x] **2.2** `src/lib/utils/cn.ts` — clsx + twMerge utility
- [x] **2.3** `app/layout.tsx` — root layout (fonts, Toaster, AuthProvider)
- [x] **2.4** `app/dashboard/layout.tsx` — sidebar nav + auth check
- [x] **2.5** Loading states with pulse animation

## Phase 3: API Layer (Axios) ✅

- [x] **3.1** `src/lib/api.ts` — Axios instance + request interceptors + all API modules
- [x] **3.2** `src/lib/types.ts` — all TypeScript types (Location, Space, Booking, IoT, Pagination, Auth)

## Phase 4: Authentication ✅

- [x] **4.1** `src/contexts/AuthContext.tsx` — apiKey, role, login(), logout(), isLoading
- [x] **4.2** `useAuth()` hook exported from AuthContext
- [x] **4.3** `app/login/page.tsx` — API key input form with validation + error feedback
- [x] **4.4** `app/dashboard/layout.tsx` — protected layout, redirects to /login if not authenticated
- [x] **4.5** Admin-only guard on IoT dashboard page

## Phase 5: Spaces Pages ✅

- [x] **5.1** Space listing with location filter
- [x] **5.2** Space CRUD (admin-only create/edit/delete)
- [x] **5.3** `app/dashboard/spaces/page.tsx` — list + locationId filter
- [x] **5.4** `app/dashboard/spaces/[id]/page.tsx` — detail + recent bookings

## Phase 6: Bookings Pages ✅

- [x] **6.1** Paginated booking list with debounced email filter
- [x] **6.2** Booking table with pagination controls
- [x] **6.3** Create booking form in Dialog with Zod validation
- [x] **6.4** Server-side error mapping (conflict, weekly limit, validation)
- [x] **6.5** Optimistic delete with rollback on failure

## Phase 7: Locations Pages ✅

- [x] **7.1** Location listing with CRUD (admin-only write ops)
- [x] **7.2** `app/dashboard/locations/page.tsx`

## Phase 8: IoT Admin Dashboard ✅

- [x] **8.1** `src/hooks/useSSE.ts` — SSE hook with auto-reconnect
- [x] **8.2** Digital Twin panel (desired vs reported side-by-side)
- [x] **8.3** Telemetry charts (Temperature, CO₂, Occupancy via recharts)
- [x] **8.4** Alerts panel (active/resolved with kind labels and metadata)
- [x] **8.5** Admin-only editing of desired config
- [x] **8.6** `app/dashboard/iot/page.tsx` — tabbed IoT dashboard

## Phase 9: Error Handling & Polish ✅

- [x] **9.1** Add `error.tsx` files in route groups for error boundaries
- [x] **9.2** Add `loading.tsx` files with skeleton loading states
- [x] **9.3** `app/not-found.tsx` — 404 page
- [x] **9.4** All API errors show user-friendly toast messages
- [x] **9.5** Consistent teal/green theming throughout

## Phase 10: Docker & Documentation ✅

- [x] **10.1** Finalize `Dockerfile` — standalone Next.js build
- [x] **10.2** Finalize `docker-compose.yml`
- [x] **10.3** Write `README.md` — setup, auth guide, feature overview

---

## Pages Overview

| Route | Auth | Description |
|---|---|---|
| `/login` | Public | API key login form |
| `/espacios` | User+ | Browse available spaces |
| `/espacios/:id` | User+ | Space detail + book link |
| `/reservas` | User+ | Paginated reservation list |
| `/reservas/nueva` | User+ | Create reservation form |
| `/lugares` | User+ | Browse places/sites |
| `/lugares/:id` | User+ | Place detail + its spaces |
| `/admin` | Admin | IoT overview dashboard |
| `/admin/oficinas/:id` | Admin | Single office IoT: telemetry, alerts, twin, config |
