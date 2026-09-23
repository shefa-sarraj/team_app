# Phase 1 Data Model: Filtering, Assignee Aggregation & Frontend Rewiring

## No new or changed domain entities

This phase introduces no new Prisma model, field, or enum. The existing `Task` model and its
`Priority`/`Status` enums (`specs/002-task-crud-frontend/data-model.md`) are the only schema
this phase reads — it adds two new *query shapes* over that same table, not new stored data.

## Query shape 1: Filtered list (extends `GET /api/tasks`)

| Query param | Required? | Validation | Effect |
|---|---|---|---|
| `priority` | no | must be one of `low \| medium \| high` if present | adds `WHERE priority = <value>` |
| `assignee` | no | any non-empty string if present | adds `WHERE assignee = <value>` (exact match) |
| anything else (`page`, `limit`, `sort`, …) | — | stripped by the query schema (see `research.md`) | no effect — silently ignored |

When both `priority` and `assignee` are present, both conditions apply together (SQL `AND`),
per spec FR-001. When neither is present, the query is unfiltered (`findMany()` with no
`where`), per spec FR-002 — identical to Phase 2's existing behavior.

## Query shape 2: Assignee aggregation (new `GET /api/tasks/assignees`)

A `SELECT DISTINCT assignee FROM "Task" ORDER BY assignee ASC`-equivalent Prisma call
(`findMany({ distinct: ['assignee'], select: { assignee: true }, orderBy: { assignee: 'asc' } })`),
mapped to a plain `string[]` response. This query never applies the `priority`/`assignee`
filter from query shape 1 — it always reflects every task in storage, per spec User Story 2 and
FR-004.

## State/consistency notes

- Neither query shape changes any stored data — both are read-only.
- The assignee aggregation is a live query (not cached), so a newly created/edited task's
  assignee value appears the next time `GET /api/tasks/assignees` is called — no separate
  refresh mechanism is needed to satisfy spec FR-005.
- The `Task.updatedAt`/`createdAt` fields are unaffected by either query.
