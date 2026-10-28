# Backend V1 — Operations + Authorization Design

**Final design pass · Pass 2 · 2026-10-23 · Documentation only.** Preserve one modular monolith, one PostgreSQL database and current Group 1 implementation. This document completes operational/authority decisions; it does not authorize implementation.

Authority: [Step 0A](backend-step0a-domain-interaction-architecture.md), [persistence classification](backend-step0b1-persistence-classification.md), [cardinalities/ownership](backend-step0b2-cardinalities-and-ownership.md), [Pass 1 persistence/consistency](backend-v1-persistence-consistency-design.md). Approved product references: [Group 1](group1-backend-spec.txt), [Group 2](group2-product-design-spec.md), [Group 3](group3-correction-editor-spec.md), Group 4 [entry](group4-stage1-entry-and-open-spec.md), [setup](group4-stage2-presentation-setup-spec.md), [scope](group4-stage3-lasso-selection-spec.md), [discussion](group4-stage4-discussion-preparation-spec.md), [builder](group4-presentation-builder-and-meeting-bridge-spec.md), [Group 5](group5-live-meeting-spec.md), [Group 6](group6-meeting-review-and-outcomes-spec.md).

Counting registers: **17 named transactional boundaries in Section 1; 20 commands with idempotency rules in Section 3; 15 concurrency-protected operation families in Section 4; eight conceptual role/capability contexts in Section 6.** Cross-references elsewhere do not add to those counts. Roles can overlap on one actor; they are not eight unrelated identities or a new enterprise RBAC product. Technical receipt/delivery bookkeeping is not another domain aggregate or change to the 38 domain-table candidates.

# SECTION 1 — TRANSACTIONAL BOUNDARIES

Each numbered boundary below is **one PostgreSQL transaction**. Domain modules retain ownership while application orchestration coordinates their authorized persistence within it. Atomic writes include the durable same-intention result association. External email, Miro, AI, artifact uploads and client notification are outside the transaction; committed records are truth.

## T01 — Create Project

**OPERATION:** Create Project.

**ATOMIC WRITES:** Project, owner binding, initial structure/layers, editor assignments, attached Sources and consumed stages, creation result receipt.

**READ/PRECONDITIONS:** Registered actor, organization membership, valid existing Group 1 inputs/editor eligibility and actor-owned unused staged uploads.

**WHAT MUST NEVER PARTIALLY COMMIT:** Project without required setup, some consumed stages without matching attachment, duplicate creation on retry.

**FAILURE RESULT:** Rollback this creation unit; staged resources remain unconsumed; preserve recoverable input. External staged bytes are not deleted by rollback.

## T02 — Attach Source / consume staged upload

**OPERATION:** Attach Source / consume staged upload.

**ATOMIC WRITES:** One authorized source attachment, one-time stage consumption/project binding, result receipt.

**READ/PRECONDITIONS:** Existing project write policy; unused valid same-uploader stage/artifact; expected attachment state; connector reference permitted.

**WHAT MUST NEVER PARTIALLY COMMIT:** Consumed stage with no durable Source/artifact origin, duplicate attachments for same consumption.

**FAILURE RESULT:** Rollback both attachment and consumption; previously uploaded artifact remains usable subject to expiry.

## T03 — Confirm Architecture

**OPERATION:** Confirm Architecture.

**ATOMIC WRITES:** Promote exact root and all imported descendants/nodes/edges/inner links; confirmed Architecture binding; close correction checkpoint; acceptance receipt.

**READ/PRECONDITIONS:** Active project owner; current candidate/family stamp; source-backed inner structure, valid endpoints, same project and no cycles.

**WHAT MUST NEVER PARTIALLY COMMIT:** Confirmed root with editable/unconfirmed inner graph, different graph than reviewed, second accepted root.

**FAILURE RESULT:** Rollback all confirmation; candidate/recovery work survives. Already committed same acceptance returns its result.

## T04 — Confirm PresentationScreen

**OPERATION:** Confirm PresentationScreen.

**ATOMIC WRITES:** One immutable confirmed definition including permitted knowledge representations/scope/settings; screen eligibility/current state; parent package change stamp; receipt.

**READ/PRECONDITIONS:** Owner; current screen and package stamps; scenario understanding/required fields; same confirmed graph; authorized inclusions.

**WHAT MUST NEVER PARTIALLY COMMIT:** Eligible screen pointing at incomplete draft or private future content; partially captured visual/overlay set.

**FAILURE RESULT:** Keep draft and prior historical checkpoint; no new eligibility/definition on failure.

## T05 — Accept presentation invitation

**OPERATION:** Accept presentation invitation.

**ATOMIC WRITES:** Resolve/bind same recipient principal, invitation acceptance, one scoped grant and any required restricted guest binding; receipt.

**READ/PRECONDITIONS:** Intended recipient verified server-side; invitation valid or same accepted operation; scope exists; allowed grant only.

**WHAT MUST NEVER PARTIALLY COMMIT:** Accepted invitation without valid scoped principal/grant; duplicate grants or project membership escalation.

**FAILURE RESULT:** Rollback acceptance unit; no access granted. Identity verification outside transaction produces only input, not an automatic grant.

## T06 — Create Meeting

**OPERATION:** Create Meeting.

**ATOMIC WRITES:** Meeting bound to one presentation/project/owner, intended schedule/setup, owner participant initialization, explicit invitation/send intents if requested; receipt.

**READ/PRECONDITIONS:** Owner; active project; confirmed graph; legal preparation/start selection; explicit invite send authorization.

**WHAT MUST NEVER PARTIALLY COMMIT:** Meeting with mismatched scope or ownership; sends for rolled-back meeting.

**FAILURE RESULT:** Rollback creation; draft setup retained where already autosaved. Immediate Start remains T10, not a partly LIVE creation.

## T07 — Accept meeting invitation

**OPERATION:** Accept meeting invitation.

**ATOMIC WRITES:** Invitation acceptance, one admitted participant, scoped guest binding when applicable, receipt.

**READ/PRECONDITIONS:** Verified intended recipient; valid scope/invitation/admission rules; one principal/meeting participation.

**WHAT MUST NEVER PARTIALLY COMMIT:** Accepted invitation with missing/duplicate participant or accidental project/presentation collaboration grants.

**FAILURE RESULT:** Rollback acceptance; retries reconnect same principal and participant.

## T08 — Request presenter transfer

**OPERATION:** Request presenter transfer.

**ATOMIC WRITES:** One pending request bound to current authority generation, sender and eligible intended recipient; meaningful owner return checkpoint where relevant; receipt.

**READ/PRECONDITIONS:** LIVE; sender current presenter; no pending request; current authority stamp; receiver admitted; guest receiver owner-permitted.

**WHAT MUST NEVER PARTIALLY COMMIT:** More than one request, changed current presenter merely by requesting, request linked to old authority.

**FAILURE RESULT:** Reject/rollback; old presenter remains. Same request retry reuses request/result even if later resolved.

## T09 — Accept presenter transfer

**OPERATION:** Accept presenter transfer.

**ATOMIC WRITES:** Accepted request resolution, current presenter change, authority generation/shared-state stamp advance, pending request clear; receipt.

**READ/PRECONDITIONS:** LIVE; actor exactly intended recipient; still admitted; same pending request and expected authority; guest permission remains valid.

**WHAT MUST NEVER PARTIALLY COMMIT:** Two presenters, accepted request without authority change, stale request resurrecting control.

**FAILURE RESULT:** Conflict/rollback leaves current authority intact; committed retry returns receipt, never replays transfer.

## T10 — Start Meeting

**OPERATION:** Start Meeting.

**ATOMIC WRITES:** MeetingPresentationSnapshot, LIVE transition, owner admission/current presenter initialization, shared-state baseline, clear incompatible pending state; receipt.

**READ/PRECONDITIONS:** Owner; unstarted legal meeting; current presentation package/eligible confirmed-definition set and Start From; required source content authorized; same graph.

**WHAT MUST NEVER PARTIALLY COMMIT:** LIVE without pinned confirmed content, valid admitted presenter or initial shared state.

