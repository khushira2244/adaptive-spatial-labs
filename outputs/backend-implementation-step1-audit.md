# Backend Implementation Step 1 — Read-only Audit

**Audit date: 2026-10-25 (Asia/Calcutta). Verdict: GO WITH SMALL FIXES FIRST.**

Scope: inspect the reported 21 added files (including original report) and five modified files; assess implementation against [Step 0A](backend-step0a-domain-interaction-architecture.md), [Step 0B.1](backend-step0b1-persistence-classification.md), [Step 0B.2](backend-step0b2-cardinalities-and-ownership.md), [Pass 1](backend-v1-persistence-consistency-design.md), [Pass 2](backend-v1-operations-authorization-design.md), and the supplied Step 1 implementation prompt.

This audit creates only this Markdown document. No code, tests, configuration, migration, schema, generated build output, original report or prior design document is changed. Existing uncommitted files predate this audit; they are not audit edits.

Evidence levels:
- **Inspected:** all 26 reported files, all 43 new test bodies, existing-policy call sites, SQL, journal and complete parsed migration snapshot.
- **Fresh read-only check:** strict typecheck passed. A pure installed-Zod probe confirmed uppercase UUID is accepted without normalization. No test file was added for the probe.
- **Prior execution evidence:** Step 1's final execution in this chat and its report recorded 96/96 tests and build passing. Current source has 96 test declarations: 53 original + 43 new. Tests/build/migrations are NOT rerun here because tests reset/write their database and build writes dist.
- **Static findings:** defects F01/F02 below are derived from current control flow plus the pure UUID probe. No live database race/uppercase round-trip reproduction was performed in this read-only audit.
- **Preservation:** SHA-256 baseline captured for all 26 files and checked again after report creation.

Two concrete pre-Step 2 defects: mixed-case UUID scope handling (F01) and replay authorization expiry after blocking waits (F02). Neither indicates an observed existing Group 1 exploit: new foundations are not wired to public product command routes. Findings distinguish implementation defects from intentionally deferred product functionality.

# SECTION 1 — EXACT FILE MAP

Twenty-one additions followed by five modifications. “Who calls” means actual callers now; future intended callers are labeled rather than represented as implemented.

## 01 — backend/FOUNDATION.md

**FILE:** [backend/FOUNDATION.md](../backend/FOUNDATION.md) · ADDED.

**PURPOSE:** Usage and limits of Step 1.

**MAIN EXPORTS / CLASSES / FUNCTIONS:** Documentation only.

**WHO CALLS IT:** Future implementers/application composers.

**WHY IT EXISTS:** Explains explicit trust/transaction/replay boundaries.

**APPROVED REQUIREMENT:** Implementation quality, simple composition, limitations.

## 02 — backend/src/shared/database/command-transaction.ts

**FILE:** [backend/src/shared/database/command-transaction.ts](../backend/src/shared/database/command-transaction.ts) · ADDED.

**PURPOSE:** Outer command transaction and commit-only effects.

**MAIN EXPORTS / CLASSES / FUNCTIONS:** CommandTransactions.run; CommandTransaction; Committed.

**WHO CALLS IT:** IdempotentOperations; foundation integration tests; no current Group 1 route.

**WHY IT EXISTS:** Coordinate participating modules with one Drizzle tx and separate committed truth from listener failures.

**APPROVED REQUIREMENT:** Transaction foundation; rollback; nested-command rejection; post-commit work.

## 03 — backend/src/shared/database/foundation-schema.ts

**FILE:** [backend/src/shared/database/foundation-schema.ts](../backend/src/shared/database/foundation-schema.ts) · ADDED.

**PURPOSE:** Two foundation-only table models.

**MAIN EXPORTS / CLASSES / FUNCTIONS:** scopedGuestAccess; operationResults.

**WHO CALLS IT:** schema.ts re-export; guest resolver/access; OperationRepository; tests; migration generator.

**WHY IT EXISTS:** Keep additive infrastructure schema separate from existing Group 1 definitions.

**APPROVED REQUIREMENT:** Durable operations and minimal guest persistence only.

## 04 — backend/src/shared/events/domain-events.ts

**FILE:** [backend/src/shared/events/domain-events.ts](../backend/src/shared/events/domain-events.ts) · ADDED.

**PURPOSE:** Local safe event dispatcher.

**MAIN EXPORTS / CLASSES / FUNCTIONS:** domainEventSchema; DomainEvent; PostCommitFailure; DomainEvents.subscribe/dispatch.

**WHO CALLS IT:** CommandTransactions; foundation tests.

**WHY IT EXISTS:** Notify after commit without event sourcing/broker.

**APPROVED REQUIREMENT:** Lightweight internal post-commit events; listener isolation.

## 05 — backend/src/shared/concurrency/change-stamp.ts

**FILE:** [backend/src/shared/concurrency/change-stamp.ts](../backend/src/shared/concurrency/change-stamp.ts) · ADDED.

**PURPOSE:** Stale-state detection and repository result pattern.

**MAIN EXPORTS / CLASSES / FUNCTIONS:** changeStampSchema; ChangeStamp; requireChangeStamp; advanceChangeStamp; requireChangedRow.

**WHO CALLS IT:** Unit tests and temporary-table integration probe; no product repository yet.

**WHY IT EXISTS:** Provide owner-level optimistic concurrency building blocks.

**APPROVED REQUIREMENT:** Expected/current stamp, conflict and increment; no architecture evolution.

## 06 — backend/src/shared/auth/principal.ts

**FILE:** [backend/src/shared/auth/principal.ts](../backend/src/shared/auth/principal.ts) · ADDED.

**PURPOSE:** Identity reference and verified application Principal.

**MAIN EXPORTS / CLASSES / FUNCTIONS:** invitedScopeSchema; InvitedScope; ActorRef; Principal; verifiedPrincipal; requirePrincipal; requireRegisteredPrincipal; sameActor.

**WHO CALLS IT:** PrincipalResolver; authorization/operations/guest modules; tests.

**WHY IT EXISTS:** Separate kind-tagged attribution from credential validity.

**APPROVED REQUIREMENT:** Registered User versus scoped guest; reject raw client-shaped Principal.

## 07 — backend/src/shared/auth/principal-resolver.ts

**FILE:** [backend/src/shared/auth/principal-resolver.ts](../backend/src/shared/auth/principal-resolver.ts) · ADDED.

**PURPOSE:** Authenticate/revalidate application principals.

**MAIN EXPORTS / CLASSES / FUNCTIONS:** PrincipalResolver.registered/guest/requireActive.

**WHO CALLS IT:** IdempotentOperations; ProjectAccess; authenticatedPrincipal test helper.

**WHY IT EXISTS:** Reuse AuthService cryptographic token validation and current access/session rows.

**APPROVED REQUIREMENT:** Server-derived principal; expiry/revocation separate from identity.

## 08 — backend/src/shared/auth/guest-access.ts

**FILE:** [backend/src/shared/auth/guest-access.ts](../backend/src/shared/auth/guest-access.ts) · ADDED.

**PURPOSE:** Internal guest scope credential persistence.

**MAIN EXPORTS / CLASSES / FUNCTIONS:** GuestAccess.provision/revoke; GuestAccessRecord; guestTokenDigest; guestAccessState; guestAttribution.

**WHO CALLS IT:** PrincipalResolver and tests; future invitation use cases only.

**WHY IT EXISTS:** Mint random bearer, store digest, retain actor identity after expiry.

**APPROVED REQUIREMENT:** Minimal scoped guest; no fake User, memberships, emails or invitation flows.

## 09 — backend/src/shared/auth/authorization.ts

**FILE:** [backend/src/shared/auth/authorization.ts](../backend/src/shared/auth/authorization.ts) · ADDED.

**PURPOSE:** Small guards and existing project-policy adapter.

**MAIN EXPORTS / CLASSES / FUNCTIONS:** requireAllowed; requireScope; requireVisible; requireLifecycle; ProjectAccess.read/owner/editorOrOwner.

**WHO CALLS IT:** Foundation tests and future domain authorization callbacks; no current routes.

**WHY IT EXISTS:** Reuse current policy rather than reimplement it.

**APPROVED REQUIREMENT:** Registered/project checks; deny default; concealed target existence.

## 10 — backend/src/shared/operations/operation-input.ts

**FILE:** [backend/src/shared/operations/operation-input.ts](../backend/src/shared/operations/operation-input.ts) · ADDED.

**PURPOSE:** Operation envelope/safe result validation.

**MAIN EXPORTS / CLASSES / FUNCTIONS:** operationInputSchema; OperationInput; operationResultSchema; OperationResult.

