# Backend implementation Step 1 — V1 domain write foundation

Date: 2026-10-24 (Asia/Calcutta). **Implemented and verified; stopped at foundation.**

## Outcome

Added shared PostgreSQL transaction/post-commit boundaries, durable idempotent command receipts, change-stamp primitives, authenticated User/scoped guest principals, guest access persistence, delegated project authorization and typed errors. Existing Group 1 modules/routes/business behavior were preserved. No later product modules or Unity work was performed.

Baseline: **53 existing tests passed** before foundation changes. Final: **96 tests passed, zero failed/skipped, nine source test files**, including all original 53 plus 43 new tests. Strict typecheck and build passed.

## Exact files added

Paths below are relative to the repository root; links resolve to the actual saved files.

| File | Purpose |
| --- | --- |
| [backend/FOUNDATION.md](../backend/FOUNDATION.md) | Composition contract, safe usage and operational limitations. |
| [backend/src/shared/database/command-transaction.ts](../backend/src/shared/database/command-transaction.ts) | Atomic command runner, nested-boundary rejection, commit-only effects. |
| [backend/src/shared/database/foundation-schema.ts](../backend/src/shared/database/foundation-schema.ts) | Isolated additive operation and guest schema definitions. |
| [backend/src/shared/events/domain-events.ts](../backend/src/shared/events/domain-events.ts) | Small typed process-local event bus with listener failure isolation. |
| [backend/src/shared/concurrency/change-stamp.ts](../backend/src/shared/concurrency/change-stamp.ts) | Expected-stamp validation/advance and conditional-update result guard. |
| [backend/src/shared/auth/principal.ts](../backend/src/shared/auth/principal.ts) | Distinct ActorRef/Principal, private server marker, registered-only checks. |
| [backend/src/shared/auth/principal-resolver.ts](../backend/src/shared/auth/principal-resolver.ts) | Existing bearer verification, session/access-token expiry and scoped guest resolution/revalidation. |
| [backend/src/shared/auth/guest-access.ts](../backend/src/shared/auth/guest-access.ts) | Internal scoped credential provisioning/revocation and stable attribution. |
| [backend/src/shared/auth/authorization.ts](../backend/src/shared/auth/authorization.ts) | Delegated existing project policy and small deny/scope/lifecycle/visibility guards. |
| [backend/src/shared/operations/operation-input.ts](../backend/src/shared/operations/operation-input.ts) | Strict Zod operation envelope and narrow safe result schema. |
| [backend/src/shared/operations/semantic-fingerprint.ts](../backend/src/shared/operations/semantic-fingerprint.ts) | Canonical JSON HMAC fingerprint; no stored raw request. |
| [backend/src/shared/operations/operation.repository.ts](../backend/src/shared/operations/operation.repository.ts) | Transaction-local claim/read/complete persistence using PostgreSQL uniqueness. |
| [backend/src/shared/operations/idempotent-operation.ts](../backend/src/shared/operations/idempotent-operation.ts) | Access-checked replay and new-command composition in one transaction. |
| [backend/migrations/0001_v1_write_foundation.sql](../backend/migrations/0001_v1_write_foundation.sql) | Foundation-only additive migration. |
| [backend/migrations/meta/0001_snapshot.json](../backend/migrations/meta/0001_snapshot.json) | Generated Drizzle migration snapshot. |
| [backend/tests/foundation.unit.test.ts](../backend/tests/foundation.unit.test.ts) | 13 pure/error-contract tests. |
| [backend/tests/foundation-transaction.integration.test.ts](../backend/tests/foundation-transaction.integration.test.ts) | Seven real PostgreSQL transaction/event/stamp tests. |
| [backend/tests/foundation-operations.integration.test.ts](../backend/tests/foundation-operations.integration.test.ts) | 13 durable operation/replay/race/rollback/security tests. |
| [backend/tests/foundation-principal.integration.test.ts](../backend/tests/foundation-principal.integration.test.ts) | Ten principal/guest/Group 1 authorization tests. |
| [backend/tests/foundation.fixture.ts](../backend/tests/foundation.fixture.ts) | Existing AuthService-backed principal test helper. |
| [outputs/backend-implementation-step1-foundation-report.md](backend-implementation-step1-foundation-report.md) | This report. |