**FAILURE RESULT:** Rollback start entirely; remain unstarted/recoverable. Already committed start returns original snapshot, never latest.

## T11 — Share own content to Meeting

**OPERATION:** Share own content to Meeting.

**ATOMIC WRITES:** New SharedMeetingItem plus immutable initial representation, safe provenance/scope, current visibility, meeting publication/capture-membership change marker; receipt.

**READ/PRECONDITIONS:** LIVE admitted actor; own private source or explicit direct input; expected source content stamp; permission-filtered attachments; valid meeting graph.

**WHAT MUST NEVER PARTIALLY COMMIT:** Public envelope without payload, unrelated private fields leaked, original moved/deleted.

**FAILURE RESULT:** Rollback publication; private original untouched. No post-commit private refetch to build published content.

## T12 — Update own publication

**OPERATION:** Update own publication.

**ATOMIC WRITES:** Append immutable publication revision, advance current pointer/visibility as permitted, advance meeting capture-membership marker; receipt.

**READ/PRECONDITIONS:** LIVE; original publishing actor; expected publication revision and source stamp; current access/semantic validity.

**WHAT MUST NEVER PARTIALLY COMMIT:** Old body overwritten, revision without intended current selection, update racing unnoticed with End.

**FAILURE RESULT:** Rollback keeps old current revision. Historical pinned revisions remain readable only within authorized audience.

## T13 — End Meeting

**OPERATION:** End Meeting.

**ATOMIC WRITES:** Freeze eligible publication revisions/intentional structured entries/final state into FrozenMeetingCapture, mark ENDED, clear pending transfer/live command eligibility; receipt.

**READ/PRECONDITIONS:** Owner confirmation; LIVE; expected lifecycle/capture membership/shared-state stamps; stable start snapshot.

**WHAT MUST NEVER PARTIALLY COMMIT:** ENDED without complete frozen capture, final publication updates omitted by race, late control transfer.

**FAILURE RESULT:** Rollback End; retain LIVE structured work or resolve already committed End receipt. No partial review-ready state.

## T14 — Meeting Review autosave

**OPERATION:** Meeting Review autosave.

**ATOMIC WRITES:** Autosave current assessment/summary/draft Decision/Action/link changes within submitted draft unit and advance review draft/member-set stamp.

**READ/PRECONDITIONS:** Owner; ended meeting plus frozen capture; review not accepted; expected review/outcome stamps; valid typed links/context.

**WHAT MUST NEVER PARTIALLY COMMIT:** Updated review stamp without submitted draft changes, outcome changes invisible to review acceptance stamp.

**FAILURE RESULT:** Rollback current autosave unit; retain previous durable draft. Client keeps unacknowledged edits for retry; no acceptance.

## T15 — Save to Project

**OPERATION:** Save to Project.

**ATOMIC WRITES:** Freeze reviewed assessments/links and Decision/Action definitions, create one accepted manifest/summary, mark review accepted, commit result receipt.

**READ/PRECONDITIONS:** Owner; ended meeting/fixed capture; exact reviewed draft/member-set/outcome stamps; assignees/evidence/context valid.

**WHAT MUST NEVER PARTIALLY COMMIT:** Some accepted outcomes without manifest, accepted manifest with incomplete outcomes, success/Home before commit.

**FAILURE RESULT:** Rollback acceptance only; all prior autosaved draft work remains; no accepted Home changes.

## T16 — Owner Take Back / server presenter fallback

**OPERATION:** Owner Take Back / server presenter fallback.

**ATOMIC WRITES:** Restore owner presenter reference, advance authority generation, invalidate pending transfer, update shared authority stamp and return checkpoint use if applicable; command receipt for explicit Take Back.

**READ/PRECONDITIONS:** LIVE; explicit actor is owner OR trusted server disconnect/fallback policy; expected current temporary presenter and connection/authority generation.

**WHAT MUST NEVER PARTIALLY COMMIT:** Take-back with live stale request, fallback overwriting newer presenter, multiple presenters.

**FAILURE RESULT:** Rollback/conflict then re-read authority; do not replay stale disconnect signal. Owner identity remains authority even if offline.

## T17 — Create/send scoped invitation

**OPERATION:** Create/send scoped invitation.

**ATOMIC WRITES:** One PresentationInvitation or MeetingInvitation, intended recipient/scope/access binding, one durable delivery intent and command result receipt.

**READ/PRECONDITIONS:** Owner explicitly sends; valid target/access policy; recipient normalization; no autosave-triggered send.

**WHAT MUST NEVER PARTIALLY COMMIT:** Email dispatched before invitation exists, invitation or delivery duplicated by same-intention retry, invitation granting project rights.

**FAILURE RESULT:** Rollback intent/invitation creation; no email requested for rolled-back intent. External delivery failure remains retryable after commit without recreating invitation.

Single-owner semantic writes such as private-note save, shared screen/focus navigation, transfer decline and publication withdrawal are also atomic at their existing owner. They do not require cross-root workflows or add another numbered freeze boundary: validate current capability/stamp and commit that owner's state/result together. Withdrawal participates in the same meeting capture-ordering invariant as T11/T12/T13. Review child edits always advance their parent review bundle stamp.

A transaction cannot protect a decision based only on an earlier unlocked read. Read-set consistency and conditional owner stamps must serialize conflicting decisions before commit. Authority/grant revocation must be checked in the same consistent command unit, not just in an earlier request middleware check. Exact locking/isolation/conditional-update syntax belongs to implementation.

# SECTION 2 — CROSS-AGGREGATE TRANSACTIONS

Choose **transaction + post-commit internal event** for the write operations below; the authoritative cross-root changes and operation receipt are one database commit. Post-commit events announce facts; they never finish a missing authoritative half of the operation. Read projections are derived, not extra acceptance writes.

| Operation | Participating owners / reads | Commit choice | Post-commit / projection consequence |
| --- | --- | --- | --- |
| Project creation / staged attachment | Identity eligibility, Projects setup, Sources stage/attachments | One transaction for setup, consumption and result | Emit committed project/source fact; Home reads created project; processing begins only after attachment commit. |
| Architecture confirm | Projects current authority/status; Architecture graph family; fixed Sources evidence | One transaction for exact accepted family | Publish accepted graph fact; Home confirmation state derives from commit. |
| Screen confirm | Presentations definition and inclusions; authorized Knowledge/Sources representations; immutable Architecture | One transaction with stable source/input stamps | Notify authorized preparation clients; readiness derives from confirmed screen state. |
| Invitation accept | Identity restricted principal binding; Presentations grant or Meetings participant/invitation | One transaction | Notify recipient/owner after commit; no organization/project membership side effect. |
| Meeting create/start | Projects owner; Presentation eligible package; Meeting participant/shared state/start snapshot | Creation and Start are separate complete transactions T06/T10 | No broadcast of LIVE until T10 commits; current valid snapshot reads are immediate. |
| Share / update | Knowledge author's intended current source; Meeting publication and immutable representation | One transaction T11/T12; source read checked consistently | Broadcast only bounded committed publication; never refetch private latest content for broadcast. |
| Presenter accept / take-back / fallback | Meetings participant validity, current authority and request | One transaction T09/T16 | Authorized clients receive current authority after commit; old command stream loses authority immediately. |
| End | Meetings lifecycle, exact publications/intentional capture input | One transaction T13 | Announce ENDED/capture-ready; AI/review work may run afterward from frozen input. |
| Review autosave | Outcomes Review, assessments, draft Decisions/Actions and typed links | One transaction per meaningful submitted unit T14 | Acknowledgment reports durable draft stamp, never accepted publication. |
| Save to Project | Projects authority; Review and accepted outcome roots/links/manifest; fixed Meeting capture | One transaction T15 | Accepted event after commit; Home reads accepted result, not eventual event completion. |
| Invitation send | Scope owner, Invitation and delivery intent | One transaction T17, then external dispatch | Delivery may retry independently; invitation/admission state is not recreated. |
| Home reads/cache | Authorized committed records across source domains | Derived read; no independent write-owned Home state | Initial V1 uses database-derived snapshot-consistent query; later cache is rebuildable and must not govern authority. |