**WHO CALLS IT:** IdempotentOperations; repository/schema types; tests.

**WHY IT EXISTS:** Strict external-intent shape and bounded durable result.

**APPROVED REQUIREMENT:** Zod boundary and no arbitrary private result bodies.

## 11 — backend/src/shared/operations/semantic-fingerprint.ts

**FILE:** [backend/src/shared/operations/semantic-fingerprint.ts](../backend/src/shared/operations/semantic-fingerprint.ts) · ADDED.

**PURPOSE:** Canonical keyed semantic request digest.

**MAIN EXPORTS / CLASSES / FUNCTIONS:** SemanticFingerprint.fingerprint; private canonical.

**WHO CALLS IT:** IdempotentOperations; unit/integration tests.

**WHY IT EXISTS:** Compare intent semantics without persisting raw request.

**APPROVED REQUIREMENT:** Safe fingerprint; deterministic JSON; no full request/secret store.

## 12 — backend/src/shared/operations/operation.repository.ts

**FILE:** [backend/src/shared/operations/operation.repository.ts](../backend/src/shared/operations/operation.repository.ts) · ADDED.

**PURPOSE:** Transaction-local receipt claim/read/complete.

**MAIN EXPORTS / CLASSES / FUNCTIONS:** OperationRepository.claim/find/complete.

**WHO CALLS IT:** IdempotentOperations; not HTTP.

**WHY IT EXISTS:** Put receipt and business effect in same database commit.

**APPROVED REQUIREMENT:** Concurrent uniqueness, durable replay and rollback.

## 13 — backend/src/shared/operations/idempotent-operation.ts

**FILE:** [backend/src/shared/operations/idempotent-operation.ts](../backend/src/shared/operations/idempotent-operation.ts) · ADDED.

**PURPOSE:** Authenticated durable intent orchestration.

**MAIN EXPORTS / CLASSES / FUNCTIONS:** OperationCommand; IdempotentOperations.run.

**WHO CALLS IT:** Foundation tests; no actual product command endpoint yet.

**WHY IT EXISTS:** One reusable replay/new-intent flow.

**APPROVED REQUIREMENT:** Same-intent result, mismatch conflict, current authorization and duplicate prevention.

## 14 — backend/migrations/0001_v1_write_foundation.sql

**FILE:** [backend/migrations/0001_v1_write_foundation.sql](../backend/migrations/0001_v1_write_foundation.sql) · ADDED.

**PURPOSE:** Add foundation tables, checks, FKs and indexes.

**MAIN EXPORTS / CLASSES / FUNCTIONS:** SQL DDL; no TS exports.

**WHO CALLS IT:** Existing migrator/test fixture through journal.

**WHY IT EXISTS:** Persist foundation without later domain tables.

**APPROVED REQUIREMENT:** Minimal additive migrations, existing naming/style.

## 15 — backend/migrations/meta/0001_snapshot.json

**FILE:** [backend/migrations/meta/0001_snapshot.json](../backend/migrations/meta/0001_snapshot.json) · ADDED.

**PURPOSE:** Generated 13-table schema state.

**MAIN EXPORTS / CLASSES / FUNCTIONS:** Drizzle metadata: id/prevId/version/dialect/tables/enums.

**WHO CALLS IT:** Drizzle migration generation; audit comparison.

**WHY IT EXISTS:** Record exact state after migration 0001.

**APPROVED REQUIREMENT:** Migration reproducibility; no unrelated table changes.

## 16 — backend/tests/foundation.unit.test.ts

**FILE:** [backend/tests/foundation.unit.test.ts](../backend/tests/foundation.unit.test.ts) · ADDED.

**PURPOSE:** 13 pure/helper/error-envelope tests.

**MAIN EXPORTS / CLASSES / FUNCTIONS:** Vitest describe/it definitions.

**WHO CALLS IT:** Vitest source include.

**WHY IT EXISTS:** Validate safe serialization, schemas, stamps and typed HTTP errors.

**APPROVED REQUIREMENT:** Concurrency/principal/auth/errors and safe fingerprint tests.

## 17 — backend/tests/foundation-transaction.integration.test.ts

**FILE:** [backend/tests/foundation-transaction.integration.test.ts](../backend/tests/foundation-transaction.integration.test.ts) · ADDED.

**PURPOSE:** Seven PostgreSQL transaction/event/stamp tests.

**MAIN EXPORTS / CLASSES / FUNCTIONS:** Vitest definitions.

**WHO CALLS IT:** Vitest and fixture.

**WHY IT EXISTS:** Exercise rollback, COMMIT-time failure, visibility and boundaries on real DB.

**APPROVED REQUIREMENT:** Commit/rollback/post-commit/nesting and conditional stamp example.

## 18 — backend/tests/foundation-operations.integration.test.ts

**FILE:** [backend/tests/foundation-operations.integration.test.ts](../backend/tests/foundation-operations.integration.test.ts) · ADDED.

**PURPOSE:** 13 PostgreSQL receipt/idempotency tests.

**MAIN EXPORTS / CLASSES / FUNCTIONS:** Vitest definitions.

**WHO CALLS IT:** Vitest and fixture.

**WHY IT EXISTS:** Exercise result replay, contention, rollback and safe disclosure.

**APPROVED REQUIREMENT:** Same/new/mismatched/concurrent/failed intent and access checks.

## 19 — backend/tests/foundation-principal.integration.test.ts

**FILE:** [backend/tests/foundation-principal.integration.test.ts](../backend/tests/foundation-principal.integration.test.ts) · ADDED.

**PURPOSE:** Ten identity/guest/authorization tests.

**MAIN EXPORTS / CLASSES / FUNCTIONS:** Vitest definitions.

**WHO CALLS IT:** Vitest and fixture.

**WHY IT EXISTS:** Exercise actual AuthService plus guest rows and existing project policy.

**APPROVED REQUIREMENT:** Principal distinctions, expiry/revocation and Group 1 semantics.

## 20 — backend/tests/foundation.fixture.ts

**FILE:** [backend/tests/foundation.fixture.ts](../backend/tests/foundation.fixture.ts) · ADDED.

**PURPOSE:** Auth-backed test principal helper.

**MAIN EXPORTS / CLASSES / FUNCTIONS:** authenticatedPrincipal; authService.

**WHO CALLS IT:** Foundation operation/principal tests.

**WHY IT EXISTS:** Use actual existing AuthService instead of synthesizing principals.

**APPROVED REQUIREMENT:** Deterministic application authentication integration.

## 21 — outputs/backend-implementation-step1-foundation-report.md

**FILE:** [outputs/backend-implementation-step1-foundation-report.md](backend-implementation-step1-foundation-report.md) · ADDED.

**PURPOSE:** Step 1 results and exact inventory.

**MAIN EXPORTS / CLASSES / FUNCTIONS:** Report only.

**WHO CALLS IT:** User and this audit.

**WHY IT EXISTS:** Distinguish scope, test claims, deployment and limitations.

**APPROVED REQUIREMENT:** Requested output report; 21 new / five modified accounting.

## 22 — backend/src/shared/database/schema.ts

**FILE:** [backend/src/shared/database/schema.ts](../backend/src/shared/database/schema.ts) · MODIFIED.

**PURPOSE:** Existing Group 1 models plus new table exports.

**MAIN EXPORTS / CLASSES / FUNCTIONS:** All existing enums/tables/types; added scopedGuestAccess/operationResults re-export.

**WHO CALLS IT:** Existing db/app repositories and Drizzle config.

**WHY IT EXISTS:** Make additive models available to db/migrator without replacing Group 1 schema.

**APPROVED REQUIREMENT:** Reuse existing storage and preserve 11 old tables.

## 23 — backend/src/shared/errors/app-error.ts

**FILE:** [backend/src/shared/errors/app-error.ts](../backend/src/shared/errors/app-error.ts) · MODIFIED.

**PURPOSE:** Existing typed HTTP error convention with eight new codes.

**MAIN EXPORTS / CLASSES / FUNCTIONS:** errorStatuses; ErrorCode; AppError; installErrorHandler.

**WHO CALLS IT:** Existing app plus foundation guards/modules.

**WHY IT EXISTS:** Extend one system; do not introduce competing exceptions/envelopes.

**APPROVED REQUIREMENT:** Domain errors mapped into existing Fastify handler.

## 24 — backend/tests/fixture.ts

**FILE:** [backend/tests/fixture.ts](../backend/tests/fixture.ts) · MODIFIED.

**PURPOSE:** Existing dedicated-test DB/application fixture; truncate new tables.

**MAIN EXPORTS / CLASSES / FUNCTIONS:** fixture; Fixture; Actor; signup; actors; projectPayload; createProject; multipartFile.

