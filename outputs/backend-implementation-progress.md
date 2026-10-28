# Adaptive Spatial Labs — Backend Implementation Progress

Last verified: 2026-10-28 (Asia/Calcutta). **BACKEND V1 IMPLEMENTATION COMPLETE**. Steps 1–8 complete. This document describes implemented backend behavior; implementation is stopped at this boundary.

## Current Stack

Node.js 22; strict TypeScript; Fastify; PostgreSQL 16; Drizzle; Zod; Argon2id; Vitest. Backend stack retained; Step 7 adds official @google/genai 2.31.0. No frontend change.

## Current Module Structure

Real implemented directories below. Named files show the shared write foundation and Step 2–7 entry points; existing Group 1 modules retain their repository/service/routes/schema conventions.

```text
backend/src/
  app/
    app.ts
    server.ts
    domain-writes.ts
    step2.routes.ts
  modules/
    auth/
    users/
    organizations/
    preferences/
    projects/
    project-editors/
    project-layers/
    project-structure/
    project-sources/
      source.attach.ts
      source.repository.ts
      source.routes.ts
      source.schema.ts
      source.service.ts
      source.types.ts
      upload.service.ts
      provenance.contract.ts
      provenance.input.ts
      provenance.schema.ts
      provenance.service.ts
    architecture/
      architecture.input.ts
      architecture.schema.ts
      architecture.validation.ts
      architecture.corrections.ts
      architecture.repository.ts
      architecture.service.ts
    knowledge/
      knowledge.access.ts
      knowledge.context.ts
      knowledge.meeting-policy.ts
      knowledge.scope.ts
      knowledge.input.ts
      knowledge.ownership.ts
      knowledge.repository.ts
      knowledge.routes.ts
      knowledge.schema.ts
      knowledge.service.ts
      snapshot.service.ts
    presentations/
      presentation.access.ts
      presentation.input.ts
      presentation.query.ts
      presentation.repository.ts
      presentation.routes.ts
      presentation.schema.ts
      presentation.service.ts
      presentation.validation.ts
      screen.service.ts
    meetings/
      meeting.access.ts
      meeting.admission.ts
      meeting.context.ts
      meeting.control.ts
      meeting.input.ts
      meeting.presence.ts
      meeting.query.ts
      meeting.realtime.ts
      meeting.repository.ts
      meeting.routes.ts
      meeting.schema.ts
      meeting.service.ts
      meeting.validation.ts
      publication.service.ts
    outcomes/
      outcome.access.ts
      outcome.input.ts
      outcome.query.ts
      outcome.repository.ts
      outcome.routes.ts
      outcome.schema.ts
      outcome.service.ts
      outcome.source.ts
      outcome.validation.ts
      review.edit.ts
      review.save.ts
    ai/
      ai.config.ts
      ai.error.ts
      ai.routes.ts
      ai.service.ts
      capabilities/
        ai.semantic.ts
        architecture-context.ts
        context-package.ts
        context-resolver.ts
        meeting-context.ts
        presentation-context.ts
        visual-preview.ts
      orchestration/ai.executor.ts
      providers/
        ai-provider.ts
        vertex-gemini.provider.ts
      schemas/
        ai.input.ts
        ai.output.ts
      prompts/
        ask.v1.ts
        discussion.v1.ts
        scenario.v1.ts
        visual.v1.ts
        summary.v1.ts
        classify.v1.ts
        index.ts
  shared/
    auth/
    concurrency/
    config/
    database/
    errors/
    events/
    operations/
    storage/
    validation/
```

Step 2 routes live in the existing application composition layer and delegate to Sources/Architecture services; domain logic stays outside HTTP.

## Shared Foundation — Implemented

### Transaction Foundation

shared/database/command-transaction.ts runs one PostgreSQL transaction for participating modules and their operation receipt. Nested command boundaries are rejected. Effects/events dispatch only after commit; failures do not falsely report a rolled-back committed write.

### Idempotency

shared/operations/idempotent-operation.ts and operation.repository.ts use operation_results. SemanticFingerprint stores a keyed digest, never the private request body. Same actor, operation kind, scope and normalized semantic request replay the original safe acknowledgement; changed input under the same intent conflicts. Current resource authorization and credential validity are rechecked.

app/domain-writes.ts composes this foundation. A stable private fingerprint key is derived by HMAC from the existing REFRESH_TOKEN_SECRET with the domain label asl.operation-fingerprints.v1. Keep that secret stable across app instances/restarts; rotation invalidates comparison with existing operation fingerprints and needs a future deliberate rotation/receipt policy.

### Concurrency

shared/concurrency/change-stamp.ts validates/advances stamps and rejects missing conditional-update results. Architecture uses a whole-family stamp. Project and architecture row locks serialize command checks, followed by conditional stamp UPDATE in the same transaction. Ingestion uses a locked source/run and expected stamp.

### Principal/Auth

shared/auth/principal.ts, principal-resolver.ts, guest-access.ts and authorization.ts distinguish verified User and Scoped Guest identity. HTTP routes resolve verified principals from existing bearer sessions; Meeting-scoped routes also resolve admitted Scoped Guest credentials. No client role/title/ActorRef grants access. ProjectAccess delegates to the existing project authorization policy. Guest domain access is limited to explicit Presentation and Meeting admission policies; it never grants global private access.