**Reliable effects:** record external delivery intent with the originating commit; dispatch after commit with bounded retry and status. If internal event delivery is needed reliably to trigger processing/notification, durable technical delivery bookkeeping can serve that purpose. This is not event sourcing or a new user feature. Physical infrastructure placement is an implementation detail; no schema is created here.

Email/provider delivery cannot be promised exactly once across a database/provider boundary. Reuse the same delivery intent and provider idempotency support when available; otherwise rare duplicate notifications may occur, but they contain the same invitation and cannot create extra access grants. Command retries must never deliberately enqueue a second delivery for the same send intent.

Artifact upload occurs before attachment with recoverable staging; rollback never pretends to roll back a remote object store. AI/external-source reads happen outside write locks, then their authorized persisted input identities/stamps are validated before acceptance. No distributed transaction or long-running provider call inside PostgreSQL transactions.

# SECTION 3 — IDEMPOTENCY

A client must preserve one conceptual **intention identity** across retries of a consequential action. Server-generated IDs alone do not identify whether a second request is a retry. Scope binds authenticated actor, command kind, target (or creation scope), intended semantic input and operation identity; no HTTP header/identifier format is selected here.

A durable result association binds an intention to its semantic request and committed result. It commits with the authoritative state. Reusing an intention with different target/content/expected input is a conflict, not a new action. In-flight duplicate attempts cannot both commit; resolve pending/committed state without minting new records.

Current permission is checked before revealing any receipt. For an already-committed matching intent, return its original authorized result **before rejecting old write stamps or current post-success lifecycle**. The record may now be frozen/ended; a retry must not try to mutate it again. Current server state may be returned as a separately identified read, never substituted for the original accepted result.

## I01 — Create Project

**SAME-INTENT RETRY:** Return original created project/setup result.

**NEW INTENT:** Explicit separate creation makes new Project.

**IDEMPOTENCY SCOPE:** Actor + create-project + client intention before project exists.

**DURABLE RESULT TO RETURN:** Project and creation receipt.

**DUPLICATE RISK:** Two projects and duplicate setup/upload consumption.

## I02 — Consume staged upload

**SAME-INTENT RETRY:** Return original Source/consumption result.

**NEW INTENT:** Another attachment requires a different valid stage or intentional connector source.

**IDEMPOTENCY SCOPE:** Uploader + stage + consuming target/intention; stage single-use globally.

**DURABLE RESULT TO RETURN:** Consumed stage → Source/artifact origin.

**DUPLICATE RISK:** Same stage attached to multiple projects/Sources.

## I03 — Confirm Architecture

**SAME-INTENT RETRY:** Return original exact accepted graph family.

**NEW INTENT:** No second V1 architecture acceptance.

**IDEMPOTENCY SCOPE:** Owner + Architecture + confirmation intention.

**DURABLE RESULT TO RETURN:** Confirmed root/family and acceptance receipt.

**DUPLICATE RISK:** Second accepted graph or changed candidate accepted as retry.

## I04 — Confirm screen

**SAME-INTENT RETRY:** Return original confirmed definition.

**NEW INTENT:** Edited valid draft explicitly reconfirms with new definition identity.

**IDEMPOTENCY SCOPE:** Owner + screen + intended draft/stamp + confirmation intention.

**DURABLE RESULT TO RETURN:** Screen/confirmed definition identity.

**DUPLICATE RISK:** New revision from retry or unseen draft confirmed.

## I05 — Create/send presentation invitation

**SAME-INTENT RETRY:** Return same invitation and delivery intent.

**NEW INTENT:** Explicit reinvite is new intention, only when recipient/grant lifecycle allows.

**IDEMPOTENCY SCOPE:** Owner + Presentation + recipient/access purpose + intention.

**DURABLE RESULT TO RETURN:** Invitation and dispatch intent state.

**DUPLICATE RISK:** Duplicate invitations/grants/emails.

## I06 — Accept presentation invitation

**SAME-INTENT RETRY:** Return original accepted binding/grant if currently entitled to result.

**NEW INTENT:** Different valid invitation may grant only its scope; accepted old invitation not repurposed.

**IDEMPOTENCY SCOPE:** Verified recipient + invitation + acceptance intention.

**DURABLE RESULT TO RETURN:** Invitation acceptance and scoped grant/principal binding.

**DUPLICATE RISK:** Multiple principals/grants for one recipient.

## I07 — Create Meeting

**SAME-INTENT RETRY:** Return same Meeting.

**NEW INTENT:** Deliberate new meeting creates independent session.

**IDEMPOTENCY SCOPE:** Owner + presentation + creation intention.

**DURABLE RESULT TO RETURN:** Meeting/setup identity.

**DUPLICATE RISK:** Duplicate scheduled sessions/invitation sends.

## I08 — Create/send meeting invitation

**SAME-INTENT RETRY:** Return same invitation and dispatch intent.

**NEW INTENT:** Explicit reinvite subject to same participant uniqueness/scope.

**IDEMPOTENCY SCOPE:** Owner + Meeting + intended recipient + intention.

**DURABLE RESULT TO RETURN:** MeetingInvitation and dispatch state.

**DUPLICATE RISK:** Duplicate attendance/invitations.

## I09 — Accept meeting invitation

**SAME-INTENT RETRY:** Return same admission/participant.

**NEW INTENT:** Valid fresh invite can reauthorize same meeting/principal binding, not duplicate actor.

**IDEMPOTENCY SCOPE:** Recipient + invitation + admission intention.

**DURABLE RESULT TO RETURN:** Admitted participant and binding.

**DUPLICATE RISK:** Reconnection creates another participant.

## I10 — Start Meeting

**SAME-INTENT RETRY:** Return original start result.

**NEW INTENT:** Second start on started/ended meeting rejected.

**IDEMPOTENCY SCOPE:** Owner + Meeting + start intention.

**DURABLE RESULT TO RETURN:** LIVE/start snapshot identity and initial authority result.

**DUPLICATE RISK:** Resnapshot newer screens or start twice.

## I11 — Request presenter transfer

**SAME-INTENT RETRY:** Return same request receipt even if request later resolved.

**NEW INTENT:** New request requires current authority and no pending request.

**IDEMPOTENCY SCOPE:** Current presenter + Meeting + authority generation + request intention.

**DURABLE RESULT TO RETURN:** Request identity, recipient and request result.

**DUPLICATE RISK:** Duplicate pending request or resurrect resolved request.

## I12 — Accept transfer

**SAME-INTENT RETRY:** Return original accepted request result, with current state separately identified.

**NEW INTENT:** Different request only if currently valid; never replay old transfer.

**IDEMPOTENCY SCOPE:** Recipient + Meeting + request identity + accept intention.

**DURABLE RESULT TO RETURN:** Resolution receipt/authority generation reached.

**DUPLICATE RISK:** Old acceptance steals presenter back.

## I13 — Decline transfer

**SAME-INTENT RETRY:** Return same decline resolution.

**NEW INTENT:** Other pending request needs explicit new decision.

**IDEMPOTENCY SCOPE:** Intended recipient + Meeting + request + decline intention.

**DURABLE RESULT TO RETURN:** Decline receipt/request resolution.

**DUPLICATE RISK:** Stale decline clears a new request.

## I14 — Take Back

**SAME-INTENT RETRY:** Return original take-back result without reapplying to later stage state.

**NEW INTENT:** Fresh explicit owner take-back acts on current valid authority.

**IDEMPOTENCY SCOPE:** Owner + Meeting + take-back intention.

**DURABLE RESULT TO RETURN:** Authority transition receipt.

**DUPLICATE RISK:** Retry cancels later legitimate handoff.

## I15 — Share to Meeting

**SAME-INTENT RETRY:** Return same publication/initial revision.

**NEW INTENT:** Deliberate Share again creates independent publication; different meeting always separate scope.

**IDEMPOTENCY SCOPE:** Author + Meeting + share intention + selected source stamp/content.

