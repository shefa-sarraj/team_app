# Feature Specification: Filtering, Assignee Aggregation & Frontend Rewiring

**Feature Branch**: `003-filtering-assignee-aggregation`

**Created**: 2026-09-24

**Status**: Draft

**Input**: User description: "Phase 3 — Filtering, Assignee Aggregation & Frontend Rewiring,
per specs/plan.md section 6 (row 3) and adhering to the unified API standards described in
plan.md section 4.1. Move priority/assignee filtering and the assignee-options aggregation from
client-side computation to the backend: extend GET /api/tasks to accept priority/assignee query
params only, deliberately excluding page/limit/sort params (resolved Ambiguity #4 —
permanently deferred, not added in this migration); add a new endpoint
GET /api/tasks/assignees returning the distinct list of assignee names instead of deriving it
client-side; overdue count stays a client-side "now"-dependent computation (isOverdue()), no
DB-level date queries. Rewire the frontend: src/App.jsx's inline visibleTasks filter
(Array.prototype.filter) is replaced by a call to taskService.listTasks({priority, assignee});
src/App.jsx's inline assigneeOptions derivation is replaced by a call to
taskService.listAssignees(); src/components/filters/FilterBar.jsx reflects the server-derived
options with no structural change. Out of scope: sorting and pagination (permanently deferred,
not added in this migration); authentication (permanently out of scope); any User/assignee
model (assignee stays a plain free-text string). Dependencies: Phase 2 (done). Completion
criteria: (1) the filtered-list and assignee endpoints verified directly via Postman with
various query combinations, confirming no pagination/sort params are accepted; (2) in the
running app, applying and clearing priority/assignee filters produces identical visible results
to the current client-side behavior, now backend-driven."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Narrow the Board by Priority and/or Assignee (Priority: P1)

As a user of the task board, I need to narrow what I see down to tasks matching a chosen
priority and/or a chosen assignee, so that I can focus on the subset of work relevant to me
right now, exactly as I could before — but now the narrowing reflects the real, complete set of
saved tasks rather than only whatever happened to already be loaded in my browser.

**Why this priority**: Filtering is the board's core "focus" tool and is used constantly; every
other story in this phase exists to support this one working correctly against real, persisted
data instead of an in-browser copy.

**Independent Test**: Can be fully tested by choosing a priority, choosing an assignee, and
choosing both together, and confirming in each case that only the matching tasks are shown —
with no create/edit/delete/move action required to demonstrate this.

**Acceptance Scenarios**:

1. **Given** tasks with a mix of priorities exist, **When** a user selects a specific priority,
   **Then** only tasks with that exact priority are shown.
2. **Given** tasks with a mix of assignees exist, **When** a user selects a specific assignee,
   **Then** only tasks assigned to that exact person are shown.
3. **Given** a user has selected both a specific priority and a specific assignee, **When** the
   selections are applied, **Then** only tasks matching both at once are shown (not tasks
   matching either one alone).
4. **Given** no priority or assignee is selected ("All"), **When** the board loads, **Then**
   every saved task is shown, matching today's unfiltered behavior.
5. **Given** a filter is applied that matches zero tasks, **When** it is applied, **Then** the
   board clearly shows that no tasks match, not an error and not the unfiltered list.

---

### User Story 2 - Choose From Every Real Assignee, Regardless of the Current Filter (Priority: P2)

As a user, I need the assignee filter's list of names to always reflect everyone who has ever
been assigned a task, not just the people visible in whatever subset of tasks the current
filter happens to be showing, so that I can always switch to filtering by any assignee without
first having to clear my other filters.

**Why this priority**: This preserves an existing guarantee of the board (today, the assignee
list is derived from every loaded task, not the currently visible subset) that would otherwise
silently break once filtering happens on the server and only a subset of tasks is ever loaded
into the browser at once.

**Independent Test**: Can be fully tested by applying a priority filter that hides every task
belonging to a particular assignee, then confirming that assignee's name is still present and
selectable in the assignee dropdown.

**Acceptance Scenarios**:

1. **Given** tasks exist for several different assignees, **When** the board is opened, **Then**
   the assignee filter offers every one of those names, regardless of any other filter currently
   applied.
2. **Given** a priority filter is active that hides all of one assignee's tasks, **When** the
   user opens the assignee dropdown, **Then** that assignee's name is still listed as a choice.
3. **Given** a brand-new task is saved for an assignee name that has never been used before,
   **When** the board is next opened or refreshed, **Then** that new name appears in the
   assignee filter's choices.

---

### User Story 3 - Clear Filters and See Everything Again (Priority: P3)

