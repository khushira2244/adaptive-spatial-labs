# Backend Implementation Step 5 — Live Meetings + My Space Publication + Realtime

Date: 2026-10-26 (Asia/Calcutta). **COMPLETE — verified; stopped after Step 5.** Steps 1–4 remain CLOSED.

## Scope / outcome

Deterministic Group 5 structured collaboration: Meeting setup/scheduling, immutable actual-Start presentation scope, stable actor admission, current presenter authority/transfer/Take Back/fallback, private exploration, Return to Live, explicit My Space publication revisions, authenticated WebSocket state and owner-only immutable End capture.

No MeetingReview, Outcomes, Decisions, ActionItems, AI provider/orchestration, media/voice transport or Unity implementation. Architecture and prepared Presentation truth are referenced, never mutated by a live Meeting. No new MySpace storage root.

## Exact files added

Exactly 27 files, repository-relative:

- [backend/src/modules/meetings/meeting.access.ts](../backend/src/modules/meetings/meeting.access.ts)
- [backend/src/modules/meetings/meeting.admission.ts](../backend/src/modules/meetings/meeting.admission.ts)
- [backend/src/modules/meetings/meeting.context.ts](../backend/src/modules/meetings/meeting.context.ts)
- [backend/src/modules/meetings/meeting.control.ts](../backend/src/modules/meetings/meeting.control.ts)
- [backend/src/modules/meetings/meeting.input.ts](../backend/src/modules/meetings/meeting.input.ts)
- [backend/src/modules/meetings/meeting.presence.ts](../backend/src/modules/meetings/meeting.presence.ts)
- [backend/src/modules/meetings/meeting.query.ts](../backend/src/modules/meetings/meeting.query.ts)
- [backend/src/modules/meetings/meeting.realtime.ts](../backend/src/modules/meetings/meeting.realtime.ts)
- [backend/src/modules/meetings/meeting.repository.ts](../backend/src/modules/meetings/meeting.repository.ts)
- [backend/src/modules/meetings/meeting.routes.ts](../backend/src/modules/meetings/meeting.routes.ts)
- [backend/src/modules/meetings/meeting.schema.ts](../backend/src/modules/meetings/meeting.schema.ts)
- [backend/src/modules/meetings/meeting.service.ts](../backend/src/modules/meetings/meeting.service.ts)
- [backend/src/modules/meetings/meeting.validation.ts](../backend/src/modules/meetings/meeting.validation.ts)
- [backend/src/modules/meetings/publication.service.ts](../backend/src/modules/meetings/publication.service.ts)
- [backend/src/modules/knowledge/knowledge.meeting-policy.ts](../backend/src/modules/knowledge/knowledge.meeting-policy.ts)
- [backend/migrations/0006_numerous_white_queen.sql](../backend/migrations/0006_numerous_white_queen.sql)
- [backend/migrations/0007_meeting_consistency.sql](../backend/migrations/0007_meeting_consistency.sql)
- [backend/migrations/0008_meeting_publication_guard.sql](../backend/migrations/0008_meeting_publication_guard.sql)
- [backend/migrations/meta/0006_snapshot.json](../backend/migrations/meta/0006_snapshot.json)
- [backend/migrations/meta/0007_snapshot.json](../backend/migrations/meta/0007_snapshot.json)
- [backend/migrations/meta/0008_snapshot.json](../backend/migrations/meta/0008_snapshot.json)
- [backend/tests/meeting.fixture.ts](../backend/tests/meeting.fixture.ts)
- [backend/tests/meeting.ws-fixture.ts](../backend/tests/meeting.ws-fixture.ts)
- [backend/tests/meeting-lifecycle.integration.test.ts](../backend/tests/meeting-lifecycle.integration.test.ts)
- [backend/tests/meeting-publication.integration.test.ts](../backend/tests/meeting-publication.integration.test.ts)
- [backend/tests/meeting-realtime.integration.test.ts](../backend/tests/meeting-realtime.integration.test.ts)
- [outputs/backend-implementation-step5-meetings-report.md](../outputs/backend-implementation-step5-meetings-report.md)

## Exact files modified

Exactly 17 existing files:

- [backend/package.json](../backend/package.json)
- [backend/package-lock.json](../backend/package-lock.json)
- [backend/src/app/app.ts](../backend/src/app/app.ts)
- [backend/src/shared/database/schema.ts](../backend/src/shared/database/schema.ts)
- [backend/migrations/meta/_journal.json](../backend/migrations/meta/_journal.json)
- [backend/tests/fixture.ts](../backend/tests/fixture.ts)
- [backend/tests/knowledge-context.integration.test.ts](../backend/tests/knowledge-context.integration.test.ts)
- [backend/src/modules/knowledge/knowledge.access.ts](../backend/src/modules/knowledge/knowledge.access.ts)
- [backend/src/modules/knowledge/knowledge.context.ts](../backend/src/modules/knowledge/knowledge.context.ts)
- [backend/src/modules/knowledge/knowledge.input.ts](../backend/src/modules/knowledge/knowledge.input.ts)
- [backend/src/modules/knowledge/knowledge.repository.ts](../backend/src/modules/knowledge/knowledge.repository.ts)
- [backend/src/modules/knowledge/knowledge.schema.ts](../backend/src/modules/knowledge/knowledge.schema.ts)
- [backend/src/modules/knowledge/knowledge.service.ts](../backend/src/modules/knowledge/knowledge.service.ts)
- [backend/src/modules/knowledge/snapshot.service.ts](../backend/src/modules/knowledge/snapshot.service.ts)
- [backend/README.md](../backend/README.md)
- [hackathon.md](../hackathon.md)
- [outputs/backend-implementation-progress.md](../outputs/backend-implementation-progress.md)

Earlier-domain modifications are additive Meeting-scope/authorization integration for private Knowledge/Snapshot; original project/private ownership checks remain when no Meeting scope is present. A server-injected Knowledge policy avoids a circular business-service dependency: Meetings depend on Knowledge services, while Knowledge consumes a narrow authorization contract supplied by composition. The schema has explicit nullable Meeting references, as appropriate for owned contextual content.

One Step 3 test SQL absence check was updated: shared_meeting_items is now requested by Step 5, so its old “future table must not exist” expectation was removed. The same test still verifies private My Space behavior and forbids my_spaces/interaction_contexts. No original Group 1 test assertion changed. Historical reports/design files, images and earlier dirty/untracked work were preserved and are not counted as this increment's changes.

No env/secret, Unity or prior migration file was changed. Build generated ignored dist output. No git commit/push/deployment performed.

## Dependencies / official transport

Installed from the official Fastify plugin package and followed its bundled README/types:

- @fastify/websocket **11.3.4**
- ws **8.22.0** (plugin dependency)
- @types/ws **8.18.2** (development types)

Existing Node.js 22 / strict TypeScript / Fastify 5 / PostgreSQL 16 / Drizzle / Zod stack retained. package.json and lockfile updated only for WebSocket support. No model/email/voice provider added.

## Migrations / database

- **backend/migrations/0006_numerous_white_queen.sql** — 10 Meeting-owned tables, nullable Meeting associations on KnowledgeItem/Snapshot, retained-identity and immutable capture/revision guards, same-Meeting composite anchors and atomic lifecycle checks.
- **backend/migrations/0007_meeting_consistency.sql** — correct deferred invariant SQL identifier/record handling, plus shared-state and participant identity protection.
- **backend/migrations/0008_meeting_publication_guard.sql** — correct LIVE publication/revision guard with unambiguous identifiers and table-specific trigger paths.
- Generated metadata: 0006_snapshot.json, 0007_snapshot.json, 0008_snapshot.json; journal extended.

Isolated integration testing exposed two ambiguous SQL guard variables. The follow-up migrations preserve already applied local migration history; the final chain is verified against actual PostgreSQL. The initial unapplied migration attempt also required CREATE OR REPLACE for the pre-existing Knowledge identity trigger function. No production database was migrated.