**DURABLE RESULT TO RETURN:** Publication/revision and safe shared representation.

**DUPLICATE RISK:** Duplicate note/publication from network retry.

## I16 — Update publication

**SAME-INTENT RETRY:** Return same resulting revision.

**NEW INTENT:** Explicit later Update creates new revision from current validated source.

**IDEMPOTENCY SCOPE:** Author + Meeting/publication + update intention + expected revision/source.

**DURABLE RESULT TO RETURN:** Immutable new revision and pointer-transition receipt.

**DUPLICATE RISK:** Repeated retry appends revisions or rewrites old meaning.

## I17 — End Meeting

**SAME-INTENT RETRY:** Return original end/capture result.

**NEW INTENT:** Second End cannot refreeze; another meeting is new entity.

**IDEMPOTENCY SCOPE:** Owner + Meeting + end intention.

**DURABLE RESULT TO RETURN:** ENDED and FrozenMeetingCapture identity.

**DUPLICATE RISK:** Changed capture/multiple reviews after retry.

## I18 — Save to Project

**SAME-INTENT RETRY:** Return original accepted manifest/outcome set.

**NEW INTENT:** New review of same meeting not created; incompatible second acceptance rejected.

**IDEMPOTENCY SCOPE:** Owner + Review + intended draft bundle + acceptance intention.

**DURABLE RESULT TO RETURN:** Manifest, accepted identities, review acceptance receipt.

**DUPLICATE RISK:** Duplicate decisions/actions/counts.

## I19 — Review autosave

**SAME-INTENT RETRY:** Return acknowledged saved draft stamp for same submitted edit batch.

**NEW INTENT:** New edit batch requires current expected draft stamp.

**IDEMPOTENCY SCOPE:** Owner + Review + edit-batch intention.

**DURABLE RESULT TO RETURN:** Durable saved draft/change-stamp result.

**DUPLICATE RISK:** Old autosave overwrites newer review or creates duplicate drafts.

## I20 — Withdraw own publication

**SAME-INTENT RETRY:** Return original withdrawal result.

**NEW INTENT:** Fresh visibility operation only if permitted/current; never reopens ended meeting.

**IDEMPOTENCY SCOPE:** Author + Meeting/publication + expected visibility/revision + intention.

**DURABLE RESULT TO RETURN:** Withdrawal/visibility receipt.

**DUPLICATE RISK:** Retry hides a subsequently different publication state or mutates frozen capture.

Technical receipts must not retain raw secrets, private requests readable by others, whole AI packages or unnecessary document copies. They need sufficient safe identity/result binding to avoid duplicate writes and identify the original success. Result access still uses current permissions.

Failed uncommitted operations have no success receipt. Retry can complete the same intended operation if preconditions still hold; a changed/stale basis requires conflict resolution and explicit new reviewed intent, not silent payload replacement. Recoverable processing/delivery states are not accepted domain success.

Durable target invariants remain after routine receipt cleanup: one confirmed root, one stage consumption, one meeting/principal participation, one start/end snapshot, one review/accepted manifest, immutable publication revision identities. Repeated creation/share intent needs retained identity binding for its supported replay lifetime; no arbitrary cleanup may make a supported retry create duplicates. Expired unknown intents must be rejected/reconciled as appropriate, never guessed to be safe new intent. Exact retention and storage mechanisms are implementation parameters, not a new product workflow.

# SECTION 4 — OPTIMISTIC CONCURRENCY

Stamps express current semantic owner state, not user-facing architecture versions. Source/read dependencies are part of the protected basis. Child/member-set changes invalidate an enclosing acceptance where relevant, including addition/removal of an action or link not present in an old client list.

| ID / protected operation | CURRENT OWNER | EXPECTED STAMP | STALE WRITE RESULT | CAN AUTO-MERGE? | MUST USER RE-REVIEW? |
| --- | --- | --- | --- | --- | --- |
| C01 Candidate ArchitectureGraph edits | Architecture | Root/family semantic change stamp covering node/edge/inner modifications and bounded correction checkpoint | Reject affected edit batch; keep server draft and client pending edits | No semantic auto-merge in V1; rebase deliberate correction on current candidate | Inspect conflicting graph before resubmission; never fork another active root |
| C02 Architecture confirmation | Architecture + Projects authority | Exact reviewed candidate family stamp, project owner/status/grant validity | Conflict; no root/child promotion | No | Yes, changed candidate must be re-reviewed and explicitly confirmed |
| C03 KnowledgeItem edits | Knowledge private owner | Current content/attachment stamp | Conflict preserves current original and unacknowledged local draft | No automatic body/context merge in V1 | Owner resolves current content before intentional save/share |
| C04 PresentationScreen draft | Presentations | Screen draft stamp and relevant parent preparation/knowledge inclusion membership stamp | Reject stale draft batch, preserve local work | No semantic auto-merge | Review conflicting field/definition; old confirmed snapshot remains unchanged |
| C05 Screen confirmation | Presentations | Exact draft, accepted-understanding, inclusion/source stamps and package state | Conflict; no new confirmed checkpoint/eligibility | No | Yes; never confirm unseen current draft |
| C06 MeetingSharedState navigation | Meetings | Lifecycle + authority generation + shared-state ordering/change stamp | Reject out-of-order or former-presenter command; return authorized current state | No; do not reinterpret old command as newest stage intent | Refresh current stage; only current presenter may issue fresh intent |
| C07 Presenter authority / request / take-back / disconnect | Meetings | Lifecycle, authority generation, pending request identity/stamp; current connection epoch for presence signal | Old request/accept/decline/disconnect cannot alter current authority | No | Human confirms a new eligible request where needed; owner fresh take-back remains available |
| C08 SharedMeetingItem current pointer / visibility | Meetings | Publication current revision/visibility stamp, source stamp when updating, LIVE lifecycle/capture membership | Conflict; old representation/current pointer intact | No | Yes for a new update; withdraw also targets currently intended publication state |
| C09 MeetingReview autosave | Outcomes | Review draft/change stamp plus submitted child/member-set stamps | Reject stale autosave; retain previous durable state and local edits | No destructive content auto-merge | Owner resolves changed assessment/bundle before new save |
| C10 Decision / Action drafts | Outcomes | Each changed draft stamp AND parent review bundle/member-set stamp | Reject stale edit; draft cannot change after acceptance | No semantic auto-merge | Owner reviews changed rationale/task/assignee before acceptance |
| C11 Save to Project | Outcomes + Projects authority | Exact reviewed bundle: review stamp, included/excluded item membership, outcome/link stamps and fixed capture identity | Conflict unless same previously committed acceptance result; no partial accept | No | Yes; changed set or accepted content must be presented for re-review |
| C12 Meeting Start / eligible presentation package | Meetings + Presentations | Meeting unstarted stamp; current package membership/confirmation state and exact eligible definition set | Conflict if authoring/eligibility changed during start | No | Refresh intended Start From/eligible set before explicit retry/new intention |
| C13 End Meeting / capture membership | Meetings | LIVE lifecycle/shared state and publication/intentional-capture membership epoch | Conflict with concurrent share/update/withdraw; use one committed ordering | No floating latest capture | Owner refreshes current structured end basis; same-intent already committed result wins |
| C14 Invitation acceptance / grants / admission | Presentations or Meetings + Identity | Invitation status/recipient binding; current scope validity; existing grant/participant uniqueness | Reject revoked/expired/stale recipient scope; same accepted intention returns authorized result | No privilege union/implicit new grant | Recipient uses current valid invitation; no silently broader acceptance |
| C15 Staged upload consumption / source attachment | Sources + Projects | Stage validity/unused-consumed state plus authorized project state | Return existing exact consumption or reject conflicting consuming scope | No | Choose valid unconsumed stage; never consume into latest/different project |

No auto-merge is allowed for consequential acceptance, presenter authority, publication update or Save to Project. V1 also defaults to conflict for overlapping semantic draft edits, rather than silently losing work. Independent owners' commands need not share one global stamp; the enclosing review/presentation/meeting stamp protects only the relevant membership/authority boundary.