**WHO CALLS IT:** Original and new integration tests.

**WHY IT EXISTS:** Respect new FK reset dependencies while keeping old assertions.

**APPROVED REQUIREMENT:** Run all tests with isolated database; preserve Group 1 regression suite.

## 25 — backend/vitest.config.ts

**FILE:** [backend/vitest.config.ts](../backend/vitest.config.ts) · MODIFIED.

**PURPOSE:** Source-only test discovery.

**MAIN EXPORTS / CLASSES / FUNCTIONS:** Default defineConfig; tests/**/*.test.ts include.

**WHO CALLS IT:** Vitest runner.

**WHY IT EXISTS:** Avoid duplicate generated dist tests while preserving original source suite.

**APPROVED REQUIREMENT:** Correct deterministic test execution; not weaker assertions.

## 26 — backend/migrations/meta/_journal.json

**FILE:** [backend/migrations/meta/_journal.json](../backend/migrations/meta/_journal.json) · MODIFIED.

**PURPOSE:** Existing migration history plus entry 0001.

**MAIN EXPORTS / CLASSES / FUNCTIONS:** Drizzle journal version/dialect/entries.

**WHO CALLS IT:** Drizzle node-postgres migrator.

**WHY IT EXISTS:** Ensure new migration is applied after 0000.

**APPROVED REQUIREMENT:** Migration registration and additive order.

# SECTION 2 — TRANSACTION FOUNDATION

Actual flow:

```text
IdempotentOperations.run or trusted application caller
 -> CommandTransactions.run
 -> reject active nested runner using AsyncLocalStorage
 -> Drizzle db.transaction(callback)
 -> context.tx passed to repositories / delegated policy
 -> awaited writes + memory-only effect registration
 -> callback resolves; effect registration closes
 -> Drizzle COMMIT completes
 -> ambient command boundary closes
 -> ordered post-commit effects / DomainEvents listeners
 -> { result, postCommitFailures }
```

- **Opener:** CommandTransactions.run calls the existing Database.transaction. Database/Transaction types come from existing Drizzle node-postgres client, pool maximum ten.
- **Participation:** CommandTransaction carries the same Transaction instance, emit and afterCommit. Repositories receive tx; OperationRepository requires Transaction. Modules retain their policies. No external request is used to select a transaction.
- **Rollback:** callback exceptions propagate to Drizzle; COMMIT failure also rejects the awaited database promise. Effect loop is reached only after successful commit. No compensating business writes occur after failed commit.
- **Nested calls:** a module-level AsyncLocalStorage marks active runner until COMMIT/ROLLBACK finishes. A second CommandTransactions.run in the same asynchronous command lineage throws NESTED_COMMAND_TRANSACTION even from another runner. Participant code should use the supplied tx, not another runner.
- **Effect collection:** closures live only in the current command's local effects array. emit parses/clones a narrow DomainEvent before registering a closure; afterCommit registers a named callback. Registration after callback completion throws INVALID_LIFECYCLE.
- **Dispatch:** effects run sequentially, outside the completed transaction. Synchronous throws and rejected listener/effect promises are collected in postCommitFailures. Remaining effects/listeners still run; business result is not rolled back or re-executed.
- **Provider verification:** new production foundation code performs DB/crypto/validation only; no provider/network/email/AI client is called inside its transaction callback. The separate pool query inside the test is intentional DB visibility verification, not external-provider work.

**Verdict: PASS for the supported wrapper contract.** Ordinary rollback, deferred COMMIT failure, cross-connection post-commit visibility and listener isolation are directly tested.

**Weaknesses/limits:** arbitrary callback code can still call fetch, retain a raw db reference, open a direct Drizzle transaction or use a savepoint; this wrapper does not sandbox it. Raw tx is exposed, and no savepoint-aware effect rollback is implemented. Unawaited application work is unsupported. These limits are documented, not claims of enforced universal transaction ownership. A never-settling post-commit callback can delay response indefinitely; no deadline exists. No durable effect delivery is provided.

# SECTION 3 — IDEMPOTENCY / OPERATION RESULTS

## Stored model

operation_results stores:
- id: client intention UUID, globally unique primary key.
- Exactly one of user_id or guest_id: existing User or scoped guest FK, enforced by XOR check.
- command_kind: intended command string; scope_kind/scope_id optional but both present/absent together.
- request_fingerprint: lowercase 64-hex HMAC result, not semantic request body.
- state: RUNNING or COMPLETED through a completion-shape check, not a PostgreSQL enum.
- result: nullable JSONB; on completed wrapper path strict safe resource reference/status/optional stamp.
- created_at and completed_at; creation default DB time and completion application time.

No independent persisted “failure result” is returned as success. Normal RUNNING insert and completion share the same transaction; rollback removes the claim as well as domain writes. SQL alone does permit a manually committed RUNNING row; service convention, not a deferred completion constraint, prevents that in normal use.

## Exact runtime paths

| Case | Actual flow / outcome |
| --- | --- |
| Fresh intent | Require internally marked Principal; parse operation envelope; fingerprint caller-selected semanticRequest; open transaction; revalidate credential; authorize(context,null); INSERT claim; execute(context); validate safe result; recheck active credential; complete receipt; commit; effects. |
| Same successful retry | Initial current credential/scope policy; INSERT ON CONFLICT DO NOTHING returns no insert; SELECT receipt FOR UPDATE; compare stored actor, command, scope and fingerprint; require COMPLETED result; parse result; authorize(context,result); return replayed=true; execute is skipped. |
| Same ID, changed semantic input | Same actor but fingerprint/command/scope differs -> IDEMPOTENCY_MISMATCH, 409; no new business effect. Scope UUID comparison has F01. |
| Two same-intent calls | Primary-key uniqueness decides claim ownership. A conflicting uncommitted insert waits; after winner commit, loser reads completed receipt and replays. After winner rollback, contender may insert/execute instead. |
| Failed callback/result validation/commit | Claim and transaction-local effects roll back. No completed receipt; later valid attempt may execute once. |
| Another actor's operation ID | Current caller still needs valid credentials/policy; fetched actor compared before semantic comparison/disclosure -> DOMAIN_NOT_FOUND. Safe result-specific policy runs before legitimate replay disclosure. |
| New intentional repeat | New operation UUID -> new command execution, subject to future domain invariants. No automatic deduplication by request fingerprint alone. |

**Concurrency is a combination:** database primary-key uniqueness + atomic transaction + row lock on retrieved receipt + application actor/semantic/lifecycle checks. It is not just an in-memory mutex or preflight SELECT. Under the current normal PostgreSQL transaction path, two conflicting same-ID commands cannot both execute committed transaction-local effects. Different intention IDs intentionally execute independently.

This is **not external exactly-once execution**. If execute performs an external side effect and then database rollback occurs, the wrapper cannot undo that side effect. Correct usage forbids such provider work and supplies it only post-commit or with later durable intent. Physical event delivery itself remains best-effort.

**Verdict: core claim/replay PASS; overall PARTIAL until F01/F02.** Current public Group 1 Create Project is not retrofitted with this API. authorize is a required trusted callback, not an implemented per-domain permission system. No controller or result-fetch endpoint exposes receipts yet.

# SECTION 4 — REQUEST FINGERPRINTING

**Fields:** exactly command.semanticRequest, an unknown JSON-compatible value selected by the trusted application caller. id/actor/command/scope are bound and compared separately; they are NOT automatically inserted into the HMAC payload. Expected stamps and all relevant semantics must be deliberately included by the command adapter.

**Determinism:** recursively sorted enumerable plain-object string keys, recursively canonical values; array order preserved; strings/booleans/finite numbers via JSON.stringify; null encoded as null. Only ordinary Object.prototype objects accepted. No domain-specific defaulting, UUID normalization, Unicode normalization or unordered-set sorting.

**Exclusions:** transient values and secrets are NOT automatically discovered/stripped. Unsupported types are rejected; valid JSON secret strings/transient numeric fields supplied by a caller will be fingerprinted. Only digest is stored, but callers must exclude irrelevant/sensitive input and include every consequential semantic value. No raw body is persisted by the mechanism.

**Undefined/null:** null is a valid explicit value; undefined at root or nested object/array position is rejected, not silently dropped or equated to null. Non-finite numbers, Dates, functions, non-plain objects and sparse arrays are rejected. Cycles/deep nesting fail at depth over 32; full serialized payload above 262144 bytes rejected after serialization.

**Algorithm:** HMAC-SHA256 with an injected private key at least 32 bytes long; constructor copies key. Keying limits offline guessing of low-entropy private inputs from leaked receipt hashes. Same key must survive service/process restart. It does not prove the input omits secrets.