### Events

shared/events/domain-events.ts is a best-effort local post-commit bus. Ingestion/architecture commands emit identifier/stamp notifications. **Not durable event sourcing, not realtime, not an outbox.**

## Sources — Implemented

Source remains existing project_sources, owned by one Project. Existing source metadata, staged uploads and controlled file download behavior remain. No duplicate source/upload/integration credential model.

SourceReference stores sourceId + exact supplied revision + typed locator, with a unique exact-origin index. Same exact origin deduplicates; a different revision gets another identity. Database triggers reject UPDATE/DELETE. Locators support existing Miro, document/artifact and OpenAPI origins without copying source bodies. Availability remains outside the historical identity on existing Source status/access. No automatic provider availability probe is claimed.

IngestionRun is a distinct, explicit attempt: PENDING -> RUNNING -> SUCCEEDED/FAILED, or cancellation from PENDING/RUNNING. Expected stamps protect transitions. One active attempt per source; terminal rows/provenance cannot be rewritten. Retry links a new attempt to an existing terminal predecessor. INPUT/OUTPUT associations must match source and input revision. No polling, worker, provider translation or parsing is implemented.

Existing Source deletion returns DOMAIN_CONFLICT when provenance or attempts must be retained. Removal of unused sources retains original Group 1 behavior. Architecture uses only provenance.contract.ts to validate reference IDs in project scope; it never rewrites SourceReference.

## Architecture — Implemented

Architecture is unique per Project. Before import it does not exist; import creates one candidate family. ArchitectureGraph is the root or a source-backed documented inner graph. **ArchitectureGraph is NOT V1/V2/V3 version history.** No per-edit graph copies or alternative architecture selectors exist.

Nodes retain identity, graph ownership, approved semantic preset, label, description, technology, reviewed position and exact provenance associations. Position is bounded X/Y with locked Z=0. Connections retain directed semantic endpoints/relationship/label and optional provenance; database foreign keys enforce same-graph endpoints. Success/failure/dim/pulse/dashed/broken visual overrides are excluded.

InnerArchitectureReference has one parent node, one child graph and one family. Application validation checks a reachable tree, no cycles, at most one inner child per node and one parent per inner graph. Existing imported links can be reparented with expected previous parent. No manually invented inner depth is generated.

Lifecycle: **Candidate -> Review/Correction -> Confirmed immutable graph family.** Owner/Architect means the actual project owner, not a designation or editor flag. Only owner can initialize, review candidate, correct or confirm. Confirmed reads use project read access.

Corrections: rename/type/X-Y move, add/delete node, add/delete connection, reparent imported inner link, Undo/Redo, checkpoint, Done. Node deletion deliberately removes incident edges; deletion of a node that owns documented inner depth is rejected until reparented. Structural edits are validated before persistence. Retained node/connection rows update in place. Undo/Redo restore deleted identities; the stacks are bounded to eight snapshots each in architecture-owned JSONB, not durable graph version history. New edit clears redo. Checkpoint stores graph/optional selected node. Done returns REVIEW and does not confirm.

Confirmation validates expected family stamp, all graph/tree/provenance invariants, then freezes the exact same root/descendant IDs, closes/clears recovery and records the idempotent result in one transaction. Database triggers block canonical content writes after confirmation; deferred family checks reject partially frozen commits.

Bounds: 32 graphs, 256 nodes and 512 edges across the entire family; every graph nonempty and source-backed. Root/child/name/semantic fields use strict Zod input. Existing 1 MiB HTTP limit and 256 KiB semantic fingerprint limit also apply.

## Knowledge / Context — Implemented

Step 3 is complete (2026-10-26). Knowledge references canonical Architecture/Sources through read-only queries/contracts and never writes either domain.

**KnowledgeItem:** stable actor-owned identity, optional project scope, PRIVATE visibility, manual NOTE / QUESTION / DISCUSSION_POINT, title/body, ACTIVE/ARCHIVED lifecycle, timestamps and expected change stamp. Global private items can omit project scope; attachments require an accessible project. PUT replaces content/current attachments; omitted state defaults ACTIVE and omitted attachments defaults empty. Clients must submit the intended complete attachment set. No AI categories or project-wide/public visibility.

**Privacy:** ownership comes from verified Principal, never JSON. User/Scoped Guest owner columns are exclusive. Project association, owner/editor/presenter/participant roles and references are not private audience grants. Actor-filtered queries precede read/list projection. Current project/target access is rechecked on attach, read, list, edit and create replay. Revoked access hides scoped items/captures and metadata; authored rows remain.

**KnowledgeContext:** item-owned relational anchors plus a strict owned descriptor. Bindings can be ended/replaced, never repointed; unchanged descriptors retain identity. Current kinds: WHOLE_ARCHITECTURE, NODE, CONNECTION, INNER_ARCHITECTURE and LASSO_GROUP. Exact Architecture/Graph IDs and family stamp are captured. Inner context pins documented child, parent node and link. Candidate targets require owner access; confirmed context uses project read access.