Permission/phase/read-set checks and expected-stamp validation must still hold at commit. A request-time comparison alone is insufficient. Concurrent share/update/withdraw and End must have one committed ordering: either included before freeze, or rejected after end. Concurrent Start and Builder changes similarly pin one eligible package or conflict. Exact database execution strategy is not prescribed.

# SECTION 5 — MEETING REALTIME AUTHORITY

**Server-authoritative:** lifecycle, admitted actor/participant identity, current presenter, shared screen/context within the start snapshot, at most one pending transfer, publication visibility/current revision. Shared authority changes have an ordering/change stamp and authority generation; former-presenter commands cannot become valid merely by arriving late.

**Local/transient:** hand, ray, gaze, hover, camera/render pose, tool targeting and local comfort recenter. These are neither permissions nor commands. **ParticipantPrivateState** is server-persisted actor-private semantic recovery state, never stage authority. Local interaction remains responsive without a network round-trip for each tracking sample.

Common validation order for a live command: authenticated bound principal → valid scope/current admission → Meeting existence and LIVE phase → required actor capability → current lifecycle/authority/request/shared-state stamp → target within immutable start snapshot/graph and permitted content → matching-intent receipt or fresh invariant validation → atomic commit → authorized broadcast. Section 7 explains early receipt lookup for successful retries.

| Action | Required authority and operation-specific validation | Authoritative outcome |
| --- | --- | --- |
| Change shared screen | Current presenter only; verify generation and shared-state ordering; chosen definition is in MeetingPresentationSnapshot | Update one current shared screen/context checkpoint; saved screen/graph untouched. Other attendees' screen selection is private exploration. |
| Change shared focus/context | Current presenter; same authority ordering; valid exact graph/selection/internal/boundary refs and captured content permissions | Advance shared semantic focus only; no canonical transform or private checkpoint broadcast. |
| Pass Presentation request | Current presenter; LIVE; no pending request; eligible admitted recipient; guest has explicit owner permission | Store one pending request tied to sender/generation/recipient; do not transfer yet. |
| Accept | Intended recipient only; still admitted/eligible; same pending request/current generation/sender; guest permission current | Atomically resolve request and advance single presenter/generation; invalid/stale accept conflicts. |
| Decline | Intended recipient only; exact still-pending request/generation | Resolve only that request; keep presenter. Stale decline cannot clear replacement request. |
| Take Back | Project Owner / Architect, still valid owner; fresh explicit intent against current meeting authority | Restore owner participant, advance generation, invalidate pending transfer; no recipient consent needed. |
| Presenter disconnect | Trusted server presence/connection policy, never an arbitrary client's report; signal matches current temporary presenter and connection generation | When that actor truly loses all eligible connections/valid presence, atomically fall back to owner and clear request. Late disconnect cannot overwrite newer authority. |
| Participant disconnect | Trusted presence policy, participant binding retained | Update transient presence; if target of pending handoff is no longer eligible, invalidate request. No new participant row or shared navigation from ordinary departure. |
| Reconnect | Reauthenticate; validate scoped identity/admission/current access; bind to existing participant | Read authoritative current state; old queued commands/stale handoff acceptance do not replay. Restore only actor's allowed private checkpoint separately. |
| Return to Live | Current admitted participant; no presenter capability needed | Read shared state NOW and mark own following/checkpoint as appropriate; never replay old personal screen into stage. |

Exactly one designated admitted presenter exists while LIVE. Owner is default and fallback even if temporarily offline; offline owner designation emits no navigation commands and grants no other attendee automatic authority. Owner disconnect does not auto-end the meeting or invent another owner. This preserves the agreed fallback rule without a presenter queue, co-presenters or new host-election product.

Connection/presence expiry is runtime infrastructure input, not raw tracking history. A connection losing transport does not itself delete admission/My Space. Multiple active connections for one actor do not create multiple participant identities; stale connection events are fenced by current connection/authority generation.

After every authority/lifecycle change, server validation applies immediately; reliable broadcast improves UI synchronization but cannot authorize a stale client. Events contain only recipient-authorized shared/public fields, not another actor's private checkpoint or note metadata. No WebSocket payloads/channels are defined in this pass.

# SECTION 6 — AUTHORIZATION MODEL

Use eight overlapping **role/capability contexts**, resolved from stored ownership/grants/admission and current lifecycle. No role string from Unity, professional designation or AI output is trusted. Registered Group 1 authorization retains organization-membership requirements and existing archive exceptions; scoped access does not become full project access.

| ID | Actor / capability context | Positive authority | Explicit limits |
| --- | --- | --- | --- |
| A01 | Project Owner / Architect | Existing owner identity; architecture acceptance; presentation lifecycle/confirmation/invites; meeting creation/start/end; Group 6 review/acceptance | Not another actor's private content owner; temporary presenter can be a different actor. |
| A02 | Project Editor | Existing Group 1 access and active-project structure/layer editing | No project metadata/editor-grant ownership, architecture correction/confirmation, meeting end or Save privilege by being editor. |
| A03 | Presentation Collaborator | Only granted presentation's approved draft preparation: permitted scenario/visual/context/inclusion edits | No parent project membership, owner-only screen confirmation/invites/start/end/acceptance. Deny unspecified write capabilities. |
| A04 | Presentation Viewer | Safe read-only presentation projection within valid grant | No draft mutation, private origin read, project/meeting admission or owner rights. |
| A05 | Meeting Participant | Admitted actor reads shared prepared content; private exploration/own workspace; intentional own sharing; Raise/Return to Live | No shared stage movement unless current presenter; no raw owner review/private notebook access. |
| A06 | Temporary Presenter | Current designated admitted actor navigates captured shared presentation; can request handoff under policy | No project/meeting ownership, graph confirmation, meeting end, review acceptance or saved-screen editing through presenter role. |
| A07 | Scoped Guest | Restricted principal with explicit invited presentation/meeting scope; capabilities are intersection of grant/admission and guest validity | No automatic project/org/editor grant; guest presentation needs owner permission; expiry denies future access while retaining attribution. |
| A08 | Private Content Owner | Own KnowledgeItem/Snapshot/private checkpoint read/write within valid scope; explicit bounded share/update/withdraw of own publication | Does not bypass meeting phase/admission, snapshot immutability or another actor's data/privacy. |

Existing ORGANIZATION_OPEN readers remain the current Group 1 read policy, not a ninth new role or editing grant. Organization membership alone does not confer later-group acceptance privileges. Owner and editor project authority requires membership as current code enforces.

For A03/A04, a grant only confers approved actions for that Presentation. Owner owns lifecycle acceptance. A source/knowledge inclusion must be readable and intentionally publishable to the target audience; collaborator access is not permission to republish another person's unshared private content.

