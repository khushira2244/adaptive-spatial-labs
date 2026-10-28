# Backend Implementation Step 2 — Sources + Architecture

Date: 2026-10-25 (Asia/Calcutta). **COMPLETE — verified; stopped after Step 2.**

## Scope and outcome

Extended existing Group 1 Sources and implemented deterministic Architecture truth using the closed Step 1 write foundation. Architecture functions without AI through validated structured import, candidate corrections and owner confirmation. No parallel project structure was introduced.

Baseline before Step 2: 107 passing tests, including the 53 original Group 1 tests. Existing dirty/untracked Step 1, design documentation, images and workspace instructions predated this increment and are not reported as Step 2 changes.

## Exact files added

Paths are repository-relative. Exactly 21 files:

- [backend/src/app/domain-writes.ts](../backend/src/app/domain-writes.ts)
- [backend/src/app/step2.routes.ts](../backend/src/app/step2.routes.ts)
- [backend/src/modules/architecture/architecture.corrections.ts](../backend/src/modules/architecture/architecture.corrections.ts)
- [backend/src/modules/architecture/architecture.input.ts](../backend/src/modules/architecture/architecture.input.ts)
- [backend/src/modules/architecture/architecture.repository.ts](../backend/src/modules/architecture/architecture.repository.ts)
- [backend/src/modules/architecture/architecture.schema.ts](../backend/src/modules/architecture/architecture.schema.ts)
- [backend/src/modules/architecture/architecture.service.ts](../backend/src/modules/architecture/architecture.service.ts)
- [backend/src/modules/architecture/architecture.validation.ts](../backend/src/modules/architecture/architecture.validation.ts)
- [backend/src/modules/project-sources/provenance.contract.ts](../backend/src/modules/project-sources/provenance.contract.ts)
- [backend/src/modules/project-sources/provenance.input.ts](../backend/src/modules/project-sources/provenance.input.ts)
- [backend/src/modules/project-sources/provenance.schema.ts](../backend/src/modules/project-sources/provenance.schema.ts)
- [backend/src/modules/project-sources/provenance.service.ts](../backend/src/modules/project-sources/provenance.service.ts)
- [backend/migrations/0002_eager_havok.sql](../backend/migrations/0002_eager_havok.sql)
- [backend/migrations/meta/0002_snapshot.json](../backend/migrations/meta/0002_snapshot.json)
- [backend/tests/step2.fixture.ts](../backend/tests/step2.fixture.ts)
- [backend/tests/sources-provenance.integration.test.ts](../backend/tests/sources-provenance.integration.test.ts)
- [backend/tests/architecture.integration.test.ts](../backend/tests/architecture.integration.test.ts)
- [backend/tests/architecture.unit.test.ts](../backend/tests/architecture.unit.test.ts)
- [hackathon.md](../hackathon.md)
- [outputs/backend-implementation-progress.md](../outputs/backend-implementation-progress.md)
- [outputs/backend-implementation-step2-sources-architecture-report.md](../outputs/backend-implementation-step2-sources-architecture-report.md)

## Exact files modified

Exactly 6 existing files:

- [backend/src/app/app.ts](../backend/src/app/app.ts)
- [backend/src/modules/project-sources/source.service.ts](../backend/src/modules/project-sources/source.service.ts)
- [backend/src/shared/database/schema.ts](../backend/src/shared/database/schema.ts)
- [backend/migrations/meta/_journal.json](../backend/migrations/meta/_journal.json)
- [backend/tests/fixture.ts](../backend/tests/fixture.ts)
- [backend/README.md](../backend/README.md)

app.ts composes new domain services/routes; source.service.ts adds provenance retention to the existing removal path; schema.ts exports domain schemas; _journal.json registers migration 0002; fixture.ts includes new tables in the dedicated test reset; README.md links current implementation truth.

No dependency, env, Unity, earlier migration SQL, original test assertion, policy or product screen file was changed by Step 2. Generated ignored dist output was produced by build.

## Migration and tables

New migration: **backend/migrations/0002_eager_havok.sql**. New metadata snapshot: **backend/migrations/meta/0002_snapshot.json**. Existing journal extended, with 0000/0001 retained.

Eleven new tables/associations; 24 total application tables:

| Table | Purpose |
| --- | --- |
| source_references | Immutable Source/revision/typed locator identity; no source body. |
| ingestion_runs | Distinct attempt, input revision, retry predecessor, lifecycle and stamp. |
| ingestion_run_references | Exact INPUT/OUTPUT provenance association. |
| architectures | One project architecture, family stamp, bounded candidate recovery, confirmation. |
| architecture_graphs | One root plus documented inner graphs; same identity freezes. |
| architecture_nodes | Stable semantic node identity and reviewed X/Y position; Z=0. |
| architecture_connections | Stable directed semantic edge; both endpoints in its own graph. |
| inner_architecture_references | Unique parent node/child graph ownership within one family. |
| architecture_graph_provenance | Graph to exact SourceReference association. |
| architecture_node_provenance | Node to exact SourceReference association. |
| architecture_connection_provenance | Connection to exact SourceReference association. |

Correction recovery is an owned JSONB value on architectures, not a new correction/version/event table. Existing project_sources, staged_uploads and all prior Group 1 tables are reused. No IntegrationCredential model existed in this backend; no duplicate or speculative credential table was added.

Database protections include exact-origin uniqueness, one active ingestion attempt per Source, immutable source references, immutable terminal attempts and append-only attempt provenance, one architecture/root per project, composite endpoint ownership foreign keys, unique inner parent/child ownership, frozen canonical content triggers and deferred all-family state consistency.

The first migration attempt found that generated composite foreign keys preceded their referenced unique indexes. The unapplied migration was corrected to create those indexes first; subsequent migration application and full suite succeeded. Custom SQL trigger definitions are intentionally part of this migration, beyond the table snapshot.

## Sources capabilities

- Existing project-scoped metadata/upload/content APIs retained.
- Exact Source/revision/typed locator creation and deduplication; new revision creates a new identity.
- Historical origins never float; no repeated document bodies or provider credentials.
- Authorized reference/status reads; source status/access can change independently.
- Explicit PENDING -> RUNNING -> SUCCEEDED/FAILED, or CANCELLED from PENDING/RUNNING.
- Attempt input/output references validated against exact source/revision.
- Expected stamps, one active attempt per Source and separate retry identity.
- Immutable terminal result/provenance enforced at database level.
- Existing editor Source rights preserved.
- Legacy hard removal returns DOMAIN_CONFLICT for sources with retained provenance/attempts; unused-source behavior remains.
- Architecture uses a read-only provenance contract; no provider/source mutation by Architecture.

## Architecture capabilities

- One Architecture and root per Project; documented source-backed inner graphs in the same family.
- Strict deterministic proposal validation before import.
- Stable node/edge identities, approved semantic presets, same-graph directed endpoints, exact provenance associations and bounded reviewed position with Z=0.
- Root/inner ownership, one-parent/child relationships, reachability and cycle validation.
- Owner-only candidate creation/review/correction/confirmation; editor designation grants no Architecture write authority. Confirmed models use project read scope.
- Rename/type/move/add-delete node/add-delete connection, imported inner-link reparenting, checkpoint, bounded Undo/Redo and Done-to-review.
- Node deletion removes incident edges; documented inner parents require reparenting before deletion.
- Eight Undo and eight Redo snapshots max; new edit clears redo; cleared on freeze. This is bounded recovery, not graph version history.
- Whole-family stamp and locked owner transaction; conditional Architecture UPDATE prevents stale overwrite.
- Atomic confirmation freezes the exact existing root and all descendants, closes recovery, records receipt, then dispatches the local event.
- Same-intent retry returns the original acknowledgement; changed semantics under the same operation ID conflict.
- Confirmed edits, partial family freeze and retained-identity repointing are rejected.
- No canonical presentation success/failure/dim/pulse/broken/dashed visual state.

## Routes implemented

All new routes require the existing authenticated bearer session. Routes validate Zod input and delegate to services.

| Method | Route | Capability |
| --- | --- | --- |
| GET | /api/v1/projects/:projectId/sources/:sourceId/references | List exact source references |
| POST | /api/v1/projects/:projectId/sources/:sourceId/references | Create/deduplicate immutable reference |
| GET | /api/v1/projects/:projectId/sources/:sourceId/runs | Ingestion status and input/output provenance |
| POST | /api/v1/projects/:projectId/sources/:sourceId/runs | New distinct attempt/retry |
| POST | /api/v1/projects/:projectId/sources/:sourceId/runs/:runId/commands | START/SUCCEED/FAIL/CANCEL |
| GET | /api/v1/projects/:projectId/architecture | Current authorized architecture |
| POST | /api/v1/projects/:projectId/architecture | Initialize from structured proposal |
| GET | /api/v1/projects/:projectId/architecture/graphs/:graphId | Authorized graph in this family |
| POST | /api/v1/projects/:projectId/architecture/corrections | Bounded candidate correction command |
| POST | /api/v1/projects/:projectId/architecture/confirm | Owner atomic confirmation |

