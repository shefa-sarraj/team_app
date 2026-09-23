---
description: "Task list for Filtering, Assignee Aggregation & Frontend Rewiring"
---

# Tasks: Filtering, Assignee Aggregation & Frontend Rewiring

**Input**: Design documents from `/specs/003-filtering-assignee-aggregation/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md,
contracts/tasks-filtering.md, quickstart.md

**Tests**: Not included — continuing Phases 1-2's decision that this migration's completion
criteria are manual Postman/curl + manual UI verification via `quickstart.md`; neither the spec
nor the plan requests TDD. Adding a test suite now would violate Constitution Principle III
(Scope Discipline).

**Organization**: Tasks are grouped by the 3 user stories in `spec.md`, in priority order
(US1 = P1, US2 = P2, US3 = P3). No Setup or Foundational phase is needed — this feature adds no
new dependency, schema, or shared infrastructure; every task extends an existing Phase 1/2 file.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1-US3)
- File paths are relative to the repository root

## Path Conventions

Extends Phases 1-2's web app layout: `backend/` and the repository-root `src/` frontend — no
new top-level directories, no new files except none (every change lands in an existing file).

---

## Phase 1: User Story 1 - Narrow the Board by Priority and/or Assignee (Priority: P1) 🎯 MVP

**Goal**: `GET /api/tasks` accepts optional `priority`/`assignee` query params (AND'd together
when both present), and the frontend filter bar drives real, server-side filtering.

**Independent Test**: Select a priority, an assignee, and both together in the filter bar;
confirm in each case only the matching tasks are shown, with no create/edit/delete/move needed.

### Implementation for User Story 1

- [x] T001 [US1] Add `listTasksQuerySchema` to `backend/src/validations/task.validation.js`:
      optional `priority` restricted to `low|medium|high`; optional `assignee` as any non-empty
      string; relies on Zod's default behavior of stripping unrecognized keys (no `.strict()`)
      so extra params like `page`/`limit`/`sort` are silently ignored, never rejected or acted
      on — per `research.md`
- [x] T002 [US1] Modify `backend/src/services/task.service.js`: change `listTasks()` to
      `listTasks(filters = {})`, building a Prisma `where` clause that includes `priority`
      and/or `assignee` only when present in `filters` (both together = SQL AND), keeping the
      existing `orderBy: { createdAt: 'desc' }` and `toWireStatus` mapping unchanged
- [x] T003 [US1] Modify `backend/src/controllers/task.controller.js`: the `listTasks` handler
      passes the now-validated `req.query` through to `taskService.listTasks(req.query)`
      (depends on: T002)
- [x] T004 [US1] Modify `backend/src/middlewares/validate.js`: generalize the `validate(schema)`
      factory to accept a second parameter, `target` (default `'body'`, or `'query'`), so the
      same factory can validate and replace `req.query` as well as `req.body` — every existing
      caller (create/update) keeps working unchanged by relying on the default
- [x] T005 [US1] Modify `backend/src/routes/task.routes.js`: apply
      `validate(listTasksQuerySchema, 'query')` to the existing `GET /` route (depends on: T001,
      T004)
- [x] T006 [US1] Modify `src/services/taskService.js`: `listTasks(filters = {})` builds a query
      string from `filters.priority`/`filters.assignee`, **omitting a key entirely** when its
      value is `'all'`, empty, or undefined (the backend's enum validation would reject the
      literal string `'all'`), and only appends `?...` to the request URL when at least one
      param remains
- [x] T007 [US1] Modify `src/hooks/useTasks.js`: accept a `filters` parameter
      (`{ priority, assignee }`); the task-loading effect now depends on
      `[filters.priority, filters.assignee]` and calls `taskService.listTasks(filters)` on
      mount **and** on every subsequent filter change, not just once (depends on: T006)
- [x] T008 [US1] Modify `src/hooks/useTasks.js`: change `addTask`/`updateTask`/`deleteTask` so
      that on success they **refetch** `taskService.listTasks(filters)` and replace `tasks` with
      the result, instead of locally patching the array as Phase 2 did — this keeps the
      displayed set always consistent with the active filter (per `research.md`'s
      refetch-after-mutation decision); `moveTask` needs no separate change since it already
      calls `updateTask` internally (depends on: T007)
- [x] T009 [US1] Modify `src/App.jsx`: pass `filters` into `useTasks(filters)`; remove the
      `visibleTasks` `useMemo` block entirely; pass the hook's `tasks` directly to `Board`
      where `visibleTasks` was used before (depends on: T007, T008)

**Checkpoint**: User Story 1 is independently testable — filtering is now real and
server-driven.

---

## Phase 2: User Story 2 - Choose From Every Real Assignee (Priority: P2)

**Goal**: A new `GET /api/tasks/assignees` endpoint returns the distinct, unfiltered list of
every assignee, and the frontend's assignee dropdown is driven by it instead of the
currently-loaded (and now possibly filtered) task list.

**Independent Test**: Apply a priority filter that hides every task belonging to one assignee;
confirm that assignee's name is still present and selectable in the assignee dropdown.

### Implementation for User Story 2

- [x] T010 [P] [US2] Modify `backend/src/services/task.service.js`: add `listAssignees()`
      running `prisma.task.findMany({ distinct: ['assignee'], select: { assignee: true },
      orderBy: { assignee: 'asc' } })`, mapped to a plain, duplicate-free, alphabetically
      sorted `string[]` — this query never applies the `priority`/`assignee` filter from User
      Story 1
- [x] T011 [US2] Modify `backend/src/controllers/task.controller.js`: add a `listAssignees`
      handler calling `taskService.listAssignees()` and responding `200` via `ApiResponse`'s
      `success()` helper (depends on: T010)
- [x] T012 [US2] Modify `backend/src/routes/task.routes.js`: add
      `router.get('/assignees', taskController.listAssignees)`, registered **before** the
      existing `router.get('/:id', ...)` line so Express does not capture "assignees" as an
      `:id` value — per `research.md`'s documented routing-order pitfall (depends on: T011;
      sequenced after T005 since both edit this file)
- [x] T013 [P] [US2] Modify `src/services/taskService.js`: add `listAssignees()` calling
      `GET ${API_BASE}/assignees` and unwrapping the envelope the same way every other function
      in this file does
- [x] T014 [US2] Modify `src/hooks/useTasks.js`: add an `assignees` array state with its own
      load effect calling `taskService.listAssignees()` once on mount, **independent of**
      `filters` (spec User Story 2); on failure, push `"Failed to load assignees"` to `errors`;
      re-run this same load after any successful `addTask`/`updateTask`/`deleteTask` so a
      new/changed assignee name becomes selectable (spec FR-005) (depends on: T013, T008)
- [x] T015 [US2] Modify `src/App.jsx`: remove the `assigneeOptions` `useMemo` block entirely;
      pass the hook's `assignees` directly to `Board`/`FilterBar` where `assigneeOptions` was
      used before (depends on: T014)

**Checkpoint**: User Story 2 is independently testable — the assignee list survives any active
filter.

---

## Phase 3: User Story 3 - Clear Filters and See Everything Again (Priority: P3)

**Goal**: The existing "Clear" control in `FilterBar.jsx` reliably returns to the full,
unfiltered task list now that filtering is server-driven.

**Independent Test**: Apply any filter, then clear it, and confirm every saved task reappears.

### Implementation for User Story 3

- [x] T016 [US3] Verify `src/components/filters/FilterBar.jsx`'s existing "Clear" button
      (`onChange({ priority: 'all', assignee: 'all' })`) correctly restores the full task list
      once T006's `'all'`-omission mapping is in place — no code change is expected in
      `FilterBar.jsx` itself (per `plan.md`'s "unchanged" structure decision); if clearing does
      not restore every task, fix the gap in `taskService.listTasks` (T006) or `useTasks.js`
      (T007) rather than adding new logic here (depends on: T007, T008, T009)

**Checkpoint**: All 3 user stories are independently functional together.

---

## Phase 4: Polish & Cross-Cutting Concerns

**Purpose**: Wrap-up tasks that don't belong to any single user story

- [x] T017 Execute every scenario in `quickstart.md` (all 9 endpoint-level checks + all 8
      running-app checks) and confirm each matches its expected response/behavior exactly —
      this feature's completion criterion (`specs/plan.md` §6 row 3)
- [x] T018 Per Constitution Principle II (Living Plan Document): once T017 passes, update
      `specs/plan.md` §6 row 3's Status column from `planned` to `done` and add a new Change
      Log entry recording Phase 3's completion

---

## Dependencies & Execution Order

### User Story Dependencies

- **User Story 1 (P1)**: No dependency on US2/US3 — independently testable once its own 9 tasks
  land.
- **User Story 2 (P2)**: Independent of US1's *filtering* logic, but T014 depends on T008 (both
  touch the same `useTasks.js` mutation functions) purely for file-conflict sequencing, not a
  logical dependency.
- **User Story 3 (P3)**: Purely a verification pass over US1's `'all'`-omission behavior (T006-
  T009) — cannot start until US1 is complete.
- **Polish (Phase 4)**: Depends on all 3 user stories being complete.

### Within User Story 1

- T001, T002 have no dependencies on each other and can run in parallel.
- T003 depends on T002. T004 has no dependencies. T005 depends on T001, T004.
- T006 has no dependencies. T007 depends on T006. T008 depends on T007. T009 depends on T007,
  T008.

### Within User Story 2

- T010 has no dependencies (can run in parallel with all of US1's backend tasks).
- T011 depends on T010. T012 depends on T011, and must be sequenced after T005 (same file,
  `task.routes.js`).
- T013 has no dependencies (can run in parallel with T010).
- T014 depends on T013, T008 (same file, `useTasks.js` — sequencing, not logic).
- T015 depends on T014.

### Parallel Opportunities

- T001 (validation schema) and T002 (service filtering) — different files.
- T004 (generalize `validate.js`) can run alongside T001/T002 — different file, no dependency.
- T010 (backend `listAssignees` service) and T013 (frontend `listAssignees` service) — can run
  in parallel with each other and with any of US1's backend tasks (T001-T005), since they touch
  different functions in shared files or entirely different files.
- `backend/src/routes/task.routes.js` (T005, T012) and `src/hooks/useTasks.js` (T007, T008,
  T014) each have two edits from different stories — do these sequentially, not in parallel,
  despite the stories being logically independent.

---

## Parallel Example: User Story 1 + User Story 2 backend work

```bash
# Launch these together — different files or different functions, no cross-dependencies:
Task: "Add listTasksQuerySchema to backend/src/validations/task.validation.js"
Task: "Add listAssignees() to backend/src/services/task.service.js"
Task: "Generalize backend/src/middlewares/validate.js to accept a query target"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: User Story 1 (T001-T009)
2. **STOP and VALIDATE**: filter by priority, by assignee, and by both; confirm results match

### Incremental Delivery

1. Add User Story 1 → validate → real, server-driven filtering (MVP)
2. Add User Story 2 → validate → assignee list survives any active filter
3. Add User Story 3 → validate → clearing filters reliably shows everything again
4. Complete Phase 4 (Polish): run `quickstart.md` end-to-end, update `specs/plan.md` §6 row 3

## Notes

- This feature touches no `prisma/schema.prisma`, no new npm dependency, and no
  `backend/src/config/*`/`backend/src/utils/*` file — every change extends existing Phase 1/2
  code paths on the same `Task` resource.
- Commit after each task or logical group.
- `backend/src/routes/task.routes.js` and `src/hooks/useTasks.js` each receive edits from more
  than one story — treat those files' tasks as a strict sequence, not parallel work, even
  across different `[Story]` labels.