| Important operation | Allowed actor / capability | Phase / scope constraints |
| --- | --- | --- |
| Read Project | Current owner/editor or eligible org member when existing visibility allows | Group 1 current access rules; guests/collaborators/attendees do not gain this from scoped role. |
| Edit Project setup | Owner for metadata/status/editor grants; owner/editor for existing structure/layers | Preserve actual Group 1 authorization, active-project requirement and existing metadata archive exception. No expansion of editor powers. |
| Review/correct candidate Architecture | Owner | Reconstructed unconfirmed family only; Group 3 cannot edit accepted graph. |
| Confirm Architecture | Owner | Exact reviewed family; explicit Group 2 dialog; one acceptance. |
| Create Presentation | Owner | Project has confirmed architecture; same immutable graph throughout package. |
| Edit Presentation | Owner; A03 only approved scoped draft preparation | Deny ungranted lifecycle/access/acceptance operations; no canonical topology changes. |
| Confirm PresentationScreen | Owner | Exact valid draft/understanding and permitted inclusion set; collaborator preparation is not confirmation. |
| Invite collaborator/viewer | Owner | Explicit send; scoped invitation only; no autosave sends. |
| Create/schedule/start Meeting | Owner | One Presentation; actual Start pins only base + confirmed definitions; schedule itself does not freeze. |
| Invite meeting participant | Owner | Explicit meeting admission scope; not project access/collaboration. |
| End Meeting | Owner | LIVE; explicit confirmation and exact capture transaction. |
| Navigate shared meeting presentation | Current presenter (owner or temporary) | LIVE and generation-current; only start-time definitions; owner without current presenter first takes back. |
| Request/pass control | Current presenter | One pending request; recipient admitted/eligible; guest owner-permitted. |
| Accept/decline transfer | Exact intended recipient | Matching current pending request, scope/admission valid. |
| Take Back | Owner | LIVE, explicit fresh intent; invalidates pending request. |
| Read another participant's My Space | Nobody by project/presentation/meeting role alone | No owner/AI/service bypass; shared publication is separate bounded content. |
| Create private note/question/Snapshot | A08 actor with valid accessible scope | Own content only; meeting guest confined to invited scope; Snapshot body immutable after creation. |
| Share own private item | A08 + A05 for target meeting | LIVE; explicit intended content; origin/attachment permissions and source stamp checked. |
| Update/withdraw own publication | Original publishing actor with current valid admission/scope | LIVE, current publication revision/visibility precondition. Owner cannot use owner role to edit another actor's body; no post-end capture rewrite. |
| Group 6 review | Owner | Ended meeting with frozen capture; AI only owner-requested draft help. |
| Save to Project | Owner | Exact reviewed draft and atomic acceptance; temporary presenter/guest/editor not entitled by that role. |
| Modify Decision/Action drafts | Owner | Review unaccepted; child edit advances review bundle stamp. Assignment does not grant edit authority. |
| Modify accepted outcomes | No accepted Decision/task-definition edits in V1 | Only owner may perform already-authorized Action execution/status transitions; accepted definition/manifest immutable. No new tracker/reassignment UI/endpoint introduced. |
| Read accepted project outcomes | Current project reader via safe project knowledge projection | Exclude private-origin data and restricted evidence; scope-only guests do not automatically read project history. |
| Use AI | Actor authorized for specific input and destination task | AI cannot broaden data access or confer saved-result write capability. |

Deny by default. A participant's explicit sharing publishes only their own safe content; ownership of the Meeting does not imply permission to rewrite every publication. Owner-confirmed End/accepted-retention controls lifecycle, not private note ownership. No new moderation/redaction UI is invented.

# SECTION 7 — ACTION POLICY / SERVER VALIDATION ORDER

Conceptual sequence for a fresh consequential command:

1. **Authenticated principal:** bind registered User or scoped guest through trusted authentication; ignore client-supplied author/role assertions.
2. **Principal scope / guest validity:** current session, intended invited scope and principal binding valid; reject revoked/expired access.
3. **Access to project/presentation/meeting:** use actual owner/grant/admission; do not infer global access through a nested ID.
4. **Object existence and ownership chain:** target belongs to requested consistent scope; return appropriately non-disclosing denial/not-found without leaking private existence.
5. **Lifecycle:** active/candidate/draft/LIVE/ended/unaccepted phases as required. Archived constraints preserve existing Group 1 policy.
6. **Ownership / capability:** actor can perform this exact action; workspace mode/menu/AI proposal cannot grant power.
7. **Current expected stamps:** current owner/member-set/authority/read dependencies equal intended reviewed state.
8. **Semantic target validity:** same graph/project, correct endpoints/inner links/context roles, allowed source/content audience, eligible start screen and valid assignee references.
9. **Idempotency state:** claim/check matching intention; reject different input under same identity and concurrent duplicate commit.
10. **Domain invariants:** final consistent state satisfies single confirmed root/presenter/request, valid complete snapshots and one accepted outcome.
11. **Transaction commit:** authority/read-set and stamps still valid; result receipt committed with writes. Only then publish success/authorized internal events.

**Safe order qualifications:** parsing/size validation and coarse authentication/guest rejection can run before database reads. Authorized scoped object lookup can combine steps 3/4 without revealing whether another actor's private target exists. Final capability/phase/stamp invariants are revalidated within the atomic command, even if preliminary checks ran earlier.

**Committed retry path:** after authentication, current scope/access and command-result entitlement, look up the same-intention durable result early. If semantic input matches, return original authorized receipt without re-executing phases/stale writes. That path may bypass mutation preconditions such as “still LIVE” or “still draft,” because no mutation occurs; it cannot bypass current access/privacy. New/uncommitted intention takes the full command sequence. Before commit, receipt claim/read and all invariants are resolved together.

**No existence/receipt oracle:** a private ID, another author's operation token or a signed-looking client role is not enough to disclose record, title, counter, grant or accepted result. Avoid differing disclosure paths that expose another scope. Logs/errors also use safe identifiers and redact secrets/private bodies.

Unity hiding a button is a usability measure, never enforcement. Provider/service credentials and background tasks use narrowly bounded application capability on behalf of the initiating authorized operation or trusted lifecycle policy; no universal AI/system principal gets unrestricted product access.

# SECTION 8 — PRIVATE DATA ACCESS MATRIX

Safe projection is part of authorization, not optional response formatting. Same rules apply to query/list/search/count/artifact access, AI retrieval, event fanout and captured representations. The following table uses the requested six fields compactly.

| OBJECT | OWNER | WHO MAY READ | WHO MAY WRITE | WHAT PUBLICATION/PROJECTION MAY EXPOSE | WHAT MUST NEVER LEAK |
| --- | --- | --- | --- | --- | --- |
| Private KnowledgeItem | Knowledge + author ActorRef | Same private owner with valid scope | Same owner; authorized draft application only; immutable consumers separate | Explicit bounded body/context chosen for share; safe author attribution | Unshared title/count/search snippet, private edits/history, other notebook items or hidden attachment metadata. |
| Private Snapshot | Knowledge + creator | Same creator within valid scope | Creator creates; cannot edit immutable capture; current visibility/wrapper only under policy | Explicit chosen capture representation and permitted refs | Private note/context/capture history/image access outside deliberate publication. |
| ParticipantPrivateState | Meetings private boundary + participant actor | Same participant only | Same participant's valid scoped operation | No private checkpoint projection to other attendees; public following status only if separately approved | Target/depth/checkpoint/private view state through participant list or owner access. |
| SharedMeetingItem | Meetings; original author attribution | Current valid admitted meeting audience; owner review uses frozen eligible representations | Publishing author explicit LIVE update/withdraw; domain freezes via End | Exact published revision/body/category/context; safe attribution/visibility | Private original body by dereference, future edits/history, unrelated private metadata or credentials. |
| FrozenMeetingCapture | Meetings immutable ended capture | Owner for Group 6 input; any entitled attendee reads only already-authorized shared projection, not blanket raw capture | Created once by owner End transaction; no subsequent body write | Safe eligible captured entry/revision references and intentionally retained content | Unshared My Space, full transcript/raw mic input, session-private exploration. |
| MeetingReview | Outcomes; owner review authority | Owner while draft; accepted project readers get approved result projection | Owner until acceptance; then frozen basis | Accepted summary/assessments/decisions/actions/retained context to authorized project readers | Draft assessments/outcomes to attendees/guests absent separate authority; private source dereference. |
| Decision | Outcomes | Owner draft; accepted authorized project readers | Owner drafts; accepted definition immutable | Accepted rationale/context and permitted grounding | Draft AI suggestion as accepted truth; hidden/private origins beyond published support. |
| ActionItem | Outcomes | Owner draft; accepted authorized project readers; assignment alone grants no new read rights | Owner drafts/accepts; owner only for permitted current status | Accepted task/assignee attribution and authorized current status | Another actor's private origin; guest assignment turning into project history access. |
| PresentationScreen included knowledge | Presentations owns inclusion; Knowledge owns original | Owner/valid grant reads only safe explicitly permitted preparation representation; meeting audience gets pinned authorized inclusion | Owner/scoped collaborator allowed inclusion edits; owner confirms | Confirmed intended selected content + provenance; start snapshot preserves it | Reading all future private content through inclusion ID, automatic private republishing. |
| SourceReference | Sources | Actor with project/source rights; scope-only audience gets explicitly allowed reference/excerpt/unavailable marker | Sources creates exact locator; accepted grounding never repoints | Safe origin/revision identity and permitted evidence content | Tokens, private raw documents, sensitive locator metadata or artifact URL granting broader access. |
| IntegrationCredential | Sources credential boundary | Credential owner gets connection status only; secret read limited to trusted connector execution needing it | Authorized integration lifecycle/rotation/revocation | Safe provider/account connection status where permitted | Token/client secret/refresh material in Source/Project/AI/event/log/receipt responses. |