## Exact existing files modified

| File | Change |
| --- | --- |
| [backend/src/shared/database/schema.ts](../backend/src/shared/database/schema.ts) | Re-export foundation tables; existing table definitions unchanged. |
| [backend/src/shared/errors/app-error.ts](../backend/src/shared/errors/app-error.ts) | Add typed domain unauthorized/forbidden/not-found/conflict/stale/lifecycle/idempotency/nested-command codes to existing handler conventions. |
| [backend/tests/fixture.ts](../backend/tests/fixture.ts) | Include the two new FK-related tables in dedicated test database reset; existing assertions unchanged. |
| [backend/vitest.config.ts](../backend/vitest.config.ts) | Include only source tests, avoiding duplicate compiled dist tests. |
| [backend/migrations/meta/_journal.json](../backend/migrations/meta/_journal.json) | Register additive generated migration 0001. |

Total this increment: **21 new files including report; five existing files modified**. Existing unrelated working-tree documentation/images were preserved. No commits, pushes, dependency changes or environment-secret changes were made.

## Migration and persistence

- Migration: **0001_v1_write_foundation.sql**; generated with the installed Drizzle tooling.
- New table **operation_results**: globally unique operation identity; exclusive registered-user or guest attribution; command/scope; HMAC request fingerprint; RUNNING/COMPLETED lifecycle; narrow safe result; creation/completion timestamps. FK, scope-completeness, fingerprint and completion-shape checks protect persisted receipts.
- New table **scoped_guest_access**: stable restricted identity/access row; invited scope kind/identity; unique 256-bit random credential digest; expiry/revocation and creation timestamps. No fake User or organization/project grant is created.
- No Presentation/Meeting/Architecture/Knowledge/Outcome tables or APIs.
- Migration applied/verified by test fixtures only in the isolated dedicated *_test database at local port 55432. Development/production databases were not migrated.
- Existing Group 1 migration/table definitions remain intact. Temporary test-only constraint/stamp probe tables are transaction-local and disappear on commit/rollback.

## Abstractions and important guarantees

**CommandTransactions:** domain modules share context.tx; a nested application runner rejects instead of silently committing independent work. Callback or commit-time failure suppresses all post-commit effects. Event/effect failure cannot roll back committed truth; failures are returned separately from result.

**IdempotentOperations:** required current authorization before claim/result disclosure; mandatory result-specific check before replay. A concurrent claim is serialized through PostgreSQL primary-key uniqueness. Same intention/request returns the original committed result, with no second business write/event. Changed command/scope/fingerprint conflicts. Another actor cannot disclose the receipt. Failed work rolls back claim, business writes and event scheduling together.

**Safe receipt data:** canonical JSON HMAC-SHA256 input fingerprint, no raw requests/bodies/secrets/prompts/docs. Result schema permits only resource UUID reference, safe status code and optional safe change stamp. Future domain response projection stays with the domain. A stable secret key is required by constructor injection; no default/development secret was silently installed.

**Change stamps:** nonnegative safe integer checks, stale error, validated increment and empty conditional-update result guard. They require an owner-locked or atomic conditional-write boundary; a preflight comparison is not sufficient. No stamp columns were added to working Group 1 tables.

**Principals:** registered resolution cryptographically verifies the bearer using current AuthService, then validates the session. Verified access-token expiry and current session are checked on later command use. Guests resolve opaque credential + exact invited scope to a distinct actor. Revoked/expired credential denies access but retained identity still supplies historical attribution.

**Authorization:** registered-only/project read/owner/editor-or-owner operations delegate to existing ProjectAuthorization, preserving organization membership, visibility and archive semantics. New consumers conceal denied versus missing project existence. Existing routes keep their current response/error behavior. Client role/title/workspace mode cannot create authority.

**Internal events:** typed safe metadata only; after-commit, sequential, best-effort local dispatch. Separate handlers continue after another listener fails. No event sourcing or external broker.

## Tests and verification

