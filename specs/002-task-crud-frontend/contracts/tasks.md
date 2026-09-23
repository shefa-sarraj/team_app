# Contract: Task Resource

Adhering to the unified API standards described in `specs/plan.md` §4.1. All shapes reuse the
Phase 1 envelope (`backend/src/utils/ApiResponse.js`) — success:
`{ "success": true, "data": {...}, "message": null }`, failure:
`{ "success": false, "data": null, "message": "<description>" }`.

A `Task` object in every response below has exactly the fields from
[data-model.md](../data-model.md): `id`, `title`, `description`, `assignee`, `priority`,
`dueDate`, `status`, `createdAt`, `updatedAt`.

## `GET /api/tasks`

**Purpose**: List every task (spec FR-001, User Story 1). No query parameters in this phase
(filtering is Phase 3's scope, per spec FR-015).

**Response — success**: `200 OK`

```json
{ "success": true, "data": [ { "id": "...", "title": "...", "...": "..." } ], "message": null }
```

`data` is `[]` (not an error) when no tasks exist.

## `GET /api/tasks/:id`

**Purpose**: Fetch a single task by id.

**Response — success**: `200 OK`

```json
{ "success": true, "data": { "id": "...", "title": "...", "...": "..." }, "message": null }
```

**Response — not found**: `404 Not Found`

```json
{ "success": false, "data": null, "message": "Task not found" }
```

## `POST /api/tasks`

**Purpose**: Create a task (spec FR-002, User Story 2).

**Request body**:

```json
{
  "title": "string, required, non-empty after trim",
  "description": "string, optional — omit or send '' for blank",
  "assignee": "string, required, non-empty after trim",
  "priority": "low | medium | high, optional (defaults to medium)",
  "dueDate": "string 'YYYY-MM-DD', optional — omit or send '' for blank",
  "status": "todo | in-progress | done, optional (defaults to todo)"
}
```

**Response — success**: `201 Created`

```json
{ "success": true, "data": { "id": "...", "title": "...", "...": "..." }, "message": null }
```

**Response — validation error** (spec FR-003): `400 Bad Request`

```json
{ "success": false, "data": null, "message": "<description of the first failing field>" }
```

## `PUT /api/tasks/:id`

**Purpose**: Update any subset of a task's fields — used both for a full edit (spec FR-005,
User Story 3) and for the drag-and-drop status-only move (spec FR-006, User Story 4), which
sends `{ "status": "<newStatus>" }` only. Per `research.md`, this one endpoint intentionally
serves both cases.

**Request body**: same shape as `POST`, but every field is optional; only the fields present
are validated and changed. An empty body `{}` is accepted and is a no-op (still returns `200`
with the task unchanged except `updatedAt`... see Note below).

**Note on the no-persist rule (spec FR-007)**: the frontend MUST NOT call this endpoint at all
when a task is dropped back onto its current column — the "no unnecessary save" rule is
enforced by not sending the request, not by the backend detecting a no-op `status` value.

**Response — success**: `200 OK`

```json
{ "success": true, "data": { "id": "...", "title": "...", "...": "..." }, "message": null }
```

**Response — validation error**: `400 Bad Request` (same shape as `POST`'s validation error)

**Response — not found**: `404 Not Found` (same shape as `GET /api/tasks/:id`'s not-found)

## `DELETE /api/tasks/:id`

**Purpose**: Permanently delete a task (spec FR-008, User Story 5).

**Response — success**: `200 OK`

```json
{ "success": true, "data": { "id": "<deleted task id>" }, "message": null }
```

**Response — not found**: `404 Not Found` (same shape as above)

## Fallback contracts (unchanged from Phase 1)

Unknown routes → `404` with `"Route not found"`; unhandled server errors → `500` with the
error description — both via the same `notFound`/`errorHandler` middleware Phase 1 already
built (`contracts/health.md` in `specs/001-backend-foundation/`, reused verbatim here).
