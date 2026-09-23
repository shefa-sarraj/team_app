---
description: "Task list for Backend Foundation & Project Setup"
---

# Tasks: Backend Foundation & Project Setup

**Input**: Design documents from `/specs/001-backend-foundation/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/health.md, quickstart.md

**Tests**: Not included — `research.md` ("No automated test framework introduced in this
phase") documents that this phase's completion criteria (`specs/plan.md` §6 row 1) are
manual Postman/curl verification via `quickstart.md`, and neither the spec nor the plan
requests TDD. Adding a test suite now would violate Constitution Principle III (Scope
Discipline).

**Organization**: This feature has a single user story (US1, P1), so Phase 3 below is the
only user-story phase.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1 only, in this feature)
- File paths are relative to the repository root

## Path Conventions

Web app layout per `plan.md`'s Structure Decision: new `backend/` directory at the
repository root, sibling to the existing untouched frontend.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Create the `backend/` directory tree per `plan.md`'s Project Structure:
      `backend/prisma/`, `backend/src/config/`, `backend/src/routes/`,
      `backend/src/controllers/`, `backend/src/middlewares/`, `backend/src/utils/`
- [x] T002 Initialize `backend/package.json` (Node.js project) and install dependencies:
      `express`, `@prisma/client`, `cors`, `dotenv` as dependencies; `prisma` as a dev
      dependency — per `plan.md` Technical Context ("Primary Dependencies")
- [x] T003 [P] Create `backend/.env.example` documenting the 4 required variables from
      `data-model.md`'s configuration table: `PORT`, `DATABASE_URL` (Neon connection string,
      `?sslmode=require`), `NODE_ENV`, `CLIENT_ORIGIN`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before the user story can be implemented

**⚠️ CRITICAL**: No user-story work can begin until this phase is complete

- [x] T004 Create `backend/prisma/schema.prisma` with only `datasource db` (provider
      `postgresql`, `url = env("DATABASE_URL")`) and `generator client` (`prisma-client-js`)
      — no model blocks yet, per `data-model.md` ("No domain entities in this phase")
- [x] T005 [P] Implement `backend/src/config/env.js`: load env vars via `dotenv`, and
      validate that `PORT`, `DATABASE_URL`, `NODE_ENV`, `CLIENT_ORIGIN` are all present and
      non-empty, throwing a clear, descriptive error if any is missing — per spec FR-004
      ("MUST fail to start... if required configuration... is missing or invalid")
- [x] T006 [P] Implement `backend/src/config/db.js`: instantiate and export a singleton
      `PrismaClient` connected via the schema created in T004
- [x] T007 [P] Implement `backend/src/utils/ApiResponse.js`: a helper producing exactly the
      two response shapes from `contracts/health.md` — success:
      `{ "success": true, "data": {...}, "message": null }` and failure:
      `{ "success": false, "data": null, "message": "<description>" }` — per spec FR-002
- [x] T008 [P] Implement `backend/src/utils/ApiError.js`: an error class carrying an HTTP
      status code and a message, for use by the centralized error middleware (T009)
- [x] T009 Implement `backend/src/middlewares/errorHandler.js`: a single centralized Express
      error-handling middleware that catches every unhandled error, maps `ApiError` instances
      (T008) to their status code, and always responds using the failure shape from
      `ApiResponse` (T007) — per spec FR-009 and the `500` fallback contract in
      `contracts/health.md` (depends on: T007, T008)
- [x] T010 [P] Implement `backend/src/middlewares/notFound.js`: catches any request to an
      undefined route and responds `404` using the failure shape from `ApiResponse` (T007),
      with message `"Route not found"` — per spec FR-008 and `contracts/health.md`'s "Fallback
      contract: unknown routes" (depends on: T007)
- [x] T011 Implement `backend/src/app.js`: create the Express app; register `cors`
      configured to allow only the exact `CLIENT_ORIGIN` from `env.js` (T005) and reject every
      other origin — per spec FR-005; mount routes (added in T015); mount `notFound` (T010)
      after all routes; mount `errorHandler` (T009) last (depends on: T005, T009, T010)
- [x] T012 Implement `backend/src/server.js`: import the validated config from `env.js`
      (T005) before anything else so a missing/invalid variable aborts startup immediately
      with a readable error (spec FR-004, SC-005); then start the Express app (T011) listening
      on `PORT` (depends on: T005, T011)

**Checkpoint**: Foundation ready — the single user story can now be implemented.

---

## Phase 3: User Story 1 - Verify the Backend Is Alive and Connected to Real Storage (Priority: P1) 🎯 MVP

**Goal**: Expose `GET /api/health`, returning the unified envelope and correctly reflecting
live database connectivity, per `contracts/health.md`.

**Independent Test**: Start the backend and request `GET /api/health` from an API client
(Postman/curl); it must report success with a reachable database and failure (never a false
"healthy") with an unreachable one — no other feature is required to demonstrate this.

### Implementation for User Story 1

- [x] T013 [US1] Implement `backend/src/controllers/health.controller.js`: on each request,
      run a lightweight query through the Prisma client (T006) to check the database is
      reachable **at request time** (not a cached startup result, per spec Edge Cases); on
      success respond `200` with `ApiResponse` success data `{ "status": "ok" }`; on failure
      respond `503` with `ApiResponse` failure message `"Database connection unavailable"` —
      exactly matching `contracts/health.md`'s `GET /api/health` contract (depends on: T006, T007)
- [x] T014 [US1] Implement `backend/src/routes/health.routes.js`: define
      `GET /api/health` wired to the controller from T013 (depends on: T013)
- [x] T015 [US1] Wire the health router (T014) into `backend/src/app.js` under the `/api`
      prefix, before the `notFound` middleware (T010) (depends on: T011, T014)

**Checkpoint**: User Story 1 is fully functional and independently testable — this is the
entire scope of this feature.

---

## Phase 4: Polish & Cross-Cutting Concerns

**Purpose**: Wrap-up tasks that don't belong to Setup, Foundational, or the single user story

- [x] T016 [P] Add `dev` and `start` scripts to `backend/package.json` (e.g. `node --watch
      src/server.js` for `dev`, `node src/server.js` for `start`)
- [x] T017 Execute every scenario in `quickstart.md` (healthy check, database-unreachable
      check, CORS allow/reject, unknown-route 404) and confirm each matches its expected
      response exactly — this is this feature's completion criterion
      (`specs/plan.md` §6 row 1, completion criterion 1)
- [x] T018 Per Constitution Principle II (Living Plan Document): once T017 passes, update
      `specs/plan.md` §6 row 1's Status column from `planned` to `done` and add a new
      Change Log entry recording Phase 1's completion

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS the user story.
- **User Story 1 (Phase 3)**: Depends on Foundational phase completion.
- **Polish (Phase 4)**: Depends on User Story 1 being complete.

### Within Phase 2 (Foundational)

- T004, T005, T006, T007, T008 have no dependencies on each other and can run in parallel.
- T009 depends on T007, T008. T010 depends on T007. T011 depends on T005, T009, T010.
- T012 depends on T005, T011.

### Within Phase 3 (User Story 1)

- T013 depends on T006, T007. T014 depends on T013. T015 depends on T011, T014.

### Parallel Opportunities

- T003 (Setup) can run alongside T001/T002 once the directory exists.
- T004, T005, T006, T007, T008 (Foundational) can all run in parallel — different files, no
  cross-dependencies.
- T010 can run in parallel with T009 (different files, both only depend on T007).

---

## Parallel Example: Phase 2 (Foundational)

```bash
# Launch these together — different files, no dependencies on each other:
Task: "Create backend/prisma/schema.prisma with datasource+generator only"
Task: "Implement backend/src/config/env.js with fail-fast validation"
Task: "Implement backend/src/config/db.js exporting a singleton PrismaClient"
Task: "Implement backend/src/utils/ApiResponse.js unified envelope helper"
Task: "Implement backend/src/utils/ApiError.js status+message error class"
```

---

## Implementation Strategy

### MVP = This Entire Feature

This feature has exactly one user story, so there is no incremental "MVP subset" — completing
Phases 1 through 4 in order **is** the MVP for Phase 1 of the overall migration
(`specs/plan.md` §6 row 1). Stop and validate (T017) before touching Phase 2 of the migration
(Task CRUD), per Constitution Principle V (Frontend-Backend Parity Per Phase / phase gating).

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks the user story)
3. Complete Phase 3: User Story 1
4. Complete Phase 4: Polish, including the mandatory `quickstart.md` validation and the
   `specs/plan.md` Status update (T018)
5. **STOP** — do not begin the migration's Phase 2 (Task CRUD) until this feature's tasks are
   all checked off and validated.

## Notes

- No `[P]` marker appears on any Phase 3 task — T013→T014→T015 are a strict chain (controller
  before route before wiring), matching the single-endpoint scope of this feature.
- Commit after each task or logical group.
- This feature intentionally has no Setup/Foundational overlap with the frontend — the
  existing `src/`, `index.html`, and `vite.config.js` are not touched by any task above, per
  Constitution Principle V's documented exception for this phase.
