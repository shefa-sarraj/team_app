# Quickstart: Backend Foundation & Project Setup

Validates this feature end-to-end against the acceptance scenarios in
[spec.md](spec.md) and the contract in [contracts/health.md](contracts/health.md).

## Prerequisites

- Node.js (LTS) installed.
- A Neon PostgreSQL connection string (see `specs/plan.md` §4) — reachable over the network.
- `backend/.env` created from `backend/.env.example` with `PORT`, `DATABASE_URL`, `NODE_ENV`,
  `CLIENT_ORIGIN` all set (see [data-model.md](data-model.md) configuration table).

## Setup

```bash
cd backend
npm install
npx prisma migrate dev --name init
```

Expect: the model-less `prisma/schema.prisma` (see [data-model.md](data-model.md)) applies
with zero table migrations, proving Prisma can reach the configured `DATABASE_URL`.

## Run

```bash
npm run dev
```

Expect (spec FR-004): if `DATABASE_URL`, `PORT`, `NODE_ENV`, or `CLIENT_ORIGIN` is missing or
invalid, the server MUST fail to start immediately with a readable error — this is scenario
**SC-005**. Fix the `.env` and re-run before continuing.

## Validate — Acceptance Scenario 1: healthy service

With the database reachable, request the health endpoint (e.g., via Postman or):

```bash
curl -i http://localhost:PORT/api/health
```

Expect: `200 OK` with the exact success envelope from
[contracts/health.md](contracts/health.md) (**SC-001**, **SC-002**).

## Validate — Acceptance Scenario 2: database unreachable

Temporarily point `DATABASE_URL` at an unreachable host (or block network access to Neon),
restart the server, and repeat the health request.

Expect: `503 Service Unavailable` with the exact failure envelope from
[contracts/health.md](contracts/health.md) — never a `200` (**SC-003**).

## Validate — Acceptance Scenario 3: CORS

With the server running and `CLIENT_ORIGIN` set to the frontend's dev origin
(e.g., `http://localhost:5173`), open the frontend app in a browser and call
`GET /api/health` from its console (`fetch('http://localhost:PORT/api/health')`).

Expect: the request succeeds with no cross-origin error (**SC-004**). Repeat the same
`fetch` call from a different origin (e.g., a different port) and confirm it is rejected by
the browser's CORS policy.

## Validate — Edge case: unknown route

```bash
curl -i http://localhost:PORT/api/does-not-exist
```

Expect: `404 Not Found` with the fallback envelope from
[contracts/health.md](contracts/health.md), not a framework default HTML page (spec FR-008).

## Done

All five scenarios above passing is this feature's completion criterion
(`specs/plan.md` §6 row 1, completion criterion 1 — completion criterion 2 is not
applicable to this phase, since no frontend behavior exists yet to verify).
