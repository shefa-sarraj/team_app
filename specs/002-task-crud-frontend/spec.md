# Feature Specification: Task CRUD + Frontend Rewiring

**Feature Branch**: `002-task-crud-frontend`

**Created**: 2026-09-23

**Status**: Draft

**Input**: User description: "Phase 2 — Task CRUD + Frontend Rewiring, per specs/plan.md section 6
(row 2) and adhering to the unified API standards described in plan.md section 4.1. Implement
full CRUD + status-move for the Task resource: Prisma `Task` model per plan.md section 2 (fields
id/title/description/assignee/priority/dueDate/status/createdAt/updatedAt, `Status` enum with
`IN_PROGRESS @map("in-progress")`, `Priority` enum low/medium/high); Zod validation for
create/update (blank `description`/`dueDate` accepted as literal `''`, never null/omitted, per
resolved Ambiguity #3); route→controller→service→model layering; endpoints GET /api/tasks,
GET /api/tasks/:id, POST /api/tasks, PUT /api/tasks/:id, DELETE /api/tasks/:id. Rewire the
frontend: replace `src/data/mockData.js` with a new `src/services/taskService.js` calling the
real API; `src/hooks/useTasks.js` calls the service instead of importing mock data, and gains a
new `error` state; drag-and-drop status move (`BoardColumn.jsx`) now triggers a PUT call; add a
new `src/components/common/Toast.jsx` that surfaces failed create/update/delete/move calls as
toast notifications (resolved Ambiguity #5). Out of scope: server-side filtering/search/sort/
pagination (Phase 3); authentication (permanently out of scope); any User/assignee model
(assignee stays a plain free-text string). Dependencies: Phase 1 (done). Completion criteria:
(1) all 5 endpoints verified directly via Postman including validation-error responses; (2) in
the running app, add/edit/delete/drag-and-drop-move a task behaves identically to the mock-data
version, now backed by persisted data that survives a page refresh, and a forced failed request
surfaces a toast instead of failing silently."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See Tasks That Persist Across a Refresh (Priority: P1)

As a user of the task board, I need the board to load the real, saved list of tasks every time
I open or refresh the app, so that my work is never lost the way it effectively "reset" under
the old hardcoded sample data.

**Why this priority**: Every other capability (create, edit, move, delete) is only meaningful
once the board is showing real, persisted data instead of a fixed sample. This is the
foundational, load-bearing story — without it, none of the others can be observed as "real."

**Independent Test**: Can be fully tested by opening the app and confirming the board shows the
current saved set of tasks grouped into their columns, then refreshing the page and confirming
the exact same tasks are still there — with zero create/edit/delete/move actions required to
demonstrate this.

**Acceptance Scenarios**:

1. **Given** tasks already exist in storage, **When** the board is opened, **Then** every task
   appears in its correct column, with the same information (title, description, assignee,
   priority, due date) it was saved with.
2. **Given** the board is currently showing tasks, **When** the page is refreshed, **Then** the
   same tasks reappear unchanged — nothing reverts to a fixed sample set.
3. **Given** the saved data cannot be reached, **When** the board is opened, **Then** the user
   sees a clear failure notification instead of a blank board or stale sample data.

---

### User Story 2 - Add a New Task That Sticks Around (Priority: P1)

As a user, I need to add a new task through the existing form and have it permanently saved, so
that it is still there the next time I or anyone else opens the board.

**Why this priority**: Creating tasks is the primary way new work enters the board; it is the
first write operation and, together with User Story 1, forms the minimum usable slice.

**Independent Test**: Can be fully tested by submitting the task form with valid details and
confirming the new task appears on the board immediately, then refreshing the page and
confirming it is still present.

**Acceptance Scenarios**:

1. **Given** the task form is open, **When** a user submits it with a title and assignee filled
   in (description and due date optionally left blank), **Then** the new task appears on the
   board in its starting column immediately, and remains after a page refresh.
2. **Given** the task form is open, **When** a user submits it with the title or assignee left
   blank, **Then** the task is rejected with a clear message and nothing is added to the board.
3. **Given** the save fails for a reason outside the user's control (e.g., the service is
   unreachable), **When** the user submits a valid task, **Then** the user sees a failure
   notification and the board's task list is left unchanged (no partial/duplicate task appears).

---

### User Story 3 - Edit an Existing Task's Details (Priority: P2)

As a user, I need to change a task's details (title, description, assignee, priority, due date)
and have the change permanently saved, so that the board reflects the task's current, correct
information going forward.

**Why this priority**: Editing is a core daily operation but depends on User Stories 1 and 2
already delivering a visible, real task to edit.

**Independent Test**: Can be fully tested by opening an existing task in edit mode, changing one
or more fields, saving, and confirming the board immediately reflects the change and the change
survives a page refresh.

**Acceptance Scenarios**:

1. **Given** an existing task, **When** a user edits its details and saves with valid values,
   **Then** the board shows the updated details immediately, and they remain after a refresh.
2. **Given** an existing task is being edited, **When** a user clears the title or assignee and
   saves, **Then** the edit is rejected with a clear message and the task's saved details are
   unchanged.
3. **Given** the save fails for a reason outside the user's control, **When** a user submits a
   valid edit, **Then** the user sees a failure notification and the task's displayed details
   revert to its last saved state.

---

### User Story 4 - Move a Task Between Columns by Dragging (Priority: P2)

As a user, I need to drag a task card into a different column and have its new status
permanently saved, so that the board's columns always reflect each task's real, current status.

**Why this priority**: Status-move is the board's signature interaction and is used constantly,
but like editing, it depends on real persisted tasks already being visible.

**Independent Test**: Can be fully tested by dragging an existing task card to a different
column and confirming it stays there after a page refresh.

**Acceptance Scenarios**:

1. **Given** a task is in one column, **When** a user drags it to a different column, **Then**
   the task appears in the new column immediately, and remains there after a page refresh.
2. **Given** a task is dragged and dropped back onto the column it started in, **When** the drop
   completes, **Then** nothing changes and no unnecessary save occurs.
3. **Given** the save fails for a reason outside the user's control, **When** a user drags a
   task to a new column, **Then** the user sees a failure notification and the task returns to
   its last saved column.

---

### User Story 5 - Delete a Task With Confirmation (Priority: P2)

As a user, I need to permanently remove a task I no longer need, after confirming the action, so
that the board doesn't accumulate stale or irrelevant work items.

**Why this priority**: Deletion is a necessary but less frequent operation than create/edit/move,
and carries a data-loss risk that already requires the existing confirmation step.

**Independent Test**: Can be fully tested by deleting an existing task through the existing
confirmation flow and confirming it no longer appears on the board, including after a page
refresh.

**Acceptance Scenarios**:

1. **Given** an existing task, **When** a user confirms its deletion, **Then** the task
   disappears from the board immediately, and does not reappear after a page refresh.
2. **Given** the deletion confirmation dialog is open, **When** a user cancels it, **Then** the
   task is left completely unchanged.
3. **Given** the delete fails for a reason outside the user's control, **When** a user confirms
   deletion of a valid task, **Then** the user sees a failure notification and the task remains
   visible on the board.

---

### User Story 6 - Be Notified When an Action Fails (Priority: P3)

As a user, I need a clear, visible notification whenever an add, edit, move, or delete action
fails, so that I know my change was not saved and I am not left thinking it worked when it
didn't.

**Why this priority**: This is a cross-cutting safety net for User Stories 2-5 rather than a
standalone capability; it is already exercised as an acceptance scenario in each of those
stories, so it is listed separately only to make its own testability explicit.

**Independent Test**: Can be fully tested by forcing any single save operation to fail (e.g.,
stopping the backing service) and confirming a visible, dismissable notification appears,
distinct from the board's normal content, and disappears without user action after a short time
or on user dismissal.

**Acceptance Scenarios**:

1. **Given** any add/edit/move/delete action fails, **When** the failure occurs, **Then** a
   notification appears describing that the action did not succeed.
2. **Given** a failure notification is showing, **When** enough time passes (or the user
   dismisses it), **Then** it disappears without blocking further use of the board.
3. **Given** multiple actions fail in quick succession, **When** each failure occurs, **Then**
   each is communicated without silently replacing or hiding an earlier unread notification.

---

### Edge Cases

- What happens when a user submits a task with a title or assignee that is only whitespace? It
  MUST be treated the same as empty (rejected), matching the existing trimmed-validation
  behavior already present in the task form.
- What happens when a user leaves description or due date blank? The task MUST save successfully
  with that field stored as blank — never rejected and never silently replaced with a
  placeholder value.
- What happens when a user tries to edit or delete a task that another client has already
  deleted (no longer exists in storage)? The action MUST fail with a clear "not found" style
  notification rather than silently succeeding or crashing the board.
- What happens when two failures happen back-to-back (e.g., a drag-move fails right after a
  failed edit)? Both MUST be surfaced (per User Story 6, Acceptance Scenario 3), not just the
  most recent one.
- What happens when the board is opened while the saved-data service is completely unreachable?
  The user MUST see a clear failure notification (User Story 1, Acceptance Scenario 3) rather
  than an empty board that looks like "zero tasks exist."

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST load and display the full, real set of saved tasks whenever the
  board is opened or refreshed, replacing the previous fixed sample data entirely.
- **FR-002**: The system MUST allow a user to create a new task with title, description,
  assignee, priority, and due date, and persist it so it survives a page refresh.
- **FR-003**: The system MUST reject task creation or edits when the title or assignee is empty
  (after trimming whitespace), leaving no partial task saved.
- **FR-004**: The system MUST accept a blank description and/or blank due date as valid on
  create and edit, storing them as blank rather than rejecting the request or substituting a
  placeholder.
- **FR-005**: The system MUST allow a user to edit any of an existing task's fields (title,
  description, assignee, priority, due date) and persist the change so it survives a page
  refresh.
