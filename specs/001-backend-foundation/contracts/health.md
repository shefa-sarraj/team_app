# Contract: Health Check

Adhering to the unified API standards described in `specs/plan.md` §4.1.

## `GET /api/health`

**Purpose**: Confirm the backend service is running and able to reach the database
(spec FR-001).

**Request**: No parameters, no body, no auth (authentication is permanently out of scope,
spec FR-007).

**Response — success** (database reachable): `200 OK`

```json
{
  "success": true,
  "data": { "status": "ok" },
  "message": null
}
```

**Response — failure** (database unreachable): `503 Service Unavailable`

```json
{
  "success": false,
  "data": null,
  "message": "Database connection unavailable"
}
```

**Notes**:
- The database connectivity check MUST be performed at request time (e.g., a lightweight
  Prisma query), not cached from server startup — spec Edge Cases: "the health check must
  reflect the current connection state at the time it is called."
- No other outcome is defined for this endpoint in this phase.

## Fallback contract: unknown routes

Any request to a path not defined above (there are no other routes in this phase) MUST
receive, per spec FR-008:

**Response**: `404 Not Found`

```json
{
  "success": false,
  "data": null,
  "message": "Route not found"
}
```

## Fallback contract: unexpected server errors

Any unhandled error caught by the centralized error middleware (Constitution Principle I)
MUST receive, per spec FR-009:

**Response**: `500 Internal Server Error`

```json
{
  "success": false,
  "data": null,
  "message": "<error description>"
}
```