New command bodies carry operationId; transitions/corrections/confirmation also carry expectedStamp. Existing /sources, /uploads and source /content routes retain their prior contracts. Acknowledgements project resource ID, lifecycle state, stamp where applicable and replayed; they do not expose raw operation receipts, fingerprints, session credentials or internal Principal objects.

## Shared foundation reused

CommandTransactions, IdempotentOperations, SemanticFingerprint, PrincipalResolver, ProjectAccess, advanceChangeStamp/requireChangedRow, typed AppError and DomainEvents are reused, not replaced. Shared canonical UUID parsing is used at new external boundaries. Project row locks protect policy checks across command waits; credential revalidation remains in the foundation.

app/domain-writes.ts derives a stable domain-separated fingerprint key from existing REFRESH_TOKEN_SECRET. Deployments must preserve that secret for replay comparison; no new env key or secret file was introduced. Rotating it requires a later deliberate receipt policy. Events remain best-effort after commit; no durable transport/outbox or event sourcing.

## Tests added

**47 new tests** in three source test files, with one fixture helper:

- sources-provenance.integration.test.ts — 12: exact identity/revision/dedup/replay, authorization, typed locator restrictions, immutable SQL origin, retained deletion, changed availability, attempt lifecycle/input-output provenance/terminal SQL immutability, distinct retry, atomic invalid provenance/active attempt conflict, stale/cancel transitions.
- architecture.integration.test.ts — 24: import/read depth/single architecture/replay, ten invalid proposal cases, cross-project provenance, owner/editor/outsider permissions, stable rename/type/move/Z, add/delete/incident-edge recovery, imported reparent/cycle guard, checkpoint/Done/bounds, concurrent stale writers, stale confirmation, same-ID atomic freeze/replay, invalid persisted provenance, injected child-freeze rollback and database frozen/partial-family guards.
- architecture.unit.test.ts — 11: multilevel ancestry/cycles, five duplicate-identity/provenance cases, unique child ownership/reachability, family-wide node bounds, empty/non-finite input, redo invalidation/checkpoint validation, immutable input/provenance preservation.
- step2.fixture.ts — typed API-driven Source/reference/import setup, no mocked database or fake authorization.

The injected PostgreSQL failure trigger exists only during its isolated test and is removed in finally; no test hook is installed in application code or production schema.

## Verification

| Check | Result |
| --- | --- |
| Full npm test | **154 passed, 0 failed, 0 skipped; 13 files** |
| Prior Step 1/fix baseline | **107/107 retained** |
| Original Group 1 regression | **53/53 passed** |
| Strict npm run typecheck | **PASS** |
| npm run build | **PASS** |
| Step 2 migration on dedicated local PostgreSQL 16 test DB | **PASS** |

No production database was migrated. The isolated local test PostgreSQL instance was started for the runs and stopped afterward. No provider, Unity Editor/native UI, simulator or headset verification is claimed.

## Documentation

Root hackathon.md created because no existing capitalization variant/equivalent was found in the inspected repository/workspace parents. It records Step 1 initial 96 tests, audit verdict/findings, eleven fixes tests, final 107 tests and CLOSED status, then Step 2 completion.

outputs/backend-implementation-progress.md is the single living implementation inventory. Earlier historical reports/design files were preserved. README now points to current backend capabilities.

## Known limitations and remaining blocker

**No blocker to this bounded Step 2 completion.**

- Structured deterministic import only. No external Miro/docs/OpenAPI translation, OAuth, content verification, background jobs or automatic ingestion execution. Authorized callers supply revision/locator assertions; source-content truth is not independently checked with providers here.
- Graph bounds: 32 graphs, 256 total nodes, 512 total edges; nonempty source-backed graphs. Semantic fingerprint limit 256 KiB and HTTP body limit 1 MiB still apply.
- New inner graphs arrive only with the source-backed import; correction can reparent existing documented depth, not generate a scratch graph.
- Bounded recovery is family snapshots owned by the candidate, not an architecture history UI or per-save Graph copy.
- Retained provenance prevents Source hard deletion. A future explicit retention/redaction policy is outside this increment.
- Stable fingerprint-secret rotation and durable notification delivery remain future operational decisions.
- Local verification only; deployment migration/backup execution is not performed.
- Existing unrelated dirty design files have trailing-blank-line warnings from git diff --check; these were left untouched. Step 2 files were checked separately.

## Next recommended step and stop

**Knowledge / Context**, only after the next user-directed increment.

Knowledge, Presentation, Meeting, My Space publication, Outcomes, AI/providers/orchestration, WebSocket and Unity integration for these modules were **not implemented**. Stop at Step 2.
