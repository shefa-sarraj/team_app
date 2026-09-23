# Backend Migration Plan

## 1. Overview

`team-app` is a small single-page React 19 + Vite + Tailwind CSS 4 application called "Team Task Board." It currently runs entirely on a single hardcoded mock dataset (`src/data/mockData.js`, 6 tasks) with no network layer at all. The scan found **exactly one data model** (`Task`), **no relationships** to any other model, **no routing library**, **no authentication, user accounts, or authorization of any kind**, and **no simulated latency/error handling** anywhere in the codebase. All state lives in two custom hooks (`useTasks`, `useTheme`) plus local component state; every CRUD operation (add, edit, delete, drag-and-drop status move) and all filtering are already fully implemented against the mock array.

Overall complexity: **low**. This is a single-resource migration, not a multi-model system. Chosen stack: **Node.js + Express** backend (per the task brief), paired with **PostgreSQL + Prisma** (justified in section 4).

No files were modified and no dependencies were installed to produce this plan — this is a documentation-only deliverable, per instruction.

## 2. Discovered Models

### Task

Fields:

| Field | Type | Required? | Notes |
|---|---|---|---|
| `id` | UUID (Postgres `uuid`, Prisma `@id @default(uuid())`) | required | Client-generated today via `crypto.randomUUID()` in `useTasks.js`; the DB now owns id generation. |
| `title` | TEXT | required | Enforced non-empty (trimmed) by `TaskForm.jsx` validation. |
| `description` | TEXT | optional | Empty string (`''`) is a valid stored value — resolved Ambiguity #3 (section 5): never coerced to `null`, never omitted. |
| `assignee` | TEXT | required | Plain free-text field, **not** a foreign key to any User/Team model. Confirmed as a permanent decision, not a placeholder — resolved Ambiguity #1 (section 5). Enforced non-empty (trimmed) by `TaskForm.jsx`. |
| `priority` | native enum — Prisma `enum Priority { low medium high }` | required | Observed values: `low`, `medium`, `high` (`constants/board.js` → `PRIORITIES`). Form defaults to `medium`. Identifiers map 1:1 to the wire values, no `@map` needed. |
| `dueDate` | TEXT (deliberately **not** a native `DATE` column) | optional | Kept as `TEXT` so the literal empty string `''` can be stored without implicit type coercion — resolved Ambiguity #3 (section 5). Format `YYYY-MM-DD` when populated. Drives `isOverdue()`/`formatDate()` in `utils/formatDate.js`; overdue logic stays entirely client-side, so no DB-level date queries are needed. |
| `status` | native enum — Prisma `enum Status { todo IN_PROGRESS @map("in-progress") done }` | required | Observed values: `todo`, `in-progress`, `done` (`constants/board.js` → `COLUMNS`). Form defaults to `todo`. `in-progress` is not a valid Prisma enum identifier, so the identifier `IN_PROGRESS` is mapped via `@map("in-progress")` to preserve the exact wire value the frontend expects. |
| `createdAt` | TIMESTAMPTZ | required | Set once at creation, client-generated today; now DB-generated via `@default(now())`. |
| `updatedAt` | TIMESTAMPTZ | required | Bumped on every field edit and on every status move. |

Relationships: **none.** `assignee` is a plain string, not a reference id — there is no User/Team/Member model anywhere in the project to relate to.

Operations actually required by the UI:
- **List**, grouped into 3 columns by `status` — `Board.jsx`, `BoardColumn.jsx`
- **Create** — `TaskForm.jsx` (add mode) → `useTasks.addTask`
- **Update** (full field edit) — `TaskForm.jsx` (edit mode) → `useTasks.updateTask`
- **Update** (partial, status-only via drag-and-drop) — `BoardColumn.jsx` drop handler → `useTasks.moveTask`
- **Delete** (with confirmation) — `TaskCard.jsx` → `ConfirmDialog.jsx` → `useTasks.deleteTask`
- **Filter** (client-side, `priority` AND `assignee`) — `App.jsx` (`visibleTasks`) + `FilterBar.jsx`
- **Derived aggregation**: distinct assignee list for the filter dropdown — `App.jsx` (`assigneeOptions`)
- **Derived computation**: overdue flag/count (`dueDate` before today) — `utils/formatDate.js:isOverdue`, used in `TaskCard.jsx` and the `Board.jsx` toolbar badge
- No sort control exists anywhere (display order is insertion order; `addTask` prepends, so newest-first is implicit)
- No pagination exists anywhere (fixed 6-item mock dataset, no page-size UI)