Lasso records selectedNodeRefs, internalConnectionRefs, boundaryConnectionRefs, externalBoundaryEndpointRefs and architectureGraphRef. Nodes/edges must resolve in that graph. Internal edges have two selected endpoints; boundary edges exactly one; outside endpoint sets must match. Direction is preserved by connection identity. Sets remain intentional bounded subsets; no automatic traversal/expansion or copied objects. Raw hand/ray/gaze/hover/camera/per-frame data and future screen/meeting placeholders are rejected.

Candidate bindings retain their captured stamp and report STALE after correction. Historical node/connection/inner-link anchors deliberately have no restrictive target foreign key, so notes do not block later correction/deletion. Their graph/family anchor is relational. Refresh requires an intentional current capture; old bindings never float. An edit resubmitting stale bindings must refresh/remove them first.

**Snapshot:** immutable private semantic capture with exact confirmed scope and structured format/title/caption payload. Project filing/association is optional, independently of its required architecture anchor. Unfiled captures still resolve and reauthorize the actual architecture project on every create/read/list/replay/evidence use; omitting projectId never bypasses access checks. When supplied, projectId must match that anchor. Confirmed-only capture avoids claiming to preserve mutable candidate bodies without canonical copying/history. New intent means new identity; same create intent replays the same capture. SQL guards enforce confirmed anchor/stamp and reject UPDATE/DELETE. No continuous recording or video. Image/artifact fields are deferred: current uploads are Source-owned and lack a compatible private Snapshot artifact authorization contract.

**Evidence:** SourceReference attachments require same-project source access; responses return exact descriptors, not document bodies. Private Snapshot attachments require same creator and project. A reference never grants broader access.

**My Space:** logical actor-private KnowledgeItem + Snapshot query, not an aggregate/table/notebook copy. Project/graph/category filters; limit 1–100 and offset 0–10000. Category filters KnowledgeItems only. Combined view returns one bounded page per collection with eligible returned-row count, not global/search totals. Inaccessible records are omitted, so pages may be shorter. No full-text search/private-admin browsing.

**Guest boundary:** reusable ActorRef storage/projection/ownership supports stable guest attribution without User/member creation. Step 5 adds actual Meeting-scoped private Knowledge/Snapshot guest admission through an injected policy; guest global/unscoped private content remains closed. Existing credential expiry/revocation checks remain; no fake parent flow.

**Writes:** item/Snapshot creation reuse IdempotentOperations, reauthorization and safe durable receipt. Knowledge edits use CommandTransactions, project/item locks and conditional expected-stamp update. Body + binding changes commit atomically. Events are local best-effort post-commit identifiers/stamps only. No model provider or AI runtime.


## Presentations — Implemented

Step 4 complete, 2026-10-26. Presentation is a separate preparation root permanently bound to one Project and one confirmed Architecture family. It never writes canonical nodes/connections, SourceReference or private Knowledge originals.

Creation requires the stored Project owner and confirmed Architecture. Many Presentations may reference that family. Each gets exactly one protected, whole-architecture Main Architecture screen, bootstrapped with a confirmed base definition from already confirmed canonical truth. The base cannot be deleted, repurposed or reordered away from first place. No canonical topology is copied into Presentation storage.

Current owner setup: name/purpose; saved builder order/selection; invitation and access authority. PREPARING means at least one current screen is a draft; READY means all current screens have confirmed definitions. This is deterministic preparation state, not Meeting readiness/admission.

Authored screen types: ARCHITECTURE_OVERVIEW, DISCUSSION, SUCCESS, FAILURE, RECOVERY, CUSTOM. Each has exactly one WHOLE_ARCHITECTURE or LASSO_GROUP scope reusing Step 3 semantic schema and a newly shared pure validator. Scope pins exact confirmed family/graph/stamp and retains boundary semantics. A scope change clears incompatible overrides/overlays and invalidates scenario acceptance.

Human/manual scenario-understanding summary/points are stored as a bounded draft. ACCEPT_UNDERSTANDING is explicit and separate from CONFIRM. Visual edits require accepted understanding. Metadata/understanding edits reset acceptance; visual-only edits retain it. No AI generation, prompts, grounding runtime or provider exists.

Node-local overrides: NORMAL/SUCCESS/WARNING/FAILURE/DISABLED, NORMAL/HIGHLIGHT/DIM emphasis, scale 0.5–2, BACK/NORMAL/FORWARD depth, opacity 0.2–1, bounded semantic color, marker, visibility, short label and simple pulse. Connection-local overrides: NORMAL/ACTIVE/BLOCKED/BROKEN, SOLID/DASHED, emphasis/marker/visibility/color, STATIC/FLOW and short label. RESET_VISUALS clears node/edge overrides. These are deterministic product contracts, not claims about Meta runtime support.

ScenarioOverlayConnection is screen-owned and separate from canonical relationships. It uses valid canonical nodes within the anchored graph, a distinct overlay ID, short label and bounded connection visual. Adds/deletes never change Architecture. Deleted authored screens are retained logically; current builder projections omit them while historical confirmed definitions retain intended overlays.

