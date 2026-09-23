# Phase 0 Research: Task CRUD + Frontend Rewiring

No items in this feature's Technical Context were marked `NEEDS CLARIFICATION` — every
technology decision needed for this phase was already made and recorded in `specs/plan.md`
§4 (Technical Decisions) and §4.1 (Unified API Standards Contract) before this feature's spec
was written, and is now also locked in by the Constitution's "Technology Stack Constraints"
section. This file consolidates those decisions in Decision/Rationale/Alternatives form,
plus the two implementation-detail decisions this phase adds on top of Phase 1's foundation.

## Decision: Introduce a real `services/` layer now

**Rationale**: Phase 1's `plan.md` explicitly deferred this ("no `services/` folder yet since
there is no business logic to hold in this phase"). This phase introduces the first real
business logic (Task persistence rules), so `task.service.js` is added to own every Prisma
call, keeping `task.controller.js` limited to request/response translation — required by
Constitution Principle I ("Controllers contain no business logic").

**Alternatives considered**: Prisma calls directly inside the controller (rejected — violates
Constitution Principle I's mandatory layering, and would need to be refactored out again the
moment Phase 3 adds filtering logic to the same resource).

## Decision: Zod for request validation, as Express middleware ahead of controllers

**Rationale**: Already decided in `specs/plan.md` §4 and restated in the Constitution's
"Technology Stack Constraints". A single `validate.js` middleware factory takes a Zod schema
and short-circuits with a `400` (via the existing `ApiError`/`errorHandler` from Phase 1) before
the controller runs, satisfying Constitution Principle I's "Input validation MUST run in a
dedicated layer... before any business logic executes."

**Important open item — requires user approval before `/speckit-implement`**: `zod` is not
yet installed in `backend/package.json`. Per the user's standing instruction, no new library
may be installed without asking first, even when — as here — it is already part of the
approved plan. This must be confirmed explicitly before implementation begins.

**Alternatives considered**: `express-validator`, `Joi` — both rejected in `specs/plan.md` §4
already (Zod's schema-first style mirrors the `Task` field table in `specs/plan.md` §2 directly
and composes cleanly into separate create/update schemas).

## Decision: `PUT /api/tasks/:id` handles both full edits and the drag-and-drop status move

**Rationale**: `specs/plan.md` §6 row 2 explicitly maps `useTasks.moveTask` → the same
`taskService.updateTask()` call as a full edit, "partial `{status}` payload, same endpoint as a
full edit" — avoiding a second, near-duplicate endpoint for what is, from the API's point of
view, just an update with fewer fields present.

**Alternatives considered**: A dedicated `PATCH /api/tasks/:id/status` endpoint (rejected —
`specs/plan.md` §6 row 2 already decided against this; it would duplicate validation and
service logic for no behavioral difference, since the update schema already treats every field
as optional-on-update).

## Decision: Update schema accepts a partial body; create schema requires `title` + `assignee`

**Rationale**: Matches spec FR-002/FR-003/FR-005/FR-006 exactly: creation requires `title` and
`assignee` (non-empty after trim); edits — including the status-only drag-and-drop move — may
send any subset of fields. `description` and `dueDate` are valid as an explicit empty string
`''` on both create and update, never rejected and never coerced (spec FR-004, Constitution
Principle IV).

**Alternatives considered**: One shared strict schema for both create and update (rejected —
would either force every field on every `PUT`, breaking the status-only move, or make `title`/
`assignee` optional on create, breaking FR-003).

## Decision: No new frontend HTTP client dependency — use the native `fetch` API

**Rationale**: The existing frontend (`package.json`) has zero HTTP client installed today; the
native `fetch` API already available in the Vite/React 19 environment is sufficient for 5
simple JSON endpoints with no auth headers or interceptor logic needed. Adding `axios` or
similar would be an unrequested new dependency.

**Alternatives considered**: `axios` (rejected — no feature requirement needs interceptors,
automatic JSON parsing beyond what `fetch`+`response.json()` already gives, or the extra
bundle weight, for 5 straightforward calls).

## Decision: Toast notification is local component state in `App.jsx`, not a new global store

**Rationale**: `specs/plan.md` §5 (resolved Ambiguity #5) only requires that failures surface
as a toast; the existing app has no state-management library beyond React's built-in hooks
(`useState`/`useEffect`/`useMemo`), and a single-page board with one active toast at a time
does not justify introducing one now (Constitution Principle III, Scope Discipline).

**Alternatives considered**: A dedicated toast/notification context or library (rejected — the
spec's Edge Cases require multiple queued failures to each be shown, not merged silently, which
a simple queue array in `useTasks`'s `error` state handles without new infrastructure).

## Decision: No automated test framework introduced in this phase (continued from Phase 1)

**Rationale**: Unchanged from Phase 1's `research.md` — `specs/plan.md` has never called for an
automated suite, and this phase's completion criteria (spec's Success Criteria + this feature's
`quickstart.md`) are Postman/curl plus manual UI verification, matching Constitution Principle
III (Scope Discipline / YAGNI).

**Alternatives considered**: Jest/Vitest + Supertest — deferred indefinitely, same as Phase 1.