Concrete test examples:
- {b:[1,{y:true,x:null}],a:"safe"} and the reordered equivalent produce equal digests.
- "1", 1, true, null, [1,2] and [2,1] all have different digests in the tested sample.
- Different injected keys produce different digest for "private".
- Undefined, Infinity, Date, sparse array, cyclic object and oversized repeated PRIVATE text reject.
- Integration test verifies chosen semantic plaintext is absent from persisted receipt and digest has 64-hex shape.

Semantically equivalent domain requests may differ if one supplies an implicit default, reordered set-like array, differently cased UUID string, alternate equivalent number representation beyond JS precision, or different string normalization. That is outside canonical JSON's guarantees; domain normalization is caller responsibility. Key rotation also changes comparisons.

Omitted relevant field is a **semantic omission bug**, not a cryptographic collision: two different actions can share a digest if adapter hashes only an incomplete subset. No future product adapter exists yet to audit for that. Cryptographic collisions are not evidenced by tests and are not treated as a demonstrated defect.

**F01 — concrete envelope UUID defect (MEDIUM, fix before Step 2):** operation-input.ts accepts UUID case without normalization, while PostgreSQL uuid storage/readback is canonical lowercase. idempotent-operation.ts:53 compares existing.scopeId to original operation.scope.id by raw string equality. A valid uppercase scope ID can commit once, then the exact same retry falsely conflicts. GuestAccess.provision and PrincipalResolver.guest/requireActive have the same scope-ID case mismatch: stored lowercase ID fails against accepted original uppercase expectedScope.id.

Read-only installed-Zod probe accepted A0B1C2D3-1111-4111-8111-AABBCCDDEEFF unchanged; comparison with its lowercase form returned false. This confirms validator behavior; database round-trip reproduction was not executed in this audit. Finding is not a SHA/HMAC collision and does not imply uppercase UUIDs should be rejected by PostgreSQL.

# SECTION 5 — OPTIMISTIC CONCURRENCY

Actual shape:

```text
current number + expected number
 -> requireChangeStamp validates safe nonnegative integers and equality
 -> advanceChangeStamp returns current + 1 (unless exhausted)
 -> owner repository must atomically write that next value
 -> requireChangedRow rejects missing conditional-update RETURNING row
```

- **Type:** number alias inferred from Zod integer range 0..Number.MAX_SAFE_INTEGER, not an opaque branded version.
- **Storage:** no stamp field is installed on any product table in Step 1. Helpers only; tests create a transaction-local temporary stamp table.
- **Atomicity:** the numeric increment/comparison helper itself is JavaScript, not an atomic DB mutation. requireChangedRow does not perform a write.
- **DB proof:** integration probe performs UPDATE with expected stamp in WHERE and checks returned row; subsequent stale conditional UPDATE returns no rows and guard throws.
- **Race:** ordinary SELECT -> JS compare -> unconstrained UPDATE remains unsafe. Correct future usage requires a conditional update or owner row lock inside the same transaction.
- **Failure:** STALE_CHANGE_STAMP maps to 409, safe reload/review message; invalid stamp shape uses existing Zod/400 convention, overflow DOMAIN_CONFLICT/409.

**Verdict: PASS as requested primitives; PARTIALLY TESTED for concurrency as a system.** Sequential SQL probe shows correct conditional-update pattern, not two racing writers. No graph/screen/review tables, parent-child stamp propagation or acceptance races are implemented or proven. That is scope-appropriate deferral, not a claim of automatic stale-write protection.

# SECTION 6 — PRINCIPAL / ACTORREF

```text
Registered:
 ActorRef  = {kind:"USER", userId}
 Principal = actor + {kind:"USER_SESSION", sessionId, accessExpiresAt} + internal Symbol marker

Guest:
 ActorRef  = {kind:"SCOPED_GUEST", guestId}
 Principal = actor + {kind:"GUEST_ACCESS"} + internal Symbol marker
 Database guest row supplies current exact invited scope/expiry/revocation
```

- Registered resolution calls existing AuthService.authenticate(token), which uses existing signature/issuer/audience/session validation. Resolver parses the verified identity and already-verified token exp, creates frozen Principal/actor/credential, then checks active session again.
- Guest resolution hashes validated 64-hex bearer token with SHA-256, finds unique digest row FOR SHARE, validates access state and exact expected invited scope, then mints guest Principal.
- Both kinds use UUID identity, but equal numeric UUID text across users/guest tables would still be different actors because sameActor checks kind first. No global cross-table UUID uniqueness is needed.
- Operation schema enforces exclusive User FK or guest FK. A guest principal cannot pass requireRegisteredPrincipal, so ProjectAccess cannot treat it as owner/editor.
- Guest actor remains attributable by retained row ID after expiry/revocation; guestAttribution returns identity only and does not validate entitlement.
- JSON cannot provide the module-private Symbol marker. Client object with actor/role/title is rejected in unit tests. Safe resolver never accepts a raw ActorRef as credentials.

**Trust caveat:** verifiedPrincipal is nevertheless an EXPORTED minting function; only PrincipalResolver calls it in current production source. A trusted server module could misuse it with unverified IDs. Marker/freeze is an anti-accidental-JSON boundary, not an unforgeable security boundary against arbitrary server code. Scope-specific guest access must still be checked at every domain use; type tag alone grants nothing.

**F02 — concrete replay-time validity gap (MEDIUM, fix before Step 2):** IdempotentOperations.run checks requireActive at line 37, then may wait in claim/find, authorization callback or DB locks. Replay at lines 63–64 returns without a fresh credential check; fresh-execution branch checks again at line 67. A credential valid at entry but expired while waiting can therefore disclose its stored result after expiry if the callback checks scope but does not separately refresh credential validity.

The now argument in resolver defaults before awaited reads; comparisons after a blocking credential SELECT also use that captured time. Row SHARE locks protect against concurrent row revocation commits, not wall-clock expiry. Existing tests reject credentials already expired BEFORE call; none force expiry during a wait. This is a static control-flow finding, not a newly executed race test. Current Group 1 routes do not invoke this wrapper, so the audit does not claim an observed public exploit.

# SECTION 7 — SCOPED GUEST ACCESS

| Aspect | Actual implementation |
| --- | --- |
| Identity/owner | Row id is both restricted guest actor identity and current single scoped access identity; no separate guest-user/account table. Original private content is not implemented. |
| Scope | Explicit text kind PRESENTATION or MEETING (Zod + SQL check) and UUID target. Kinds are fixed allowlist; target identity is generic/opaque until domain modules exist. |
| Lifecycle | ACTIVE/EXPIRED/REVOKED is derived, not a status column. Revocation takes precedence over expiry. |
| Credential | randomBytes(32).toString("hex"); only SHA-256 digest persisted; token returned once by trusted internal provision method. |
| Expiry/revocation | expires_at and revoked_at; internal revoke sets timestamp; resolver denies expired/revoked access, subject to F02 timing boundary. |
| Historical attribution | Retained row continues to identify same guest after unusable credential. No cleanup deletes attribution in Step 1. |
| Uniqueness | UUID PK and unique token_digest index. Scope index nonunique; several guests may share a scope; repeated provision always creates a new guest, not recipient deduplication. |
| Scope existence | NOT validated against actual Presentation/Meeting tables because those do not exist. Provision is intentionally internal; future owner use case must authorize actual target first. |
| Membership effects | Guest code never inserts users, organization_members, project_editors or projects. Guest type cannot pass registered-only project adapter. |
| Deferred | Invitation acceptance/recipient deduplication, email/UI, parent-domain FKs, token renewal, account linking, guest admin and external route authentication wiring. |

No fake User is created. Existing Project owner FK points to users, not guest access. Code therefore provides no guest -> project owner/OrganizationMember/ProjectEditor conversion. Arbitrary direct privileged SQL could create any unrelated membership; that is not an entitlement granted by this service.

**Verdict: PASS foundation boundary / PARTIAL edge correctness because F01/F02 apply.** Do not mistake provision(scope,id) for a validated invitation flow. It carries a bearer secret and complete internal access row; neither should be forwarded wholesale by a future route.

# SECTION 8 — AUTHORIZATION HELPERS