Owner-only CONFIRM validates exact current draft stamp, accepted understanding, semantic scope, all override/overlay targets and bounded captured inclusion schemas. It inserts an immutable definition, updates the current pointer/eligibility/stamps and operation receipt atomically. Same intent replays the same definition. A later edit marks the screen DRAFT/ineligible for a new Meeting while retaining its previous immutable definition. Reconfirmation creates a new definition ID. No per-edit/autosave history is created; explicit confirmed definitions are retained for future consumers. Presentation preparation owns no Meeting snapshot; Step 5 freezes the confirmed definitions when the Meeting actually starts.

PresentationAccessGrant is USER or SCOPED_GUEST, VIEWER or COLLABORATOR; owner is separate. Collaborators edit authored drafts but cannot invite, change owner setup or confirm screens. Viewers read the granted projection and cannot persist selection. No grant creates Project/organization membership/editor assignment or Architecture/Meeting authority. Builder architecture display omits canonical source-provenance arrays; private item origin IDs and private attachments are not exposed.

Registered invitations are durable PENDING intents that can become ACCEPTED/DECLINED/CANCELLED/EXPIRED; expiry is derived on reads and persisted on response. Acceptance checks the authenticated account's stored normalized email and creates one grant atomically. It uses the existing account identity contract, not a new email-verification claim. Email sending/delivery and guest email-link redemption are deferred. A trusted owner-authorized server admission method can provision a real Presentation-scoped guest credential + grant in one transaction, returning the secret once to the trusted caller. There is no public guest mint/redeem route. Guest reads/edits require both current credential validity and grant; expiry/revocation and cross-Presentation isolation are enforced. Step 5 separately adds actual Meeting-scoped private content; this Presentation grant still cannot grant private content or global guest access.

Explicit Add to Discussion/inclusion captures: own permitted KnowledgeItem at expected item stamp, own authorized Snapshot, or exact same-project SourceReference evidence. Knowledge capture includes deliberately selected title/body/category/author only, never private attachment sets, history, origin read permission or whole My Space. The Presentation owns its safe current representation, and confirmed definitions pin it. Later private edits cannot change either representation; replacing requires explicit remove/include. Snapshot/source captures preserve permitted exact semantic/evidence refs without source bodies. Presentation-only guest credentials do not grant private Knowledge/Snapshot access; Step 5 Meeting-scoped private rights are separately validated.

All consequential commands reuse Step 1 idempotency, verified principals and role checks; parent/screen locks and conditional stamps protect writes. Events are best-effort post-commit. Lists are actor-filtered bounded pages (limit 1–100, offset 0–10000) with page counts. Bounds: 64 current screens, 128 overlays and 32 inclusions per screen; 100 stored invitations per Presentation; trusted guest admission checks a 256 active-grant bound and at most thirty-day expiry. Registered invitation expiry is 1–30 days. The 256 active-grant bound is enforced by trusted guest admission; registered acceptances are bounded through the 100 invitation limit.

Migration 0005_unknown_storm.sql adds seven Presentation-owned tables (34 application tables total), immutable definition/inclusion-body guards, permanent family binding, composite owner/pointer FKs and exactly-one-base deferred constraints. No Meeting/Outcomes/AI tables. Full manifest/routes/limits: [Step 4 report](backend-implementation-step4-presentations-report.md).


## Meetings — Implemented

Step 5 complete, 2026-10-26. Deterministic structured collaboration only: DRAFT/SCHEDULED -> LIVE -> ENDED. Many Meetings can use one Presentation. Creation requires stored Project/Presentation owner and matching Project. Owner controls setup, scheduling, invitations, Start/End and Take Back; an invited participant receives no Project/editor/Presentation-collaborator or outcome authority.

**Actual Start freeze:** scheduling stores setup only. Start collects protected Main plus current CONFIRMED authored definitions (drafts excluded even if Presentation is PREPARING), validates Start From, and atomically writes one immutable MeetingPresentationSnapshot, LIVE state, owner participant/presenter, initial shared state and durable receipt. Snapshot stores bounded prepared definitions and stable canonical refs, not canonical graph bodies. Later Builder edits cannot alter it. Start From must belong to that confirmed set. Start retries reuse the same snapshot.

**Participants/invitations:** one stable User or Scoped Guest ActorRef per Meeting. Reconnect reuses it. Registered email-matched intents support accept/decline/cancel/expiry without membership/grant side effects. Expiry is computed on reads and persisted when responding. Email delivery and guest email-link redemption remain deferred; trusted owner-authorized server admission provisions real Meeting-scoped guest access with bounded validity. No public guest mint endpoint or fake User. Revocation/expiry deny future access; attribution rows remain.

**Presenter authority:** one server-authoritative presenter while LIVE, initially owner. Only that participant navigates/sets shared focus or requests transfer to exactly one admitted target. One pending transfer max, no queue/co-presenters. Target explicitly accepts/declines; only acceptance changes presenter. Take Back is owner-only and advances authority generation/cancels pending transfer. Temporary presenter cannot End, edit Architecture/Builder, change owner or accept outcomes.

Socket presence uses trusted connection epochs and expected authority generation. Last relevant temporary-presenter socket loss/leave returns authority to owner. Late old disconnect cannot override newer transfer/reconnect. Owner disconnect never auto-ends or transfers ownership. Single-instance startup recovery clears stale connected flags, cancels transfers, restores owner authority and advances generation; old cached control cannot remain valid across process restart.

