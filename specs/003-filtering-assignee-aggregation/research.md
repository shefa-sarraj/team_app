# Phase 0 Research: Filtering, Assignee Aggregation & Frontend Rewiring

No items in this feature's Technical Context were marked `NEEDS CLARIFICATION` — the one open
question relevant to this phase (pagination/sorting) was already resolved in `specs/plan.md`
§5 (Ambiguity #4) before this feature's spec was written. This file documents that decision's
application here, plus three implementation-level decisions this phase adds on top of Phase 2's
foundation.

## Decision: Extra/unsupported query params (`page`, `limit`, `sort`, …) are silently ignored, not rejected

**Rationale**: `specs/plan.md` §6 row 3 says the extended endpoint "deliberately exclud[es]
page/limit/sort params" — meaning those params are simply not a feature, not that requests
containing them must fail. The query-validation schema strips unknown keys (Zod's default
behavior) rather than using `.strict()` to reject them. This matches ordinary REST API
convention (an endpoint ignores parameters it doesn't understand) and keeps the spec's
completion criterion — "confirming no pagination/sort params are accepted" — verifiable as "sent
but had no effect on the response," which is what `quickstart.md` checks.

**Alternatives considered**: Rejecting requests containing unknown query params with `400`
(rejected — overly strict for a GET endpoint, not requested by the spec, and would make the API
more fragile for no benefit, e.g. a client adding an analytics-only query param would break).

## Decision: `GET /api/tasks/assignees` is registered before `GET /api/tasks/:id`

**Rationale**: Express matches routes in registration order; `/api/tasks/assignees` would
otherwise be captured by `GET /api/tasks/:id` with `id = "assignees"`, returning a spurious
404 ("Task not found") instead of the assignee list. Registering the more specific literal
path first avoids this entirely — a well-known Express routing pitfall, not specific to this
project.

**Alternatives considered**: A separate top-level route (e.g., `GET /api/assignees`) — rejected
as an unnecessary deviation from `specs/plan.md` §6 row 3's explicit `GET /api/tasks/assignees`
path, which reads naturally as "assignees of the tasks resource."

## Decision: After a successful create/update/delete/move, refetch the current filtered list instead of locally patching state

**Rationale**: Phase 2's `useTasks` patched the local `tasks` array directly from each
operation's response (e.g., prepending a newly created task). Once filtering happens
server-side and only the *matching* subset of tasks is ever loaded, a locally-patched task
could violate the active filter — e.g., editing a task's priority away from the selected filter
value should make it disappear from view, and a naive local patch would leave it visible until
the next full reload. Refetching `taskService.listTasks(filters)` after every successful
mutation keeps the displayed set always consistent with whatever filter is currently active,
with no extra bookkeeping logic to keep in sync. Given the spec's confirmed small dataset
(pagination permanently deferred, Ambiguity #4), the extra request per mutation has no
meaningful cost.

**Alternatives considered**: Locally checking whether the mutated task still matches the active
filter and splicing it in/out accordingly (rejected — duplicates the server's filter logic on
the client, a second place the two rules could drift apart, for a dataset too small to justify
the optimization).

## Decision: The assignee list loads once, independently of the active filter, and refetches only after a mutation

**Rationale**: Spec User Story 2 requires the assignee dropdown to always offer every real
assignee regardless of the currently applied filter. `useTasks` therefore keeps `assignees` as
a separate piece of state with its own `taskService.listAssignees()` call, decoupled from the
filtered `tasks` load — refetched on mount and again after any successful create/update/delete
(a new or changed assignee name should become selectable per spec FR-005), but never re-run
just because the priority/assignee filter changed.

**Alternatives considered**: Deriving assignee options from the currently loaded (filtered)
`tasks` array, as Phase 2 did (rejected — this is exactly the behavior spec User Story 2 exists
to prevent from silently breaking once `tasks` only ever holds a filtered subset).

## Decision: No automated test framework introduced in this phase (continued from Phases 1-2)

**Rationale**: Unchanged from Phases 1-2 — `specs/plan.md` has never called for an automated
suite, and this phase's completion criteria are Postman/curl plus manual UI verification via
`quickstart.md`, matching Constitution Principle III (Scope Discipline / YAGNI).

**Alternatives considered**: Jest/Vitest + Supertest — deferred indefinitely, same as Phases 1-2.
