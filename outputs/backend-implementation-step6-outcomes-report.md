# Backend Implementation Step 6 — Meeting Review + Outcomes

Date: 2026-10-26 (Asia/Calcutta). **COMPLETE — verified; stopped after Step 6.** Steps 1–5 remain CLOSED.

## Outcome and ownership

Deterministic post-meeting review over one exact immutable FrozenMeetingCapture. Modular monolith retained: Outcomes consumes Meeting's frozen boundary, owns review assessment/candidates/links and publishes accepted project knowledge through one explicit Save. Earlier domains are unchanged except application composition/schema exports and test-fixture table reset. No dependency, configuration, private-origin or Unity changes. No commit/push/deployment requested or performed.

## Exact files added

- `backend/src/modules/outcomes/outcome.input.ts`
- `backend/src/modules/outcomes/outcome.schema.ts`
- `backend/src/modules/outcomes/outcome.access.ts`
- `backend/src/modules/outcomes/outcome.repository.ts`
- `backend/src/modules/outcomes/outcome.source.ts`
- `backend/src/modules/outcomes/outcome.validation.ts`
- `backend/src/modules/outcomes/outcome.service.ts`
- `backend/src/modules/outcomes/review.save.ts`
- `backend/src/modules/outcomes/review.edit.ts`
- `backend/src/modules/outcomes/outcome.query.ts`
- `backend/src/modules/outcomes/outcome.routes.ts`
- `backend/migrations/0009_meeting_outcomes.sql`
- `backend/migrations/meta/0009_snapshot.json`
- `backend/tests/outcome.fixture.ts`
- `backend/tests/outcome-review.integration.test.ts`
- `backend/tests/outcome-save.integration.test.ts`
- `backend/migrations/0010_outcome_acceptance_guard.sql`
- `backend/migrations/meta/0010_snapshot.json`
- `outputs/backend-implementation-step6-outcomes-report.md`

## Exact files modified

- `backend/src/app/app.ts`
- `backend/src/shared/database/schema.ts`
- `backend/tests/fixture.ts`
- `backend/migrations/meta/_journal.json`
- `backend/README.md`
- `hackathon.md`
- `outputs/backend-implementation-progress.md`

The workspace already contained earlier uncommitted implementations/design material; those are preserved and excluded from this increment's manifest. No baseline test assertion changed; fixture adds new tables to its existing isolated reset.

## Persistence and migrations

- backend/migrations/0009_meeting_outcomes.sql — five tables, references/checks/uniques, exact ended capture/project/owner binding, stable source/outcome identities, parent-locked child guards, same-review typed links, responsible frozen ActorRef and accepted-set checks.
- backend/migrations/0010_outcome_acceptance_guard.sql — parentheses around JSONB operands fix PostgreSQL operator precedence in the deferred accepted-manifest guard. Found during real commit integration; already applied local history was preserved.
- Matching 0009/0010 snapshots and extended journal. Generated table snapshots do not retain custom trigger functions: preserve SQL guards in future migrations.
- Applied only to the dedicated local PostgreSQL integration test database; no production database migrated.

| Table | Owner/purpose |
| --- | --- |
| meeting_reviews | One per ended Meeting/exact FrozenMeetingCapture, Project/owner, lifecycle, summary, bundle stamp, accepted manifest and saved timestamp. |
| meeting_review_items | Stable frozen primary source key or explicitly manual entry, bounded reviewed title/summary, human classification, retention choice, order and safe supporting keys. |
| decisions | Stable draft identity promoted to accepted project Decision, exact originating Review/Meeting, statement/rationale/context, creator and accepted-by. |
| action_items | Stable draft identity, originating Project/Review/Meeting, title/description, one responsible participant/ActorRef, optional due date and primary Decision, OPEN status, creator/accepted-by. |
| review_outcome_links | Typed same-review N:M assessment-to-Decision/Action provenance. Exactly one typed target per link. |

Total **49 application tables**. No duplicate ProjectOutcome, MeetingOutcome-body, Home activity, MySpace, transcript or AI table. MeetingOutcome acceptance manifest is immutable JSONB on its Review; summary and assessment/link identities freeze there. Draft outcome definitions already have their final stable IDs; Save promotes them instead of minting duplicate bodies. No per-edit history.

## Lifecycle, commands and concurrency

DRAFT -> REVIEWING -> READY_TO_SAVE -> SAVED.
BEGIN or meaningful edit enters REVIEWING. READY requires explicit confirmed:true, exact expected bundle stamp and full validation. It represents owner acceptance of intended retained content; no mandatory all-questions-resolved checklist. RAISED items may remain explicitly unknown. REOPEN returns ready draft to REVIEWING before further edits; direct edits while ready reject. SAVED forbids all content changes/reopening/deletion at API and database boundaries.

