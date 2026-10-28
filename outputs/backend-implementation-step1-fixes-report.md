# Step 1 foundation — F01 / F02 fixes report

Date: 2026-10-25 (Asia/Calcutta). **F01 RESOLVED. F02 RESOLVED.** This increment fixes only the two defects identified in [the read-only audit](backend-implementation-step1-audit.md). It does not start Step 2 or change product behavior beyond UUID identity equivalence and credential validity timing.

## 1. Files modified / added

Exactly six existing Step 1 implementation files modified:

| File | Targeted change |
| --- | --- |
| [backend/src/shared/operations/operation-input.ts](../backend/src/shared/operations/operation-input.ts) | Use shared canonical UUID schema for operation identity, scope and result reference. |
| [backend/src/shared/operations/idempotent-operation.ts](../backend/src/shared/operations/idempotent-operation.ts) | Fresh requireActive after result authorization, immediately before replay result return; fresh execution final check preserved. |
| [backend/src/shared/auth/principal.ts](../backend/src/shared/auth/principal.ts) | Canonical invited scope, actor and session UUID boundaries; shared UUID equality for sameActor. |
| [backend/src/shared/auth/principal-resolver.ts](../backend/src/shared/auth/principal-resolver.ts) | Canonical verified identity/expected scopes; sample current time after awaited credential reads; recheck token expiry after User session lookup. |
| [backend/src/shared/auth/guest-access.ts](../backend/src/shared/auth/guest-access.ts) | Reuse canonical UUID boundary for revocation; provision uses now-canonical invitedScopeSchema. |
| [backend/src/shared/auth/authorization.ts](../backend/src/shared/auth/authorization.ts) | requireScope compares same-kind UUID identities through shared helper. Existing project policy delegation unchanged. |

Three files added:

| File | Purpose |
| --- | --- |
| [backend/src/shared/validation/uuid-identity.ts](../backend/src/shared/validation/uuid-identity.ts) | One canonical UUID schema and identity-equality helper. |
| [backend/tests/foundation-fixes.integration.test.ts](../backend/tests/foundation-fixes.integration.test.ts) | Eleven targeted regression checks, including real PostgreSQL/barrier timing tests. |
| [outputs/backend-implementation-step1-fixes-report.md](backend-implementation-step1-fixes-report.md) | This report. |

No existing test file was changed. SHA-256 comparison against the audit baseline confirms that only the six implementation files above changed among the original 26 Step 1 files. Existing migrations, migration metadata, schema definitions, transaction/event/stamp infrastructure, old test assertions, package files, original report/audit and FOUNDATION.md were not changed.

## 2. Exact UUID identity strategy

One shared **uuidIdentitySchema** validates with Zod UUID rules and transforms accepted text to lowercase. **sameUuidIdentity** validates both operands through that schema and compares canonical values; invalid UUIDs do not acquire equality.

The lowercase transformation lives in one implementation place, not scattered ad-hoc calls. Step 1 operation/scoped-principal UUID boundaries reuse it; sameActor and requireScope use the shared equality helper. Session/user/guest identities minted by the existing trusted Principal path are canonicalized.

PostgreSQL UUID storage and application scope comparisons now agree for uppercase, lowercase and mixed-case spellings. Same-kind/same-ID comparisons succeed; different IDs and different scope/actor kinds still reject. Existing persisted UUIDs require no data change or migration.

This does not normalize arbitrary semanticRequest strings, change request-fingerprint semantics, alter guest bearer tokens, modify Group 1 common validation, or add permissions. Domain-normalized semantic input remains the caller responsibility described by Step 1.

## 3. Exact replay-validity fix

Replay now performs:

1. Existing authentication/current scope validation.
2. Claim/read that may wait for receipt or other database locks.
3. Stored actor, command, canonical scope and fingerprint checks.
4. Stored safe result parsing and result-specific authorization.
5. **Fresh PrincipalResolver.requireActive using current database state and current time.**
6. Return original result with replayed=true, without execute.

The final active check on fresh execute remains present and unchanged in purpose.

PrincipalResolver methods no longer capture default now at function entry. User requireActive may reject an already expired token early, but after its awaited session read it samples current time again and validates BOTH access-token expiry and session expiry/revocation. Guest requireActive and guest credential resolution sample default current time after their awaited access lookup.

The optional explicit Date argument remains a deterministic test-time override for existing tests. Production calls omit it and sample the live clock after reads; no replay path supplies a pre-wait timestamp. Share locks still serialize database revocation against a command; they do not substitute for wall-clock expiry checks.