| HELPER | INPUT | CHECK | SUCCESS OUTPUT | FAILURE | EXISTING GROUP 1 LOGIC REUSED? |
| --- | --- | --- | --- | --- | --- |
| requirePrincipal | Marked Principal or null | Private Symbol marker present | Same Principal | DOMAIN_UNAUTHORIZED | No: new marker gate; not credential validation. |
| requireRegisteredPrincipal | Principal | Marker + actor.kind USER | User ActorRef | DOMAIN_UNAUTHORIZED / DOMAIN_FORBIDDEN | New type gate; project policy reused separately. |
| PrincipalResolver.registered | Existing AuthService + bearer | Existing token/session verification, parsed verified identity/exp, current session | Frozen registered Principal | Existing AUTH errors, domain unauthorized or Zod boundary error | Yes, AuthService/TokenService. |
| PrincipalResolver.guest | Opaque token + expected scope | Unique digest, derived ACTIVE state, exact type/ID | Frozen guest Principal | Domain unauthorized; malformed token Zod validation | No existing guest system; new minimal foundation. |
| PrincipalResolver.requireActive | Principal, invited scope for guest, clock | User token/session expiry/revocation and binding, or guest row scope/validity; FOR SHARE in command tx | void | DOMAIN_UNAUTHORIZED | Existing refresh session storage. Timing F02. |
| sameActor | Two ActorRefs | Kind plus corresponding ID | boolean | Caller decides denial | New type+identity comparison; no authority implied. |
| guestAttribution | GuestAccessRecord | No validity check | Guest ActorRef | No authorization decision | New historical identity helper only. |
| requireAllowed | Boolean policy decision | Exactly true | void | DOMAIN_FORBIDDEN | Policy-neutral deny-by-default. |
| requireScope | Actual/expected kind+ID | Raw equality | void | DOMAIN_NOT_FOUND | Policy-neutral; case behavior relates to F01. |
| requireVisible | Value + allowed | Value present and exactly true | Value | Same DOMAIN_NOT_FOUND for hidden/missing | New safe projection guard. |
| requireLifecycle | Allowed boolean | Exactly true | void | INVALID_LIFECYCLE | Policy-neutral phase gate. |
| ProjectAccess.read | Principal + project ID | Registered current session + existing membership/visibility/owner/editor rules | Existing project/role/member result | Concealed DOMAIN_NOT_FOUND for missing/denied; guest forbidden | Yes, ProjectAuthorization.requireProjectAccess. |
| ProjectAccess.owner | Principal + project + allowArchived | Registered session, existing owner/member and archive rules | Existing owner/project result | Concealed not-found, existing PROJECT_INVALID_STATE | Yes, requireProjectOwner. |
| ProjectAccess.editorOrOwner | Principal + project | Registered session, actual owner/editor and active status | Existing role/project result | Concealed not-found, existing invalid-state | Yes, requireProjectEditorOrOwner. |

There is no separate public resolveActorRef function: resolver returns Principal.actor, registered-only helper returns User ActorRef, guestAttribution returns guest ActorRef. This meets identity resolution conceptually without another generic policy registry. verifiedPrincipal mints but does not authenticate; GuestAccess.provision/revoke persist internal scope state but do not authorize the caller.

ProjectAccess always constructs existing ProjectAuthorization with lock=true; inside command transaction this locks Project FOR UPDATE through existing repository. Registered session lock participates too. Existing organization-membership read is not row-locked; all future membership-revocation writers must participate in a consistent policy protocol. An out-of-band membership deletion is not serialized merely by locking Project.

**No competing Group 1 policy:** existing route/service source is unchanged. Adapter delegates and conceals two old error codes only for new consumers. Source/structure/layer policies retain existing owner/editor distinctions. New helpers do not grant editor project-metadata ownership or Architect-title powers.

**Verdict: PASS delegation and type gates; PARTIAL integration-wide authorization assurance.** Most idempotency tests use explicit no-op authorize for generic command tests; only a boolean callback test covers result-specific replay denial. No real later-module grant/revocation race is tested. These are unimplemented domain policies, not invented permissions.

# SECTION 9 — DOMAIN ERRORS

One existing AppError class and errorStatuses map are extended; no competing handler or transport envelope. New codes are typed by ErrorCode. Existing handler returns {error:{code,message,details:null}}, logs safe request/route/status/code and does not emit stack or arbitrary thrown SQL details.

| ERROR TYPE / code | HTTP MAPPING | SAFE MESSAGE (actual example) | INTERNAL DETAILS | WHERE USED |
| --- | --- | --- | --- | --- |
| Unauthorized / DOMAIN_UNAUTHORIZED | 401 | Authentication required. / Authentication is no longer valid. | No credential/user/session detail exposed | Principal gates/resolver. Existing AuthService can still throw AUTH_UNAUTHORIZED. |
| Forbidden / DOMAIN_FORBIDDEN | 403 | Access denied. / A registered user is required. | No private target body | requireAllowed; guest rejection by registered gate. |
| Not found / DOMAIN_NOT_FOUND | 404 | Resource not found. / Operation not found. | No hidden target/other actor receipt contents | Visibility/scope/project conceal adapter; operation actor mismatch. |
| Conflict / DOMAIN_CONFLICT | 409 | Operation is not available. Retry safely. / Operation is not complete. / The change stamp cannot advance. | No stored fingerprint/result in mismatch diagnostic | Generic operation/unexpected lifecycle and stamp exhaustion. |
| Stale change stamp / STALE_CHANGE_STAMP | 409 | The item changed. Reload and review before retrying. | Current/expected values not placed in client detail | requireChangeStamp; requireChangedRow. |
| Invalid lifecycle / INVALID_LIFECYCLE | 409 | This action is unavailable in the current state. / The command transaction is closed. / Guest access must expire in the future. | No private content | Lifecycle guard; closed effect registration; guest provisioning. |
| Semantic mismatch / IDEMPOTENCY_MISMATCH | 409 | This operation identity was used with different semantic input. | No original payload/hash or private target content | Same actor's changed command/scope/fingerprint. |
| Nested command / NESTED_COMMAND_TRANSACTION | 409 | Pass the existing transaction to participating modules. | No DB transaction contents | CommandTransactions.run nested detection. |

Zod errors map to existing VALIDATION_ERROR/400 with generic request-validation message; unknown internal/SQL errors map to INTERNAL_ERROR/500 with generic message. Thus malformed token input may be 400 at the Zod boundary while invalid well-formed credentials become unauthorized; no new guest route contract is defined.

Concealment is deliberate in ProjectAccess/requireVisible/requireScope/other-actor receipt comparison. Existing Group 1 errors are not rewritten globally. This does not prove perfect timing/side-channel indistinguishability. A same-actor idempotency mismatch can reveal that their operation exists, as intended. Raw PostCommitFailure.error stays an internal object and must not become a future HTTP DTO.

# SECTION 10 — POST-COMMIT EVENTS

- **Collection:** in-memory per-command Effect array; no event row/outbox. emit validates and snapshots ID, kind, aggregate kind/UUID, optional changeStamp. afterCommit can instead register arbitrary trusted named async work.
- **Dispatch structure:** DomainEvents maintains kind -> listener array. subscribe returns unsubscribe closure; dispatch validates event again, freezes outer object/aggregate, takes a listener-list snapshot and awaits listeners sequentially.
- **Registration time:** during active command callback only. emit itself is not delivery. Caller-supplied event ID is validated, not auto-generated by dispatcher.
- **Execution time:** after db.transaction resolves COMMIT, outside active runner context. A listener can start a new independent command then; it cannot complete a missing authoritative half of the old command.
- **Rollback/commit failure:** no effect loop is reached; registered callbacks do not run. Deferred COMMIT failure has a real database test.
- **Listener failure:** caught per listener, recorded with listener name and unknown error; remaining listeners/effects continue. Return is committed result plus failures. Caller must distinguish notification failure from command failure.
- **Durability:** NONE across process crash. A crash between COMMIT and dispatch can lose all events; crash during dispatch can deliver only a prefix. No built-in retry, receipt/event replay, deduplication, delivery acknowledgement or worker.
- **Replay:** IdempotentOperations skips execute on receipt replay, so it does not re-enlist lost events. Test confirms no duplicate event on successful replay, not eventual delivery after crash.
- **Deferred:** reliable notification/processing needs separately persisted delivery intent in its later authorized increment; not implemented by this bus.

**Verdict: PASS for requested lightweight local post-commit mechanism; durable effects DEFERRED-BY-DESIGN. This is NOT event sourcing.** Public dispatch can be called directly by trusted application code; only runner usage supplies the after-commit guarantee. This is a composition contract, not a universal ban on premature manual dispatch.

# SECTION 11 — DATABASE MIGRATION AUDIT

## operation_results

**TABLE/PURPOSE:** Durable technical receipt keyed by one intended command, not a product proposal/history aggregate.

**KEYS:** UUID id primary key; exactly one nullable User/guest FK is populated.