Consequential commands use Step 1 IdempotentOperations, keyed semantic fingerprints, current verified principal/project owner checks, review row lock and expected bundle stamp. Child edits advance that same parent stamp. Same-intent replay returns original acknowledgement; changed semantic input conflicts. Review creation uses the ended Meeting lock/unique constraints, so simultaneous create intentions return one identity.

Commands: BEGIN, SUMMARY, ADD_MANUAL, EDIT_ITEM, CLASSIFY, RETAIN, EVIDENCE, REORDER, DECISION, ACTION, REMOVE_OUTCOME, READY, REOPEN, SAVE. Mutations are bounded REST commands with operationId + expectedStamp. READY/SAVE explicitly require confirmed:true. Manual entries are clearly sourceKey manual:<uuid>, never falsely attributed captured speech. New IDs are discoverable through review GET; Save returns immutable accepted manifest and saved timestamp in addition to receipt/stamp.

## Frozen source and privacy

Input is the exact End capture. Resolve its exact start snapshot and captured screen/definition values, and only publication revisions named in capture.publications. Source projection does not read current SharedMeetingItem pointers, Builder drafts/definitions, private Knowledge originals, private Snapshot origins or participant checkpoints. Stable bound Meeting title/Presentation/schedule are display metadata. No transcript, voice, tracking or source document bodies.

Projection includes frozen screen scopes/overrides/overlays/safe prepared inclusions, final semantic shared state, captured actor attribution and published source text/timestamp. Only shared immutable publication body is selected from revision rows; originKind/originId/originStamp are never selected for projection. Shared/prepared Snapshot representation remains semantic scope/payload, without private Snapshot identity. A prepared SourceReference is the already authorized exact reference, not document-body retrieval.

Supporting evidence uses exact frozen catalog keys: publication:<revisionId>, inclusion:<definitionId>:<inclusionId>, screen:<definitionId>. These preserve exact Snapshot/evidence/semantic content through their captured representation without granting private-origin permissions or resolving arbitrary external/latest source content. No new post-meeting source/document import or attachment flow.

Source text is retained in the immutable source projection; initial editable assessment summary is a deterministic maximum-4000-character excerpt (title max200), not an AI summary/classification. Explicit human edits do not overwrite source text.

Draft/ignored assessment text is owner-only. Saved read requires current ProjectAccess, so an admitted Meeting participant/temporary presenter gains no project/private read or finalization permission. Saved project projection excludes ignored review text and ignored source entries/inclusions unless deliberately referenced elsewhere. Author attribution is a stable User/ScopedGuest ActorRef, never a bearer credential. Guest credentials cannot call Review APIs; guest task responsibility is historical attribution only.

## Classification and linked outcomes

Every captured question/note/discussion point/action suggestion/snapshot/prepared inclusion starts RAISED; no silent decisions or tasks.

RAISED -> DISCUSSED -> ADDRESSED / UNRESOLVED / DEFERRED / DECISION / ACTION.
Human can explicitly mark NOT_DISCUSSED from RAISED/DISCUSSED. Final classifications return to DISCUSSED for correction; direct unrelated terminal jumps reject. No captured discussion does not prove not-discussed.

DECISION/ACTION commands explicitly author candidate definitions from retained, discussed/assessed items. Classification-only promotion requires a matching definition before readiness. Normalized links allow multiple assessments per outcome, multiple outcomes per assessment and both Decision/Action links without forcing a one-to-one relationship. Assessment status stays independent when adding further links. Unwanted candidate can be removed while draft; linked assessment classification must then be corrected or ignored before acceptance.

Retained UNRESOLVED/DEFERRED/ADDRESSED/NOT_DISCUSSED/RAISED states remain final ReviewItem knowledge, discoverable through project assessments and saved Review. No forced task/Decision; no duplicate knowledge root.

## Decision and Action contracts

Decision: stable ID, originating Project/Review/Meeting and typed assessment links; title, statement, rationale, exact safe context keys, createdBy/acceptedBy and createdAt. Draft definitions are editable only through the locked review; accepted definitions are immutable. No canonical Architecture mutation.

Action: stable ID with the same scope/provenance, title/description, optional draft responsible participant + captured ActorRef, optional ISO due date, optional same-review primary Decision, OPEN status and timestamps. Exactly one responsible frozen actor is required by readiness/acceptance, following approved Pass 1 R66. Owner is present in captured participants; registered/guest captured actors preserve attribution. A responsibility reference never provisions membership, session or project rights. Future task status/reassignment/tracking endpoints are not implemented; there are no reminders, tickets, notifications or provider calls.

## Atomic Save to Project

1. Authenticate and recheck current stored owner/project authority.
2. Lock review, validate expected bundle stamp and READY_TO_SAVE.
3. Re-resolve exact immutable capture/start/pinned revisions.
4. Validate retained assessments, exact catalog references, candidate bodies, all same-review links, one responsible actor per Action and same-review primary Decision.
5. Accept existing Decision/Action rows with owner attribution.
6. Seal retained assessments, accepted summary and manifest; set SAVED/changeStamp/savedAt.
7. Persist Step 1 durable result in the same transaction; deferred SQL guards validate exact accepted sets and no partial acceptance.
8. COMMIT, then best-effort process-local meeting_review.saved event.

