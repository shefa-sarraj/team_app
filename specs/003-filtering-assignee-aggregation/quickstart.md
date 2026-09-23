# Quickstart: Filtering, Assignee Aggregation & Frontend Rewiring

Validates this feature end-to-end against the acceptance scenarios in [spec.md](spec.md) and
the contract in [contracts/tasks-filtering.md](contracts/tasks-filtering.md). Assumes Phase 2
(`specs/002-task-crud-frontend/`) is already done — the backend serves full Task CRUD and the
frontend already calls it.

## Prerequisites

- Phase 2 complete: `backend/` serves `GET/POST/PUT/DELETE /api/tasks[/:id]`, and the frontend
  board already reads/writes real tasks.
- A few tasks with a mix of `priority` and `assignee` values exist (create some via the app or
  `POST /api/tasks` if the board is currently empty).

## Setup

No new setup — no schema change, no new dependency. Start both servers as before:

```bash
cd backend && npm run dev
```

```bash
npm run dev
```

## Validate — endpoint-level (Postman/curl)

1. `GET /api/tasks?priority=high` → expect `200` with only `high`-priority tasks.
2. `GET /api/tasks?assignee=<a real name>` → expect `200` with only that assignee's tasks.
3. `GET /api/tasks?priority=high&assignee=<a real name>` → expect `200` with only tasks
   matching **both** (spec FR-001, Acceptance Scenario 3).
4. `GET /api/tasks?priority=medium&assignee=<a name with no medium tasks>` → expect `200` with
   `"data": []` — not an error (spec FR-003).
5. `GET /api/tasks?priority=bogus` → expect `400` with a clear validation message.
6. `GET /api/tasks?page=2&limit=10&sort=title` → expect `200` with the full unfiltered list,
   confirming these params have no effect (spec FR-007, this feature's completion criterion).
7. `GET /api/tasks` (no params) → expect `200` with every task, unchanged from Phase 2.
8. `GET /api/tasks/assignees` → expect `200` with the alphabetical, duplicate-free list of every
   assignee across all tasks.
9. `GET /api/tasks/assignees` while a `priority`/`assignee` filter would hide some tasks →
   confirm the assignee list is unaffected — it always reflects every task, filtered or not
   (spec User Story 2, Acceptance Scenario 2).

## Validate — running app (manual UI walkthrough)

With both `npm run dev` processes running:

1. **Priority filter** (User Story 1): select a priority in the filter bar; confirm only
   matching tasks show. Select "All"; confirm every task reappears.
2. **Assignee filter** (User Story 1): select an assignee; confirm only their tasks show.
3. **Combined filter** (User Story 1, Acceptance Scenario 3): select both a priority and an
   assignee where the combination matches nothing; confirm the board clearly shows "no tasks"
   rather than an error or the full list.
4. **Assignee list stays complete** (User Story 2): apply a priority filter that hides every
   task belonging to one assignee; open the assignee dropdown; confirm that assignee's name is
   still listed as a choice.
5. **New assignee appears** (User Story 2, Acceptance Scenario 3): add a task with a brand-new
   assignee name; refresh the board; confirm that name now appears in the assignee filter.
6. **Clear filters** (User Story 3): apply any filter, then clear it; confirm every task
   reappears, identical to the board's state before filtering.
7. **Mutation respects the active filter**: with a priority filter active, edit a visible task
   so its priority no longer matches the filter; confirm it disappears from view (per
   `research.md`'s refetch-after-mutation decision) rather than incorrectly staying visible.
8. **Failure notification** (spec FR-008): stop the backend, change the filter selection;
   confirm the same kind of failure toast introduced in Phase 2 appears, rather than a silently
   stale or blank board. Restart the backend and confirm normal operation resumes.

## Done

All 9 endpoint-level checks and all 8 running-app checks passing is this feature's completion
criterion (`specs/plan.md` §6 row 3, both completion criteria).