As a user, I need a simple way to remove any active priority/assignee filter and immediately see
every saved task again, so that I never feel "stuck" inside a narrowed view.

**Why this priority**: This is a convenience on top of User Story 1's filtering rather than a
new capability — filtering is only fully usable if it can be undone as easily as it was applied.

**Independent Test**: Can be fully tested by applying any filter, then clearing it, and
confirming every saved task reappears.

**Acceptance Scenarios**:

1. **Given** a priority and/or assignee filter is active, **When** the user clears the filter,
   **Then** every saved task is shown again, identical to the board's state before any filter
   was applied.

---

### Edge Cases

- What happens when the assignee filter is opened while no tasks exist at all yet? It MUST show
  an empty (or "no assignees yet") list rather than erroring or showing stale names.
- What happens when a task's assignee changes via an edit, or a task with a unique assignee name
  is deleted? The assignee filter's choices MUST reflect this the next time they are loaded —
  the board never traps a user with a choice that is permanently stale, though it does not need
  to update the currently-open dropdown instantaneously without a reload/refetch.
- What happens when a selected assignee filter no longer matches any task (e.g., that person's
  only task was just deleted)? The board MUST show "no tasks match" rather than silently
  reverting to the unfiltered list or erroring.
- What happens when the priority or assignee filter cannot be applied because the saved-data
  service is unreachable? The user MUST see the same kind of clear failure notification already
  established for other failed operations (Phase 2), not a silently empty or stale board.
- What happens with mixed-case or extra-whitespace assignee names entered when a task was
  created? Filtering MUST match by the assignee value exactly as it is stored — this phase does
  not introduce new normalization behavior beyond what task creation/editing already does.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST allow a user to narrow the visible tasks by priority, by
  assignee, or by both at once, showing only tasks matching every currently selected criterion.
- **FR-002**: The system MUST show every saved task when no priority or assignee filter is
  selected, matching today's default (unfiltered) behavior.
- **FR-003**: The system MUST clearly indicate when a filter matches zero tasks, rather than
  showing an error or silently falling back to the unfiltered list.
- **FR-004**: The system MUST offer the complete, real set of assignee names as filter choices,
  independent of whatever priority/assignee filter is currently applied.
- **FR-005**: The system MUST make a newly used assignee name available as a filter choice the
  next time the board or its filter choices are loaded.
- **FR-006**: The system MUST provide a single, clear action that removes every active filter
  and returns to showing every saved task.
- **FR-007**: The system MUST NOT introduce any sorting or page-by-page browsing of tasks in
  this phase — the full matching set is always shown at once, exactly as today.
- **FR-008**: The system MUST show the same kind of failure notification already used for other
  failed actions (per Phase 2) when a filter or the assignee list cannot be loaded, rather than
  leaving the user with a stale, empty, or silently broken view.
- **FR-009**: The system's "overdue" indicator MUST continue to be computed the same way as
  today (based on the current date at the moment of viewing) and MUST NOT change behavior in
  this phase.
- **FR-010**: The system MUST NOT introduce any user account, login, role, or per-user data
  scoping, and MUST NOT change `assignee` from a plain free-text value into a reference to any
  other record.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can filter by priority, by assignee, and by both together, and in every
  case sees exactly the tasks matching their selection — 100% of the time under normal
  conditions.
- **SC-002**: The assignee filter always offers every assignee who has a saved task, even when
  every one of that assignee's tasks is currently hidden by another active filter.
- **SC-003**: Clearing an active filter restores the full, unfiltered task list every time.
- **SC-004**: The board's filtering behavior (what appears, what disappears, what the assignee
  dropdown offers) is indistinguishable to a user from the previous, fully-client-side version
  — aside from now reflecting the complete saved dataset rather than only what was already
  loaded in the browser.

## Assumptions

- "Users" of this phase are the same end users of the task board as before — this phase changes
  where filtering and assignee-list computation happen, not who uses the board or what they can
  see, consistent with `specs/plan.md` §5's permanent decision that authentication stays out of
  scope.
- Sorting and pagination remain permanently out of scope in this phase, per `specs/plan.md` §5
  (resolved Ambiguity #4) — the full matching set of tasks is always returned and shown at once,
  matching today's behavior and the dataset's expected small size.
- The overdue count/badge shown on the board is unaffected by this phase — it already depends
  only on each task's own `dueDate` and the current moment, not on filtering or on where the
  assignee list comes from.
- Phase 2 (`specs/002-task-crud-frontend/`, status `done`) is already fully live — this phase
  builds directly on its existing task data, endpoints, and failure-notification pattern rather
  than introducing a new one.