| New table | Purpose |
| --- | --- |
| meetings | Permanent Project/Presentation/owner binding, title/setup/schedule/Start From, lifecycle and aggregate change stamp. |
| meeting_participants | One stable User or Scoped Guest actor per Meeting, admission state and trusted socket presence epoch. |
| meeting_invitations | Durable email intent and accepted/declined/cancelled/expired state; accepted participant reference. |
| meeting_presentation_snapshots | One immutable actual-Start prepared screen/definition capture and exact canonical family reference. |
| meeting_shared_state | Authoritative current pinned screen/focus, presenter and authority generation. |
| participant_private_state | Actor-private semantic recovery/following checkpoint with its own stamp. |
| presenter_transfer_requests | One bounded pending target request, requester/generation and terminal decision. |
| shared_meeting_items | Publication identity/author/category, current immutable revision pointer, visibility and stamp. |
| shared_meeting_item_revisions | Explicit immutable shared representation and internal private-origin provenance. |
| frozen_meeting_captures | One immutable owner-End capture of structured eligible Meeting state. |

Total **44 application tables**. No review/outcome/AI/my_spaces/global interaction-history tables.

SQL guards enforce start/end uniqueness, frozen snapshot/revision/capture immutability, stable participant/publication identity, same-Meeting presenter/author/snapshot anchors and current revision ownership. Deferred checks reject LIVE/ENDED state without frozen start scope/shared state/admitted presenter, and ENDED without exactly one capture. Shared-state mutations close after End. Knowledge Meeting scope cannot be repointed on an edit. Custom trigger/constraint definitions are migration SQL beyond Drizzle table snapshots and must be retained.

## Lifecycle / Start freeze

Owner means the stored Project/Presentation owner at creation; no client title/role supplies authority. Creation validates the exact Presentation and Project. Many Meetings may reference one Presentation. Owner participant is ensured in setup and re-used at Start.

DRAFT/SCHEDULED -> LIVE -> ENDED. Scheduling changes setup only; it never freezes Builder early or automatically starts a session. Owner may explicitly Start a scheduled Meeting.

Actual Start transaction:
owner/auth -> current setup/stamp -> Presentation/Project -> protected Main + only current CONFIRMED authored definitions -> Start From eligibility -> bounded immutable start payload -> owner participant/current presenter -> shared scope -> LIVE + receipt -> commit -> post-commit event.

A Presentation may still contain drafts; those drafts are excluded. Start From cannot be an unconfirmed/deleted/later screen. Captured definitions are safe bounded prepared values with exact canonical refs, not Architecture body copies. Later Builder edits or new confirmations do not affect this Meeting. Same-intent Start retry returns the original snapshot, even when current lifecycle has since advanced; clients read current state separately.

Start payload bound: 2 MiB. No partial LIVE snapshot/presenter state on validation, insertion or commit failure.

## Participants / invitations / scope

One User or Scoped Guest ActorRef per Meeting, with exclusive owner columns and unique actor/Meeting indexes. Reconnect and admitted rejoin use the same participant identity, never create project membership or Presentation grants.

Registered invitation lifecycle: PENDING -> ACCEPTED / DECLINED / CANCELLED / EXPIRED. Recipient response checks authenticated stored normalized email, following existing account identity conventions; no new external email-verification claim. Owner cancels. Expiry is computed for read projection and persisted on response. Acceptance adds/reuses one admitted participant atomically with its receipt. REVOKED participants cannot rejoin; LEFT participants may reconnect/rejoin while eligible. Owner admission remains the fallback authority even when offline.

No email provider/delivery. Trusted owner-authorized guest provisioning validates a real Meeting, uses existing ScopedGuestAccess and creates only a participant. No fake User/organization/project editor/Presentation collaborator. Secret returned once to trusted server caller; no public guest mint/email-redemption route. Guest validity is at most thirty days; guest admission checks a 256-participant bound; registered invitation intents are bounded to 200. These are separate admission bounds, not a claim of a universal 256-person policy.

Every read/write validates current admission and credential validity, including after waits/before disclosure. Guest credentials are exact MEETING scope and cannot be used for another Meeting, Presentation or general Project API. Revocation/expiry denies new access but retains attribution and private authored records.

## Presenter / shared state

Exactly one authoritative current presenter while LIVE, initially owner. Only current presenter with expected aggregate stamp and authorityGeneration may navigate or change shared focus/request transfer.