**UNIQUE CONSTRAINTS:** Primary key supplies operation identity uniqueness globally; no extra actor+command+scope uniqueness intended. Fingerprint is not unique: two deliberate intents may have same semantics.

**INDEXES:** operation_user_idx, operation_guest_idx (B-tree, nonunique). Primary-key index supports claim/replay.

**STATUS / ENUM VALUES:** state text constrained through completion check to RUNNING with null result/completed_at, or COMPLETED with nonnull result/completed_at. No explicit pgEnum.

**FOREIGN KEY INTENT:** user_id -> users.id; guest_id -> scoped_guest_access.id; deletion restricted to preserve attribution. Optional scope UUID does not reference future domain tables. Paired-null check prevents half-scope.

**SENSITIVE DATA:** request fingerprint, actor/scope identifiers and resource result can be sensitive metadata even without raw body. HMAC key not stored. Safe result shape is runtime-enforced by wrapper, not JSON-schema-enforced in PostgreSQL.

**RETENTION/EXPIRY:** created_at/completed_at only. No expiry column, cleanup worker or rotation/versioned key identifier. Receipt must remain during supported replay lifetime. DB permits RUNNING to be committed manually; trusted wrapper does not.

## scoped_guest_access

**TABLE/PURPOSE:** Minimal stable restricted actor/access binding; no User row.

**KEYS:** UUID id primary key, random default.

**UNIQUE CONSTRAINTS:** scoped_guest_token_unique unique digest index. No recipient/email/scope-person uniqueness: recipient flow is absent and multiple guests per scope valid.

**INDEXES:** scope kind/id composite nonunique B-tree. No dedicated expiry index/cleanup worker.

**STATUS / ENUM VALUES:** scope_kind text constrained to PRESENTATION or MEETING; access lifecycle computed from revoked_at/expires_at, no status enum.

**FOREIGN KEY INTENT:** no parent-scope FK until actual domains exist; no User/organization/project membership FK inserted by this foundation.

**SENSITIVE DATA:** token_digest is a digest of a random 256-bit bearer, not plaintext; token returned to trusted provisioning caller once. Internal full row contains scope/access metadata; not an automatic public DTO.

**RETENTION/EXPIRY:** expires_at, revoked_at, created_at. Expiry denies access; does not delete identity attribution. No automatic hard deletion. SQL does not enforce expiry > creation; service checks future expiry for provision, and retained expired rows are legal.

## Migration verification

- Names use existing snake_case table/column/index convention. SQL creates two tables, then adds two operation FKs, so guest target exists before FK installation even though operation table is declared first.
- Existing migration 0000 is unchanged. 0001 does not ALTER existing Group 1 table definitions; ALTER statements add constraints to the new operation_results only.
- Parsed 0001 snapshot contains 13 tables: all 11 prior table definitions and all prior enums match 0000 exactly, plus two new tables. Snapshot prevId matches 0000.id; journal adds idx 1/tag 0001 after idx 0.
- PostgreSQL UUID storage provides uniqueness independently of input casing, but raw application comparison fails equivalent-cased scope retries (F01). This is not a missing PK.
- Step 1's existing fixture applied migration in dedicated test DB during successful execution. Static SQL/journal/snapshot inspection is consistent with that result. Fresh empty-database/deployment rehearsal is **not performed** in this read-only audit.
- No schema for graph/screens/meetings/outcomes, no SQL/RLS authorization layer and no database-validated safe result JSON are claimed. Existing app-level authorization remains necessary.
- Self-re-export between schema.ts and foundation-schema.ts resolves users through FK callback; current typecheck passes and prior runtime/migration tests exercised it. No duplicate users table was introduced.

**Verdict: PASS additive schema/uniqueness intent; PARTIAL operational migration coverage.** No migration rewrite is requested or made here. Lack of future scope FK or recipient deduplication is intentionally deferred, not evidence of a current public invitation bug.

# SECTION 12 — TEST AUDIT

**Current declarations:** 13 unit + seven transaction + 13 operation + ten principal = **43 new tests**. Original files declare 14 auth/user + three config + 15 projects + 15 structure/sources + six transaction = **53**; total **96 across nine test files**. Original assertion files have no Step 1 diff. Source-only Vitest include excludes generated copies, not original tests.

Prior successful Step 1 execution is evidence of 96 passing then. This audit inspects test content and freshly passes typecheck; it does not claim a fresh integration/build run. No database reset, migration execution or test addition occurs here.

## New tests: what each actually proves

### foundation.unit.test.ts — 13

| Test | Actually proves / limit |
| --- | --- |
| Nested reordered keys | Canonical plain-object key order independent, recursively. |
| Types/array order/keys | Tested sample digests differ; does not prove all semantics or cryptographic collision resistance. |
| Weak key | Constructor rejects short key; does not enforce random deployment generation. |
| Unsupported values | Undefined/Infinity/Date/sparse/cycle rejected. |
| Oversize | Checked serialized input rejected with safe message; size cap occurs after canonicalization. |
| Matching stamp | JS compare/increment gives expected number. |
| Stale stamp | JS helper emits typed stale conflict. |
| Invalid/exhausted stamp | Range/integer/overflow handling. |
| Client-shaped Principal | JSON actor/fake role/title lacks internal Symbol; not an attack through exported mint factory. |
| Deny/scope/visibility/lifecycle | Basic fail-closed booleans and same hidden/missing message. |
| Envelope extras | Zod rejects fake role and invalid UUID, not uppercase-equivalent UUID behavior. |
| Narrow result | Extra private fields/status prose rejected by result schema. |
| Error HTTP contract | Seven new domain codes map to expected statuses/envelope; nested-command code not separately injected here. |

### foundation-transaction.integration.test.ts — seven

| Test | Actually proves / limit |
| --- | --- |
| Commit visibility/effect | Separate pool connection cannot see uncommitted row, sees committed row before listener returns. |
| Callback rollback | Transactional insert removed and queued afterCommit not run. |
| Deferred COMMIT failure | Callback can finish but COMMIT fail; queued effect suppressed. |
| Listener/effect failure | Committed row survives; healthy listener continues; internal failure names returned. |
| Nested runner | Another runner in same command lineage rejects and outer insert rolls back. Does not intercept raw db.transaction. |
| New command after commit | AfterCommit can open another runner; closed registration fails. |
| Persisted stamp example | Sequential temp-table conditional UPDATE advances, stale condition returns no row and guard rejects. Not two simultaneous writers and no product-table wiring. |

### foundation-operations.integration.test.ts — 13

| Test | Actually proves / limit |
| --- | --- |
| Service reconstruction replay | Same DB/key/request returns original safe result; execute counter once; raw chosen plaintext absent from row. Not actual OS restart. |
| Semantic/command/scope mismatch | Changed fields conflict under same actor/intention; initial operation is unscoped, so no valid scoped-uppercase replay test. |
| New intention | Same semantics/new ID executes independently. |
| Eight concurrent duplicates | Promise.all through real PostgreSQL yields one execution and common result. Does not force a lock barrier at every stage or cover separate OS processes. |
| Conflicting concurrent requests | One fulfilled, one mismatch; no two successful divergent effects. |
| Failed command | Claim/business insert/event queue rollback; later retry fresh. |
| Unsafe result | Strict result parse fails and rolls back business row/claim. |
| Other actor receipt | Another authenticated actor gets concealed not-found. |
| Replay policy/stale execute skip | Boolean policy rechecked; execute that would fail is skipped. Not a real domain grant-revocation race. |
| Missing actor constraint | SQL CHECK rejects neither actor set. Other SQL checks not all directly tested. |
| Logged-out credential | Already revoked session denies new command. |
| Event replay | Already completed replay does not deliver second event. Not durable event recovery. |
| Failed claimant/retry | Started first command fails; retry completes. Barrier releases first immediately after starting retry, so test does not prove contender reached blocked INSERT before release. |

### foundation-principal.integration.test.ts — ten

| Test | Actually proves / limit |
| --- | --- |
| Registered resolution | Actual AuthService resolves User actor and USER_SESSION credential. |
| Rebound/client-shaped input | Malformed token/identity-shaped object rejected. Test title says session cannot rebind, but no correctly signed cross-user forged-token construction is attempted. |
| Owner/editor adapter | Owner accepted; editor read/editor-or-owner succeeds; editor owner check denied. Actual later domain action not tested. |
| Concealed project | Outsider existing and missing IDs share safe not-found message. |
| Guest/no memberships | Scope token resolves guest; no new User/member/editor rows; registered-only project read denies. Direct guest-as-owner SQL attempt not tested. |
| Wrong/expired/revoked scope | Mismatch/future-clock expiry/revocation deny; retained actor ID stable. No expiry-during-wait test. |
| Guest operation replay | Correct guest scope works; wrong scope/revocation deny same operation use. |
| Archive semantics | Existing project archive restrictions and allowArchived owner exception reused. |
| Persisted guest expiry | Previously resolved guest denied after DB expiry change; row attribution retained; guest bearer rejected by Group 1 User route. |
| Cached User token expiry | Token expiry clock denies prior Principal even if refresh session remains active. No receipt lock contention before expiry check. |

