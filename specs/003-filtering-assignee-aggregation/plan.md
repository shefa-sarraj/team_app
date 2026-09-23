# Implementation Plan: Filtering, Assignee Aggregation & Frontend Rewiring

**Branch**: `003-filtering-assignee-aggregation` | **Date**: 2026-09-24 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/003-filtering-assignee-aggregation/spec.md`

## Summary

Extend `GET /api/tasks` to accept optional `priority`/`assignee` query parameters (server-side
filtering, no pagination/sort), add a new `GET /api/tasks/assignees` endpoint returning the
distinct, unfiltered list of assignee names, and rewire the frontend so `App.jsx`'s inline
`visibleTasks`/`assigneeOptions` client-side computations are replaced by calls to
`taskService.listTasks({priority, assignee})` and `taskService.listAssignees()`. This is
`specs/plan.md` §6 row 3, building directly on Phase 2's completed Task CRUD backend and
`useTasks`/`taskService` frontend (`specs/002-task-crud-frontend/`, status `done`).

## Technical Context

**Language/Version**: Backend: Node.js (LTS), CommonJS — matching the existing
`backend/src/*.js` files. Frontend: JavaScript (ES modules), React 19 — matching the existing
untouched Vite setup.

**Primary Dependencies**: No new dependencies. Reuses Phase 2's `express`, `@prisma/client`,
`zod` (for the new query-parameter validation schema), and the existing `ApiResponse`/
`ApiError`/`errorHandler`/`validate` infrastructure. Frontend continues using the native
`fetch` API already in place.

**Storage**: PostgreSQL on Neon, via the existing `Task` model (`backend/src/config/db.js`,
`prisma/schema.prisma`) — no schema change; this phase adds two new *read* query shapes
(a `where`-filtered list, and a `distinct` aggregation) over the same table.

**Testing**: Manual verification via Postman/curl for the 2 endpoints (extended list + new
assignees), plus a manual in-browser walkthrough of filter/clear-filter behavior — continuing
Phase 1/2's decision that no automated test framework is introduced in this migration.

**Target Platform**: Same as Phases 1-2 — local Node.js server connecting to Neon; React app
served by the existing Vite dev server.

**Project Type**: Web application — existing frontend (`src/`) rewired in place; existing
backend (`backend/`) extended with two new read behaviors on the existing `tasks` resource.

**Performance Goals**: N/A — no load/throughput target in the spec; the dataset is expected to
stay small (per `specs/plan.md` §5, resolved Ambiguity #4), so a full-table filtered query and
a full-table distinct query are both adequate without indexing work.

**Constraints**: Every endpoint MUST keep using the unified response envelope and centralized
error handling (Constitution Principle I); no sorting/pagination query parameters are
introduced (Constitution Principle III, spec FR-007); `assignee` stays a plain string, never a
relation (Constitution Principle III, spec FR-010).

**Scale/Scope**: 1 extended endpoint (`GET /api/tasks` gains 2 optional query params), 1 new
endpoint (`GET /api/tasks/assignees`); 1 modified frontend service file, 1 modified frontend
hook, 1 modified frontend component (`App.jsx`); `FilterBar.jsx` needs no structural change
(per `specs/plan.md` §6 row 3 — it already just renders whatever `assigneeOptions` it's given).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Check | Result |
|---|---|---|
| I. Unified API Contract (NON-NEGOTIABLE) | Both endpoints reuse the existing `ApiResponse`/`ApiError`/`errorHandler` unchanged; the existing `route → controller → service → model` chain is extended, not bypassed; a new Zod schema validates query params before the controller runs, per plan.md §4.1. | PASS |
| II. Living Plan Document | No new flaw or scope change discovered while writing this plan — `specs/plan.md` §6 row 3 already fully describes this phase's scope; one implementation-time design decision (refetch-after-mutation, see research.md) is a code-level detail, not a scope/requirement change, so it does not require a `specs/plan.md` update. | PASS (no update needed) |
| III. Scope Discipline (YAGNI) | No pagination/sort query params, no auth, no new tables/indexes beyond what a `WHERE`/`DISTINCT` query on the existing small table needs. `assignee` stays a plain string. | PASS |
| IV. Schema-First Data Integrity | No schema change — `prisma/schema.prisma`'s existing `Task` model and enums are the only source of truth used by both new read queries. | PASS |
| V. Frontend-Backend Parity Per Phase | Both new/extended endpoints are paired with their frontend consumers (`App.jsx`'s filter wiring, `FilterBar.jsx`'s existing props) in this same phase — no endpoint ships without a caller. | PASS |

No violations — the Complexity Tracking table below is not needed.

## Project Structure

### Documentation (this feature)

```text
specs/003-filtering-assignee-aggregation/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
backend/                            # EXISTING (Phases 1-2) — extended, not restructured
├── prisma/schema.prisma             # UNCHANGED — no new model/enum needed
├── src/
│   ├── validations/
│   │   └── task.validation.js       # MODIFIED: adds `listTasksQuerySchema` (optional
│   │                                 # `priority`/`assignee`, unknown keys stripped so
│   │                                 # accidental page/limit/sort params are harmlessly
│   │                                 # ignored, never rejected or acted on)
│   ├── services/
│   │   └── task.service.js          # MODIFIED: `listTasks(filters)` adds a Prisma `where`
│   │                                 # clause built from `{priority, assignee}`; new
│   │                                 # `listAssignees()` runs a `distinct: ['assignee']` query
│   ├── controllers/
│   │   └── task.controller.js       # MODIFIED: `listTasks` reads `req.query` (already
│   │                                 # validated) and passes it through; new `listAssignees`
│   │                                 # handler
│   └── routes/
│       └── task.routes.js           # MODIFIED: adds `GET /assignees`, registered BEFORE
│                                     # `GET /:id` so Express doesn't match "assignees" as
│                                     # an `:id` value; `GET /` gains the query-validation
│                                     # middleware

src/                                 # EXISTING frontend (React 19 + Vite)
├── services/
│   └── taskService.js               # MODIFIED: `listTasks` accepts an optional
│                                     # `{priority, assignee}` filter object and appends it as
│                                     # a query string; new `listAssignees()` function
├── hooks/
│   └── useTasks.js                  # MODIFIED: accepts `filters` as a parameter; the load
│                                     # effect re-runs on filter change; adds a separate,
│                                     # filter-independent `assignees` list + its own load
│                                     # effect; every successful create/update/delete/move
│                                     # now re-fetches the current filtered list afterward
│                                     # instead of locally patching `tasks` (see research.md)
├── App.jsx                          # MODIFIED: passes `filters` into `useTasks(filters)`;
│                                     # removes the `visibleTasks`/`assigneeOptions` useMemo
│                                     # blocks (server now does both); passes the hook's
│                                     # `tasks`/`assignees` straight through to `Board`
└── components/
    └── filters/
        └── FilterBar.jsx             # UNCHANGED — already a pure prop-driven component
```

**Structure Decision**: Extends Phases 1-2's layered `backend/src/` structure with no new
folders — this phase adds two read code paths to the existing `task.*` files rather than new
modules, since it operates on the same `Task` resource. Frontend changes stay inside the
existing `src/` tree; `FilterBar.jsx` is explicitly unchanged per `specs/plan.md` §6 row 3.

## Complexity Tracking

*No violations — table not applicable.*
