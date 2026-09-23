# Contract: Task Filtering & Assignee Aggregation

Adhering to the unified API standards described in `specs/plan.md` §4.1. Both endpoints reuse
the envelope from `specs/002-task-crud-frontend/contracts/tasks.md` — success:
`{ "success": true, "data": {...}, "message": null }`, failure:
`{ "success": false, "data": null, "message": "<description>" }`.

## `GET /api/tasks` (extended)

**Purpose**: List tasks, optionally narrowed by `priority` and/or `assignee` (spec FR-001,
FR-002). This replaces Phase 2's unfiltered-only behavior; calling it with no query params is
unchanged from Phase 2.

**Query parameters** (all optional):

| Param | Type | Notes |
|---|---|---|
| `priority` | `low \| medium \| high` | invalid value → `400` (same validation-error shape as create/update) |
| `assignee` | string | exact match against the stored value; any string accepted |

Any other query parameter present (`page`, `limit`, `sort`, etc.) is silently ignored — see
`research.md`.

**Response — success**: `200 OK`

```json
{ "success": true, "data": [ { "id": "...", "title": "...", "...": "..." } ], "message": null }
```

`data` is `[]` (not an error) when no tasks match. Both `priority` and `assignee` given together
apply as a logical AND (spec FR-001, Acceptance Scenario 3).

**Response — invalid `priority`**: `400 Bad Request`

```json
{ "success": false, "data": null, "message": "Invalid enum value. Expected 'low' | 'medium' | 'high', received '<value>'" }
```

## `GET /api/tasks/assignees` (new)

**Purpose**: Return the distinct list of every assignee name across all tasks, independent of
any `priority`/`assignee` filter (spec User Story 2, FR-004, FR-005). No query parameters.

**Response — success**: `200 OK`

```json
{ "success": true, "data": ["Alice", "Bob", "Carol"], "message": null }
```

`data` is `[]` (not an error) when no tasks exist yet. The list is sorted alphabetically and
contains no duplicates.

## Fallback contracts (unchanged from Phases 1-2)

Unknown routes → `404` with `"Route not found"`; unhandled server errors → `500` with the error
description — via the same `notFound`/`errorHandler` middleware already built.