## Major requirement coverage classification

FULLY TESTED means direct coverage of that narrow stated scenario, not a complete security certification.

| Requirement | Coverage | Evidence / missing case |
| --- | --- | --- |
| Successful command commit | FULLY TESTED | Real DB row + separate connection check. |
| Ordinary/COMMIT failure rollback/effect suppression | FULLY TESTED | Callback and deferred constraint probes. |
| Wrapper nesting guard | FULLY TESTED | Same lineage/another runner; direct raw DB bypass outside contract. |
| External provider forbidden inside arbitrary callback | NOT TESTED | No production provider call exists; no runtime sandbox. |
| Same/new/mismatched intention | FULLY TESTED for sample supported paths | UUID-cased scope not tested; F01 remains. |
| Concurrent receipt uniqueness | PARTIALLY TESTED | Eight Promise.all and mismatch; no forced full lock schedule, OS crash or multiprocess test. |
| Failed claimant retry | PARTIALLY TESTED | Rollback/retry covered; specific waiting contender barrier not guaranteed. |
| Another actor/revoked credential denial | FULLY TESTED at command entry | Direct DB-backed cases; not mid-wait expiry. |
| Fresh replay result permission at disclosure time | PARTIALLY TESTED | Boolean callback recheck; F02 timing edge and real grant races missing. |
| Pure stamp compare/increment | FULLY TESTED | Matching/stale/invalid/overflow units. |
| DB optimistic concurrency | PARTIALLY TESTED | Sequential conditional-update temp-table pattern; no two-writer race or product rows. |
| User/guest distinction and no implicit membership | FULLY TESTED for service effects | Actual row counts and project gate. |
| Guest scope/expiry/revocation | PARTIALLY TESTED | Normal/wrong/expired/revoked covered; case and concurrent expiry not. |
| Authorization matches owner/editor/archive | PARTIALLY TESTED | Key new adapter scenarios; existing 53 cover routes; new adapter ORG_OPEN/nonmember/deletion races not exhaustively tested. |
| Domain error envelope | PARTIALLY TESTED | Seven code mappings; nested/SQL-internal redaction branches not new exhaustive tests. |
| Post-commit event timing/failure | FULLY TESTED for local supported scenario | Commit/rollback/throw/healthy continuation; no crash recovery/timeouts/delivery durability. |
| DB constraints/migration | PARTIALLY TESTED | Previous fixture applies migration; one direct actor-check failure; not every CHECK/FK/index/empty-db upgrade independently tested. |
| Existing Group 1 regression | PARTIALLY TESTED as assurance claim | Prior all 53 pass and original modules/assertions unchanged; not fresh audit execution or exhaustive contract coverage. |
| Later domain acceptances/private My Space/AI/WebSocket | NOT TESTED / DEFERRED-BY-DESIGN | No later modules exist; cannot infer protection from foundation tests. |

# SECTION 13 — DESIGN COMPLIANCE MATRIX

PASS/PARTIAL/FAIL describe Step 1 implementation against its actual requested foundation scope. DEFERRED-BY-DESIGN is not an implied promise that later behavior already exists.

| Step 1 requirement | Implemented? | Evidence/file | Test coverage | Notes |
| --- | --- | --- | --- | --- |
| Preserve existing stack/strict TS | PASS | package unchanged; current strict typecheck | Fresh typecheck | No new dependencies/provider setup. |
| Inspect/reuse existing Group 1 | PASS | ProjectAccess delegates; original modules unchanged | Prior 53 + principal adapters | Schema adds only re-export for old definitions. |
| Atomic application command | PASS | CommandTransactions; OperationRepository tx | Seven transaction tests | Requires participating code use supplied tx. |
| Rollback failure | PASS | Await Drizzle transaction; no loop on rejection | Ordinary + deferred COMMIT probes | No post-failure business completion. |
| Module participation without ownership bypass | PARTIAL | Tx passed; mandatory authorize callback | Mostly generic/no-op policies | Future domain policy ownership still needed. |
| No accidental nested runner | PASS | Module-wide AsyncLocalStorage | Nested integration test | Raw db/savepoint bypass remains documented contract boundary. |
| No external provider inside tx | PASS for implemented code | No provider calls/imports in command execution | Static inspection | Arbitrary future callback cannot be automatically sandboxed. |
| Post-commit only after success | PASS | Effects after awaited db.transaction | Commit/rollback/COMMIT-failure | Direct manual dispatcher bypass is trusted code responsibility. |
| Durable operation/result | PASS | operation_results + claim/complete | PostgreSQL operation tests | No raw request/result body storage. |
| Same intent returns original result | PARTIAL | Read/actor/fingerprint/result replay | Service reconstruction | Valid scope case defect F01. |
| Same ID changed semantics conflicts | PASS | Separate command/scope and HMAC comparisons | Mismatch + concurrent mismatch | Requires complete domain semantic input. |
| Concurrent duplicate cannot both commit | PASS for supported tx path | Global PK + same tx + receipt lock | Eight concurrent duplicates | Not external exactly-once side effects. |
| Failed attempt not success | PASS | Claim rolls back with work | Failure/unsafe-result/retry | Direct manually committed RUNNING row conflicts, never treated as success. |
| Access rechecked before replay exposure | PARTIAL | Initial requireActive + callbacks | Actor/boolean/revoked cases | F02 after-wait expiry gap. |
| Equivalent accepted UUID scope retries | FAIL | Raw strings versus UUID persistence | Pure Zod probe; missing regression | F01 also affects guest scope resolver. |
| Credential expiry after blocking replay reads | FAIL in edge path | Replay lacks final requireActive; captured clock before await | Not tested | F02; no current public product route using wrapper. |
| Safe semantic fingerprint/no raw request | PASS foundation | SemanticFingerprint | Unit + receipt plaintext check | Caller selects fields; secrets not auto-redacted. |
| Safe committed result | PASS foundation | Strict operationResultSchema | Extra-body rejection + rollback | Application must still authorize referenced result. |
| Expected/current stamp and typed conflict | PASS | concurrency/change-stamp.ts | Unit + temp SQL probe | Product columns/transactions not implemented. |
| Atomic stale-write implementation on product rows | DEFERRED-BY-DESIGN | No product module changes | Not tested | Helpers require conditional write or owner lock. |
| User versus guest identity | PASS | ActorRef tagged union; exclusive FKs | Principal tests | IDs interpreted with kind. |
| Server-derived authentication | PASS current resolver path | AuthService + token/session recheck | Malformed/client object/expiry | Exported internal mint must remain trusted. |
| Guest expiry/revocation/stable attribution | PARTIAL | GuestAccess + resolver | Entry-expiry/revoke tests | F01/F02 at boundaries; actual invite flows deferred. |
| Guest no User/org/project membership | PASS | No such inserts; registered gate | Row counts/read denial | Future provision must validate invited parent. |
| Scoped guest invited parent existence | DEFERRED-BY-DESIGN | Generic scope IDs; no later tables | Wrong scope test only | Not an externally authorized invitation endpoint. |
| Shared project helpers reuse Group 1 | PASS | ProjectAccess -> ProjectAuthorization | Owner/editor/outsider/archive | Not a new RBAC policy. |
| Fail-closed scope/not-found patterns | PARTIAL | requireAllowed/Scope/Visible | Unit + integration messages | Scope UUID case F01; no timing side-channel proof. |
| Required domain error kinds | PASS | Eight additions to errorStatuses | Seven HTTP mappings + behavior | Same AppError/Fastify convention. |
| Lightweight local internal events | PASS | DomainEvents | Failure/timing/replay tests | No Kafka/RabbitMQ/event sourcing. |
| Durable notifications/outbox | DEFERRED-BY-DESIGN | None | Not tested | Mandatory reliable processing cannot rely on bus alone. |
| Only necessary schema/migration | PASS | Two new tables; snapshot diff | Previous migration execution | Original 11 table/enums identical. |
| Strong tests plus unchanged old tests | PARTIAL | 43 new + 53 old declarations | Prior 96 pass | Specific missing races/normalization explicitly listed. |
| HTTP/domain separation and focused modules | PASS | shared modules, no new route files | Static/typecheck | Some trusted adapters depend on existing domain policy by delegation. |
| Implementation output report | PASS | Original report lists all 26 files | Count/hash inspection | “No blocker” conclusion is superseded by this audit's two pre-Step 2 defects. |
| Stop before later modules/Unity | PASS | No module/Unity/package diff | Static inventory | Step 2 not started; all current code unchanged during audit. |