Meeting owner cannot automatically read another actor's private source even if a shared publication cites it. Granting an owner AI access does not change that rule. A minimal origin attribution/unavailable marker is not a link that grants origin body access.

Guest-authored private content uses stable restricted ActorRef. Leave/end preserves content; expired/revoked scope denies future private retrieval until valid reauthorization. No automatic assignment of guest content to owner, migration to registered account, cross-project guest notebook or project membership is introduced.

Artifact content obeys the same audience as the owning private/published representation. A raw file path or reusable download URL cannot bypass the owning projection boundary. Exact storage signing/provider mechanisms are implementation choices, not new APIs here.

# SECTION 9 — HOME PROJECTION

**DERIVED; no independent Home source-of-truth table.** Initial V1 reads authorized committed domain state directly. Fetch a logically consistent read snapshot for related counters/activity, not independently timed queries that mix pre/post acceptance. Every projection distinguishes operational meeting phase from accepted outcome publication.

| Home/project-card value | SOURCE OF TRUTH | WHEN IT CHANGES | CAN DRAFT/FAILED WORK AFFECT IT? | PERMISSION FILTER |
| --- | --- | --- | --- | --- |
| Project identity/name | Existing Project | Committed creation/authorized metadata update | Wizard draft/failed creation: no | Existing project-read scope. |
| Architecture confirmation state | Architecture confirmed root/family acceptance | Successful T03; candidate progress may remain distinct existing setup state | Candidate edit is not confirmed; failed confirm cannot set accepted state | Authorized project reader; no source/private body leakage. |
| Presentation count | Project-scoped saved Presentation identities | Successful creation/archive policy | Saved setup draft may count as a saved draft package if count used; never as ready. Failed creation no | Only accessible presentations; do not add a new card feature merely because projection exists. |
| Presentation readiness | Base plus current confirmed eligible screen state | Screen confirmation or later new draft/eligibility change | Draft may make current authoring screen unready; never counted as confirmed | Accessible package; current meeting still uses pinned start snapshot. |
| Latest meeting activity | Committed Meeting lifecycle | Create/start/end commits, if existing Home shows lifecycle activity | Failed Save cannot manufacture Saved/accepted activity; ENDED is distinct from Saved | Authorized project/meeting summary only. |
| Decision count | Accepted Decision set referenced by accepted review/manifest | Successful T15 | Draft/failed Save: no | Accessible accepted project outcome set only. |
| Open action count | Accepted Actions plus current authorized status | T15 and any already-authorized later status change | Draft actions/failed Save: no | Same accessible accepted set; no guest grant inferred from assignee. |
| Unresolved count | Accepted reviewed assessments explicitly UNRESOLVED | T15 and only future explicitly authorized lifecycle if approved | Draft review/failed Save: no | Do not fold DEFERRED/NOT_DISCUSSED into UNRESOLVED; filter accessible accepted review. |
| Latest accepted outcome indicator | Committed MeetingOutcome acceptance receipt/summary | Successful T15 | Never changed by draft, End alone, AI summary or failed Save | Safe accepted project summary, not raw review/private source. |

Home counters/readiness are optional read projections of already-approved Home behavior, not new navigation/UI. No client-written counters, provisional accepted decision count, or event-only “Saved” flag. Counts must use one consistent definition; do not count a Decision again for every ReviewOutcomeLink.

After successful Save acknowledgment, Home reads from the committed authoritative database state or a read path that guarantees that acceptance is visible. It must not navigate on a provisional notification and show an older replica/cache as the accepted result. Later caching is rebuildable; invalidate/update after commit and bypass/refetch until the user's accepted result is observable. Event loss cannot lose accepted domain truth.

Private item titles/counts/search results are not part of broad project counts. Scope-only meeting guests have no general Home/project-card entitlement; use their authorized invited-context projection without granting project membership.

# SECTION 10 — SAVE TO PROJECT TRANSACTION

This is T15; the detailed sequence below does not add another numbered transaction.

1. Authenticate current ActorRef and validate current project-owner authority, organization/access and project lifecycle.
2. Check for an already-committed matching acceptance intention, after result entitlement. Return original accepted manifest/result if found; do not reject that success merely because review is no longer draft.
3. For a fresh acceptance, validate the ended Meeting, same immutable start/capture identity and the one MeetingReview still in reviewable state.
4. Validate the exact expected Review draft/bundle stamp, member set, assessment/link and Decision/Action draft stamps. A new/removed child also invalidates the reviewed set.
5. Validate every Decision definition/rationale/context and its captured supporting provenance; no unreviewed inferred verbal-only decision.
6. Validate every Action definition, due date/status semantics already approved and exactly one responsible ActorRef at acceptance. Assignee is eligible project user or valid originating-meeting participant identity, including scoped guest attribution. Guest access expiry/leave does not erase that historical identity or grant new access.
7. Validate same-project/review typed outcome links, optional primary Decision per Action, captured graph/context refs, and permitted retained evidence/Snapshot content. Use the reviewed frozen representation, not private latest original.
8. Freeze the intended reviewed assessments and link set; promote intended existing draft Decisions to accepted definitions and intended Actions to accepted task definitions/responsibility-at-acceptance. Excluded drafts remain excluded, not silently accepted/deleted.
9. Create exactly one accepted MeetingOutcome manifest/summary referencing the exact accepted identities/representations, freeze reviewed basis, mark Review accepted and record the same-intention result.
10. Commit all authoritative acceptance changes together. Only afterward return accepted success and publish safe internal notification. Home derives counts/activity from this committed state.

**WHAT HAPPENS IF ANY STEP FAILS:** no acceptance writes from this transaction remain. Previously successful autosaves remain durable, along with draft decisions/actions/links; no accepted partial result, no false Home increment, no success navigation. Unacknowledged client edits remain local until saved/reconciled, not falsely described as durable. Surface recoverable validation/conflict/failure without auto-discard.

**WHAT RETRY RETURNS:** original manifest, accepted outcome identities and acceptance result for a matching committed intention. If no commit occurred and reviewed basis still matches, retry may complete it. If basis changed, conflict and re-review; never accept latest unseen draft or mint another result.

**HOW DUPLICATES ARE PREVENTED:** durable intention/result binding plus one-review/one-accepted-manifest invariant and unique accepted identity promotion. Concurrency protects the whole intended set; outcome identity stability prevents a retry creating new Decision/Action bodies. Internal event/delivery retries cannot invoke a fresh acceptance.

**WHAT CANNOT BE CHANGED AFTER COMMIT:** frozen Meeting capture; accepted review assessments/links/summary; accepted Decision rationale/context; accepted Action definition/responsibility/context; manifest membership and acceptance provenance. Current permitted action execution status can evolve under its separate policy without modifying acceptance receipt. No new accepted-definition editing or meeting-reopen workflow is added.

Cross-root acceptance is coordinated by an Outcomes application use case through owner module boundaries, not a global service allowed to edit private Knowledge/Architecture. Approved retained knowledge is represented with controlled references/publication snapshots; accepted Decision is not also written as an independently editable KnowledgeItem.

# SECTION 11 — AI AUTHORIZATION

AI is an application capability, **never an authority principal**. The requesting actor's current permission and intended destination constrain both inputs and persisted outputs. Revalidate those rights/stamps when accepting a delayed proposal; a provider response arriving after access revocation/end/acceptance cannot silently commit.