**Shared state:** current pinned screen, semantic focus, presenter/generation and Meeting aggregate stamp. Screen must be in start snapshot; focus is deterministically validated against frozen family/current screen scope. Parent locking and conditional aggregate stamps serialize lifecycle/navigation/presenter/publication ordering. Participant-private checkpoint has its own stamp and does not advance shared authority or broadcast. Return to Live reads current authoritative state NOW and switches the caller to following without replaying private state into shared state.

**Private My Space integration:** added optional Meeting association to existing KnowledgeItem/Snapshot, not another notebook/table. A server-injected Knowledge policy validates actual current Meeting admission and exact frozen architecture without granting Project membership. This enables registered invitees and guests to own scoped notes/Snapshots/context even without Project read access. Generic guest/global private routes stay closed; exact Meeting routes resolve guest credentials. Actor ownership still gates every item/capture/list/count. Losing admission or credential validity blocks scoped retrieval while retained content/attribution remain. Raw SourceReference access still requires normal Project policy; Meeting scope is not a source/document grant. Context uses semantic references only.

**Explicit publication:** SharedMeetingItem + immutable revision body. SHARE chooses own eligible note/question/discussion/action-suggestion or Snapshot and intended semantic context; representation includes only deliberate title/body or safe Snapshot scope/payload plus safe author. No private attachment set, unrelated title/count, edit history, origin read permission or notebook copy. Origin ID/stamp stay internal. Same intent replays; another Share intention creates another publication. Explicit UPDATE appends a new immutable revision/current pointer; private edit alone changes nothing. WITHDRAW changes current visibility without erasing revision history. Audience reads only current visible or exact End-pinned revisions; author can inspect own retained revisions.

**Meeting Context:** current pinned screen/prepared inclusions, participants, pending transfer and visible publications, grouped by their manual classifications by consumers. Canonical display is resolved from immutable refs without source-provenance arrays. No unshared private bodies/checkpoints, transcript, continuous capture or inferred verbal decisions.

**Realtime:** official @fastify/websocket 11.3.4 (ws 8.22.0, @types/ws 8.18.2). Authenticated /api/v1/meetings/:meetingId/ws binds an existing admitted participant and sends authorized current state. JSON command schemas reject role/hand/ray/gaze/camera/audio data. Per-command lifecycle/admission/capability/generation/stamp checks and final credential checks reuse REST services. Committed events include presence, navigation/focus, transfer/Take Back/fallback, publication changes and End. Broadcast is post-commit and reauthorized per recipient; private creation/checkpoints never broadcast. Reconnect/SYNC resynchronizes from PostgreSQL. End sends final state and closes live sockets; future live upgrades/commands reject.

Transport bounds: 64 KiB inbound JSON frames, 20 commands/second/socket, 16 pending commands, 4 MiB buffered-output backpressure cutoff, 15-second ping/auth heartbeat. Output is bounded by domain collections and may exceed inbound-frame size. Events carry full authorized current state + aggregate sequence, not a durable event log; clients discard stale sequences and resync after gaps/disconnect. Single backend process only: in-process fan-out/presence, no distributed broker/HA delivery. REST alone does not establish a continuous presence lease; live clients must connect WebSocket for automatic disconnect fallback.

**End / frozen input for Step 6:** owner-only atomic LIVE -> ENDED writes one immutable FrozenMeetingCapture, exact start snapshot ID, current visible publication revision refs, final shared semantic state and safe participant attribution; it cancels pending transfer and records receipt. It excludes withdrawn/unshared content, private exploration, tracking, voice/transcript and verbal-only inference. Publication changes and End share one lock/stamp ordering. Failed End leaves LIVE/no capture; retry returns the original capture. Step 5 End itself creates no review or accepted outcome; Step 6 owns the separate review/acceptance flow. No AI interpretation is created.

**Persistence:** 10 new Meeting-owned tables; total 44 application tables. Migrations 0006_numerous_white_queen.sql, 0007_meeting_consistency.sql and 0008_meeting_publication_guard.sql plus metadata. SQL guards protect immutable snapshots/revisions/capture, one start/end freeze, stable participant/publication identity and atomic LIVE/frozen-state invariants. Follow-up migrations correct SQL guard ambiguities found in isolated PostgreSQL tests; previously applied migration history was preserved. Earlier-domain changes are additive scope/authorization integration; one obsolete Step 3 absence assertion now permits the requested shared_meeting_items table while preserving no-MySpace/no-global-context checks.

Full manifest, REST/WS contract and limits: [Step 5 report](backend-implementation-step5-meetings-report.md).


## Deterministic vs AI Boundary

**DETERMINISTIC DOMAIN:** permissions, graph ownership, node/connection validity, corrections, provenance, concurrency, confirmation, freeze semantics, persistence, idempotency.

**AI: Step 7 proposal capabilities implemented; deterministic domains retain all commit authority.**