One pending PresenterTransferRequest targets exactly one other admitted participant. No queue/co-presenters. Target alone accepts/declines; authority changes only on acceptance and generation advances. Decline preserves presenter. Owner Take Back always requires owner authority, restores owner, cancels pending transfer and advances generation. Temporary presenter gets navigation/focus authority only: no owner End, Architecture/Builder write, invitation, outcome acceptance or ownership transfer.

Trusted WebSocket presence records connection epochs. Last relevant temporary-presenter close/leave returns presenter to owner. Disconnect fallback compares current epoch + authority generation, so old disconnect signals cannot overwrite a newer reconnect/transfer. Owner disconnect never ends Meeting or changes ownership. On single-instance server startup, stale connected flags/pending transfers are cleared and owner authority/generation restored. No old socket lease survives process restart.

MeetingSharedState references only screen IDs from start snapshot and validated semantic focus within frozen family/current screen. New Builder definitions/drafts cannot enter via navigation. Canonical display is resolved from immutable family refs, omitting source-provenance arrays and unrelated source bodies.

Aggregate locks/stamps serialize lifecycle, authority, presence and publication membership. Stale commands conflict. There is no client-authoritative role/position stream.

## Private state / Return to Live / My Space

ParticipantPrivateState stores only following flag, exact explored screen and optional bounded semantic scope. It has a participant-owned stamp. No hand/ray/gaze/pose/camera history. No other-participant checkpoint endpoint. Owner/presenter roles cannot inspect it; it is absent from shared projection, events and End capture.

Return to Live is available to any admitted live participant: read authoritative shared state NOW -> set caller following -> return current shared screen/focus/stamp. It never replays private state into shared state or requires presenter authority. Private writes do not advance Meeting shared authority or broadcast.

KnowledgeItem/Snapshot gain optional Meeting association. The injected policy proves actual admission and frozen Architecture scope; invited registered users and guests can own scoped private notes/questions/discussion points and semantic Snapshots without Project read membership. Scope is immutable with the private item's identity. Actor remains lifetime author; expiry/revocation does not erase content.

Existing unscoped/project-private registered-user behavior remains. Generic guest private routes stay closed; Meeting-scoped routes resolve exact guest credentials. Meeting My Space lists that actor's Meeting-associated content; existing registered My Space APIs can additionally query eligible own global/project items. No MySpace table, duplicated notebook or “My Shared Things” page/table.

Architecture/context attachment and Snapshot capture resolve only the authorized immutable Meeting family. Direct raw SourceReference attachment/read still requires existing Project/source policy; a Meeting grant is not a raw-docs grant. Losing current Meeting admission/credential validity blocks Meeting-scoped private retrieval, while durable attribution remains. No identity linking/guest-to-User conversion or later recovery administration implemented.

## Explicit publication / revisions / privacy

Supported manual classifications: NOTE, QUESTION, DISCUSSION_POINT, ACTION_SUGGESTION, SNAPSHOT. No AI finding generation or accepted ActionItem creation.

SHARE selects own eligible KnowledgeItem at exact private stamp or own Snapshot and explicit semantic context. It captures only intended title/body or Snapshot scope/payload plus safe author. Cross-actor/cross-Meeting origins rejected. Private attachment sets, edit history, unrelated items/counts, hidden context and credentials are excluded. Origin ID/stamp are internal provenance, never private read permission or audience projection.

Initial Share creates publication + immutable revision 1. Same intention replays same publication; another explicit Share creates another identity. Explicit UPDATE creates the next immutable revision, advances current pointer/stamp and restores intended visibility. Private original edit alone changes nothing. WITHDRAW changes current visibility while retaining revisions. Publication body max 32 KiB; at most 200 publication identities per Meeting.

Audience sees current visible revision or an exact End-pinned revision. Author may inspect own retained revision history. Audience cannot dereference private originals or arbitrary previous/withdrawn revisions. No editable KnowledgeItem mirror.

Publication mutation and End share the Meeting lock/stamp. Either publication commits first (fresh End captures that exact current revision) or End commits first (later publication mutation rejects). A stale concurrently attempted End must refresh/retry rather than silently capture an unintended state.

## Meeting Context / End capture

Shared projection contains Meeting setup/lifecycle, current pinned screen/prepared inclusions, safe participants/presence, pending transfer, canonical display and visible structured publications. The author-selected classifications support Questions/Notes/Discussion/Snapshot/action-suggestion views. Private originals/checkpoints are not present.

