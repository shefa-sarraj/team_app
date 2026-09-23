# Phase 1 Data Model: Task CRUD + Frontend Rewiring

## `Task` (new — first domain entity in this migration)

Fields, exactly as fixed in `specs/plan.md` §2:

| Field | Prisma Type | Required? | Notes |
|---|---|---|---|
| `id` | `String @id @default(uuid())` | required | DB-generated (`uuid()`), replacing the client-side `crypto.randomUUID()` currently in `useTasks.js`. |
| `title` | `String` | required | Non-empty after trim — enforced by Zod on create/update. |
| `description` | `String` | optional-value, always-present column | Stored as literal `''` when left blank — never `null`, never omitted (spec FR-004, Constitution Principle IV). Prisma field itself is non-nullable with a default of `""`. |
| `assignee` | `String` | required | Plain free-text field — no relation, no foreign key (spec FR-016). Non-empty after trim — enforced by Zod. |
| `priority` | `Priority` (enum) | required | `low \| medium \| high`. Defaults to `medium` to match the existing `TaskForm.jsx` default. |
| `dueDate` | `String` (`@db.Text`) | optional-value, always-present column | Deliberately `TEXT`, not a native `DATE` — stored as literal `''` when left blank, same reasoning as `description`. Format `YYYY-MM-DD` when populated. |
| `status` | `Status` (enum) | required | `todo \| IN_PROGRESS @map("in-progress") \| done`. Defaults to `todo`, matching `TaskForm.jsx`. |
| `createdAt` | `DateTime @default(now())` | required | DB-generated once, at creation. |
| `updatedAt` | `DateTime @updatedAt` | required | DB-bumped automatically on every field change, including a status-only move. |

Relationships: **none** — matches `specs/plan.md` §2 ("Relationships: none").

### Prisma schema addition

```prisma
enum Priority {
  low
  medium
  high
}

enum Status {
  todo
  IN_PROGRESS @map("in-progress")
  done
}

model Task {
  id          String   @id @default(uuid())
  title       String
  description String   @default("")
  assignee    String
  priority    Priority @default(medium)
  dueDate     String   @default("") @db.Text
  status      Status   @default(todo)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

This is added to the existing model-less `prisma/schema.prisma` from Phase 1 (its `datasource`
and `generator` blocks are untouched); applied via `prisma migrate dev --name add_task_model`.

## Validation rules (enforced by Zod, per `research.md`)

| Rule | Applies to | Source |
|---|---|---|
| `title`: required, non-empty after trim | create, update (if present) | spec FR-002, FR-003 |
| `assignee`: required, non-empty after trim | create, update (if present) | spec FR-002, FR-003 |
| `description`: string, may be `''`, never rejected for being blank | create, update (if present) | spec FR-004 |
| `dueDate`: string, may be `''`, never rejected for being blank | create, update (if present) | spec FR-004 |
| `priority`: must be one of `low \| medium \| high` if present | create, update (if present) | `specs/plan.md` §2 |
| `status`: must be one of `todo \| in-progress \| done` if present | create, update (if present) | `specs/plan.md` §2 |
| Update body: every field optional, but at least the fields being changed must be valid per the rules above; an empty body is accepted as a no-op | update only | supports the status-only drag-and-drop move (spec User Story 4) |

## State transitions

`status` moves freely between `todo`, `in-progress`, and `done` in any direction (the board's
drag-and-drop allows dropping a card into any column) — no restricted transition graph exists
in the current UI (`BoardColumn.jsx` accepts a drop from any column into any other). Dropping a
card back onto its current column MUST NOT trigger a persistence call or bump `updatedAt` (spec
FR-007) — this is a frontend-side guard in `useTasks.moveTask`, not a backend rule, since the
backend's `PUT` treats "no changed fields" as a valid no-op update per the row above.