Implemented boundary: authorized context -> proposed structured actions -> deterministic validation -> human preview/confirmation -> domain commit. AI never owns canonical architecture truth. The current import endpoint accepts structured proposals and does not parse arbitrary source files or prove externally supplied claims against provider content.

## Meeting Outcomes — Implemented

Step 6 implements deterministic Group 6:
FrozenMeetingCapture -> MeetingReview -> human-reviewed assessments/candidates -> explicit READY_TO_SAVE -> owner-confirmed Save to Project -> immutable accepted results. Step 6 remains deterministic; Step 7 separately proposes, without acceptance authority.

Outcomes owns one review per ended Meeting/exact capture. Lifecycle: DRAFT -> REVIEWING -> READY_TO_SAVE -> SAVED. Explicit REOPEN returns READY_TO_SAVE to REVIEWING; edits are blocked while ready and all content freezes after Save. Expected review bundle stamp serializes every child edit, classification, candidate/link change, readiness and Save. Meaningful commands persist immediately; no automatic acceptance.

Frozen source projection resolves only exact End-pinned publication revisions and actual-Start screen definitions/inclusions, safe attribution and final semantic state. It never queries private originals, mutable current publication pointers, participant-private checkpoints or raw source bodies. Safe supporting references are catalog keys into that fixed projection (publication revision, prepared inclusion, confirmed screen); arbitrary source/private IDs are rejected. Original shared source remains separate from edited assessment text.

Manual classification: RAISED -> DISCUSSED -> ADDRESSED / UNRESOLVED / DEFERRED / DECISION / ACTION. NOT_DISCUSSED requires explicit human assessment too; unknown RAISED never becomes inferred not-discussed. Terminal classifications may return to DISCUSSED for correction. Unresolved/deferred/addressed/unknown retained items freeze as review-owned project knowledge, not duplicated ProjectOutcome or KnowledgeItem roots.

Decision/Action draft identities and normalized typed N:M ReviewOutcomeLinks persist before Save; project queries hide all draft results. Human promotion requires a discussed/assessed retained source. Decisions contain title/statement/rationale/context keys and creator/accepted-by; Actions contain title/description, one optional draft assignee, due date, optional same-review primary Decision and OPEN status. Acceptance requires exactly one captured responsible ActorRef, including stable guest attribution. Assignment grants no access. No post-save task tracking/status/reassignment endpoint exists.

Save transaction: current owner/project authority + review lock/stamp -> exact capture + full candidate/link/reference validation -> accept existing Decision/Action IDs -> freeze retained assessments and immutable accepted manifest/summary -> SAVED + durable Step 1 receipt -> commit -> best-effort meeting_review.saved event. Same intent returns original accepted IDs/manifest and stamp; changed input conflicts. New Save after SAVED rejects. Any mid-write or commit failure rolls back all acceptance and receipt while preserving the ready draft. Concurrent Save/edit intentions have one committed ordering.

Saved project reads use existing ProjectAccess; Meeting participation/presenter status alone cannot finalize or read project outcomes. Only owner reads draft or ignored assessment text. Saved project projections filter ignored assessments and source inclusions. No canonical Architecture mutation, My Space permission widening or private origin dereference.

Five new tables: meeting_reviews, meeting_review_items, decisions, action_items, review_outcome_links. Accepted MeetingOutcome manifest is owned JSONB on meeting_reviews, not a second body/history root. Total **49 application tables**. Migrations 0009_meeting_outcomes.sql and 0010_outcome_acceptance_guard.sql plus generated metadata. Follow-up corrects JSONB operator precedence exposed by real commit testing; applied history preserved. SQL guards protect exact ended capture/project/owner binding, same-review typed links and responsibility, immutable saved bundle and no partial acceptance. Preserve custom SQL guards beyond generated snapshots.

REST: POST/GET /api/v1/meetings/:meetingId/review; GET /api/v1/reviews/:reviewId; POST /api/v1/reviews/:reviewId/commands; bounded GET /api/v1/projects/:projectId/{decisions,actions,assessments,outcome-activity}. Default item page 6, max 100, offset max 10000. Review/source collection is bounded; full frozen source envelope is not a new infinite history. Home reads derived accepted activity/counts; no Home truth table.

Verification: **52 new tests: 24 frozen-review/classification + 28 outcomes/acceptance tests. Full suite: 341 passed, 0 failed, 0 skipped, 21 files. All 289 baseline tests and 53/53 original Group 1 tests pass unchanged. Strict TypeScript typecheck PASS; build PASS.** Isolated PostgreSQL16 migrated and stopped cleanly after the full run. No production/provider/Unity verification claimed. Full contract, exact manifest and limits: [Step 6 report](backend-implementation-step6-outcomes-report.md).

## AI Capability Layer — Implemented

Step 7 adds a separate AI module with official @google/genai 2.31.0 and Vertex/Gemini primary, using SDK ADC only. No business domain imports the provider SDK. Flow:
deterministic domain -> resolved safe context -> AI proposal -> schema/domain validation -> human confirmation -> existing deterministic commit.

