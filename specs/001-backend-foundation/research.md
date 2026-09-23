# Phase 0 Research: Backend Foundation & Project Setup

No items in this feature's Technical Context were marked `NEEDS CLARIFICATION` — every
technology decision needed for this phase was already made and recorded in
`specs/plan.md` §4 (Technical Decisions) before this feature's spec was written, and is
now also locked in by the Constitution's "Technology Stack Constraints" section. This file
consolidates those decisions in the Decision/Rationale/Alternatives format for traceability,
rather than performing new research.

## Decision: Backend framework — Express

**Rationale**: Matches the task brief and `specs/plan.md` §1 ("Chosen stack: Node.js +
Express backend"); minimal, unopinionated, and sufficient for a single-resource API with a
handful of routes — no heavier framework is justified by the scope in `specs/plan.md` §1
(complexity rated "low").

**Alternatives considered**: None — this was a given constraint from the original task
brief, not an open choice for this migration.

## Decision: ORM — Prisma, against PostgreSQL hosted on Neon

**Rationale**: `specs/plan.md` §4 already resolved this (originally MongoDB/Mongoose, then
changed to PostgreSQL/Prisma per user decision): type-safe schema-first modeling, native
enum support for the `Task` model's `priority`/`status` fields (needed starting Phase 2),
and a straightforward migration workflow (`prisma migrate`). Neon was chosen as the specific
hosting provider (`specs/plan.md` §4, Change Log entry #2) so no local PostgreSQL install is
needed — Prisma connects to it like any standard Postgres instance via `DATABASE_URL`
(`?sslmode=require`).

**Alternatives considered**: MongoDB + Mongoose (rejected — see `specs/plan.md` §4 reasoning:
no relational complexity remains once `assignee` stays a plain string, so MongoDB's
flat-document advantage no longer applies); raw `pg`/node-postgres and TypeORM (rejected —
more boilerplate or less native fit for a schema this small).

## Decision: No automated test framework introduced in this phase

**Rationale**: `specs/plan.md` §6 row 1's completion criteria are Postman-verified manual
checks; no phase in `specs/plan.md` calls for an automated test suite. Introducing one now,
unrequested, would violate Constitution Principle III (Scope Discipline / YAGNI).

**Alternatives considered**: Jest/Vitest + Supertest — deferred indefinitely unless a future
change to `specs/plan.md` explicitly adds automated testing to scope.

## Decision: CORS via the `cors` package, allow-listing `CLIENT_ORIGIN` only

**Rationale**: `specs/plan.md` §4 notes `vite.config.js` has no dev proxy configured, so the
frontend (a different origin/port) needs explicit CORS support; restricting to exactly
`CLIENT_ORIGIN` (not a wildcard) satisfies spec FR-005 or the request must be rejected.

**Alternatives considered**: Wildcard `*` origin (rejected — spec FR-005 requires rejecting
non-configured origins, and a wildcard cannot express that); a Vite dev-server proxy
(rejected — would require editing `vite.config.js`, which is a frontend file, whereas
Constitution Principle V documents Phase 1 as touching no frontend file).

## Decision: Centralized error handling + a single response-envelope helper, introduced now

**Rationale**: Constitution Principle I (Unified API Contract, NON-NEGOTIABLE) requires this
for every phase; introducing the shared `ApiResponse`/`ApiError` helpers and the centralized
error middleware in Phase 1 — even though there's only one real endpoint to use them —
means Phase 2's Task endpoints reuse them instead of duplicating response-shaping logic.

**Alternatives considered**: Per-route manual response shaping, added later once more
endpoints exist (rejected — directly contradicts Constitution Principle I, which is marked
NON-NEGOTIABLE and applies "in this phase and all future phases" per spec FR-002).
