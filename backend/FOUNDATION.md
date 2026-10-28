# V1 write foundation — Step 1

This increment adds reusable infrastructure only. Existing Group 1 HTTP routes/authentication/permissions are unchanged. Architecture, Presentations, Meetings, Knowledge/My Space, Outcomes, AI and realtime are not implemented.

## Composition and transaction ownership

Use `CommandTransactions.run` once per application command. Pass its `context.tx` to participating domain repositories and policies; do not open another runner/independent database transaction inside it. Async-local detection rejects nested application boundaries. All transaction work must be awaited. Drizzle savepoint composition is not part of this wrapper; do not independently register effects inside a savepoint that might be rolled back.

The callback receives only a transaction plus `emit`/`afterCommit` registration. Do not perform provider, network, email, AI, external storage or notification calls in the callback. Resolve provider input outside it, then validate persisted input identities/stamps inside it. This is an application contract, not a network sandbox for arbitrary application code.

Callback or commit-time failure rolls back and discards effects. Effects execute only after Drizzle resolves a successful commit. The return shape is `{ result, postCommitFailures }`: listener/effect failures do not reject already-committed domain truth. Inspect/report failures with safe observability; never serialize raw internal error objects to clients or report the successful command as rolled back.

`DomainEvents` is sequential, process-local, best-effort delivery. Event metadata is intentionally limited to kind, aggregate identity and optional change stamp. No event sourcing, durable outbox, retry worker or notification service is included. A crash after commit can lose delivery; future mandatory notifications must persist delivery intent before relying on them.

## Authenticated principals and scoped guests

`PrincipalResolver.registered(authService, bearerToken)` verifies the token using existing `AuthService.authenticate`, then rechecks the current session. The verified access-token expiry is retained and rechecked on cached/queued use; an active refresh session cannot extend an expired access token. Do not parse request bodies into Principal/ActorRef. Principals carry an internal marker/frozen actor and are application-only objects; actor attribution is distinct from current session/access validity.

`PrincipalResolver.guest(token, expectedInvitedScope)` resolves a 256-bit opaque guest credential to a distinct restricted actor. Only the token digest is stored. `GuestAccess.provision` is INTERNAL trusted persistence, not an invitation API: future invited-scope owner must validate/authorize the actual Presentation/Meeting first. No invited-domain tables, scope foreign keys, emails or routes exist yet. No User, organization membership or project editor row is created for a guest.

Access state is derived as ACTIVE, EXPIRED or REVOKED. Revocation/expiry denies use, while the same retained guest identity supports safe historical attribution. Scope is immutable. Renewal/account linking/invitation handling is out of scope. Never use `guestAttribution` as authorization.

Use `PrincipalResolver.requireActive` with the command transaction before exposing a receipt or executing a write. Registered sessions and guest access are share-locked during that transaction to serialize revocation against the command. Guests require the actual invited scope. Expiration is rechecked before completing a fresh idempotent write.

`ProjectAccess` delegates to existing `ProjectAuthorization`; owner/member/editor/visibility/archive semantics are reused. It conceals denied/missing project existence for new consumers. Existing routes retain their exact errors. New commands should call adapters using `context.tx` so policy locking participates in the write unit. Scope/grant-specific authorization still belongs to each future domain; this is not enterprise RBAC.

## Durable intention/result flow

Construct `IdempotentOperations` from the transaction runner and `SemanticFingerprint` with a stable, private, randomly generated key of at least 32 bytes. Inject that key through deployment secret configuration when wiring an actual command; no key or new configuration variable is silently added by this increment. Preserve the key across restarts and supported receipt replay. Rotation requires an explicit compatibility plan; arbitrary key replacement makes old semantic comparisons conflict.

Each operation has a UUID intention ID, command kind and optional scope. Use the same intention across a retry; a deliberate repeat uses a new ID. The global ID is bound to the original actor/command/scope/fingerprint. Reusing another actor's ID yields a concealed not-found; changed semantics/command/scope under the same actor/ID conflicts.

Semantic input is canonical JSON hashed with HMAC-SHA256; raw request text is never stored by the receipt layer. Include all acceptance-relevant intended values/stamps in that semantic input. Pure context objects/dates/functions/undefined/sparse arrays are rejected rather than ambiguously hashed. Select only domain-normalized semantic input, not headers/tokens/provider documents.

`authorize(context, originalResult)` is mandatory trusted application policy. It runs before claim/disclosure and again with the stored result on replay; it must check current access and result-specific entitlement, not mutation-only phase/stamp rules. A no-op policy is appropriate only for controlled internal tests, never an application endpoint. Guest invited-scope identity checks alone do not grant arbitrary target access.

Put fresh lifecycle, expected-stamp and semantic invariant validation in `execute(context)`. Then return a result conforming to `operationResultSchema`: UUID resource reference, safe status code, optional safe change stamp. This deliberately excludes arbitrary bodies/metadata/secrets. Domains project the actual authorized content separately.

Claim uses PostgreSQL primary-key uniqueness inside the SAME transaction as the business write. A racing insert waits for the winner to commit/rollback. Completed same-intent replay returns original result without re-executing stale mutation checks. RUNNING is transaction-local in normal use; failure/crash rolls back claim and writes, never returns a failed attempt as success. A completed command's post-commit events are not re-emitted on receipt replay.

`operation_results` is technical infrastructure, not a later product module. It keeps user-or-guest attribution exclusively, safe fingerprint/result metadata and lifecycle timestamps. There is no cleanup worker. Keep receipts for the supported replay lifetime; do not delete one then interpret a delayed supported retry as a new intent. Existing target invariants remain required when later commands are implemented.

## Change stamps

`requireChangeStamp` detects stale domain state; `advanceChangeStamp` validates and safely increments a nonnegative safe integer. This is not architecture version evolution. Use them inside an owner-locked transaction or an atomic conditional write. A comparison performed before a write transaction is insufficient.

For conditional-update repositories, return rows only when expected stamp matches; call `requireChangedRow` on the returned row. Empty update means a stale conflict, not a silent successful mutation. The temporary-table integration test demonstrates persisted expected-stamp update behavior. No stamp columns are added to unrelated Group 1 domain tables.

## Migration and verification

Additive Drizzle migration: `migrations/0001_v1_write_foundation.sql`; tables `operation_results` and `scoped_guest_access`. Group 1 tables are unchanged. Tests truncate both new tables along with existing Group 1 tables in the dedicated `*_test` database. Vitest includes only `tests/**/*.test.ts` so compiled `dist` copies cannot duplicate the suite.

Apply migrations through the normal migration runner only to an explicitly chosen environment. This task exercises migration in the isolated test database; no development/production migration or new product endpoint is implied. Run `npm run typecheck`, `npm test` (dedicated local test DB running) and `npm run build`.

Follow the root design docs for all subsequent user-directed increments. Next module increment is Sources/ingestion foundation; do not proceed automatically.
