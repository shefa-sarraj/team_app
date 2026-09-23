# Quickstart: Task CRUD + Frontend Rewiring

Validates this feature end-to-end against the acceptance scenarios in [spec.md](spec.md) and
the contract in [contracts/tasks.md](contracts/tasks.md). Assumes Phase 1
(`specs/001-backend-foundation/`) is already done — the backend server boots and
`backend/.env` already has a working `DATABASE_URL`.

## Prerequisites

- Phase 1 complete: `backend/` runs and `GET /api/health` returns a healthy envelope.
- `zod` installed in `backend/package.json` (see `research.md` — requires explicit user
  approval before this phase's implementation, per the user's standing preference).

## Setup

```bash
cd backend
npx prisma migrate dev --name add_task_model
```

Expect: a new migration is created and applied, adding the `Task` table and the `Priority`/
`Status` enums (see [data-model.md](data-model.md)) to the previously model-less database.

```bash
npm run dev
```

## Validate — endpoint-level (Postman/curl)

1. **Create** (`POST /api/tasks`) with a valid body → expect `201` and the new task echoed
   back with a generated `id`, `createdAt`, `updatedAt` (contracts/tasks.md).
2. **Create** with `title` or `assignee` missing/blank → expect `400` with a clear message
   (spec FR-003).
3. **Create** with `description`/`dueDate` omitted → expect `201` with those fields stored as
   `""`, not `null` (spec FR-004).
4. **List** (`GET /api/tasks`) → expect `200` with an array including the task just created.
5. **Get one** (`GET /api/tasks/:id`) with the created id → expect `200` with that task; with a
   random/nonexistent id → expect `404` (contracts/tasks.md).
6. **Update** (`PUT /api/tasks/:id`) with a full new set of fields → expect `200` with every
   field updated and `updatedAt` bumped (spec FR-005).
7. **Update** with only `{ "status": "done" }` → expect `200` with just `status` (and
   `updatedAt`) changed — this is the same call the drag-and-drop move makes (spec FR-006).
8. **Update** clearing `title` to `""` → expect `400`, task unchanged (spec FR-003 applies to
   edits too).
9. **Update** a nonexistent id → expect `404`.
10. **Delete** (`DELETE /api/tasks/:id`) the created task → expect `200`; a repeat delete of the
    same id → expect `404` (spec FR-008, Edge Cases).

## Validate — running app (manual UI walkthrough)

With `npm run dev` running in `backend/` and the existing `npm run dev` (Vite) running at the
repository root:

1. **Persistence** (User Story 1): open the board, note the tasks shown; refresh the page;
   confirm the exact same tasks reappear (not the old 6-item mock set).
2. **Create** (User Story 2): add a task via the existing form with a title and assignee;
   confirm it appears immediately; refresh; confirm it is still there.
3. **Validation** (User Story 2, Scenario 2): try submitting the form with title or assignee
   blank; confirm it's rejected client-side/server-side and nothing is added.
4. **Edit** (User Story 3): edit an existing task's fields; confirm the board updates
   immediately and the change survives a refresh.
5. **Drag-and-drop move** (User Story 4): drag a card to a different column; confirm it lands
   there and survives a refresh. Drag a card and drop it back on its own column; confirm no
   network call is made (check the browser's network tab) and nothing changes.
6. **Delete** (User Story 5): delete a task with confirmation; confirm it disappears and stays
   gone after a refresh. Open the confirmation dialog and cancel; confirm nothing changed.
7. **Failure toast** (User Story 6): stop the backend server, then try to add, edit, move, or
   delete a task in the still-open frontend; confirm a visible failure notification appears
   for each attempt and the board's displayed state reverts to its last saved values (spec
   FR-010, FR-011). Restart the backend and confirm normal operation resumes.

## Done

All 10 endpoint-level checks and all 7 running-app checks passing is this feature's completion
criterion (`specs/plan.md` §6 row 2, both completion criteria — endpoint-level and
running-app-level, per Constitution Principle V).
