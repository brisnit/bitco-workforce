# BITCO Workforce

**Shop operations. Connected.** An interactive MVP prototype of an internal machine shop operations platform for BITCO Drilling Tools, built by Artifact Digital.

It connects the office, shop supervisors and shop-floor workers around five questions: what needs to get done today, who is responsible, where each job stands, what is slowing production down, and what management needs to know.

> **Prototype notice:** roles are simulated with a demo role switcher (no login, not secure authorization). All people, customers and jobs are fictional, except Eran (owner). Data is saved in the browser's local storage and does **not** sync between users, devices or browsers. Messages are not delivered to anyone.

## Run it

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # production build (what Vercel runs)
```

No database, environment variables or paid services are required. To deploy, import the repo in Vercel with the default Next.js settings.

## What to try

| # | Interaction | Where |
|---|---|---|
| 1 | Switch Admin / Supervisor / Worker | Landing page, or the **Demo** bar at the top of every screen |
| 2 | Create, preview and publish a daily briefing | Dashboard → Daily Briefings → Create today's briefing |
| 3 | Acknowledge the briefing ("Got it — I've read this") | Worker app → Today (as Marcus) |
| 4 | Create a work order | **New work order** (top bar) |
| 5 | Assign a worker | Work order detail → Details → Assigned worker |
| 6 | Change a job's status (with confirmation) | Work order detail → Change status, or drag on the Production Board |
| 7 | Start a job and post progress, photos and voice notes | Worker app → job card → Start job / Update progress |
| 8 | Report a problem (high urgency marks the job Blocked) | Worker app → Report a problem |
| 9 | Resolve a problem | Dashboard → Overview → Needs attention → Resolve |
| 10 | Send a message | Messages (dashboard or worker app) |
| 11 | Move between the dashboard and work order details | KPI cards, lists, ⌘K search |
| 12 | Filter and search work orders | Work Orders: views, search, status/priority/type/assignee filters |

**Reset demo data** is in the demo bar's role menu and in Settings.

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · shadcn/ui (Radix) · Lucide · dnd-kit (production board drag-and-drop).

Branding follows the BITCO website (https://bitco-steel.vercel.app/): navy `#032641`, BITCO orange `#FF6100`, ink `#0B0D10`, warm white `#F8F6F1`, with Archivo, Inter and Roboto Mono. The BITCO mark in `public/brand/` comes from that site. The reference drawings in `public/reference/` are illustrative placeholders, not BITCO specifications.

## Architecture

```
src/
  app/
    page.tsx                 Landing + demo role chooser
    dashboard/…              Office & supervisor app (desktop-first)
    worker/…                 Shop worker app (mobile-first, PWA manifest)
  components/
    ui/                      shadcn/ui primitives
    shared/ dashboard/ worker/ work-orders/ briefings/ messages/ reports/ brand/
  lib/
    domain/types.ts          Domain models (Organization, Location, Team, Employee, User,
                             Customer, WorkOrder, WorkOrderActivity, Attachment, Blocker,
                             Briefing, BriefingAcknowledgement, MessageThread, Message)
    domain/constants.ts      Status workflow, labels, colors
    auth/permissions.ts      Centralized role → permission rules + status-transition rules
    auth/session.ts          AuthProvider abstraction (DemoAuthProvider today)
    services/commands.ts     All state changes (pure functions with business rules + activity logging)
    selectors.ts             All derived metrics (KPIs, reports): nothing hard-coded
    data/repository.ts       DataRepository interface + LocalStorageRepository
    store/app-store.ts       Central store (useSyncExternalStore) + typed actions
    seed/                    Fictional demo data, generated relative to "today"
    integrations/            Future website-intake contract + integration registry (inactive)
```

**Data flow:** UI → `actions` → `services/commands` (permission check, business rules, activity log) → store → `DataRepository`. Every view reads the same snapshot, so a change made anywhere appears everywhere.

**Moving to production:**
1. Implement `DataRepository` (or replace commands with API routes / server actions) against Supabase/Postgres. Records already carry `orgId` (and work orders `locationId`) for multi-shop support later.
2. Replace `DemoAuthProvider` with real authentication and enforce `permissions.ts` on the server (for example with row-level security).
3. Connect `integrations/website-intake.ts`: customer requests land in an office review queue and **never** become shop work orders without explicit admin approval.
4. A native worker app (Expo / React Native) could reuse `lib/domain`, `lib/auth/permissions` and the command logic. The current responsive web app is not a native app.

## Deliberately out of scope

No accounting, payroll, inventory or ERP functions. No location tracking, productivity surveillance or automated disciplinary scoring. Briefing acknowledgements are read receipts, not legal, training or safety certifications. Safety concerns show instructions to stop work and notify a supervisor in person; the app is not an emergency reporting system.