## 3. Business Rules Inferred From the UI

- A task is **overdue** when its `dueDate` is before today (start-of-day comparison). Source: `utils/formatDate.js:isOverdue`; surfaced in `TaskCard.jsx` (red styling) and `Board.jsx` (overdue count badge).
- Newly created tasks are **prepended**, making "newest first" the implicit default order. Source: `useTasks.js:addTask`.
- Dragging a card between columns is a **status-only partial update** that also bumps `updatedAt`, and is a no-op if dropped back on its current column. Source: `useTasks.js:moveTask`, `BoardColumn.jsx` drag handlers.
- Filtering is an **AND** of `priority` and `assignee` (both default to `'all'`, meaning "no filter"). Source: `App.jsx:visibleTasks`.
- The assignee filter's options are **derived from whichever assignees currently exist on tasks**, not from a separately managed list. Source: `App.jsx:assigneeOptions`.
- Only `title` and `assignee` are enforced as non-empty; `description` and `dueDate` may be left blank. Source: `TaskForm.jsx:handleSubmit`.
- Deleting a task **always requires explicit confirmation**. Source: `App.jsx` (`taskToDelete` state) + `ConfirmDialog.jsx`.
- **No authentication, no user accounts, no per-user data scoping, and no route protection exist anywhere.** Source: absence of any router, login UI, or user/auth context in `App.jsx`/`main.jsx`.

## 4. Technical Decisions