- **FR-006**: The system MUST allow a user to change a task's status by dragging it to a
  different column, persisting the new status so it survives a page refresh.
- **FR-007**: The system MUST NOT persist any change when a task is dragged and dropped back
  onto its current column.
- **FR-008**: The system MUST allow a user to permanently delete a task, only after the user
  confirms the action, and the deletion MUST survive a page refresh.
- **FR-009**: The system MUST leave a task completely unchanged if its deletion is cancelled at
  the confirmation step.
- **FR-010**: The system MUST show the user a clear, visible failure notification whenever a
  create, edit, move, or delete action does not succeed, and MUST NOT show the change on the
  board as if it had succeeded.
- **FR-011**: The system MUST revert a task's displayed details, column, or presence on the
  board to its last known saved state when an edit, move, or delete action fails.
- **FR-012**: The system MUST show a failure notification when the initial task list cannot be
  loaded, rather than displaying an empty board or previously cached sample data.
- **FR-013**: The system MUST surface each action failure as its own notification even when
  multiple failures occur close together, without silently dropping or overwriting an earlier
  one.
- **FR-014**: The system MUST NOT introduce any user account, login, role, or per-user data
  scoping — every user continues to see and act on the same shared set of tasks, matching
  today's behavior.
- **FR-015**: The system MUST NOT introduce any server-side filtering, sorting, search, or
  pagination in this phase — the full task list continues to load at once, exactly as today.
