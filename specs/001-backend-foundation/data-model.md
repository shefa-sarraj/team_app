# Phase 1 Data Model: Backend Foundation & Project Setup

## No domain entities in this phase

This feature introduces no domain model. The `Task` entity (fields, enums, relationships)
is fully specified in `specs/plan.md` §2 and is explicitly deferred to Phase 2
(`specs/plan.md` §6 row 2) — introducing it here would violate Constitution Principle III
(Scope Discipline) and spec FR-006 ("The backend MUST NOT expose any Task-related
capability... in this phase").

## `prisma/schema.prisma` in this phase

Only the Prisma configuration itself is established now, with no model blocks:

- `datasource db`: provider `postgresql`, `url = env("DATABASE_URL")` (the Neon connection
  string, `?sslmode=require`, per `specs/plan.md` §4).
- `generator client`: standard `prisma-client-js` generator.

This lets `backend/src/config/db.js` construct a working `PrismaClient` and verify
connectivity (used by the health check, FR-001) without any table existing yet. Running
`prisma migrate dev` against this model-less schema is expected to succeed with zero
migrations, proving the connection is live — the first real migration is created in Phase 2
when the `Task` model is added.

## Configuration "entity" (not a data model — process configuration only)

For completeness, the environment configuration this phase depends on (validated by
`backend/src/config/env.js` per FR-004's fail-fast requirement):

| Variable | Required | Purpose |
|---|---|---|
| `PORT` | yes | Port the Express server listens on |
| `DATABASE_URL` | yes | Neon PostgreSQL connection string (`?sslmode=require`), read by Prisma |
| `NODE_ENV` | yes | Standard Node environment flag (`development`/`production`) |
| `CLIENT_ORIGIN` | yes | Exact frontend origin allowed by CORS (FR-005) — no wildcard |

This is configuration, not a persisted entity — it is documented here only because the
template calls for entity extraction and this phase has no other candidate.