| Check | Result |
| --- | --- |
| Baseline existing backend suite | 53 / 53 passed. |
| New unit/error-contract tests | 13 / 13 passed. |
| New PostgreSQL transaction tests | 7 / 7 passed. |
| New PostgreSQL operation tests | 13 / 13 passed. |
| New principal/authorization tests | 10 / 10 passed. |
| Final complete source backend suite | **96 / 96 passed; 0 failed; 0 skipped; 9 files.** |
| npm run typecheck | Passed, strict TypeScript. |
| npm run build | Passed. |
| Existing module/Unity/package changes | None. |
| Existing Group 1 regressions | None observed across all 53 unchanged existing tests. |

Real PostgreSQL tests cover successful commit, ordinary rollback, deferred constraint failure at COMMIT, post-commit visibility from a separate connection, listener failure isolation, nested command rejection, persisted conditional stamp updates, concurrent duplicate/mismatched intents, failed claimant rollback/retry, same-intent service-reconstruction replay, no duplicate event on replay, unsafe result rollback and unauthorized receipt read.

Principal tests cover existing JWT authentication, fake identity/role rejection, owner/editor/outsider/archive policy, distinct guest with no new memberships, wrong guest scope, persisted expiry, revocation, stable attribution, guest credential rejection by registered-user routes and access-token expiry despite a still-active refresh session.

Runtime: Node **22.14.0**, npm **10.9.2**; existing installed dependencies reused. Tests used local PostgreSQL **16** installation and existing isolated cluster. The cluster started only for tests and was stopped afterward. No physical Quest/Unity/device verification was attempted.

Initial baseline attempts exposed sandbox denial of loopback database access; network permission was granted. A subsequent connection refusal was resolved by starting/testing/stopping PostgreSQL within the same shell lifetime. These were environment failures before the successful baseline/final runs, not product regressions. Compiled duplicate test discovery was fixed through the explicit source include; no test was weakened.

## Known limitations / boundaries

1. Foundations are application-only and are not retrofitted into existing Group 1 endpoints. In particular existing Create Project does not gain a new external idempotency API/header in this increment.
2. Guest scope IDs are opaque until invited-domain modules exist. Provisioning/revocation are trusted internal persistence, not externally exposed endpoints. Future invitation use cases must authorize the real parent and binding; no invitation flow, mail delivery, guest renewal/account linking or administration is built.
3. Internal events are best-effort; process crash can lose delivery. Mandatory future effects need durable delivery-intent/outbox work in their explicitly authorized increment. Event listeners must not supply missing authoritative writes.
4. No provider/network calls are made inside these command implementations. Arbitrary application callbacks cannot be network-sandboxed by a TypeScript utility; future use cases must honor the documented boundary. All transactional work must be awaited. Savepoint-specific effect scoping is unsupported; do not register effects inside independently rolled-back savepoints.
5. Idempotency keying requires a stable deployment secret supplied when composing real commands. Rotation/receipt cleanup needs an explicit supported replay policy; no cleanup worker or default secret is included.
6. Safe result schema is deliberately narrow. Additional metadata requires reviewed validation rather than accepting arbitrary private payloads. Post-commit failure objects are internal diagnostics, not HTTP response bodies.
7. Change-stamp primitives do not automatically make arbitrary read-then-write code safe. Future repositories must use owner locking/conditional writes and propagate child/member-set stamps as designed.
8. Shared helpers are not universal permission policy. Future domains must provide current scope/result authorization, lifecycle and semantic-target checks, including safe event/AI projections. Group 1 behavior remains its existing implementation.
9. No application deployment or development/production migration was performed; the new migration still needs the normal explicit environment deployment workflow.

## Recommended next implementation step

**Step 2: Sources / ingestion foundation only**, preserving the existing Group 1 source/upload contracts. Begin with existing attachment/staging inspection, then source provenance locators and bounded ingestion attempt persistence, protected integration credential boundaries and recoverable processing state. Compose the Step 1 transaction/principal/idempotency helpers and real PostgreSQL tests. Do not automatically implement Architecture, Knowledge, Presentations, Meetings, Outcomes or AI as part of that step.

No blocker remains for this completed foundation increment. Sources is a recommendation, not work started here.