## 4. Regression tests added

Eleven tests in one new file; no sleeps or test assertion weakening.

| # | Coverage |
| --- | --- |
| 1 | Operation/result/invited-scope and marked actor/session UUID boundaries normalize accepted case variants. |
| 2 | sameActor and requireScope accept equivalent UUIDs, retain distinct actor/scope kind checks and deny genuinely different identities. |
| 3 | Uppercase operation scope commits once; lowercase, uppercase and mixed-case retries return the same durable result; PostgreSQL scope is canonical and business effect appears once. |
| 4 | Same intention with a genuinely different scope still returns IDEMPOTENCY_MISMATCH. |
| 5 | Guest provisioning with uppercase scope resolves and passes requireActive for equivalent mixed/lower/uppercase expected scope. |
| 6 | Wrong guest scope identity or kind remains unauthorized. |
| 7 | Registered User replay passes initial validity, reaches a result-authorization barrier, token expires via controlled Date advancement while paused, then disclosure is denied. |
| 8 | Same replay-barrier scenario for scoped guest access expiry. |
| 9 | User requireActive actually blocks on a real PostgreSQL session row lock; clock advances while blocked; post-read expiry check denies. |
| 10 | Guest requireActive actually blocks on an access-row lock; expiry during wait is denied after release. |
| 11 | Guest credential resolution itself blocks on access-row lock; expiry during wait prevents Principal resolution. |

Replay expiry scenarios assert: execute is never invoked; original operation remains COMPLETED with its original result; one receipt and one original business effect remain; no duplicate operation/effect is created.

Timing is deterministic: promise barriers control result authorization; PostgreSQL pg_blocking_pids confirms reader lock-wait before clock advancement. Only Date is faked, leaving I/O/timers functional. Each scenario releases barriers/transactions and restores real time in cleanup. Tests use expiration, avoiding an impossible concurrent revocation commit while the same command holds a SHARE lock.

### Before / after proof

- **Before fixes:** new suite had 9 failures and 2 passes. Four UUID boundary/equivalence tests and all five expiry-after-wait tests failed. Wrong-scope negative checks already passed.
- **After fixes, regression suite:** 11 / 11 passed.
- The formerly false-positive replay/guest outcomes are therefore reproduced by tests, not only inferred from static inspection.

## 5. Complete test results

| Suite | Passed | Failed |
| --- | ---: | ---: |
| Original Group 1 tests | 53 | 0 |
| Previous Step 1 foundation tests | 43 | 0 |
| New F01/F02 regressions | 11 | 0 |
| **Complete backend suite** | **107** | **0** |

Final complete run: **10 test files passed; zero skipped tests**. New regressions also passed independently before the complete suite.

Tests ran against the existing isolated local PostgreSQL test database, with the cluster started for the run and stopped afterward. No development/production migration or deployment occurred.

## 6. Strict TypeScript

**npm run typecheck: PASS.** Shared schema transforms retain normal string identity types; no additional dependencies or any-based bypasses introduced.

## 7. Build

**npm run build: PASS.** Generated dist is build output, not a new source module or committed product change. Source-only Vitest configuration continues to avoid compiled duplicate tests.

## 8. Group 1 regression status

**No regressions observed.** All original 53 tests and previous 43 foundation tests still pass. Existing routes, product modules, Group 1 schema/common validation, permission rules, old test assertions and dependencies remain unchanged.

## 9. F01 status

**RESOLVED:** canonical shared UUID identity strategy is used at relevant foundation boundaries/comparisons; case-equivalent scope retries and guest resolution work against actual PostgreSQL; genuinely different scopes continue to fail.

## 10. F02 status

**RESOLVED:** replay result disclosure has a final fresh active-principal check; awaited credential lookups evaluate default expiry time after the wait. Registered and guest deterministic regressions demonstrate denied access without re-execution or loss/duplication of committed state.

## 11. Remaining blocker before Step 2

**None from the two required foundation fixes.** The audit's documented integration/operational limitations—best-effort events, trusted internal guest provisioning, actual domain authorization/stamp composition and durable secret/receipt lifecycle—remain as previously scoped responsibilities, not new infrastructure implemented here.

The historical audit and original report remain unchanged; this report records closure of F01/F02. Stop here. No Sources, Architecture, Knowledge, Presentations, Meetings, Outcomes, AI, WebSocket or Unity implementation was performed.