# SECTION 14 — RISK REVIEW

**Distinct risk count: 0 HIGH, 8 MEDIUM, 2 LOW.** Only R01/R02 are concrete foundation defects required before Step 2. Remaining risks identify documented composition/operational responsibilities, not a demand for optional framework work now.

## R01 — Accepted UUID strings do not match database-normalized scope identities

**RISK:** F01 false semantic conflict/guest denial for otherwise valid uppercase or mixed-case UUID scope.

**SEVERITY:** MEDIUM.

**WHY:** Validator accepts unchanged UUID spelling; persistence canonicalizes; raw equality checks compare spellings rather than identity. Same uppercase request can commit then fail its exact retry.

**CURRENT PROTECTION:** DB UUID PKs still prevent duplicate identity; ordinary lowercase randomUUID tests pass. This protection does not fix false rejection.

**WHAT STEP SHOULD ADDRESS IT:** Small foundation correctness fix BEFORE Step 2; no fix performed. Evidence: operation-input.ts UUID validators; idempotent-operation.ts:53; guest resolver scope comparisons.

## R02 — Time can advance past credential expiry while replay is waiting

**RISK:** F02 result disclosed after initially valid credential expires during receipt/authorization lock wait.

**SEVERITY:** MEDIUM.

**WHY:** Replay returns after callbacks without final fresh active check; resolver clock captured before awaited reads. SHARE locks stop revocation races, not clock progression.

**CURRENT PROTECTION:** Entry requireActive, actual session/scope locks, replay callback, and a second check on fresh execute branch. Existing public Group 1 routes do not use this wrapper.

**WHAT STEP SHOULD ADDRESS IT:** Small foundation validity-at-disclosure fix BEFORE Step 2; regression should exercise expiry across a forced wait. No code/test added now.

## R03 — Semantic fingerprint depends on caller choosing complete normalized meaning

**RISK:** Omitted significant field yields false same-intent match; transient/default/casing input yields false mismatch.

**SEVERITY:** MEDIUM.

**WHY:** Mechanism hashes semanticRequest only; cannot infer what execute will read or future domain semantics.

**CURRENT PROTECTION:** Strict operation/result envelope, canonical JSON, HMAC, documented caller contract; no product adapter exists yet.

**WHAT STEP SHOULD ADDRESS IT:** Each new command's Step 2/later integration must supply validated complete semantic input and field-relevance tests. Not a reason to implement later modules in this audit.

## R04 — Helpers alone do not make optimistic writes atomic

**RISK:** Future caller uses compare then unguarded update and loses a concurrent write.

**SEVERITY:** MEDIUM.

**WHY:** Stamp helpers are pure numeric functions; generic runner defaults do not install product row conditions/stamps.

**CURRENT PROTECTION:** requireChangedRow; documented conditional-write/owner-lock contract; sequential SQL probe.

**WHAT STEP SHOULD ADDRESS IT:** Owner repository integration in each product increment, including a true two-writer test before that write is exposed. Not missing Step 1 product implementation.

## R05 — Internal guest provision/mint methods are trusted capabilities

**RISK:** Future route exposes provision/revoke or exported verifiedPrincipal as if it validates caller/parent.

**SEVERITY:** MEDIUM.

**WHY:** Methods accept server-supplied scope/actor data; guest scope existence is intentionally not looked up, and exported mint can construct a marked Principal.

**CURRENT PROTECTION:** No route calls them; only current resolver mints in production path; token digest/exact scope/registered-only policy blocks ordinary JSON escalation.

**WHAT STEP SHOULD ADDRESS IT:** Before invitation endpoints in later domains, enforce actual scope ownership/recipient binding and preserve server-only construction. This audit finds no current guest -> project grant path.

## R06 — Result/scope permission and revocation consistency are integration responsibilities

**RISK:** Future noop/incorrect authorize callback, unfiltered diagnostics/DTO or unsynchronized grant removal discloses a receipt/private scope.

**SEVERITY:** MEDIUM.

**WHY:** authorize is required but arbitrary; tests mostly use no-op or boolean policy. Existing organization membership read is not locked by new adapter.

**CURRENT PROTECTION:** Actor/credential checks, mandatory result-specific callback, narrow receipt, project policy delegation and Project lock. Existing grant writers use project lock where applicable; no broad new membership-removal endpoint.

**WHAT STEP SHOULD ADDRESS IT:** Each actual command and grant-revocation path must validate current read/result scope in a consistent transaction. Preserve original route semantics; no speculative RBAC rewrite now.

## R07 — Local post-commit effects can be lost on process crash

**RISK:** Later mandatory source processing/notifications are never scheduled despite committed truth.

**SEVERITY:** MEDIUM.

**WHY:** Memory-only effect queue; replay does not re-emit; failed listeners have no automatic retry.

**CURRENT PROTECTION:** Authoritative writes committed first; failures surfaced; current foundation does not depend on event for missing data.

**WHAT STEP SHOULD ADDRESS IT:** When a real feature requires durable follow-up, persist delivery intent in that authorized increment. This lightweight bus is not defective for its explicitly best-effort scope.

## R08 — Receipt retention/fingerprint-key continuity not operationally configured yet

**RISK:** Deleting receipts or changing injected key makes supported retry duplicate effects or conflict against old results.

**SEVERITY:** MEDIUM.

**WHY:** No cleanup/versioned-key/rotation mechanism or actual application secret wiring exists.

**CURRENT PROTECTION:** Required >=32-byte key constructor, no default secret or cleanup worker; existing receipts retained. Docs require stable secret/replay lifetime.

**WHAT STEP SHOULD ADDRESS IT:** First real command wiring/deployment configuration and any future rotation/retention work; do not change key or delete receipts silently. Not a pre-Step 2 infrastructure expansion demand.

## R09 — Awaited effect/listener can indefinitely delay response

**RISK:** Slow/hanging post-commit hook makes client see timeout though domain truth committed.

**SEVERITY:** LOW.

**WHY:** Sequential await with no deadline/cancellation.

**CURRENT PROTECTION:** Thrown failures isolated; durable command replay prevents duplicate transactional effects after client retry.

**WHAT STEP SHOULD ADDRESS IT:** Real effect consumer integration/operational timeout policy if needed; optional until effect workloads exist.

## R10 — Runtime invariants are stronger than raw database receipt JSON guards

**RISK:** Privileged/manual SQL or misuse of repository can persist malformed result or stranded RUNNING receipt.

**SEVERITY:** LOW.

**WHY:** CHECK enforces actor/scope/completion shape, not full Zod result schema, immutability or completed-only at commit.

**CURRENT PROTECTION:** Normal IdempotentOperations validates result and completes atomically; malformed/incomplete replay rejects rather than claiming success.

**WHAT STEP SHOULD ADDRESS IT:** Administrative DB/maintenance discipline and future schema/consumer integration tests if those write paths are introduced. No evidence of current application bypass.

# SECTION 15 — GO / NO-GO

## GO WITH SMALL FIXES FIRST

The core foundation is suitable in structure for Sources + Architecture work. PostgreSQL receipt uniqueness and rollback are real, local events obey the supported commit boundary, identity kinds are distinct, existing Group 1 policy is reused, and the migration is additive. Passing tests do not cover two concrete boundary defects.

Only these foundation corrections are required BEFORE Step 2:

1. **F01 / R01:** make accepted UUID scope identity handling consistent across validation, persistence and comparison so equivalent mixed-case UUIDs neither cause false idempotency mismatch nor block valid guest scope resolution. Confirm the same uppercase-scope request can round-trip and replay, and guest scope lookup uses identity-equivalent comparison. This is a correctness criterion, not code/schema modification in this audit.
2. **F02 / R02:** ensure credential validity is freshly checked after blocking reads/authorization waits and immediately before returning a replayed result; do not reuse pre-wait clock state as current access proof. Confirm a credential expiring while a replay waits is denied without executing another command or exposing its result. No test/fix is implemented here.

No requirement to build an outbox, invitation flows, universal RBAC, product version tables, actual domain stamp columns or deployment cleanup now. Those are deferred responsibilities already identified in the design. Do not start Sources/Architecture as part of this audit or silently fix F01/F02.

Audit conclusion supersedes the original report's “no blockers” for proceeding beyond Step 1, without erasing its historical successful 96-test run. Fresh read-only typecheck passes; original implementation files remain unchanged.
