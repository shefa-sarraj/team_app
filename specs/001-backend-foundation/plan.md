# Implementation Plan: Backend Foundation & Project Setup

**Branch**: `001-backend-foundation` | **Date**: 2026-09-16 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/001-backend-foundation/spec.md`

## Summary

Stand up a working Express server, connected to PostgreSQL (hosted on Neon) via Prisma,
that exposes one endpoint — `GET /api/health` — returning the project's unified response
envelope, with no Task model or business logic yet. This is the foundation every later
phase (Task CRUD in Phase 2, filtering in Phase 3) builds on, per `specs/plan.md` §6 row 1
and adhering to the unified API standards described in `specs/plan.md` §4.1.

## Technical Context

**Language/Version**: Node.js (LTS), JavaScript (CommonJS or ESM — decided at Phase 1
implementation time; no TypeScript, matching the existing plain-JS frontend)

**Primary Dependencies**: Express (HTTP server/routing), `@prisma/client` + `prisma` CLI
(database access/migrations), `cors` (CORS middleware), `dotenv` (env loading)

**Storage**: PostgreSQL, hosted on Neon (serverless Postgres), accessed exclusively through
Prisma per Constitution "Technology Stack Constraints"

**Testing**: Manual verification via Postman for this phase (per spec Success Criteria
SC-001–SC-005); no automated test framework is introduced in Phase 1 — `specs/plan.md` does
not call for one, and adding one now would be scope creep under Constitution Principle III
(Scope Discipline)

**Target Platform**: Local Node.js server (Linux/Windows dev machine), connecting outbound
to Neon's managed PostgreSQL over the internet (`sslmode=require`)

**Project Type**: Web application — existing frontend (React 19 + Vite, already at repo
root) + new backend service

**Performance Goals**: N/A for this phase — no load/throughput target exists in the spec;
the only measurable behavior is a single health check responding promptly and correctly
(SC-001, SC-003)

**Constraints**: Must fail fast and loudly on missing/invalid configuration (FR-004) rather
than starting in a broken state; must reject cross-origin requests from any origin other
than the configured `CLIENT_ORIGIN` (FR-005)

**Scale/Scope**: Single endpoint (`GET /api/health`), single environment per deployment
(local dev for this phase) — matches the "low complexity, single-resource" assessment in
`specs/plan.md` §1

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Check | Result |
|---|---|---|
| I. Unified API Contract (NON-NEGOTIABLE) | Health endpoint and the not-found fallback both use the two-shape response envelope; a centralized error middleware and a shared response helper are introduced now so every later phase reuses them instead of reinventing per-route formatting. | PASS |
| II. Living Plan Document | No new flaw or scope change was discovered while writing this plan — `specs/plan.md` §6 row 1 already fully describes this phase's scope; nothing to write back. | PASS (no update needed) |
| III. Scope Discipline (YAGNI) | No Task model, no auth, no automated test suite, no ORM beyond Prisma, no extra endpoints beyond `/api/health` are introduced. | PASS |
| IV. Schema-First Data Integrity | `prisma/schema.prisma` is created in this phase as the (currently model-less) source of truth, just to establish the Prisma↔Neon connection; the `Task` model itself is explicitly deferred to Phase 2 per `specs/plan.md` §6 row 2. | PASS |
| V. Frontend-Backend Parity Per Phase | This phase is the constitution's explicitly named exception (infra-only, no corresponding frontend behavior exists yet to verify) — no frontend file is touched in this phase. | PASS (documented exception) |

No violations — the Complexity Tracking table below is not needed.

## Project Structure

### Documentation (this feature)

```text
specs/001-backend-foundation/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
backend/                       # NEW in this phase
├── prisma/
│   └── schema.prisma           # datasource + generator only in this phase; no models yet
├── src/
│   ├── config/
│   │   ├── db.js                # initializes and exports the Prisma client
│   │   └── env.js                # loads/validates PORT, DATABASE_URL, NODE_ENV, CLIENT_ORIGIN
│   ├── routes/
│   │   └── health.routes.js
│   ├── controllers/
│   │   └── health.controller.js
│   ├── middlewares/
│   │   ├── errorHandler.js       # centralized error-handling middleware
│   │   └── notFound.js           # unified 404 fallback
│   ├── utils/
│   │   ├── ApiError.js
│   │   └── ApiResponse.js        # unified { success, data, message } envelope helper
│   ├── app.js                    # Express app: middleware, routes, error handlers wired up
│   └── server.js                 # boots the HTTP server, fails fast on bad config
├── .env.example
└── package.json

src/                            # EXISTING frontend (React 19 + Vite) — untouched this phase
index.html                      # EXISTING — untouched this phase
```

**Structure Decision**: Web application layout per `specs/plan.md` §7 — a new `backend/`
directory at the repository root, sibling to the existing frontend (`src/`, `index.html`,
`vite.config.js`), which remains completely untouched in this phase (Constitution Principle
V's documented exception: no frontend behavior exists yet to verify). Layered
`routes → controllers → (services in later phases) → prisma` inside `backend/src/`, matching
Constitution Principle I; no `services/` folder yet since there is no business logic to hold
in this phase — it is added starting Phase 2 when the `Task` service is introduced.

## Complexity Tracking

*No violations — table not applicable.*
