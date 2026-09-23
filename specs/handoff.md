# Handoff — Backend Migration Planning (team-app)

## Project
- Path: `C:\Users\hp\Desktop\team-app`
- React 19 + Vite + Tailwind 4 task board app, currently 100% mock data (`src/data/mockData.js`).
- Not a git repo yet.

## Done so far
1. Full project scan completed (every file in `src/` read). Findings written to `specs/plan.md`:
   - One model only: `Task`. No relationships, no auth, no routing, no roles anywhere in the app.
   - `specs/plan.md` follows the required structure: Overview, Discovered Models, Business Rules, Technical Decisions (+ 4.1 API standards contract), Ambiguities, Phases table, Folder structure, Change Log.
2. All 5 original ambiguities in `specs/plan.md` §5 are **RESOLVED** (see Change Log entries #1 and #2 at the bottom of the file):
   - **DB**: PostgreSQL (switched from an initial MongoDB draft) + **Prisma**, hosted on **Neon**.
   - **assignee**: stays a plain free-text string — no User/Team model, no relation.
   - **Auth**: permanently out of scope for this migration — no auth phase anywhere in the roadmap.
   - **Empty `description`/`dueDate`**: stored as literal `''` (never `null`/omitted). `dueDate` is deliberately a `TEXT` column, not a native `DATE`, so `''` doesn't hit type coercion. Overdue logic stays 100% client-side (`isOverdue()`).
   - **Pagination/sorting**: deferred indefinitely — Phase 3 only supports `priority`/`assignee` filtering, no `page`/`limit`/`sort`.
   - **Error UX** (bonus, from the missing error-state note): failed API calls surface as **toast notifications** — added to Phase 2 scope (`useTasks.js` gets an `error` state + new `Toast.jsx`).
3. `specs/plan.md` §6 has 3 phases defined: (1) backend foundation/Prisma+Postgres setup — infra only, no frontend rewiring since nothing exists to replace yet, (2) Task CRUD + frontend rewiring + toast error state, (3) backend-side filtering + frontend rewiring, no pagination.
4. **spec-kit installed** into this project via `uv`/`uvx` (`uv` binary is at `C:\Users\hp\.local\bin\uv.exe` — not yet on this session's PATH, may need `export PATH="$PATH:/c/Users/hp/.local/bin"` in Bash or a fresh shell in PowerShell):
   - Command used: `uvx --from git+https://github.com/github/spec-kit.git specify init --here --force --non-interactive --integration claude --ignore-agent-tools`
   - Installed `.claude/skills/speckit-*` (constitution, specify, plan, tasks, implement, clarify, analyze, checklist, converge, taskstoissues) and `.specify/` (templates, scripts, memory, workflows).
   - **Known issue**: the skill list for a running session is loaded at session start, so a session open *before* spec-kit was installed can't see the new `/speckit-*` skills (confirmed: both the slash command and calling the Skill tool directly failed with "unknown"). **This is exactly why a new session is needed** — the new session should have `/speckit-constitution` etc. available from the start.

## Done in latest session
5. Verified `/speckit-*` skills are recognized in a fresh session (confirmed via the session's skill listing).
6. Ran `/speckit-constitution` with no extra user input — derived all 5 principles from `specs/plan.md` (§1, §2, §4, §4.1, §5, §6) and the handoff's permanent living-plan rule. Wrote `.specify/memory/constitution.md` v1.0.0 (ratified 2026-09-16):
   - **I. Unified API Contract (NON-NEGOTIABLE)** — codifies plan.md §4.1 verbatim (layering, response envelope, status codes, centralized error handling, validation-before-logic, naming, self-documentation).
   - **II. Living Plan Document** — codifies the handoff's permanent rule that `specs/plan.md` is updated immediately, not deferred.
   - **III. Scope Discipline (YAGNI)** — auth/roles/User model/pagination/sorting stay permanently out of scope; re-adding any requires amending plan.md §5 first.
   - **IV. Schema-First Data Integrity** — `prisma/schema.prisma` as source of truth, enum `@map` rule, literal `''` never `null` for blank `description`/`dueDate`.
   - **V. Frontend-Backend Parity Per Phase** — every phase pairs backend+frontend in the same phase (Phase 1 stays the justified infra-only exception), two-part verification before a phase is marked done.
   - Plus "Technology Stack Constraints" and "Development Workflow" sections, and a Governance section tying amendments back to `/speckit-constitution` and semver.
   - No `.specify/extensions.yml` exists, so no pre/post hooks were checked/run — confirmed by listing `.specify/` (no hooks to note).

## Done in latest session (continued)
7. Ran `/speckit-specify` for Phase 1. No `.specify/extensions.yml` exists, so no hooks fired.
   - Feature directory: `specs/001-backend-foundation/` (sequential numbering per `.specify/init-options.json`, first feature).
   - Wrote `specs/001-backend-foundation/spec.md` — framed the "user" as the developer/operator
     verifying the service (documented explicitly in Assumptions, since Phase 1 has no end-user
     behavior per `specs/plan.md` §6's own note). 1 user story (P1: verify backend alive +
     connected to real DB), 4 edge cases, 9 functional requirements (FR-001..FR-009), 5 success
     criteria (SC-001..SC-005). Zero `[NEEDS CLARIFICATION]` markers — everything relevant was
     already resolved in `specs/plan.md` §5 before this spec was written.
   - Wrote `specs/001-backend-foundation/checklists/requirements.md` — **all items passed on the
     first validation pass**, no iteration needed.
   - Wrote `.specify/feature.json` → `{"feature_directory": "specs/001-backend-foundation"}` so
     `/speckit-plan`/`/speckit-tasks` can find this feature without relying on git branch (project
     still has no git repo).

## Done in latest session (continued further)
8. Ran `/speckit-plan` for `specs/001-backend-foundation/`. Constitution Check gate: **all 5 principles PASS**, no violations, Complexity Tracking table not needed. Generated:
   - `specs/001-backend-foundation/plan.md` — Technical Context filled with zero `NEEDS CLARIFICATION` (all decisions already fixed by `specs/plan.md` §4 / constitution); Structure Decision: new `backend/` dir at repo root, sibling to existing untouched frontend, layered `routes→controllers→middlewares` (no `services/` yet — nothing to hold there until Phase 2's Task service).
   - `research.md` — no open unknowns; documents the already-made stack decisions (Express, Prisma+Neon, no test framework yet, CORS via allow-listed `CLIENT_ORIGIN`, centralized error handling introduced now) in Decision/Rationale/Alternatives form.
   - `data-model.md` — no domain entities this phase (Task deferred to Phase 2); documents the model-less `prisma/schema.prisma` (datasource+generator only) and the 4 required env vars.
   - `contracts/health.md` — full request/response contract for `GET /api/health` (200 success / 503 db-down), plus the shared 404 and 500 fallback envelopes.
   - `quickstart.md` — 5 runnable validation scenarios matching the spec's 3 acceptance scenarios + edge cases + SC-001..SC-005.

## Done in latest session (continued further still)
9. Ran `/speckit-tasks` for `specs/001-backend-foundation/`. Generated `tasks.md`: 18 tasks
   total (T001-T018), single user story (US1/P1) since this feature only has one — Setup (3
   tasks) → Foundational (9 tasks, T004-T012) → User Story 1 (3 tasks, T013-T015: health
   controller → route → wiring) → Polish (3 tasks: npm scripts, run `quickstart.md`
   validation, then update `specs/plan.md` §6 row 1 Status to `done` per Constitution
   Principle II). No test tasks generated — `research.md` already decided no automated test
   framework this phase, and neither spec nor plan requested TDD.
   Auto mode was exited by the system right after this — session is now in
   more-interactive/ask-before-assuming mode.

## Next step for the new session (or next turn in this one)
1. **Before running `/speckit-implement`**: this will run `npm install` inside a new
   `backend/` folder (express, @prisma/client, cors, dotenv, prisma) — confirm with the user
   first per the standing "don't install any library/dependency without asking" preference
   (see below), even though spec-kit itself was pre-approved.
2. **Also needed before implementation can be fully verified**: an actual Neon PostgreSQL
   `DATABASE_URL` connection string for `backend/.env` — ask the user if they already
   provisioned a Neon project, or need help creating one, since `quickstart.md`'s validation
   scenarios (T017) require a real reachable database.
3. Once both are confirmed, run `/speckit-implement` for `specs/001-backend-foundation/`,
   then execute `quickstart.md` manually (T017) and update `specs/plan.md` §6 row 1 (T018).
4. After Phase 1 fully lands, repeat the `/speckit-specify` → `/speckit-plan` →
   `/speckit-tasks` → `/speckit-implement` cycle for Phase 2 (Task CRUD + Frontend Rewiring).
3. Remember the **permanent rule** (now also Constitution Principle II): `specs/plan.md` (the top-level migration plan, distinct from the per-feature `specs/001-backend-foundation/plan.md` that `/speckit-plan` will create) is a living file — any flaw/scope change discovered during `specify/clarify/plan/tasks/analyze/implement` must be reflected back into it immediately (new Change Log entry, updated Status column), not deferred.
4. Before implementing, re-check new work against the 5 constitution principles in `.specify/memory/constitution.md` (especially III: don't add auth/roles/pagination/User-model even incidentally).
5. After Phase 1 fully lands (`/speckit-implement` done + both completion criteria verified), update `specs/plan.md` §6 Status column for row 1 from `planned` to `done`, then repeat the `/speckit-specify` → ... → `/speckit-implement` cycle for Phase 2 (Task CRUD + Frontend Rewiring).

## User preferences observed this session
- Don't install any library/dependency without asking first, **except** the user has now explicitly approved spec-kit's installation and its `uv` prerequisite — no need to re-ask about those two specifically.
- User prefers direct explanations in Arabic (Levantine dialect) for chat replies; code/docs content itself stays in English/technical style.
