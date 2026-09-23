# Feature Specification: Backend Foundation & Project Setup

**Feature Branch**: `001-backend-foundation`

**Created**: 2026-09-16

**Status**: Draft

**Input**: User description: "Phase 1 — Backend Foundation & Project Setup, per specs/plan.md section 6 (row 1) and adhering to the unified API standards described in plan.md section 4.1. Stand up a working Express server connected to PostgreSQL (Neon) via Prisma, with the unified response/error contract and no business logic yet. Scope: Express app skeleton; Prisma Client connection to PostgreSQL (prisma/schema.prisma + prisma migrate dev); env config (PORT, DATABASE_URL, NODE_ENV, CLIENT_ORIGIN); folder structure per plan.md section 7; centralized error middleware; unified response helper; CORS for CLIENT_ORIGIN; GET /api/health endpoint. Out of scope: any Task model/endpoints, any frontend changes, authentication (permanently out of scope). No dependencies (first phase). Completion criteria: server boots and connects to PostgreSQL via Prisma, GET /api/health returns the unified success envelope via Postman."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Verify the Backend Is Alive and Connected to Real Storage (Priority: P1)

As a developer building the next phases of this migration (Task CRUD in Phase 2, filtering
in Phase 3), I need a running backend service that is genuinely connected to a persistent
database, so that I can start building real, persisted features on top of it instead of the
current hardcoded mock data — and so that every later phase inherits one consistent way of
calling the backend and reading its responses.

**Why this priority**: Every subsequent phase (Task CRUD, filtering) depends on this
foundation existing and being trustworthy. Without a verified, connected backend, no other
phase can begin — this is the single dependency the entire migration roadmap in
`specs/plan.md` §6 sits on top of.

**Independent Test**: Can be fully tested by starting the backend service and requesting its
health status from an API client (e.g., Postman) — it delivers value by proving the service
is running, correctly configured, and able to reach the real database, with zero Task-related
functionality required to demonstrate this.

**Acceptance Scenarios**:

1. **Given** the backend service is started with valid configuration and a reachable
   database, **When** its health status is requested, **Then** the response confirms the
   service is healthy and reports success using the project's one standard response format.
2. **Given** the backend service is started but the database is unreachable, **When** its
   health status is requested, **Then** the response clearly reports failure (not a false
   "healthy") using the project's one standard error format, with an appropriate error status
   code.
3. **Given** the frontend application (running on its own origin) calls the backend health
   status, **When** the request is made from the browser, **Then** it is not blocked by
   cross-origin restrictions.

---

### Edge Cases

- What happens when required configuration (e.g., the database connection string) is missing
  entirely at startup? The service must fail fast with a clear, logged error rather than
  starting in a broken state that only fails later on first request.
- What happens when the database is reachable at startup but becomes unreachable later? The
  health check must reflect the current connection state at the time it is called, not a
  cached "was healthy once" result.
- What happens when a client requests a path that doesn't exist yet (no other endpoints exist
  in this phase)? The service must return a consistent not-found response using the same
  standard response format, not a framework-default HTML error page.
- What happens when the frontend's origin differs from what is configured as allowed? The
  request must be rejected by the cross-origin policy rather than silently allowed.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The backend service MUST expose a single way to check whether it is running and
  able to reach the database ("health status"), reachable by any HTTP client.
- **FR-002**: Every response the backend returns, in this phase and all future phases, MUST
  use exactly one of two shapes: a success shape carrying the result, or a failure shape
  carrying a human-readable message — never a mix of the two, and never a success shape used
  to report an error.
- **FR-003**: The backend MUST use correct, consistent HTTP status codes to reflect the actual
  outcome of a request (e.g., healthy vs. unreachable database vs. unknown route), never
  reporting an error inside a "successful" (200) response.
- **FR-004**: The backend MUST fail to start, with a clear diagnostic message, if required
  configuration (database connection, listening port) is missing or invalid — it must never
  start in a state where it appears available but cannot actually serve requests correctly.
- **FR-005**: The backend MUST reject cross-origin requests from any origin other than the
  frontend's configured origin.
- **FR-006**: The backend MUST NOT expose any Task-related capability (list, create, update,
  delete, or filter) in this phase — those are explicitly deferred to later phases.
- **FR-007**: The backend MUST NOT implement or expose any authentication or user-identity
  capability — permanently out of scope for this entire migration, not just this phase.
- **FR-008**: Any request to a path the backend does not recognize MUST receive the same
  standard failure shape (FR-002) with a "not found" outcome, not a framework default page.
- **FR-009**: All backend-side error conditions in this phase (startup failure, unreachable
  database, unknown route) MUST be surfaced through one consistent, centralized handling path
  rather than being handled ad hoc in different places.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A developer can confirm the backend is running and connected to the database in
  a single request, with no additional setup steps beyond documented configuration.
- **SC-002**: 100% of responses from the backend in this phase (health check, and any
  not-found request) conform to exactly one of the two standard response shapes — verified by
  inspecting every response during manual testing.
- **SC-003**: When the database is intentionally made unreachable, the health status reflects
  that failure within a single request — never reporting healthy while the database is down.
- **SC-004**: The frontend application can call the backend's health status from its own
  origin with zero cross-origin errors, while a request from an unlisted origin is rejected.
- **SC-005**: Restarting the backend with missing required configuration produces an
  immediate, readable startup failure — not a silent hang or a crash with no explanation.

## Assumptions

- "Users" of this phase are the developers/operators building and verifying the migration,
  not the end users of the task board — no end-user-facing behavior changes in this phase, per
  `specs/plan.md` §6 (Phase 1 has no corresponding frontend behavior to verify).
- The database referenced throughout is the same PostgreSQL instance already decided in
  `specs/plan.md` §4 (hosted on Neon); provisioning that instance and obtaining its connection
  string is assumed to happen outside this spec, as an environment/configuration concern.
- No Task data, schema, or endpoint exists yet — this phase proves connectivity and the
  response contract only, per the explicit "Out of Scope" list in `specs/plan.md` §6 row 1.
- The frontend's allowed origin is known and stable for local development; production origin
  configuration is out of scope for this phase.