Failure at Decision acceptance, Action acceptance or COMMIT leaves READY_TO_SAVE with original stamp/work, no partial accepted outcomes/manifest or success receipt. Retry can complete same intention. Concurrent same Save intent gets one durable result; different intentions produce one winner/stale conflict. Reopen/edit racing Save commits one ordered result; losing writer cannot overwrite accepted work. Same Save retry returns the immutable manifest/IDs; a new Save after SAVED rejects. Post-commit listener failure cannot undo accepted truth and replay never re-emits acceptance.

## Routes

All require verified registered Bearer identity; owner-only drafts/mutations, existing project-read policy for saved project knowledge.

| Method | Route | Capability |
| --- | --- | --- |
| POST | /api/v1/meetings/:meetingId/review | Create/open one exact capture-bound review with operationId and captureId. |
| GET | /api/v1/meetings/:meetingId/review | Read existing review by Meeting. |
| GET | /api/v1/reviews/:reviewId | Source, paged assessments, candidates, links, lifecycle/stamp and accepted manifest. |
| POST | /api/v1/reviews/:reviewId/commands | Explicit manual draft/classification/readiness/Save commands. |
| GET | /api/v1/projects/:projectId/decisions | Paged SAVED-only project Decisions. |
| GET | /api/v1/projects/:projectId/actions | Paged SAVED-only project Actions. |
| GET | /api/v1/projects/:projectId/assessments | Retained SAVED assessments, including unresolved/deferred. |
| GET | /api/v1/projects/:projectId/outcome-activity | Derived latest saved review and accepted counts. |

No AI/transcript/realtime-review/Unity endpoints. Home integration is a client-agnostic derived read contract, not changed Home UI. Activity counts are project totals from accepted rows; latest.title/meetingId/reviewId/savedAt identifies latest saved review. No activity cache/truth table.

## Bounds and operational limits

- Item page default6, max100; offset0–10000. Source envelope remains fixed/bounded, not paged arbitrary history.
- Capture initialization <=2248 prepared/publication entries (64 screens x32 inclusions +200 publication bounds inherited from Step5).
- Review total2304 items including manual entries; exact reorder command max2304 IDs.
- Max256 total Decision/Action candidates, max64 assessment links per candidate and max32 evidence keys per item/candidate.
- Titles200, reviewed summaries/rationale/descriptions4000 chars; accepted Decision statement1–4000; strict payloads reject overposting.
- Full source envelope/candidate arrays may be larger than a page; capped upstream start snapshot (2MiB), publication bodies (32KiB each), and collection bounds apply. No delta/history streaming.
- Single local PostgreSQL transaction/Step1 durable receipt; best-effort local events only, no durable outbox or cross-process event guarantee.
- No Action execution/status workflow, new guest login, invitation delivery, media/transcript processing, provider calls or AI. No new user configuration.
- Exact source-document bodies are not materialized. Opening raw sources later must use Sources' existing current authorization.
- No native Unity/device/UI verification claimed. Earlier Step5 single-process realtime constraints remain.

## Tests and verification

**52 new tests: 24 frozen-review/classification + 28 outcomes/acceptance tests. Full suite: 341 passed, 0 failed, 0 skipped, 21 files. All 289 baseline tests and 53/53 original Group 1 tests pass unchanged. Strict TypeScript typecheck PASS; build PASS.** Isolated PostgreSQL16 migrated and stopped cleanly after the full run. No production/provider/Unity verification claimed.

New tests use actual isolated PostgreSQL and Fastify REST injection. Coverage: ended/exact-capture ownership, simultaneous creation/replay, frozen revisions/prepared definitions and post-End private edits, no private origins/checkpoints/transcript, manual bounded classification/edit/evidence/order/retention, stale writes, no automatic task inference, N:M links, assignee/primary-Decision validation, ready/reopen safeguards, ignored/project reader visibility, stable draft/accepted identities, unchanged Architecture, same/different concurrent Saves and reopen/edit ordering, mid-acceptance and deferred COMMIT rollback, saved SQL immutability, derived counts, safe guest Snapshot/responsibility and failing post-commit listener replay.

All 289 baseline tests pass unchanged; only fixture reset is extended. All 53 original Group1 tests remain unchanged. No standalone or targeted skipped cases are presented as full-suite verification.

## Next recommended step and stop

STOP after Step6. A separately authorized increment can audit Steps1–6/contracts and plan the AI boundary over these deterministic sources and human acceptance contracts. Do not start AI providers/orchestration/summary/classification, prompts/runtime, Unity or Group7 automatically.