Owner End transaction:
LIVE/stamp -> exact start snapshot -> current visible publication revision IDs -> final shared semantic state + safe participant attribution -> one immutable FrozenMeetingCapture -> cancel transfer -> ENDED + receipt -> commit -> final event/socket close.

Frozen capture excludes unshared/withdrawn My Space, private exploration, raw tracking, voice/transcript, continuous recording and inferred verbal decisions. It pins revisions, not “private latest.” Failure rolls back capture/lifecycle; same End intention returns original result; no second capture. No Group 6 review/decision/action acceptance or AI summary.

## REST routes

All require verified registered bearer or, for a Meeting-scoped route, exact admitted Meeting guest credential.

| Method | Route | Capability |
| --- | --- | --- |
| POST / GET | /api/v1/meetings | Owner create / registered actor's authorized paginated list. |
| GET | /api/v1/meetings/:meetingId | Authorized complete structured Meeting/current/frozen context. |
| POST | /api/v1/meetings/:meetingId/commands | SETUP, START, END, TAKE_BACK, NAVIGATE, FOCUS, transfer request/accept/decline, LEAVE, REVOKE. |
| POST | /api/v1/meetings/:meetingId/invitations | Owner durable invitation. |
| POST | /api/v1/meetings/:meetingId/invitations/:invitationId/respond | Registered recipient ACCEPT/DECLINE or owner CANCEL. |
| POST | /api/v1/meetings/:meetingId/join | Eligible admitted/LEFT actor rejoin; stable participant ID. |
| POST | /api/v1/meetings/:meetingId/publications | SHARE / UPDATE / WITHDRAW with Meeting/publication/private-source stamps. |
| GET | /api/v1/meetings/:meetingId/revisions/:revisionId | Authorized current/own/frozen-pinned immutable publication revision. |
| GET / PUT | /api/v1/meetings/:meetingId/private/checkpoint | Own checkpoint only. |
| POST | /api/v1/meetings/:meetingId/return-to-live | Follow current authoritative shared state. |
| POST | /api/v1/meetings/:meetingId/private/items | Create own Meeting-scoped KnowledgeItem. |
| GET / PUT | /api/v1/meetings/:meetingId/private/items/:itemId | Read/edit own item in this scope. |
| POST | /api/v1/meetings/:meetingId/private/snapshots | Explicit own immutable semantic Snapshot. |
| GET | /api/v1/meetings/:meetingId/my-space | Eligible own Meeting-associated notes/captures/count. |

Consequential mutations use Step 1 durable operation IDs; semantic checkpoint/Return-to-Live uses own stamp/current-state semantics instead of replaying old live state. REST is also available for deterministic non-streaming control; live clients need WebSocket for a continuous presence lease/disconnect detection. No Outcomes, AI or media routes.

## WebSocket contract

**GET /api/v1/meetings/:meetingId/ws**, authenticated upgrade with Authorization: Bearer header. Credentials are not placed in URLs/query strings. Browser/native clients requiring another authentication mechanism need a later deliberate ticket/protocol design; no insecure query-token workaround.

Connection validates LIVE/admission, binds existing participant and trusted connection epoch, sends:
STATE { event, sequence, data: authorized current Meeting projection }.

Client JSON types:
- COMMAND { command: strict stamped Meeting command }
- PUBLICATION { command: strict stamped share/update/withdraw }
- RETURN_TO_LIVE
- SYNC

Replies are safe ACK/ERROR; committed notifications send STATE with authoritative sequence. Events include started/setup/presence/join/admission, shared screen/focus, presenter transfer accepted/declined/requested/Take Back/fallback, publication created/updated/withdrawn and meeting.ended. Initial/upgraded live connection is only after Start; scheduling/Start can use REST.

Each command revalidates credential, LIVE phase, admission, capability, generation and expected stamps through the same application services as REST. Read/sync/event delivery is reauthorized per recipient. Expired/revoked clients close or receive a denial. Private checkpoint/my-space changes do not fan out; Return-to-Live private following response is sent only to requester.

