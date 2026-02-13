# CLAUDE.md

> **Self-maintaining**: When making changes that affect this file (new scripts, dependencies, routes, conventions, project structure, etc.), update this file as part of the same change.

## Project Overview

Big Vibes is a fitness & diet tracker — a full-stack monorepo with a Bun API backend, Vue 3 frontend, and shared TypeScript types.

## Tech Stack

- **Runtime/Package Manager**: Bun (monorepo workspaces)
- **API**: Custom router on `Bun.serve()`, Drizzle ORM, SQLite, Zod validation
- **Frontend**: Vue 3 (Composition API + `<script setup>`), Pinia, Vite, Tailwind CSS, Radix Vue
- **Shared**: TypeScript interfaces in `/shared/types.ts`
- **Real-time**: WebSocket for live updates

## Commands

```bash
bun install          # Install dependencies
bun run dev          # Run API + Web in parallel
bun run dev:api      # API only (localhost:3001)
bun run dev:web      # Web only (localhost:5173)
bun run kill         # Kill processes on ports 3001 and 5173
bun run dev:fresh    # Kill + clear DB + run dev (re-seeds test data)
bun run db:reset     # Delete the SQLite DB
bun run db:generate  # Generate Drizzle migrations after schema changes
bun run db:migrate   # Run migrations
cd web && bun run build  # Build frontend
```

## Project Structure

```
api/src/
  index.ts           # Server entry, CORS, WebSocket upgrade
  router.ts          # Custom HTTP router
  routes/            # Feature-based route handlers (exercises, workouts, meals, bodylog, programs, settings)
  db/schema.ts       # Drizzle ORM schema (source of truth for DB structure)
  db/index.ts        # DB connection (SQLite WAL mode)
  middleware/auth.ts  # Auth stub (hardcoded "default" user, TODO: better-auth)
  ws/index.ts        # WebSocket broadcast system

web/src/
  pages/Dashboard.vue  # Main UI — imports all feature panels
  components/          # Grouped by feature: workout/, meals/, body/, planner/, shared/, ui/
  stores/              # Pinia stores mirror API features (workouts, meals, bodylog, programs, settings)
  composables/         # useApi.ts (fetch wrapper), useWebSocket.ts
  lib/                 # Utilities

shared/
  types.ts           # All API contracts, shared TypeScript interfaces
```

## Architecture & Conventions

### API
- RESTful: `GET/POST /api/{feature}`, `GET/PUT/DELETE /api/{feature}/:id`
- Query params for filtering: `?date=YYYY-MM-DD`
- Each feature has a `registerXxxRoutes(router)` function in its own file
- Zod `safeParse()` on all POST/PUT bodies; return 400 with error details on failure
- Responses use `ApiResponse<T>` wrapper (`{ data }` or `{ error }`)
- WebSocket broadcasts `WSEvent` types (defined in shared) for real-time sync

### Frontend
- Vue 3 Composition API with `<script setup>` — no Options API
- Pinia stores handle CRUD + state; composables for cross-cutting concerns
- `useApi()` composable wraps fetch; Vite proxies `/api` and `/ws` to localhost:3001
- Tailwind utility classes only — no scoped/component CSS
- Radix Vue for accessible headless UI primitives
- date-fns for date formatting

### Database
- Drizzle ORM with SQLite; schema in `api/src/db/schema.ts`
- All tables have `userId` and `createdAt` columns
- After schema changes: `bun run db:generate` then `bun run db:migrate`

### TypeScript
- Strict mode enabled (`noUnusedLocals`, `noUnusedParameters`)
- Path aliases: `@/*` → `web/src/*`, `shared` → shared package
- All API contracts defined in `shared/types.ts` — keep API and frontend in sync

## Git
- Use `git add .` when staging, unless told otherwise.
- "commit this" = `git add . && git commit` with a short message. No need to check status/diff/log first.

## Development Workflow

- The user runs `bun run dev` themselves — do NOT start or restart dev servers.
- Both API (Bun `--hot`) and frontend (Vite HMR) hot-reload on file changes, so edits take effect immediately.
- Auto-seed: On API startup, if the DB is empty, test data is seeded automatically (`api/src/seed.ts`).

## Code Style

- Feature-based file organization (not layer-based)
- Explicit returns from Pinia store setup functions
- Try-catch in async route handlers; log errors to console
- HTTP status codes: 200 OK, 201 Created, 400 Bad Request, 404 Not Found, 500 Internal Error