| Decision | Chosen Option | Alternatives Considered | Reason |
|---|---|---|---|
| Database | PostgreSQL, hosted on **Neon** (serverless Postgres) | MongoDB (originally chosen in the first draft of this plan), MySQL; self-hosted/other managed Postgres (e.g. RDS, Supabase) as hosting alternatives | User decision (resolved Ambiguity #1, section 5): strong existing SQL familiarity, and since `assignee` stays a plain string with no relational model introduced, there is no relational complexity left for MongoDB's document model to avoid — familiarity wins over the flat-shape argument that originally favored MongoDB. Neon chosen as the hosting provider per user decision — no separate local Postgres install needed; Prisma connects to it like any standard Postgres instance via `DATABASE_URL`. |
| ORM/ODM | Prisma | Mongoose (originally chosen), raw `pg`/node-postgres, TypeORM | Type-safe, schema-first modeling for PostgreSQL with native enum support for `priority`/`status` and a straightforward migration workflow (`prisma migrate`) well suited to a single-resource schema like `Task`. |
| Authentication | None — out of scope for this migration | JWT-based auth, session-based auth | No login screen, no user context, and no per-user data scoping exist anywhere in the frontend today. Confirmed as a final decision (resolved Ambiguity #2, section 5): no auth phase is added to the roadmap, not deferred to a later one. |
| Authorization | Not applicable | Role-based, fine-grained permissions | No roles, permissions, or conditional UI based on "user type" were found anywhere in the codebase. |
| Folder structure | Layered (`routes/controllers/services/middlewares`, with `prisma/schema.prisma` as the schema source of truth instead of a `models/` folder) | Feature-folder ("module per domain") | The project has a single resource (`tasks`) today; a classic layered structure is simplest and matches the mandatory API contract (4.1) without over-engineering for domains that don't exist yet. |
| Input validation | Zod, applied as Express middleware | express-validator, Joi | Schema-first validation that mirrors the field table in section 2 directly (required `title`/`assignee`, enum `priority`/`status`, optional `description`/`dueDate`), and composes cleanly for separate create vs. update schemas. |
| Error handling | Centralized Express error-handling middleware + a small `ApiError` class | Per-route try/catch with manual response shaping | Matches the mandatory unified response contract (4.1) and avoids inconsistent, hand-rolled error formatting spread across controllers. |
| Environment variables | `PORT`, `DATABASE_URL`, `NODE_ENV`, `CLIENT_ORIGIN` | — | Baseline for any Express + PostgreSQL/Prisma server (`DATABASE_URL` is Prisma's standard connection-string variable — here it will hold the **Neon** connection string, which requires `?sslmode=require`); `CLIENT_ORIGIN` is required because the Vite dev server runs on a different origin/port and `vite.config.js` currently has **no proxy configured**, so CORS must be handled explicitly on the backend. |

### 4.1 Unified API Standards Contract (mandatory for every subsequent phase)

Every phase's spec must explicitly reference this section (e.g. "Adhering to the unified API standards described in plan.md section 4.1") and implement it without exception:

- **Clean layering is mandatory**: every module follows `route → controller → service → (repository/model)`. Controllers contain **no business logic** — they only receive the request, call the service, and return the response. All business logic lives in the service layer.
- **Unified endpoint naming**: plural resource names, RESTful where possible — `GET /api/tasks`, `GET /api/tasks/:id`, `POST /api/tasks`, `PUT /api/tasks/:id`, `DELETE /api/tasks/:id`. Any deviation from direct CRUD must be explicitly documented and justified in the plan, not left implicit.
- **A unified response shape** across the entire API (success and error), applied literally in every phase:
  ```json
  { "success": true, "data": { ... }, "message": null }
  { "success": false, "data": null, "message": "<error description>" }
  ```
- **Correct, consistent HTTP status codes**: 200/201 for success, 400 for input errors, 401/403 for authorization, 404 for not found, 500 for server errors — never 200 for everything with the error only embedded in the body.
- **Centralized error handling**: a single middleware catches all unexpected errors; no scattered, inconsistently-styled try/catch blocks in every controller.
- **Input validation before business logic**: a separate validation layer (middleware/schema) runs before the controller, never validation scattered inside functions.
- **Consistent file/folder naming** across every module — the same pattern (`task.routes.js`, `task.controller.js`, `task.service.js`, …) — so any new module is built from the same template.
- **Self-documentation**: every endpoint is described in its phase's spec (path, method, input shape, output shape, possible errors) before implementation, serving as the reference for wiring the frontend.

## 5. Ambiguities Requiring Clarification Before Implementation

**All 5 items below are RESOLVED.** The user made these decisions directly; see Change Log §8, entry #1. Original descriptions and sources are kept per the "no information is ever deleted" rule — the last column now records the resolution instead of the open impact.

| # | Description | Where Observed | Resolution |
|---|---|---|---|
| 1 | `assignee` is a free-text string with no link to any User/Team model — there is no user-management UI anywhere. | `data/mockData.js`, `hooks/useTasks.js`, `components/tasks/TaskForm.jsx` | **RESOLVED.** Kept as a plain free-text string; no User/Team/Member model or relation is introduced. No schema change beyond what's documented in section 2. |
| 2 | No authentication or user accounts exist in the frontend at all. | Entire codebase — no login screen, no router, no auth/user context in `App.jsx`/`main.jsx` | **RESOLVED.** No authentication phase is included in this migration — matches the current frontend, which has no login screen or user context anywhere. Removed from the roadmap entirely, not deferred. |
| 3 | `description` and `dueDate` can be submitted as empty strings (`''`) rather than `null`/omitted — the mock data always has non-empty values, but the form allows blanks. | `data/mockData.js` (always populated) vs. `components/tasks/TaskForm.jsx` (`EMPTY_TASK` defaults to `''`) | **RESOLVED.** Blank values are stored as a literal empty string (`''`), never coerced to `null` or omitted. `dueDate` is kept as a `TEXT` column (not a native `DATE` type) specifically so `''` can be stored without implicit type coercion; overdue logic stays entirely client-side (`isOverdue()`), so no DB-level date queries are needed. |
| 4 | No sorting or pagination controls exist anywhere in the UI; the mock dataset is fixed at 6 tasks. | `Board.jsx`, `BoardColumn.jsx`, absence of any sort/page UI | **RESOLVED.** Pagination and sorting are deferred — the dataset is expected to stay small. Phase 3's endpoints support `priority`/`assignee` filtering only; no `page`/`limit`/`sort` query params are added in this migration. |
| 5 | `useTasks.js` has no error state at all — it returns only `tasks` and `isLoading`, with no UI path today for "failed to load" or "failed to save." | `hooks/useTasks.js` (`return { tasks, isLoading, ... }`) | **RESOLVED.** Failed API calls (create/update/delete/move) surface as toast notifications. `useTasks.js` gains a new error state wired to a toast; added explicitly to Phase 2's scope (section 6). |

## 6. Phases

Note on Phase 1: it is infrastructure-only by nature (per the prompt's own "typical order" reference model, base setup precedes any model work), so it has no mock function to replace and no frontend file to rewire — this is treated as a justified, explicit exception to the "backend + frontend together" rule, not a violation of it, because no corresponding UI behavior exists yet to verify.

| # | Phase | Goal | Scope | Out of Scope | Dependencies | Endpoints | Affected Frontend Files | mock → service | Completion Criterion | Risks | Status | Spec Path |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Backend Foundation & Project Setup | Stand up a working Express server connected to PostgreSQL with the unified response/error contract, with no business logic yet. | Express app skeleton; Prisma Client connection to PostgreSQL (`prisma/schema.prisma` + `prisma migrate dev`); env config; folder structure per 4.1; centralized error middleware; unified response helper; CORS for `CLIENT_ORIGIN`; `GET /api/health`. | Any Task model/endpoints; any frontend changes; authentication (permanently out of scope, resolved Ambiguity #2). | — | `GET /api/health` | none (no mock call exists yet to replace) | — (not applicable; see note above) | (1) Server boots and connects to PostgreSQL via Prisma, `GET /api/health` returns the unified success envelope via Postman. (2) Not applicable for this phase — no frontend behavior exists yet to verify, per the note above. | None beyond standard setup risk. | done | `specs/001-backend-foundation/` |
| 2 | Task CRUD + Frontend Rewiring | Implement full CRUD + status-move for the Task resource, and replace the mock-based `useTasks` hook with real API calls via a new frontend service layer. | Task Prisma model (`prisma/schema.prisma`) per section 2, including the `Status` enum's `IN_PROGRESS @map("in-progress")`; Zod validation for create/update (blank `description`/`dueDate` accepted as literal `''`, resolved Ambiguity #3); `route→controller→service→model` layering; list/get/create/update/delete endpoints; rewire `useTasks.js` to call a new `src/services/taskService.js` instead of importing `mockData.js`; add an `error` state to `useTasks.js` wired to a **toast notification** for failed create/update/delete/move calls (resolved Ambiguity #5 — no error-state UX existed before this phase). | Server-side filtering/search/sort/pagination (Phase 3); authentication — permanently out of scope, resolved Ambiguity #2, not deferred; any User/assignee model — `assignee` stays a plain string, resolved Ambiguity #1, not deferred. | 1 | `GET /api/tasks`, `GET /api/tasks/:id`, `POST /api/tasks`, `PUT /api/tasks/:id`, `DELETE /api/tasks/:id` | `src/hooks/useTasks.js`; `src/data/mockData.js` (removed); `src/App.jsx` (async load + new error state); `src/components/board/BoardColumn.jsx` (drop handler now triggers a `PUT` call); `src/components/common/Toast.jsx` (new — renders error notifications from the new `useTasks` error state) | `mockTasks` (static import) → `taskService.listTasks()`; `useTasks.addTask` → `taskService.createTask()`; `useTasks.updateTask` → `taskService.updateTask()`; `useTasks.deleteTask` → `taskService.deleteTask()`; `useTasks.moveTask` → `taskService.updateTask()` (partial `{status}` payload, same endpoint as a full edit) | (1) All 5 endpoints verified directly via Postman, including validation-error responses. (2) In the running app, add/edit/delete/drag-and-drop-move a task and confirm the board behaves identically to the mock-data version, now backed by persisted data (state survives a page refresh); a forced failed request (e.g. server stopped) surfaces a toast instead of failing silently. | None outstanding — the empty-string handling (Ambiguity #3) and error-state UX (Ambiguity #5) are resolved (section 5) and must be implemented exactly as decided: literal `''` storage (not `null`), and toast-based error surfacing. | done | `specs/002-task-crud-frontend/` |
| 3 | Filtering, Assignee Aggregation & Frontend Rewiring | Move priority/assignee filtering and the assignee-options aggregation from client-side computation to the backend, and rewire the filter UI to use it. | Extend `GET /api/tasks` to accept `priority`/`assignee` query params only — deliberately excluding `page`/`limit`/`sort` params per resolved Ambiguity #4; add an endpoint returning the distinct assignee list instead of deriving it client-side; overdue count stays a client-side "now"-dependent computation (`isOverdue()`), confirmed in resolved Ambiguity #3/#4 — no DB-level date queries. | Sorting/pagination — permanently deferred, resolved Ambiguity #4 (dataset expected to stay small); not added in this migration. | 2 | `GET /api/tasks?priority=&assignee=` (extension of Phase 2's endpoint, no pagination/sort params); `GET /api/tasks/assignees` | `src/App.jsx` (`visibleTasks`/`assigneeOptions` useMemo logic removed, replaced by service calls); `src/components/filters/FilterBar.jsx` (reflects server-derived options, no structural change) | `App.jsx` inline `visibleTasks` filter (`Array.prototype.filter`) → `taskService.listTasks({ priority, assignee })`; `App.jsx` inline `assigneeOptions` derivation → `taskService.listAssignees()` | (1) Filtered-list and assignee endpoints verified directly via Postman with various query combinations, confirming no pagination/sort params are accepted. (2) In the running app, applying and clearing priority/assignee filters produces identical visible results to the current client-side behavior, now backend-driven. | None outstanding — the pagination/sorting question (Ambiguity #4) is resolved (section 5); this phase intentionally ships without them. | done | `specs/003-filtering-assignee-aggregation/` |

## 7. Proposed Backend Folder Structure

```
backend/
  prisma/
    schema.prisma
  src/
    config/
      db.js       // initializes and exports the Prisma client
      env.js
    routes/
      health.routes.js
      task.routes.js
    controllers/
      task.controller.js
    services/
      task.service.js
    middlewares/
      errorHandler.js
      validate.js
      notFound.js
    validations/
      task.validation.js
    utils/
      ApiError.js
      ApiResponse.js
    app.js
    server.js
  .env.example
  package.json
```

## 8. Change Log

#4 — 2026-09-24 — Phase 3 (Filtering, Assignee Aggregation & Frontend Rewiring) is **done**:
all 18 tasks in `specs/003-filtering-assignee-aggregation/tasks.md` (T001-T018) complete. No
new dependency and no schema change — `GET /api/tasks` now accepts optional `priority`/
`assignee` query params (validated by a new `listTasksQuerySchema`; unrecognized params like
`page`/`limit`/`sort` are silently stripped, never rejected or acted on); a new
`GET /api/tasks/assignees` endpoint returns the distinct, filter-independent assignee list
(registered before `GET /:id` to avoid an Express routing conflict). `backend/src/middlewares/
validate.js` was generalized to validate `req.query` as well as `req.body`. Frontend: `App.jsx`'s
inline `visibleTasks`/`assigneeOptions` client-side computations are removed; `useTasks.js` now
takes a `filters` argument, refetches on filter change, and — per an implementation-time design
decision — refetches the task list and assignee list after every successful create/update/
delete instead of locally patching state, so the displayed set always stays consistent with the
active filter (e.g., editing a task's priority away from the active filter correctly makes it
disappear from view immediately). Verified live in the browser: priority filter, assignee
filter, combined filter (including a zero-match case showing a clean empty state), the
assignee dropdown staying complete while a filter hides that assignee's only task, "Clear"
restoring the full list, a filtered-out task correctly disappearing after an edit, and the
failure-toast path (backend stopped mid-session, toast appeared, normal operation resumed after
restart) — all confirmed working end-to-end, continuing the same manual verification approach
used in Phases 1-2. No scope/requirement changes — Row 3's Status updated from `planned` to
`done`. **This completes the full 3-phase migration plan defined in section 6.**

#3 — 2026-09-23 — Phase 2 (Task CRUD + Frontend Rewiring) is **done**: all 22 tasks in
`specs/002-task-crud-frontend/tasks.md` (T001-T022) complete. `zod` (^3.25.76) added to
`backend/package.json` with explicit user approval before installation. `prisma/schema.prisma`
gained its first domain model (`Task`) plus `Priority`/`Status` enums, applied via migration
`add_task_model`; all 5 endpoints (`GET /api/tasks`, `GET /api/tasks/:id`, `POST /api/tasks`,
`PUT /api/tasks/:id`, `DELETE /api/tasks/:id`) verified directly via curl against the live Neon
database, including validation-error (400) and not-found (404) responses. Frontend rewired:
`src/services/taskService.js` (new) replaces `src/data/mockData.js` (deleted); `useTasks.js`
now loads/persists via the real API and exposes an `errors` queue; `src/components/common/
Toast.jsx` (new) renders failure notifications. Verified live in the browser: persistence
across refresh, create, edit, delete, and the failure-toast path (backend stopped mid-session,
toast appeared, board state stayed unchanged, normal operation resumed after restart) all
confirmed working end-to-end. Implementation notes: (1) the frontend calls the backend by
absolute origin (`http://localhost:4000`) rather than a relative path, since no Vite dev proxy
exists — matching the CORS-based cross-origin decision already recorded in section 4; (2) Neon
free-tier auto-suspend caused several transient `P1001`/503 connectivity gaps during
implementation and testing (resolved each time by a retry/wake-up call, e.g. `prisma db
execute`), an operational characteristic of the hosting tier rather than an application defect;
(3) drag-and-drop status-move could not be exercised through browser-automation mouse events
(native HTML5 drag-and-drop requires OS-level drag gestures that synthetic mouse/DragEvents
don't fully replicate) — the underlying `PUT` status-only call was verified directly instead,
and the drag UI itself is unchanged, pre-existing code from before this migration; a real
manual drag is recommended as a final human check. No scope/requirement changes — Row 2's
Status updated from `planned` to `done`.

#2 — 2026-09-23 — Phase 1 (Backend Foundation & Project Setup) is **done**: all 18 tasks in
`specs/001-backend-foundation/tasks.md` (T001-T018) complete, all 5 `quickstart.md` scenarios
verified against a live Neon database (healthy check, database-unreachable → 503, CORS header
fixed to `CLIENT_ORIGIN`, unknown-route → 404, missing-env-var startup failure). Row 1's Status
updated from `planned` to `done`. Implementation note: `backend/package.json` initially pinned
`prisma`/`@prisma/client` to `^8.0.0-rc.15`/`^7.10.0` — npm's `latest` dist-tag for `prisma`
resolves to a pre-release with an entirely different CLI (no `prisma migrate dev`, requires
`prisma.config.ts` + driver adapters). Re-pinned both packages to the last stable classic-CLI
release, `^6.19.3`, matching the `env("DATABASE_URL")`-in-schema + plain `new PrismaClient()`
pattern already assumed by `data-model.md` and the already-written `src/config/db.js`. No
scope/requirement changes — implementation detail only.

#1 — 2026-09-16 — User resolved all 5 open ambiguities from section 5: switched the database from MongoDB/Mongoose to PostgreSQL/Prisma (familiarity-driven — since `assignee` stays a plain string, there was no relational complexity left for MongoDB to be avoiding); confirmed `assignee` remains a free-text field with no User/Team model or relation; removed authentication from the roadmap entirely rather than deferring it; decided empty `description`/`dueDate` values are stored as a literal `''` (kept `dueDate` as `TEXT`, not a native `DATE`, specifically to support this without coercion); deferred pagination/sorting indefinitely (dataset expected to stay small, Phase 3 stays filter-only); added toast-based error-state handling to Phase 2's scope (`useTasks.js` gains an `error` state and a new `Toast.jsx` component). Updated sections 1, 2, 4, 5, 6, and 7 accordingly; section 4.1 (Unified API Standards Contract) is unaffected by any of these decisions.

#2 — 2026-09-16 — User decided the PostgreSQL database will be hosted on **Neon** (serverless Postgres) rather than self-hosted or another managed provider. No schema, ORM, or phase changes — Prisma connects to Neon exactly like any standard Postgres instance via `DATABASE_URL`, which will hold the Neon connection string (`?sslmode=require`). Updated the Database and Environment variables rows in section 4.

_No entries prior to entry #1 — the file was created from the initial full-project scan._