- **FR-016**: The system MUST NOT change `assignee` into a reference to any other record — it
  remains a plain free-text value a user types directly into the form.

### Key Entities

- **Task**: A single unit of work tracked on the board. Attributes: title (required), description
  (optional, may be blank), assignee (required, free text), priority (one of a fixed small set:
  low/medium/high), due date (optional, may be blank), status (one of a fixed small set of board
  columns), and timestamps recording when it was created and last changed. No relationships to
  any other entity exist — `assignee` is a label, not a link to a person record.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can add, edit, move, and delete a task, and every one of those changes is
  still visible after refreshing the page — 100% of the time under normal conditions.
- **SC-002**: A user attempting to save an incomplete task (missing title or assignee) is
  informed immediately, with zero incomplete tasks ever appearing on the board.
- **SC-003**: When a save action is forced to fail, the user sees a failure notification within
  the same interaction — never a silent failure that looks like success.
- **SC-004**: The board's visible behavior for adding, editing, moving, and deleting a task is
  indistinguishable from the previous sample-data version, aside from changes now surviving a
  page refresh.
- **SC-005**: Blank optional fields (description, due date) are accepted on 100% of create/edit
  attempts and never cause a rejected save.

## Assumptions

- "Users" of this phase are the same end users of the task board as before (no new user type is
  introduced) — this phase changes where data lives and how failures are communicated, not who
  uses the board or what they can see, per `specs/plan.md` §5's resolved decision that
  authentication stays permanently out of scope.
- The specific wording, styling, and exact auto-dismiss timing of the failure notification are
  left to standard, unobtrusive UI conventions (a small dismissable message, not a blocking
  dialog) since `specs/plan.md` §5 (resolved Ambiguity #5) establishes only that failures must
  surface as a toast-style notification, not its exact presentation details.
- The backend service and database created in Phase 1 (`specs/001-backend-foundation/`) are
  already running and reachable — this phase builds directly on that completed foundation per
  `specs/plan.md` §6 row 2's `Dependencies` column.
- No sorting, filtering, search, or pagination behavior changes in this phase — the board
  continues to show every task at once, exactly as it does today, per `specs/plan.md` §5's
  resolved Ambiguity #4 (deferred indefinitely, out of scope for this phase).
