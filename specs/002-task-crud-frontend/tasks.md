---
description: "Task list for Task CRUD + Frontend Rewiring"
---

# Tasks: Task CRUD + Frontend Rewiring

**Input**: Design documents from `/specs/002-task-crud-frontend/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/tasks.md,
quickstart.md

**Tests**: Not included — `research.md` ("No automated test framework introduced in this
phase") continues Phase 1's decision that this migration's completion criteria are manual
Postman/curl + manual UI verification via `quickstart.md`; neither the spec nor the plan
requests TDD. Adding a test suite now would violate Constitution Principle III (Scope
Discipline).

**Organization**: Tasks are grouped by the 6 user stories in `spec.md`, in priority order
(US1/US2 = P1, US3/US4/US5 = P2, US6 = P3).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1-US6)
- File paths are relative to the repository root

## Path Conventions

Extends Phase 1's web app layout per `plan.md`'s Structure Decision: `backend/` (existing) and
the repository-root `src/` frontend (existing) — no new top-level directories.

---

## Phase 1: Setup

**Purpose**: The one new dependency this phase needs

- [x] T001 Add `zod` (`^3.x`) to `backend/package.json` dependencies and run `npm install`
      inside `backend/` — per `research.md`'s flagged open item, **this is a new dependency and
      MUST NOT be installed without the user's explicit go-ahead at implementation time**, even
      though it is already part of the approved plan

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The `Task` model, its 5 endpoints, and the shared frontend plumbing every user
story below depends on

**⚠️ CRITICAL**: No user-story work can begin until this phase is complete

- [x] T002 Add to `backend/prisma/schema.prisma` (per `data-model.md`): `enum Priority { low
      medium high }`; `enum Status { todo IN_PROGRESS @map("in-progress") done }`; and the
      `Task` model — `id String @id @default(uuid())`, `title String`,
      `description String @default("")`, `assignee String`, `priority Priority @default(medium)`,
      `dueDate String @default("") @db.Text`, `status Status @default(todo)`,
      `createdAt DateTime @default(now())`, `updatedAt DateTime @updatedAt` — no relations
- [x] T003 Run `npx prisma migrate dev --name add_task_model` inside `backend/` to create and
      apply the migration adding the `Task` table and its enums (depends on: T002)
- [x] T004 [P] Create `backend/src/validations/task.validation.js`: a Zod `createTaskSchema`
      requiring `title` and `assignee` as strings, non-empty after `.trim()` (spec FR-002,
      FR-003); optional `description`/`dueDate` strings that accept `''` and are never rejected
      for being blank (spec FR-004); optional `priority` restricted to `low|medium|high`;
      optional `status` restricted to `todo|in-progress|done`; and an `updateTaskSchema` where
      every one of those fields is optional, but `title`/`assignee` still enforce non-empty-
      after-trim when present (depends on: T001)
- [x] T005 [P] Create `backend/src/middlewares/validate.js`: a middleware factory
      `validate(schema)` that parses `req.body` against the given Zod schema, calls
      `next(new ApiError(400, <first validation issue's message>))` on failure, otherwise
      overwrites `req.body` with the parsed data and calls `next()` (depends on: T001)
- [x] T006 Create `backend/src/services/task.service.js`: `listTasks()`, `getTaskById(id)`,
      `createTask(data)`, `updateTask(id, data)`, `deleteTask(id)`, each using the Prisma
      client from `backend/src/config/db.js`; `getTaskById`, `updateTask`, and `deleteTask`
      throw `new ApiError(404, "Task not found")` when Prisma reports no matching row
      (contracts/tasks.md's not-found responses) (depends on: T002, T003)
- [x] T007 Create `backend/src/controllers/task.controller.js`: thin handlers (`listTasks`,
      `getTask`, `createTask`, `updateTask`, `deleteTask`) that each call the matching
      `task.service.js` function and respond via `backend/src/utils/ApiResponse.js`'s
      `success()` helper with the status code from `contracts/tasks.md` (200 list/get/update,
      201 create, 200 with `{ id }` on delete) — no business logic in this file (Constitution
      Principle I) (depends on: T006)
- [x] T008 Create `backend/src/routes/task.routes.js`: `GET /`, `GET /:id`,
      `POST /` (with `validate(createTaskSchema)`), `PUT /:id`
      (with `validate(updateTaskSchema)`), `DELETE /:id`, wired to `task.controller.js`
      (depends on: T004, T005, T007)
- [x] T009 Mount `task.routes.js` into `backend/src/app.js` under the `/api` prefix, alongside
      the existing health router and before the `notFound` middleware (depends on: T008)
- [x] T010 [P] Create `src/services/taskService.js`: `listTasks()`, `createTask(values)`,
      `updateTask(id, changes)`, `deleteTask(id)`, each calling the matching endpoint from
      `specs/002-task-crud-frontend/contracts/tasks.md` via `fetch`, parsing the JSON envelope,
      and throwing `new Error(body.message)` when `body.success` is `false` or the response is
      not `ok`
- [x] T011 [P] Create `src/components/common/Toast.jsx`: renders a list of dismissable
      notifications from props `errors` (`{ id, message }[]`) and `onDismiss` (`(id) => void`),
      each auto-dismissing after a few seconds, styled consistently with the existing Tailwind
      conventions in `src/components/common/Modal.jsx`
- [x] T012 Modify `src/hooks/useTasks.js`: add an `errors` array state (`{ id, message }[]`,
      appended to — never replacing an earlier unread entry, per spec Edge Cases) and a
      `dismissError(id)` function removing one entry by id; return both alongside the existing
      `tasks`/`isLoading` (depends on: T010)
- [x] T013 Modify `src/App.jsx`: render `<Toast errors={errors} onDismiss={dismissError} />`
      using the values now returned by `useTasks()` (depends on: T011, T012)

**Checkpoint**: Foundation ready — every user story below can now be implemented.

---

## Phase 3: User Story 1 - See Tasks That Persist Across a Refresh (Priority: P1) 🎯 MVP

**Goal**: The board loads its real, saved task list from the backend on open/refresh, per
`contracts/tasks.md`'s `GET /api/tasks`.

**Independent Test**: Open the app and confirm the board shows the current saved set of tasks;
refresh and confirm the same tasks reappear unchanged — no create/edit/delete/move required.

### Implementation for User Story 1

- [x] T014 [US1] Modify `src/hooks/useTasks.js`: replace the `useEffect` that sets `mockTasks`
      with an async call to `taskService.listTasks()`; keep `isLoading` true until it settles;
      on failure, push a "Failed to load tasks" entry to `errors` instead of leaving the board
      silently empty (spec FR-001, FR-012) (depends on: T010, T012)
- [x] T015 [US1] Delete `src/data/mockData.js` and confirm no remaining file imports it
      (depends on: T014)

**Checkpoint**: User Story 1 is independently testable — the board is now backed by real,
persisted data.

---

## Phase 4: User Story 2 - Add a New Task That Sticks Around (Priority: P1)

**Goal**: A new task submitted through the existing form is permanently saved via
`POST /api/tasks`.

**Independent Test**: Submit the task form with valid details; confirm the task appears
immediately and remains after a refresh.

### Implementation for User Story 2

- [x] T016 [US2] Modify `src/hooks/useTasks.js`: make `addTask(values)` async — call
      `taskService.createTask(values)` and prepend the server-returned task (real `id`,
      `createdAt`, `updatedAt`) to `tasks` on success; on failure, push a "Failed to add task"
      entry to `errors` and leave `tasks` unchanged (spec FR-002, FR-003, FR-004, User Story 2
      Acceptance Scenario 3) (depends on: T014)

**Checkpoint**: User Story 2 is independently testable.

---

## Phase 5: User Story 3 - Edit an Existing Task's Details (Priority: P2)

**Goal**: Editing an existing task's fields permanently saves the change via
`PUT /api/tasks/:id`.

**Independent Test**: Edit an existing task's details and save; confirm the board reflects the
change immediately and after a refresh.

### Implementation for User Story 3

- [x] T017 [US3] Modify `src/hooks/useTasks.js`: make `updateTask(id, changes)` async — call
      `taskService.updateTask(id, changes)` and replace the matching task in `tasks` with the
      server-returned task on success; on failure, push a "Failed to update task" entry to
      `errors` and leave the task's stored fields unchanged (spec FR-005, User Story 3
      Acceptance Scenario 3) (depends on: T014)

**Checkpoint**: User Story 3 is independently testable.

---

## Phase 6: User Story 4 - Move a Task Between Columns by Dragging (Priority: P2)

**Goal**: Dragging a task to a different column permanently saves its new status, reusing the
same `PUT /api/tasks/:id` call as a full edit (per `research.md`).

**Independent Test**: Drag an existing task card to a different column; confirm it stays there
after a refresh; drop a card back on its own column and confirm nothing changes.

### Implementation for User Story 4

- [x] T018 [US4] Modify `src/hooks/useTasks.js`: make `moveTask(id, nextStatus)` call the same
      `updateTask(id, { status: nextStatus })` path from T017, but only when `nextStatus`
      differs from the task's current status — a dropped-on-its-own-column move MUST make no
      network call and no state change (spec FR-006, FR-007) (depends on: T017)

**Checkpoint**: User Story 4 is independently testable.

---

## Phase 7: User Story 5 - Delete a Task With Confirmation (Priority: P2)

**Goal**: Confirmed deletion permanently removes a task via `DELETE /api/tasks/:id`.

**Independent Test**: Delete an existing task through the existing confirmation flow; confirm
it no longer appears, including after a refresh.

### Implementation for User Story 5

- [x] T019 [US5] Modify `src/hooks/useTasks.js`: make `deleteTask(id)` async — call
      `taskService.deleteTask(id)` and remove the task from `tasks` only on success; on
      failure, push a "Failed to delete task" entry to `errors` and leave the task visible
      (spec FR-008, FR-009, User Story 5 Acceptance Scenario 3) (depends on: T014)

**Checkpoint**: User Story 5 is independently testable.

---

## Phase 8: User Story 6 - Be Notified When an Action Fails (Priority: P3)

**Goal**: Every add/edit/move/delete failure is clearly and independently surfaced, per spec
Edge Cases and Acceptance Scenarios 1-3.

**Independent Test**: Force any single save operation to fail (e.g., stop the backend) and
confirm a visible, dismissable notification appears and clears without blocking the board.

### Implementation for User Story 6

- [x] T020 [US6] Verify — and adjust `src/components/common/Toast.jsx` or the `errors` queue in
      `src/hooks/useTasks.js` if needed — that concurrent failures each get their own entry (no
      overwriting an earlier unread one), each is independently dismissable, and each
      auto-clears without blocking board interaction (depends on: T011, T012, T016, T017, T018,
      T019)

**Checkpoint**: All 6 user stories are independently functional together.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Wrap-up tasks that don't belong to Setup, Foundational, or any single user story

- [x] T021 Execute every scenario in `quickstart.md` (all 10 endpoint-level checks + all 7
      running-app checks) and confirm each matches its expected response/behavior exactly —
      this feature's completion criterion (`specs/plan.md` §6 row 2)
- [x] T022 Per Constitution Principle II (Living Plan Document): once T021 passes, update
      `specs/plan.md` §6 row 2's Status column from `planned` to `done` and add a new Change
      Log entry recording Phase 2's completion

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately (pending the user's explicit
  approval to install `zod`).
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS every user story.
- **User Stories (Phase 3-8)**: All depend on Foundational phase completion. US1 must land
  before US2-US6 (they all build on `useTasks.js`'s real-data load from T014). US4 depends on
  US3's `updateTask` (T017). US2, US3, US5 are otherwise independent of each other. US6 is a
  verification pass over all the others.
- **Polish (Phase 9)**: Depends on all 6 user stories being complete.

### Within Phase 2 (Foundational)

- T002 → T003 → T006 → T007 → T008 → T009 (backend chain).
- T004, T005 depend only on T001 (zod installed) and can run in parallel with each other and
  with T002/T003.
- T010, T011 have no dependencies on each other or on the backend chain and can run in
  parallel.
- T012 depends on T010. T013 depends on T011, T012.

### Parallel Opportunities

- T004 and T005 (Foundational) — different files, both only need `zod` installed.
- T010 and T011 (Foundational) — different files (frontend service vs. UI component).
- Once Foundational (Phase 2) is complete, US2, US3, and US5 (T016, T017, T019) touch the same
  file (`useTasks.js`) and so should be done sequentially, not in parallel, despite being
  logically independent stories.

---

## Parallel Example: Phase 2 (Foundational)

```bash
# Launch these together once T001 (zod) is approved and installed:
Task: "Create backend/src/validations/task.validation.js with Zod create/update schemas"
Task: "Create backend/src/middlewares/validate.js validation middleware factory"

# Launch these together — independent of the backend chain above:
Task: "Create src/services/taskService.js with fetch-based CRUD calls"
Task: "Create src/components/common/Toast.jsx notification component"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (confirm `zod` install with the user, then install it)
2. Complete Phase 2: Foundational (CRITICAL — blocks every story)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: confirm the board loads and persists real data across a refresh

### Incremental Delivery

1. Setup + Foundational → backend fully live for all 5 endpoints, frontend plumbing ready
2. Add User Story 1 → validate → board shows real, persisted data (MVP)
3. Add User Story 2 → validate → create works and persists
4. Add User Story 3 → validate → edit works and persists
5. Add User Story 4 → validate → drag-and-drop move works and persists
6. Add User Story 5 → validate → delete works and persists
7. Add User Story 6 → validate → every failure path is clearly, independently notified
8. Complete Phase 9 (Polish): run `quickstart.md` end-to-end, update `specs/plan.md` §6 row 2

## Notes

- Every user-story task after T015 modifies the same file (`src/hooks/useTasks.js`) — this is
  expected for a single-hook-owns-all-state architecture (matching the existing codebase
  convention documented in that file's own header comment) and means Phase 3-8 tasks run
  sequentially in practice, not in parallel, regardless of the `[P]` marker's absence there.
- Commit after each task or logical group.
- This feature touches no `backend/src/config/*` or `backend/src/middlewares/{errorHandler,
  notFound}.js` files from Phase 1 — those are reused exactly as built.