Six proposal-only capabilities: AskContextAI, SuggestDiscussionPoints, UnderstandScenario, TranslateVisualCommand, SummarizeMeeting, ClassifyMeetingOutcomes. No auto-save, screen acceptance, canonical edit, ReviewItem classification or Decision/Action creation. Context/permission is resolved before and after the provider wait; stale context or revocation blocks disclosure. Scope PRIMARY/BOUNDARY/explicit EXPANDED is preserved. SourceReference metadata only; raw source documents/private origins/checkpoints/receipts/credentials never enter prompts. Meeting summaries use exact frozen input; current retained review assessments are separately included only for owner classification suggestions.

Visual operations reuse NODE_VISUAL / CONNECTION_VISUAL / ADD_OVERLAY / RESET_VISUALS, approved Step4 enums/ranges, PRIMARY targets and existing validateDefinition on an in-memory preview. Main Architecture remains protected. Step4 ACCEPT_UNDERSTANDING/CONFIRM and Step6 owner review/READY/SAVE stay explicit, separate domain commands.

Config: optional AI_ENABLED, GOOGLE_CLOUD_PROJECT/LOCATION, GEMINI_MODEL_PRIMARY/REASONING, AI_TIMEOUT_MS. Missing/bad AI settings or provider failures return typed errors; deterministic flows continue. Primary gemini-3.5-flash was verified through authenticated Node listing and tiny structured generation. Optional gemini-3.1-pro-preview was listed, not generation-smoked. SDK uses vertexai:true explicitly; no application ADC JSON reader. Missing non-secret local Google settings were appended to ignored backend/.env without changing credential values.

Execution is bounded:16KiB input,128KiB context,32KiB/8192-token output,20s default timeout (max60s), abort/disconnect,4 concurrent calls per app instance,12 requests/minute/IP/route in production. No automatic retries, model escalation, external tools, agent loops or fallback. OpenAI deferred because no safe key was visible. Six versioned prompts, strict Zod/JSON-schema output and exact semantic/source-key validation. Safe metadata-only telemetry, no prompt/response history.

No migrations/tables;49 application tables unchanged. Proposal/preview is ephemeral response state; owning domains remain the only persistence owners. Guest AI access, raw source-body ingestion, proposal recovery persistence, AssemblyAI, Unity, Step8 and production deployment are not implemented.

Routes: POST /api/v1/ai/context/ask; /api/v1/ai/discussion-points; /api/v1/ai/scenario/understand; /api/v1/ai/visual-command/translate; /api/v1/ai/meetings/:meetingId/summary; /api/v1/ai/reviews/:reviewId/classify. No generic /ai/chat.

Verification: **53 tests added: 26 provider/schema unit tests and 27 capability integration tests. Full suite: 394 passed, 0 failed, 0 skipped in 23 files. All 341 baseline tests and 53/53 original Group 1 tests pass unchanged. Strict TypeScript typecheck PASS; build PASS.** Normal suite uses only fake/null AI providers. Actual installed Gemini adapter smoke separately PASS. Isolated local PostgreSQL stopped cleanly.
Live installed-adapter smoke PASS, vertex-gemini/gemini-3.5-flash,56 input and5 output tokens. Opt-in only: npx --no-install tsx scripts/ai-smoke.ts --live; normal suite uses fake/null providers. Full manifest/contracts/limits: [Step 7 report](backend-implementation-step7-ai-report.md).

## Database

Existing Group 1 (11): users, organizations, organization_members, user_preferences, projects, project_editors, project_structures, project_layers, project_sources, staged_uploads, refresh_sessions.

Step 1 foundation (2): operation_results — durable safe receipt; scoped_guest_access — scoped guest credential/access foundation.

Step 2 Sources/Architecture (11):

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

Step 3 Knowledge/Context (3):

| Table | Purpose |
| --- | --- |
| knowledge_items | Actor-private authored content and concurrency stamp; optional project association. |
| knowledge_contexts | Owned current/ended semantic and evidence bindings; exact captured descriptor. |
| snapshots | Immutable actor-private confirmed semantic capture with optional project filing. |

Step 4 Presentations (7):

| Table | Purpose |
| --- | --- |
| presentations | Permanent Project/confirmed Architecture/owner binding and preparation checkpoint. |
| presentation_access_grants | Actor-scoped viewer/collaborator access and revocation. |
| presentation_invitations | Durable registered-recipient intent and terminal acceptance state. |
| presentation_screens | Protected base and authored current draft/eligibility/order. |
| presentation_screen_definitions | Immutable explicit confirmed definitions. |
| scenario_overlay_connections | Screen-only hypothetical relationships, never canonical edges. |
| presentation_screen_knowledge_references | Safe intentional captured inclusion with internal private provenance. |

Migrations: 0000_busy_beyonder.sql (Group 1), 0001_v1_write_foundation.sql, 0002_eager_havok.sql. Step 3 migration: 0003_sleepy_nitro.sql adds knowledge_items, knowledge_contexts and snapshots. 0004_glamorous_pet_avengers.sql permits optional Snapshot project filing while retaining confirmed-anchor/access checks. Step 4 migration 0005_unknown_storm.sql adds presentations, presentation_access_grants, presentation_invitations, presentation_screens, presentation_screen_definitions, scenario_overlay_connections and presentation_screen_knowledge_references. Step 5 adds 10 Meeting-owned tables via 0006_numerous_white_queen.sql, with guard corrections in 0007_meeting_consistency.sql and 0008_meeting_publication_guard.sql. Step 6 migrations 0009_meeting_outcomes.sql and 0010_outcome_acceptance_guard.sql add five Outcomes tables/acceptance guards. Total 49 application tables. Its custom guards/FKs/deferred constraints also require preservation. Custom Knowledge/Snapshot guard triggers in 0003 also require preservation. Custom trigger/constraint SQL in 0002 must be retained in future migrations; generated Drizzle snapshots describe tables/indexes, not trigger bodies.

