<!--
Sync Impact Report
- Version change: [none — template] → 1.0.0 (initial ratification)
- Modified principles: n/a (first concrete draft, all 5 slots newly defined)
  - [PRINCIPLE_1_NAME] → I. Unified API Contract (NON-NEGOTIABLE)
  - [PRINCIPLE_2_NAME] → II. Living Plan Document
  - [PRINCIPLE_3_NAME] → III. Scope Discipline (YAGNI)
  - [PRINCIPLE_4_NAME] → IV. Schema-First Data Integrity
  - [PRINCIPLE_5_NAME] → V. Frontend-Backend Parity Per Phase
- Added sections: "Technology Stack Constraints" (was [SECTION_2_NAME]),
  "Development Workflow" (was [SECTION_3_NAME])
- Removed sections: none
- Templates requiring updates: none checked yet — no dependent
  plan/spec/tasks templates have been generated for this feature set.
- Deferred placeholders: none — all values derived from
  specs/plan.md (sections 1, 4, 4.1, 6) and this session's handoff notes.
-->

# team-app Backend Migration Constitution

## Core Principles

### I. Unified API Contract (NON-NEGOTIABLE)
Every backend module MUST follow `route → controller → service → (repository/model)`
layering; controllers MUST contain no business logic and only translate a request
into a service call and a response. Every endpoint MUST return the unified envelope
`{ "success": true, "data": {...}, "message": null }` on success and
`{ "success": false, "data": null, "message": "<description>" }` on failure — never a
mixed shape. HTTP status codes MUST be used correctly and consistently (200/201
success, 400 input errors, 401/403 authorization, 404 not found, 500 server errors);
returning 200 with an embedded error is a violation. A single centralized
error-handling middleware MUST catch all unexpected errors — no per-route,
inconsistently-styled try/catch blocks. Input validation MUST run in a dedicated
layer (middleware/schema) before any business logic executes. File and folder
naming MUST stay consistent across modules (`task.routes.js`, `task.controller.js`,
`task.service.js`, …) so every new module follows the same template. Every endpoint
MUST be self-documented in its phase's spec (path, method, input shape, output
shape, possible errors) before it is implemented.
Rationale: this project has exactly one contract (specs/plan.md §4.1) that every
phase must reference explicitly; without a single non-negotiable standard, a
single-resource backend built phase-by-phase would drift into inconsistent
per-endpoint conventions.

### II. Living Plan Document
`specs/plan.md` is the single source of truth for discovered models, business
rules, technical decisions, and phase scope. Any flaw, ambiguity, or scope change
discovered during `/speckit-specify`, `/speckit-clarify`, `/speckit-plan`,
`/speckit-tasks`, `/speckit-analyze`, or `/speckit-implement` MUST be written back
into `specs/plan.md` immediately as a new dated Change Log entry (with the
relevant section and Status column updated) — never silently deferred or left only
in a spec/tasks file. No information already recorded in `specs/plan.md` may be
deleted; superseded content is annotated with its resolution, not removed.
Rationale: this migration spans multiple phases and tool sessions; a plan that
falls out of sync with reality defeats the purpose of planning it up front.

### III. Scope Discipline (YAGNI)
Build only what the discovered UI in `src/` actually exercises. Authentication,
authorization, user/team/role models, pagination, and sorting are permanently out
of scope for this migration (not deferred) because no corresponding UI, router, or
control exists in the frontend today. `assignee` stays a plain free-text field,
never a foreign key. Introducing any of the above requires first amending
`specs/plan.md` §5 with a new resolved ambiguity and this constitution's own
amendment procedure — it may never be added silently inside a phase's
implementation.
Rationale: `specs/plan.md` §1 rates this migration's complexity as low precisely
because it is a single-resource system; speculative infrastructure for models,
auth, or list controls that don't exist in the UI would contradict that
assessment and the user's explicit resolutions in §5.

### IV. Schema-First Data Integrity
`prisma/schema.prisma` is the single source of truth for the data model — no
parallel hand-maintained model definitions. Enum identifiers MUST map 1:1 to the
frontend's wire values, using `@map(...)` where the two diverge (e.g. Prisma's
`IN_PROGRESS` mapped to the wire value `"in-progress"`) so the API never forces a
frontend contract change. Optional fields left blank by the user (`description`,
`dueDate`) MUST be persisted as a literal empty string `''`, never `null` or
omitted; `dueDate` MUST remain a `TEXT` column rather than a native `DATE` type
specifically to support this without implicit coercion.
Rationale: these are direct, previously-resolved decisions in `specs/plan.md` §2
and §5 (ambiguity #3); re-deciding them per-phase would reintroduce ambiguity the
user already closed.

### V. Frontend-Backend Parity Per Phase
Except for a phase that is justified as infrastructure-only because no
corresponding UI behavior exists yet to verify (e.g. Phase 1), every phase MUST
pair its backend work with the frontend rewiring that consumes it in the same
phase — never landing an endpoint with no frontend caller, or rewiring the
frontend against an endpoint that doesn't exist yet. Each phase's completion
criterion MUST be verified two ways before being marked done: (1) the endpoint(s)
directly, and (2) the running app, confirming behavior identical to the
pre-migration mock-data version (including a forced-failure path surfacing a
toast, per Phase 2).
Rationale: matches the phase table already defined in `specs/plan.md` §6 and
prevents "backend done, frontend still on mock data" or the reverse from ever
being called complete.

## Technology Stack Constraints

Backend: Node.js + Express, layered per Principle I. Database: PostgreSQL hosted
on Neon (serverless Postgres), accessed exclusively through Prisma as the ORM —
no raw SQL or a second data-access library introduced alongside it. Validation:
Zod, applied as Express middleware ahead of controllers. Environment variables are
limited to `PORT`, `DATABASE_URL` (Neon connection string, `?sslmode=require`),
`NODE_ENV`, and `CLIENT_ORIGIN` (required because `vite.config.js` has no dev
proxy, so CORS is handled explicitly server-side) unless a new one is justified in
`specs/plan.md` first. Frontend stack (React 19 + Vite + Tailwind CSS 4) is fixed
for the duration of this migration — this is a backend migration, not a frontend
rewrite, and no frontend framework/library swap is in scope.

## Development Workflow

Each phase from `specs/plan.md` §6 is carried through the Spec Kit pipeline in
order: `/speckit-specify` → `/speckit-plan` → `/speckit-tasks` →
(`/speckit-clarify` / `/speckit-analyze` optional) → `/speckit-implement`. A
phase's spec MUST explicitly reference "the unified API standards described in
plan.md section 4.1" and MUST NOT begin implementation before its dependencies
(the `Dependencies` column in `specs/plan.md` §6) are marked complete. Before any
phase is marked `done` in the Status column, both completion criteria in its row
(endpoint-level and running-app-level) MUST have been verified, not merely
implemented.

## Governance

This constitution supersedes any conflicting ad-hoc practice adopted during a
single phase. Amendments are made only via `/speckit-constitution`, follow
semantic versioning (MAJOR: incompatible principle removal/redefinition; MINOR:
new principle or materially expanded guidance; PATCH: wording/clarification), and
require a Sync Impact Report describing what changed. Every `/speckit-plan` and
`/speckit-implement` pass MUST verify its output against these principles before
being marked complete; a violation discovered later is corrected under Principle
II (recorded in `specs/plan.md`'s Change Log) rather than left unresolved.

**Version**: 1.0.0 | **Ratified**: 2026-09-16 | **Last Amended**: 2026-09-16
