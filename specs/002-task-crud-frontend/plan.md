# Implementation Plan: Task CRUD + Frontend Rewiring

**Branch**: `002-task-crud-frontend` | **Date**: 2026-09-23 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/002-task-crud-frontend/spec.md`

## Summary

Add the `Task` Prisma model and its 5 CRUD/status-move endpoints to the existing Express
backend (from Phase 1), validated with Zod ahead of the service layer, and rewire the existing
frontend (`useTasks.js`, `App.jsx`, `BoardColumn.jsx`) to call a new `taskService.js` over the
real API instead of importing `src/data/mockData.js` — including a new `error` state surfaced
through a new `Toast.jsx` component whenever a create/update/delete/move call fails. This is
`specs/plan.md` §6 row 2, building directly on Phase 1's completed Express+Prisma+Neon
foundation (`specs/001-backend-foundation/`, status `done`).

## Technical Context

**Language/Version**: Backend: Node.js (LTS), CommonJS — matching Phase 1's existing
`backend/src/*.js` files. Frontend: JavaScript (ES modules), React 19 — matching the existing
untouched Vite setup.

**Primary Dependencies**: Backend — reuses Phase 1's `express`, `@prisma/client`/`prisma`
(pinned `^6.19.3`, per `specs/plan.md` §8 Change Log #2), `cors`, `dotenv`; adds **Zod** (new
dependency, not yet installed — required by Constitution "Technology Stack Constraints" and
`specs/plan.md` §4, but must not be installed without the user's explicit go-ahead, per the
user's standing "ask before installing anything" preference). Frontend — no new dependency:
the native `fetch` API (already available in the existing Vite/React 19 setup) is sufficient
for `taskService.js`; no HTTP client library is added.

**Storage**: PostgreSQL on Neon, via the same Prisma connection Phase 1 already established
(`backend/src/config/db.js`); this phase adds the first real model (`Task`) and its first real
migration to the previously model-less `prisma/schema.prisma`.

**Testing**: Manual verification via Postman/curl for the 5 endpoints, plus a manual
in-browser walkthrough of add/edit/delete/drag-move/failure-toast — continuing Phase 1's
decision (`research.md`) that no automated test framework is introduced in this migration.

**Target Platform**: Same as Phase 1 — local Node.js server connecting to Neon; React app
served by the existing Vite dev server.

**Project Type**: Web application — existing frontend (`src/`) rewired in place; existing
backend (`backend/`) extended with a new resource.

**Performance Goals**: N/A — no load/throughput target in the spec; the only measurable
behaviors are correctness of persistence and correctness/visibility of failure notifications
(SC-001–SC-005).

**Constraints**: Every endpoint MUST use the unified response envelope and centralized error
handling already built in Phase 1 (Constitution Principle I); blank `description`/`dueDate`
MUST be stored as literal `''`, never `null` (Constitution Principle IV, spec FR-004); no
auth, no pagination/sort/filter query params, no `assignee` relation (Constitution Principle
III, spec FR-014–FR-016).

**Scale/Scope**: 5 endpoints (`GET /api/tasks`, `GET /api/tasks/:id`, `POST /api/tasks`,
`PUT /api/tasks/:id`, `DELETE /api/tasks/:id`); one new Prisma model with 2 enums; 3 modified
frontend files + 2 new frontend files.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Check | Result |
|---|---|---|
| I. Unified API Contract (NON-NEGOTIABLE) | All 5 endpoints reuse Phase 1's `ApiResponse`/`ApiError`/`errorHandler`/`notFound` unchanged; a real `route → controller → service → model` chain is introduced now (Phase 1 had no service layer since there was no business logic yet); Zod validation runs as middleware before controllers, per plan.md §4.1. | PASS |
| II. Living Plan Document | No new flaw or scope change discovered while writing this plan — `specs/plan.md` §6 row 2 already fully describes this phase's scope; nothing to write back yet (implementation-time deviations, if any, will be logged per Principle II when they occur). | PASS (no update needed) |
| III. Scope Discipline (YAGNI) | No filtering/sort/pagination query params (Phase 3's job), no auth, no `assignee` relation — `assignee` stays a plain required string field on `Task`. | PASS |
| IV. Schema-First Data Integrity | `Task` model and its `Priority`/`Status` enums are added to `prisma/schema.prisma` as the single source of truth; `IN_PROGRESS @map("in-progress")` preserves the frontend's exact wire value; blank `description`/`dueDate` persist as literal `''` (both remain `TEXT`, never `null`/`DATE`). | PASS |
| V. Frontend-Backend Parity Per Phase | This phase is explicitly NOT the infra-only exception — it pairs all 5 backend endpoints with the matching frontend rewiring (`useTasks.js`, `App.jsx`, `BoardColumn.jsx`, new `Toast.jsx`) in the same phase, per spec User Stories 1-6. | PASS |

No violations — the Complexity Tracking table below is not needed.

## Project Structure

### Documentation (this feature)

```text
specs/002-task-crud-frontend/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
backend/                            # EXISTING (Phase 1) — extended, not restructured
├── prisma/
│   └── schema.prisma                # MODIFIED: adds `Task` model + `Priority`/`Status` enums
├── src/
│   ├── config/                      # UNCHANGED (db.js, env.js from Phase 1)
│   ├── routes/
│   │   ├── health.routes.js         # UNCHANGED
│   │   └── task.routes.js           # NEW: GET/POST /, GET/PUT/DELETE /:id
│   ├── controllers/
│   │   ├── health.controller.js     # UNCHANGED
│   │   └── task.controller.js       # NEW: translates request → service call → ApiResponse
│   ├── services/                    # NEW folder — first business logic in this migration
│   │   └── task.service.js          # NEW: all Prisma calls for Task (list/get/create/update/delete)
│   ├── validations/                 # NEW folder
│   │   └── task.validation.js       # NEW: Zod schemas for create/update
│   ├── middlewares/
│   │   ├── errorHandler.js          # UNCHANGED
│   │   ├── notFound.js              # UNCHANGED
│   │   └── validate.js              # NEW: generic "run this Zod schema, else 400" middleware
│   ├── utils/                       # UNCHANGED (ApiError.js, ApiResponse.js from Phase 1)
│   ├── app.js                       # MODIFIED: mounts task.routes.js under /api
│   └── server.js                    # UNCHANGED
└── package.json                     # MODIFIED: adds `zod` dependency (pending user approval)

src/                                 # EXISTING frontend (React 19 + Vite)
├── services/
│   └── taskService.js               # NEW: fetch() wrapper for the 5 endpoints, unwraps envelope
├── hooks/
│   └── useTasks.js                  # MODIFIED: calls taskService instead of mockData; adds `error` state
├── components/
│   ├── common/
│   │   └── Toast.jsx                 # NEW: renders the error state as a dismissable notification
│   └── board/
│       └── BoardColumn.jsx           # MODIFIED: drop handler's moveTask call is now async (service call)
├── App.jsx                           # MODIFIED: renders Toast, wires the new error state
└── data/
    └── mockData.js                   # REMOVED: no longer imported by any file after this phase
```

**Structure Decision**: Extends Phase 1's layered `backend/src/` structure exactly as
pre-declared in `specs/plan.md` §7 — adding the `services/` and `validations/` folders that
Phase 1 explicitly deferred ("no `services/` folder yet since there is no business logic to
hold in this phase"). Frontend changes stay inside the existing `src/` tree with no new
top-level directories; `mockData.js` is deleted once nothing imports it, per spec FR-001.

## Complexity Tracking

*No violations — table not applicable.*