## Important Flows

Import/reconstruction: Source -> exact references -> supplied validated structured proposal -> candidate ArchitectureGraph -> review/correction -> confirm -> immutable architecture. No provider reconstruction adapter exists yet.

Correction: user command -> verified principal/owner -> project/family lock -> expected stamp -> domain/tree/provenance validation -> differential write -> new family stamp + operation receipt -> commit.

Confirmation: owner -> exact reviewed family/stamp -> invariant validation -> atomic root/descendant freeze + closed correction recovery + idempotent receipt -> commit -> best-effort notification. Failed validation/database write rolls everything back.

Presentation preparation: confirmed Architecture + authorized deliberate Knowledge -> protected Main + authored screens -> whole/lasso scope -> manual scenario understanding acceptance -> local visual/overlay/discussion state -> owner-confirmed immutable definitions -> current meeting eligibility. Step 5 implements Meeting Start and its immutable snapshot as a separate domain.

Detailed route inventories/manifests: [Step 2 report](backend-implementation-step2-sources-architecture-report.md), [Step 3 report](backend-implementation-step3-knowledge-context-report.md), [Step 4 report](backend-implementation-step4-presentations-report.md).

## Tests

Step 1 final before Step 2: **107 passed**. Step 2 adds **47 tests**: Sources integration 12, Architecture integration 24, architecture invariant/correction unit tests 11.

Step 2 closed baseline: **154 passed**. Step 3 adds **53 tests** (45 Knowledge/Context and 8 guest/transient-data checks). Step 3 closed baseline: **207 passed**. Step 4 adds **39 tests**. Step 4 closed baseline: **246 passed**. Step 5 adds **43 tests** (20 lifecycle/private/authority, 13 publication, 10 WebSocket). Step 5 closed baseline: **289 passed**. Step 6 adds **52 tests** (24 review, 28 outcomes/acceptance). Step 6 closed baseline: **341 passed**. Step 7 adds **53 tests** (26 provider/schema unit, 27 capability integration). Step 7 closed full run: **394 passed, 0 failed, 0 skipped, 23 test files**; all 341 earlier tests remained passing unchanged. Step 8 adds **23 tests in four files**; final full suite on both fresh and regular dedicated databases: **417 passed, 0 failed, 0 skipped, 27 files**. All **53 original Group 1 tests** and all 54 existing foundation/fix tests pass. Strict typecheck and build pass. Integration uses the dedicated local PostgreSQL test database, with all 11 migrations 0000–0010 applied from an empty database and automatic fixture reset on the normal database. Normal regression uses fake/null providers; a separate opt-in Gemini tiny smoke passed. No Unity/device verification is claimed.

## Not Implemented Yet

- Unity integration for these new backend modules
- Provider-specific source parsing, OAuth clients, automatic ingestion execution

## Backend V1 Completion / Next Boundary

**BACKEND V1 IMPLEMENTATION COMPLETE**. Step 8 integration/hardening is complete. The backend has 49 application tables, 91 business routes and 38 automatic HEAD handlers. Final typecheck/build, real HTTP start/explicit app.close + pool cleanup, compiled entrypoint HTTP smoke and tiny Gemini smoke all pass. No migration added; all historical migrations retained. Runtime npm audit: zero vulnerabilities; four moderate development-tool-chain advisories remain documented. No Unity, AssemblyAI, production deployment or new product work is authorized automatically.

## Step 8 — Final Integration + Hardening

Five cross-domain lifecycle flows, role/IDOR/privacy regressions and missing freeze-boundary rollback tests verified. Fixed cross-Project Source deletion existence leak, production example-secret acceptance, closed-socket queued commands and compiled server late-hook startup. Batched builder/current/frozen revision projections and replaced full revision history materialization with MAX(sequence). Fastify 5.12.6 / fast-uri 3.1.9 and 4.2.3 are the only dependency security patches.

Fresh empty database full migration/full suite: 417/417 (589.47 s); normal dedicated fixture/reset full suite: 417/417 (351.62 s). No failures or skips. All 394 earlier tests and all 53 original Group 1 tests pass; existing Group 1 assertion files unchanged. Realtime remains single-process; private/Project/canonical/Presentation/Meeting/Outcomes ownership remains separate. AI owns proposals only and requires human deterministic acceptance.

Final report and exact Step 8 manifest: [Step 8 hardening report](backend-implementation-step8-hardening-report.md). Complete route method/path/auth/purpose inventory: [Backend V1 route inventory](backend-v1-route-inventory.md). The module tree above describes the final implemented modular monolith. Unity integration is the next separately authorized product increment, with AssemblyAI and deployment also separate; none was started.