Handlers attach synchronously before async connection work, per official plugin guidance. Commands are serialized per socket; broadcast work is queued per Meeting after transaction commit. Frame size max 64 KiB inbound; 20 commands/second/socket; max 16 pending; output buffer cutoff 4 MiB; 15-second ping/auth heartbeat. Unresponsive sockets terminate, causing trusted fallback. Output states are collection-bounded and can exceed inbound frame size.

Transport is **single backend process** with in-process fan-out/presence. No distributed broker, durable outbox/event replay, cross-process socket lease or HA delivery guarantee. Events contain current state, not a historical event log; label is a notification hint, sequence/state is authoritative. Clients discard stale sequences and resync after gaps/disconnect. Best-effort post-commit delivery failure does not roll back a committed command. Full-state snapshots are used, not fine-grained deltas.

End sends final ENDED/frozen state then closes live sockets. An End command over WebSocket may observe final state/close before its ACK; REST same-intent retry returns the durable frozen result. New live upgrades/mutations reject after End. Historical/private reads remain subject to current valid admission.

## Tests / verification

**43 new integration tests**, all against real isolated PostgreSQL; real Fastify/ws upgrades and frames through injectWS, not mocked socket permission logic.

- meeting-lifecycle.integration.test.ts — **20**: ownership/project consistency, scheduled/start freeze, draft exclusion, immutable/same-intent Start, injected rollback, later Builder changes, stable registered/guest admission/reconnect/no membership, transfer pending/target/decline/accept/Take Back/stale generation, focus membership, actor-private checkpoint/Return-to-Live, three raw-history rejects, trusted disconnect epochs, leave fallback, guest private notes/Snapshot/revocation, immutable/idempotent End/rollback and startup recovery.
- meeting-publication.integration.test.ts — **13**: explicit own safe share/no private leakage, cross-actor/scope denial, replay/new intent, no private-edit read-through, immutable revision Update, author-only withdrawal/history permissions, exact End refs/exclusion, Snapshot classification/ownership, three unsupported-field/category cases, stale original/publication stamps, concurrent Update vs End, duplicate concurrent Start/End.
- meeting-realtime.integration.test.ts — **10**: authenticated admitted LIVE upgrade, authorized current state, no private origin/checkpoint broadcast, presenter navigation/forgery rejection, stable reconnect/resync, explicit publication only, revocation, guest scope, actual socket fallback, End closure and invalid tracking/role commands.

Minimal existing test update: the obsolete Step 3 “shared_meeting_items must not exist yet” table-absence list now permits that requested table; My Space/global-context storage prohibition and private visibility checks remain. All baseline tests remain in the suite; all original Group 1 assertions are untouched.

| Check | Result |
| --- | --- |
| Baseline before Step 5 | 246 passed |
| Full suite | **289 passed, 0 failed, 0 skipped; 19 files** |
| Original Group 1 | **53/53 passed** |
| Earlier test cases retained | **246/246 passing** (one scope-only Step 3 schema absence update) |
| Strict npm run typecheck | **PASS** |
| npm run build | **PASS** |
| Step 5 migration chain | **PASS on dedicated local PostgreSQL test database** |

Test runs started the isolated local PostgreSQL cluster and stopped it afterward. No production data/deployment migration, real headset, Unity Editor/native UI or XR Simulator verification is claimed.

## Documentation / known limits / next step

Updated existing hackathon.md and outputs/backend-implementation-progress.md with real module tree, table ownership, private/shared/realtime/frozen semantics and current results; README links this report. Prior reports/design specifications remain historical and unchanged.

Known limits: single active server instance for presence/realtime/startup recovery; no distributed/HA broker or durable event delivery; full-state rather than delta events; REST alone is not a continuous presence lease; email delivery/guest redemption deferred; trusted guest admission only; no voice/media/conferencing, transcript or hidden recording; no review/outcomes/decision/action acceptance or AI. Bound privacy persists within valid scope; no guest-to-User identity linking or post-scope recovery administration introduced.

Next recommended increment: **Group 6 MeetingReview / Outcomes**, reading FrozenMeetingCapture. Do not implement automatically.

**Remaining blocker for this bounded Step 5: none.** Outcomes, MeetingReview, Decisions, ActionItems, AI/providers/orchestration and Unity were **not implemented**. Stop here.