| Capability | INPUT PERMISSION SOURCE | ALLOWED OUTPUT | WHO MUST CONFIRM | WHAT AI CANNOT COMMIT | PROVENANCE WHEN SAVED |
| --- | --- | --- | --- | --- | --- |
| AskContextAI | Actor's valid scope + authorized exact graph/context/evidence; own private additions only | Sourced answer, uncertainty, bounded interpretation | Requester deliberately saves/attaches/shares result as allowed | Private publication, canonical edit, grant or accepted decision | Exact permitted graph/source/capture refs, source stamps, uncertainty and result attribution. |
| SuggestDiscussionPoints | Authorized presentation preparation scope and permitted selected Knowledge/source representations | Candidate questions/risks/discussion points | Authorized preparer explicitly Add to Discussion; owner lifecycle acceptance later | Silent inclusion, republishing private originals or screen confirmation | Selected context/grounding refs and saved proposed point provenance. |
| UnderstandScenario | Current authorized scenario draft, selected immutable graph and permitted evidence | Bounded scenario meaning/constraints with unsupported assumptions visible | Authorized preparer explicitly accepts understanding; owner screen-confirm remains separate | Screen confirmation, canonical topology change or meeting start | Scenario input stamp, accepted understanding/context and permitted grounding. |
| TranslateVisualCommand | Actor's allowed screen draft/selection and visual vocabulary | Validated deterministic proposed operations and preview | Authorized actor explicit Apply to permitted draft; owner confirms screen | Arbitrary code/geometry, canonical writes, unapplied preview persistence as truth | Intended command/result operations, target/input stamps and approved operation attribution. |
| SummarizeMeeting | Owner-requested eligible FrozenMeetingCapture/structured items only | Draft cited summary; explicitly insufficient-support markers | Owner reviews and Save accepts | Live transcript invention, unshared My Space retrieval or automatic accepted summary | Capture/entry/revision identities and cited structured support; no raw audio warehouse. |
| ClassifyMeetingOutcomes | Owner's review draft plus exact eligible frozen capture | Proposed statuses/decisions/actions/links | Owner edits/reviews; explicit Save to Project | Accepted outcomes, task assignment authority by AI alone, Home count changes | Source entries, proposed classification grounding and final accepted human-confirmed result. |

AI context construction filters before provider submission; post-hoc redaction is insufficient. Project owner capability cannot retrieve another attendee's private titles, notes, search results or checkpoint. A shared-publication origin ID is not retrieval permission. Avoid broad “all project documents” queries when only selected/internal/boundary scope is authorized.

Generic provider inputs/outputs and previews remain transient. Preserve only meaningful domain drafts and accepted provenance under the destination owner, without creating a universal AI-truth/history table. Queued AI work checks current input/destination authorization when executed and when result is applied; deliberate saved text, not continuous mic audio, is product content.

# SECTION 12 — SECURITY / AUTHORITY INVARIANTS

1. Authenticated principal binding is server-derived; client role/author/project/mode fields never establish authority.
2. Project owner and current presenter are separate; professional Architect designation alone grants nothing.
3. Current Group 1 organization membership/visibility/editor/archive rules are preserved.
4. Presentation collaborator/viewer, meeting participant and scoped guest never become project editor/member automatically.
5. Guest principal is restricted to valid invited scope; stable attribution after expiry is not continued access.
6. Exactly one designated admitted presenter while LIVE; at most one pending recipient-specific transfer; no queue/co-presenters.
7. Handoff requires intended recipient acceptance; owner take-back/fallback invalidates stale requests and former-presenter commands.
8. Trusted current presence/connection generation drives fallback; arbitrary client disconnect claims cannot change authority.
9. Temporary presenter cannot confirm graph, end meeting, change ownership or Save to Project.
10. Private Knowledge/Snapshot/checkpoint ownership protects titles, counts, metadata, search, artifacts, AI input and events as well as bodies.
11. Meeting/project owner cannot inspect another participant's My Space by virtue of ownership.
12. Explicit publication exposes only intended bounded representation; no origin read-through or future private-edit synchronization.
13. Each explicit publication update creates immutable revision identity; captured references never float to latest.
14. Confirmed graph family is immutable; autosave is not another graph version and presentation/meeting never own copied canonical topology.
15. Start uses one confirmed-only eligible content snapshot; drafts and later Builder edits never enter live content silently.
16. End freezes eligible structured state once; no ENDED state without capture or review-derived rewrite of it.
17. No continuous recording/transcript or AI-invented verbal-discussion evidence.
18. Draft autosave cannot confirm screens/architecture, send invites, share private content or accept outcomes.
19. Child changes invalidate relevant parent acceptance/member-set stamps; omitted/new children cannot evade stale-review detection.
20. Stale consequential actions conflict; no silent latest-target acceptance, privilege merge or automatic semantic auto-merge.
21. Committed same-intention retries return their authorized original result; different semantic input under same intent conflicts.
22. Grant revocation/access changes are checked in the command's consistent commit basis; a prior permission check is not enough.
23. Save acceptance is all-or-nothing across reviewed set, Decisions/Actions/links/manifest; failure keeps prior durable draft.
24. Home counts only eligible accepted outcomes; link multiplicity, failed saves, AI suggestions and draft records cannot inflate counts.
25. AI has no authority principal or privileged private search; applied results undergo the same capability/phase/stamp validation as manual commands.
26. Tokens/secrets never enter ordinary project/source/AI/publication/notification/receipt/error projections.
27. External delivery/events occur after durable intent/authoritative commit; retries cannot recreate domain success or guarantee provider exactly-once delivery.
28. Ownership/FK references in JSON documents obey the same scope/retention checks as relational anchors; references alone do not grant permission.
29. Permission-scoped receipts, logs, summaries and broadcasts cannot become a private existence/content oracle.
30. Local hands/gaze/camera state stays local; meaningful private checkpoints persist without becoming shared stage authority.

# SECTION 13 — IMPLEMENTATION GATE

**BACKEND DESIGN READY FOR IMPLEMENTATION?**

- [x] Persistent objects classified — Step 0B.1, 38 domain candidates.
- [x] Cardinalities decided — Step 0B.2.
- [x] Aggregate ownership decided — Step 0B.2, 12 roots.
- [x] Mutability/freeze boundaries decided — Pass 1, six major freezes.
- [x] Normalized vs document storage decided — Pass 1 conceptual storage register.
- [x] Context persistence decided — hybrid owned semantic context, transient InteractionContext.
- [x] Privacy/publication model decided — actor-private originals, independent immutable publication revisions.
- [x] Transaction boundaries decided — Section 1, 17 named units plus single-owner atomic commands.
- [x] Idempotency expectations decided — Section 3, 20 commands.
- [x] Optimistic concurrency decided — Section 4, 15 protected operation families.
- [x] Home projection decided — Section 9, direct derived committed-state read.
- [x] Permissions decided — Sections 5–8/11, eight scoped capability contexts and deny-by-default policy.

**BACKEND V1 DESIGN IS READY FOR IMPLEMENTATION.**

No genuine design blocker remains for the authorized V1 scope. This states design readiness, not proof of implementation, runtime verification, provider setup, device readiness or production/security certification. Existing Group 1 contracts are preserved; additive persistence/schema choices and provider-specific configuration must be implemented/verified when implementation is explicitly requested. No additional design-document pass is required as a blanket gate.

Recommended implementation order, modules/foundations only:

1. Persistence/shared transaction, identity/principal and operation-result/delivery foundation; preserve existing Group 1 Projects/Identity behavior.
2. Sources / ingestion and protected connector/artifact boundaries.
3. Architecture.
4. Knowledge / context and private workspace.
5. Presentations.
6. Meetings.
7. Outcomes / meeting review.
8. AI application capability wiring through authorized domain facades.
9. Integration / authorization / failure-retry hardening.

Implementation must follow the user-directed increment, not automatically build all modules from this checklist. No code, schema, migrations, APIs, WebSocket contracts, Unity changes or product redesign is performed in this task.

Verification register: 13 sections; 17 named transactional boundaries; 20 idempotent command definitions; 15 concurrency-protected operation families; eight role/capability contexts; all required privacy/AI/Home/gate sections. Only this Markdown file is created; prior design/product documents remain unchanged.

