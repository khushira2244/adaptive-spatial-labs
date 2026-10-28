# Backend V1 — Persistence + Consistency Design

**Pass 1 · 2026-10-23 · Design only.** One modular monolith and one PostgreSQL database; existing backend/Unity contracts and stack are unchanged. This document selects conceptual mutability, storage and freeze semantics, without SQL, columns, physical layouts, migrations, endpoints or realtime contracts.

Authority: [Step 0A](backend-step0a-domain-interaction-architecture.md), [Step 0B.1](backend-step0b1-persistence-classification.md), [Step 0B.2](backend-step0b2-cardinalities-and-ownership.md). Group references: [1](group1-backend-spec.txt), [2](group2-product-design-spec.md), [3](group3-correction-editor-spec.md), [4 entry](group4-stage1-entry-and-open-spec.md), [setup](group4-stage2-presentation-setup-spec.md), [scope](group4-stage3-lasso-selection-spec.md), [discussion preparation](group4-stage4-discussion-preparation-spec.md), [builder](group4-presentation-builder-and-meeting-bridge-spec.md), [5](group5-live-meeting-spec.md), [6](group6-meeting-review-and-outcomes-spec.md). New conclusions here refine persistence, not product journeys.

The **38 A/B/C candidates and their cardinalities remain the baseline**. Revision-bearing owned values below do not introduce universal history tables or new aggregate roots. Exact physical decomposition remains a later schema pass. Privacy filtering applies before copying, counting, snapshotting, AI packaging or publication.

# SECTION 1 — MUTABILITY / IMMUTABILITY MODEL

One primary classification per concept in this register:

- **A MUTABLE:** authorized lifecycle/current state changes, with stable identity and scoped references.
- **B MUTABLE UNTIL CONFIRMATION:** draft content becomes immutable at successful acceptance.
- **C IMMUTABLE AFTER CREATION:** exact content/binding fixed on creation; independent access/availability wrappers may still change.
- **D IMMUTABLE AFTER DOMAIN EVENT / FREEZE:** working state closes at its named owner-authorized boundary.
- **E REPLACEABLE CURRENT VALUE WITH HISTORICAL SNAPSHOT:** current working/envelope state can change; previously captured/confirmed representation cannot.
- **F DERIVED / NOT STORED:** no new domain-truth storage; runtime objects remain transient.

“Immutable” means semantic content and identity cannot be overwritten under the same reference. It does not bypass access revocation, archive or required redaction. A schema/encoding upgrade may preserve identical meaning; it cannot silently change an accepted fact. Table entries separate mutable operational wrappers from frozen content where necessary.

| Concept | Class | When / who may change | Freeze boundary | Historical rule |
| --- | --- | --- | --- | --- |
| User | A | Identity/user updates profile, credentials and account availability | None; historical attribution is separately pinned | Keep stable actor identity; profile updates never reassign authorship |
| Organization | A | Existing organization authority maintains identity/status | None | Archive does not erase project origin |
| OrganizationMember | A | Existing organization policy grants/ends membership | None; grant ends without erasing attribution | Historical authored records retain actor, not a live grant assumption |
| AuthSession | A | Identity issues/rotates/revokes/expires; actor signs out | None; immutable issued token material is never overwritten for reuse | No domain history requirement; expiry does not delete authored content |
| UserPreference | A | User changes own preferences; absent record uses defaults | None | No preference history; cannot grant authority |
| ScopedGuestAccess | A | Identity/scope authority binds recipient and expires/revokes access | Principal binding fixed once issued; usability mutable | Retain minimal stable attribution after session/scope expiry |
| Project | A | Existing owner-authorized metadata/status/grants | None for project metadata; confirmed graph separate | Archive retains referenced architecture/outcomes; no scope retarget |
| ProjectStructure | A | Existing authorized structure configuration | None; not canonical topology | No automatic rewrite of confirmed graph |
| ProjectLayerDefinition | A | Existing authorized layer add/rename/reorder/remove | None | Referenced historical label/meaning remains captured, not live layer dereference |
| ProjectEditorAssignment | A | Existing project authority grants/revokes editor | None | Revocation changes access, not authorship or accepted history |
| Source | A | Sources updates processing/connection/availability metadata | Imported provenance locators remain fixed separately | New external content cannot refresh confirmed graph; keep old origin identities |
| SourceReference | C | Sources creates exact origin/revision/locator; never repoints that identity | Creation of locator binding | New content/locator uses new identity; availability comes from current source/access, not replacement |
| IngestionRun | D | Sources updates active attempt progress/result; explicit retry is another attempt | Terminal success/failure/cancellation | Terminal input/result provenance fixed; no unbounded retry event ledger |
| IntegrationCredential | A | Integration owner/Identity rotates or revokes authorization | None; token usability follows current authorization | No historical usable token copies; nonsecret origin survives revocation |
| StagedUpload | D | Sources validates stage and consumes once, or expires/discards | Consumption or terminal expiry; no reuse | Source keeps durable artifact origin before stage cleanup; bytes outside database |
| Architecture | D | Architecture creates/reviews candidate container under project owner | Explicit Group 2 confirmation | Confirmed graph binding immutable; archive/availability separate |
| ArchitectureGraph (formerly ArchitectureVersion) | D | Owner corrects one candidate root/imported graph family; Sources only supplies validated input | Architecture confirmation of exact candidate graph family | Same root promoted; confirmed root and documented descendants never retarget |
| ArchitectureNode | D | Owner candidate add/rename/type/position/delete through graph authority | Architecture confirmation | Rename/move preserves identity; frozen node not screen copy |
| ArchitectureConnection | D | Owner candidate add/delete with valid same-graph endpoints | Architecture confirmation | Accepted endpoints/direction/provenance fixed |
| InnerArchitectureReference | D | Validated import/authorized candidate repair; no invented Open content | Architecture confirmation | Confirmed child reference stays fixed/unavailable; no alternate retarget |
| CorrectionSession value | A | Owner autosaves meaningful correction draft/checkpoint; bounded Undo recovery | Closes at confirmation or explicit confirmed discard | Not graph-version history; cannot reopen frozen graph |
| KnowledgeItem | E | Author edits private/current content; authorized retention handles retained project content | No global content freeze; consumers freeze intentional representations | Content stamp distinguishes edits; publications/captures retain exact body without private edit history |
| KnowledgeContext | E | Authorized author changes attachment set by add/end/replace; never repoints a captured binding | Captured descriptor immutable in each frozen consumer | Changing current attachments never changes stored publication/snapshot scope |
| Snapshot | C | Creator explicitly captures structured state; content cannot be edited in place | Creation | New capture is new Snapshot; visibility/archive wrapper may change without rewriting capture |
| MySpace logical state | F | Private query over own KnowledgeItem/Snapshot records | None; underlying content rules apply | Survives meeting exit through underlying records |
| Presentation | E | Owner/scoped preparation updates setup and current screen collection; lifecycle/access independent | Meeting snapshots freeze selected eligible definitions, not entire authoring package | One confirmed graph; meetings do not follow later Builder edits |
| PresentationAccessGrant | A | Owner grants/changes/revokes restricted scope | None | Revocation ends future access, not accepted author attribution |
| PresentationInvitation | A | Owner sends/cancels; recipient accepts/declines; expiry policy | Recipient/scope binding never repurposed | Keep admission origin; retry does not duplicate grant |
| PresentationScreen | E | Authorized preparation edits draft; explicit confirm produces immutable eligible definition | Each screen confirmation freezes that definition; later edits create new draft | Current draft excluded at new meeting start; old meeting snapshot unaffected |
| VisualOverride set | E | Manual authorized change or explicit AI Apply updates active screen draft | Included in confirmed screen and start snapshot | One current value per target/property; copied frozen definition retains prior settings |
| ScenarioOverlayConnection | E | Authorized scenario authoring adds/edits/removes draft overlay | Included in confirmed screen/start definition | Old confirmed/start definitions preserve prior hypothetical connection |
| PresentationScreenKnowledgeReference | E | Explicit Add to Discussion/authorized removal updates screen inclusion | Confirmed definition fixes selected authorized representation/references | Unshared future private content never follows inclusion; inaccessible content omitted/rejected until authorized |
| Meeting | A | Owner schedules/starts/ends; presenter only changes allowed stage state | Start/end content snapshots immutable; schedule/status envelope mutable by lifecycle | Cannot switch presentation/graph after start; archive not capture rewrite |
| MeetingParticipant | A | Authorized admission, leave/reconnect and permission lifecycle | Principal/meeting binding fixed; current availability/permissions mutable | Retain attribution; participation never owns User |
| MeetingInvitation | A | Owner sends/cancels; recipient accepts/declines; expiry | Binding not reusable for a different actor/scope | Retry reuses intended admission; invitation validity not perpetual authority |
| MeetingSharedState | E | Authorized current presenter updates semantic screen/focus; owner manages authority | Final state included at End Meeting | Current value plus final capture, no per-frame history |
| ParticipantPrivateState | A | Same participant updates meaningful private-following/exploration checkpoint | None; meeting lifecycle limits commands, content persists independently | Return to Live uses NOW; no private trajectory history |
| PresenterTransferRequest | A | Current presenter creates; intended receiver accepts/declines; owner/fallback invalidates | No history; cleared/staled on resolution/end | One pending maximum; stale acceptance cannot resurrect control |
| SharedMeetingItem | E | Explicit share creates publication; explicit update appends representation; authorized withdrawal changes visibility | Each published representation immutable from creation | Frozen/accepted refs pin publication AND revision; newer revision never overwrites prior content |
| MeetingPresentationSnapshot | C | Owner start captures current eligible confirmed presentation definitions | Creation at successful Start Meeting | No floating screen/body/latest pointers; graph topology stays referenced |
| FrozenMeetingCapture | C | Owner-confirmed end captures eligible structured state once | Creation at successful End Meeting | Review cannot overwrite it; no private notebook/audio transcript |
| MeetingReview | D | Owner autosaves/reviews draft over fixed capture; AI proposes only | Successful Save to Project acceptance | Failure keeps mutable draft; success seals accepted reviewed basis |
| MeetingReviewItem | D | Owner edits assessment/status/evidence/proposed links while reviewing | Successful Save to Project | Primary capture anchor fixed; acceptance seals assessment separately from original |
| Decision | B | Owner edits draft rationale/context; AI suggests | Successful Save to Project | No accepted decision editing workflow introduced; never a mutable KnowledgeItem duplicate |
| ActionItem | E | Owner reviews draft; only authorized permitted execution/status fields may change later | Save freezes accepted task definition, responsibility-at-acceptance and context | Accepted manifest pins initial definition; current status cannot rewrite acceptance. No new tracking UI/reassignment workflow |
| MeetingOutcome accepted manifest | C | Owner acceptance creates exact accepted result once | Creation at successful Save to Project | Pins accepted decisions/actions/assessments/capture; status projection may later differ without rewriting receipt |
| ReviewOutcomeLink | D | Owner adds/removes typed decision/action links while review is draft | Successful Save to Project | Accepted link provenance remains fixed; no outcome body copies |
| CapturedSemanticScope | E | Saving owner captures/replaces current draft descriptor; frozen consumer keeps its own copy | Containing snapshot/publication/screen/acceptance freeze | Pin graph and screen/capture revisions, internal/boundary roles |
| OwnerPresentationReturnCheckpoint | A | Owner/handoff stores one meaningful return target; owner resets | None; final capture may include relevant public state only | Different from participant Return to Live; not general camera history |
| ImmutablePublicationContent | C | Authorized sharing creates bounded permitted representation | Creation per publication revision | Retain referenced old representation or captured copy; never replace bytes under a revision |
| AI grounding metadata / accepted AI provenance | D | Destination owner records authorized sources/task/result attribution; AI has no write authority | Containing accepted/frozen result | Pin exact referenced source/capture revision; later model output not substitute |
| Bounded scenario understanding | E | Owner refines scenario draft/AI understanding and explicitly confirms | Scenario understanding acceptance pins input for generated screen definition; later draft changes require reconfirmation | Understanding confirmation is not screen confirmation or meeting start |
| Source locator metadata | C | Sources captures revision-specific frame/section/item locator | Creation with SourceReference | External live URL may be unavailable; never silently resolve to unrelated latest content |
| Structured snapshot payload | C | Explicit capture creates immutable scope/scenario/evidence state | Snapshot creation | No video/camera stream; saved semantic state persists unchanged |
| Home / ProjectMembership / readiness / counts | F | Authorized derived query only | Not applicable | Failed/draft saves cannot appear as accepted outcomes |
| InteractionContext / runtime input / AI preview | F | Transient operation/render state only; meaningful draft result goes to owner | Not applicable as runtime object | Re-resolve permissions; never treat client preview/mode as authority |
| MySpaceItem private wrapper | A | Owner updates workspace organization/context under underlying KnowledgeItem or Snapshot; capture body stays fixed | Underlying publication/capture rules apply, not wrapper mutation | Changing private wrapper cannot move/delete shared publications or captured content |

Registered/guest principal binding, project/meeting scope and graph ownership are never editable identity shortcuts. Deactivation/revocation changes usability, not attribution. Actions may expose an already-authorized current execution status; **the accepted task definition remains fixed**. This pass introduces no new task tracker or accepted-decision correction workflow.

# SECTION 2 — ARCHITECTURE INTERNAL RECORD MODEL

Recommend **ArchitectureGraph**, replacing the conceptual name **ArchitectureVersion** for V1. This is a naming recommendation for future implementation; no existing source/schema/doc is renamed now. Old architectureVersion references mean the same stable graph identity in this design, not an exposed V2/V3 model.

| Concept | V1 meaning | Persistence conclusion |
| --- | --- | --- |
| Architecture | Project's single architecture container/accepted family | Stable project binding and root identity; no second confirmed architecture. |
| Candidate root ArchitectureGraph | One editable reconstruction reviewed in Groups 2/3 | Same graph record through autosave/correction; no new graph per edit, save or Undo. |
| Confirmed root ArchitectureGraph | That exact root after explicit Group 2 dialog acceptance | Identity preserved; semantic graph frozen. No post-confirmation replacement/version selector. |
| Documented inner ArchitectureGraph | Imported subordinate graph with one parent-node link | Same Architecture family; zero/one child per node; acyclic containment; freezes with root family. |
| Autosave/concurrency state | Current draft/checkpoint and change-detection stamp | Not a graph revision series. Bounded reversible correction state is owned by candidate; detailed concurrency deferred to Pass 2. |

Graph nodes/connections are normalized records owned by exactly one graph. Both edge endpoints belong to that graph; child link points to documented same-family detail. Stable logical node identity survives candidate rename/move/type edits. Confirmation covers the reviewed root, imported descendants, edges, inner links and source provenance as one consistent accepted family.

A recovery/concurrency stamp detects whether the candidate being accepted is still the one reviewed. It is not user-visible architecture evolution, an event store, or another stored graph body. After confirmation there is no active root candidate. Materially different architecture still requires another Project.

# SECTION 3 — FREEZE BOUNDARIES

Six major boundaries. Copying below means an intentional bounded semantic representation, not duplicating canonical graphs or source documents. Snapshot membership is finite, permission-filtered and identified; technical limits belong to implementation planning.

## F1 — ARCHITECTURE CONFIRM

**SOURCE STATE:** Current owner-reviewed root candidate plus its complete documented inner family and valid references.

**TARGET FROZEN STATE:** One confirmed immutable ArchitectureGraph family under the existing Architecture.

**WHAT GETS COPIED:** No second graph body; promote the existing candidate and retain exact accepted provenance/checkpoint receipt.

**WHAT STAYS REFERENCED:** Project, owning graph identities, normalized nodes/edges/inner links and exact SourceReference identities.

**WHAT MUST NOT FLOAT TO “LATEST”:** Accepted candidate state, endpoint membership, inner structure and source revision.

**RETRY BEHAVIOR:** RETURN EXISTING RESULT for the same acceptance; reject an attempt to confirm a different state after confirmation. Pending acceptance against changed candidate requires re-review, never silent latest acceptance.

**WHO AUTHORIZES:** Project Owner / Architect via Group 2 explicit confirmation. Group 3 Done only saves/returns to review.

## F2 — PRESENTATION SCREEN CONFIRM

**SOURCE STATE:** Complete screen draft: scenario intent/approved understanding, semantic scope, local overrides/overlays and permitted knowledge inclusions.

**TARGET FROZEN STATE:** Immutable confirmed screen-definition checkpoint associated with that screen identity.

**WHAT GETS COPIED:** Bounded semantic screen definition and explicitly authorized inclusion representations/provenance; no graph topology or full source documents.

**WHAT STAYS REFERENCED:** Presentation, its single confirmed graph family, canonical targets and permitted source/knowledge identities.

**WHAT MUST NOT FLOAT TO “LATEST”:** Scenario meaning, applied settings, scope and included content at that confirmation.

**RETRY BEHAVIOR:** RETURN EXISTING RESULT for the same draft confirmation. A genuinely edited draft needs explicit new confirmation and a new definition identity.

**WHO AUTHORIZES:** Owner-controlled screen confirmation; scoped collaborator preparation remains limited to existing grants. Scenario-understanding confirmation and AI Preview/Apply are not screen-confirmation substitutes.

Editing a confirmed screen saves a separate current draft and makes that current screen ineligible for a new meeting until reconfirmed. The prior confirmed definition remains protected where already captured; current draft never leaks through an old confirmed label. Main Architecture is the required base screen from the confirmed graph; no new scenario wizard/confirmation interaction is invented for its initialization.

## F3 — MEETING START

**SOURCE STATE:** One Presentation's Main Architecture plus current CONFIRMED authored screen definitions, validated at actual start.

**TARGET FROZEN STATE:** Exactly one immutable MeetingPresentationSnapshot for the started meeting.

**WHAT GETS COPIED:** Eligible screen membership/order, semantic definitions, intended prepared context, authorized bounded included content and selected Start From definition.

**WHAT STAYS REFERENCED:** Canonical graph/node/connection identities; exact source locators; Presentation/screen origins. Canonical graph is not copied.

**WHAT MUST NOT FLOAT TO “LATEST”:** Screen eligibility/membership/order/definitions and prepared-content representation. Mutable source note bodies are never historical screen content.

**RETRY BEHAVIOR:** RETURN EXISTING RESULT if already started by the same intended operation. Never resnapshot newer authoring state on a retry; incompatible subsequent start is rejected.

**WHO AUTHORIZES:** Project Owner / Architect. Scheduling does not freeze early; temporary presenter does not acquire start authority.

If an inclusion would require reading unshared private content, start cannot dereference it on behalf of attendees. Resolve only an explicitly authorized bounded representation or fail/require correction before start; do not silently broaden visibility.

## F4 — SHARE TO MEETING / EXPLICIT UPDATE

**SOURCE STATE:** Authorized author's current intentionally selected KnowledgeItem/Snapshot representation or explicit direct shared input.

**TARGET FROZEN STATE:** SharedMeetingItem identity plus immutable publication revision representation.

**WHAT GETS COPIED:** Intended body/type, semantic scope, permitted evidence/attachment representation, safe author attribution and minimal origin provenance.

**WHAT STAYS REFERENCED:** Meeting, author, optional private origin identity and source content stamp, permitted graph/source/capture references.

**WHAT MUST NOT FLOAT TO “LATEST”:** Shared body, original stamp, context and selected attachment content. Origin reference does not authorize private dereference.

**RETRY BEHAVIOR:** RETURN EXISTING RESULT for same share/update intention. A distinct explicit update creates a new publication revision; a deliberate separate share creates an independent publication identity.

**WHO AUTHORIZES:** Authorized sharing actor for their intended content in the admitted meeting. Owner controls session/admission but cannot share another person's private material by virtue of ownership.

## F5 — END MEETING

**SOURCE STATE:** Started meeting's eligible shared publications and intentional structured session items, exact revisions and relevant final semantic stage state.

**TARGET FROZEN STATE:** Exactly one FrozenMeetingCapture with stable identifiable captured entries.

**WHAT GETS COPIED:** Exact used/current eligible publication representations and structured context/attribution. Earlier explicitly retained/shared revision references preserve their used representation too; do not flatten intentional distinct entries into a latest-body overwrite.

**WHAT STAYS REFERENCED:** Start snapshot, canonical graph and exact publication/revision/capture/evidence identities.

**WHAT MUST NOT FLOAT TO “LATEST”:** End capture membership/content and source revision bindings. Never inspect unshared My Space or infer verbal-only discussion.

**RETRY BEHAVIOR:** RETURN EXISTING RESULT after successful end; never refreeze later source changes or create another capture.

**WHO AUTHORIZES:** Owner-confirmed End Meeting. Temporary presenter has no end authority. No continuous audio or full transcript.

## F6 — SAVE TO PROJECT

**SOURCE STATE:** Autosaved owner-reviewed assessment/summary draft and draft Decisions/Actions over the unchanged FrozenMeetingCapture.

**TARGET FROZEN STATE:** One accepted MeetingOutcome manifest, accepted review assessments/links and accepted Decision/Action definitions.

**WHAT GETS COPIED:** Accepted summary and intended reference set/acceptance receipt; freeze existing draft outcome definitions rather than also minting editable KnowledgeItem mirrors.

**WHAT STAYS REFERENCED:** Project, Review, frozen capture/entry IDs, accepted outcome identities, accepted semantic contexts and permitted evidence/snapshots.

**WHAT MUST NOT FLOAT TO “LATEST”:** Assessed source, accepted rationale/task definition, responsibility-at-acceptance, accepted item/link set and original summary.

**RETRY BEHAVIOR:** RETURN EXISTING RESULT on repeat success. Failure preserves all draft work and publishes no partial accepted outcome set. Later authorized action status is current execution state, not a revision of the accepted manifest.

**WHO AUTHORIZES:** Project Owner / Architect after explicit review/Save confirmation; AI/autosave/temporary presenter cannot accept. Successful Save alone routes success/Home.

# SECTION 4 — REVISION / SNAPSHOT STRATEGY

Revision identity is required only to distinguish captured meanings. It is not a universal history UI or one new table per revision. Current-record change stamps are concurrency inputs, not retained edit history.

| Subject | Chosen strategy | Identity / retention rule |
| --- | --- | --- |
| KnowledgeItem edits | BOUNDED REVISION / SNAPSHOT | Current body + content stamp. Published/captured consumers keep exact selected body/context/stamp; do not retain or expose every private edit. |
| Snapshot | IMMUTABLE PUBLICATION | New capture = new Snapshot identity. Original structured payload fixed; optional image outside PostgreSQL. |
| PresentationScreen edits | BOUNDED REVISION / SNAPSHOT | Current draft + last confirmed definition checkpoint. Meeting copies confirmed semantic definition. Keep additional older definitions only where referenced; no unlimited Builder edit ledger. |
| SharedMeetingItem explicit update | IMMUTABLE PUBLICATION | Stable publication identity; distinct immutable revision per intentional share/update; only current visibility/pointer mutable. Keep current and all historically referenced revisions. |
| MeetingPresentationSnapshot | IMMUTABLE PUBLICATION | One start-time snapshot identity under Meeting; later authoring never replaces it. |
| FrozenMeetingCapture | IMMUTABLE PUBLICATION | One end-capture identity; each entry has stable local identity and exact source/revision provenance. |
| MeetingReview autosave | CURRENT RECORD ONLY | One resumable draft over one fixed capture. Autosave stamp, not another review per save. Acceptance seals reviewed basis. |
| Decision draft → accepted | IMMUTABLE ACCEPTED RECORD | Draft identity promoted to accepted content at Save; no later in-place accepted rationale/context edits in V1. |
| ActionItem draft → accepted | IMMUTABLE ACCEPTED RECORD | Freeze original accepted definition/assignee/context; current permitted status is separate operational state, never a moving accepted-definition reference. |
| SourceReference | BOUNDED REVISION / SNAPSHOT | Exact source revision/locator identity fixed. New source content uses new locator identity, not rewriting origin. Source metadata/availability can remain current. |
| Candidate graph autosave | CURRENT RECORD ONLY | Same graph IDs, current draft and bounded recovery state; no append-only graph versions. |
| Preferences, current grants, private checkpoint | NO REVISION HISTORY | Persist needed current value/lifecycle and stable attribution elsewhere; no product history stream. |

“Bounded” means preserve the current working value and snapshots genuinely required by retained consumers, not an arbitrary age/count cap that deletes referenced history. Superseded unreferenced representations may be reclaimed under later retention policy. Every reference either resolves an immutable origin representation or owns a self-contained authorized historical copy with provenance; both must never silently resolve “latest.”

Publication revision identity can be owner-local. Screen-definition and capture entry identities can also be owner-local. Exact identifier shapes, table decomposition, retention limits and cleanup mechanisms are intentionally deferred. No new universal revisions table or revision list UI is authorized.

# SECTION 5 — NORMALIZED VS JSONB DESIGN

This is the authoritative **57-concept storage register**. Each concept has one primary style: **21 NORMALIZED RELATIONAL, 20 HYBRID, 13 JSONB / STRUCTURED DOCUMENT VALUE, 3 NOT STORED**. These are classifications of concepts, including owned nested values and projections, not 57 tables. Parent HYBRID plus nested JSONB entries describe containment, not duplicate persistence.

Relational anchors carry independently referenced identity, ownership, grants, phase/state predicates and important cardinality. Owned document values carry bounded typed semantic configuration. HYBRID means these cooperate; no consequential authority may exist only inside arbitrary unvalidated JSON. No exact SQL types, columns or JSONB layout are chosen here.

| Concept | Primary storage style | Why |
| --- | --- | --- |
| User | NORMALIZED RELATIONAL | Stable principal, authentication and cross-domain joins |
| Organization | NORMALIZED RELATIONAL | Stable organizational scope |
| OrganizationMember | NORMALIZED RELATIONAL | Unique organization/user association and role constraints |
| AuthSession | NORMALIZED RELATIONAL | Independent secure session expiry/revocation lookup |
| UserPreference | NORMALIZED RELATIONAL | Existing per-user persisted preference record |
| ScopedGuestAccess | NORMALIZED RELATIONAL | Scope-limited identity/admission joins |
| Project | NORMALIZED RELATIONAL | Owner/organization scope, access and project queries |
| ProjectStructure | NORMALIZED RELATIONAL | Existing exactly-one project-owned configuration |
| ProjectLayerDefinition | NORMALIZED RELATIONAL | Ordered project-owned rows, identity and filtering |
| ProjectEditorAssignment | NORMALIZED RELATIONAL | Explicit project/user grant uniqueness |
| Source | HYBRID | Relational project/source identity and state; bounded connector/file description document |
| SourceReference | HYBRID | Relational Source attachment/identity; owned typed locator metadata |
| IngestionRun | HYBRID | Relational source/attempt/status; bounded normalized-result provenance/failure detail |
| IntegrationCredential | HYBRID | Relational owner/binding; isolated protected connector-specific credential envelope |
| StagedUpload | NORMALIZED RELATIONAL | Actor/project consumption constraints and artifact reference |
| Architecture | NORMALIZED RELATIONAL | One project/container and accepted root identity constraints |
| ArchitectureGraph (formerly ArchitectureVersion) | NORMALIZED RELATIONAL | Stable graph identity, parent/family and node/edge joins |
| ArchitectureNode | NORMALIZED RELATIONAL | Independent referenced IDs; graph ownership and filtering |
| ArchitectureConnection | NORMALIZED RELATIONAL | Endpoint identity, validity and graph joins |
| InnerArchitectureReference | NORMALIZED RELATIONAL | One child per parent node, same-family acyclic containment |
| CorrectionSession value | JSONB / STRUCTURED DOCUMENT VALUE | Candidate-local checkpoint/reversible semantic state, no independent lifetime |
| KnowledgeItem | HYBRID | Relational author/visibility/project/type; bounded typed authored body/provenance |
| KnowledgeContext | HYBRID | Relational item/attachment/scope anchor; owned selection/locator descriptor |
| Snapshot | HYBRID | Relational creator/scope/identity; owned capture payload and optional artifact ref |
| MySpace logical state | NOT STORED | No independent container/content mirror needed |
| Presentation | HYBRID | Relational project/graph/owner; bounded preparation configuration/draft |
| PresentationAccessGrant | NORMALIZED RELATIONAL | Presentation/principal/role authorization and uniqueness |
| PresentationInvitation | NORMALIZED RELATIONAL | Recipient admission lifecycle and accepted-grant relationship |
| PresentationScreen | HYBRID | Relational presentation/screen/state/identity; owned bounded definition/last confirmed checkpoint |
| VisualOverride set | JSONB / STRUCTURED DOCUMENT VALUE | Owner-local target/property set validated/written as semantic unit |
| ScenarioOverlayConnection | HYBRID | Relational screen/overlay/endpoints; bounded visual/label settings |
| PresentationScreenKnowledgeReference | HYBRID | Relational screen/item association; bounded permitted inclusion snapshot/provenance |
| Meeting | HYBRID | Relational scope/owner/lifecycle; owned state, snapshot and capture documents |
| MeetingParticipant | NORMALIZED RELATIONAL | Unique meeting/principal admission; no duplicate reconnect identities |
| MeetingInvitation | NORMALIZED RELATIONAL | Admission/invitation and participant relationships |
| MeetingSharedState | HYBRID | Authorization-critical presenter/screen references relational anchors; owned navigation descriptor |
| ParticipantPrivateState | JSONB / STRUCTURED DOCUMENT VALUE | Participant-owned minimal semantic recovery value |
| PresenterTransferRequest | HYBRID | One meeting-owned pending descriptor with constrained sender/recipient participant references |
| SharedMeetingItem | HYBRID | Relational meeting/author/publication/current visibility; owned immutable revision representations |
| MeetingPresentationSnapshot | JSONB / STRUCTURED DOCUMENT VALUE | Meeting-owned immutable package, referenced relational meeting/presentation/graph anchors |
| FrozenMeetingCapture | JSONB / STRUCTURED DOCUMENT VALUE | Meeting-owned immutable capture with identifiable entries and exact publication revisions |
| MeetingReview | HYBRID | Relational meeting/review/status; bounded review summary/draft and accepted manifest |
| MeetingReviewItem | HYBRID | Relational review/source assessment identity; owned semantic context and bounded assessment text |
| Decision | HYBRID | Relational project/review/identity; bounded rationale/context/provenance |
| ActionItem | HYBRID | Relational project/review/assignee/status/optional decision; owned accepted definition/context |
| MeetingOutcome accepted manifest | JSONB / STRUCTURED DOCUMENT VALUE | Review-owned accepted references, summary and receipt, not duplicated editable bodies |
| ReviewOutcomeLink | NORMALIZED RELATIONAL | N:M assessment-to-outcome joins, project/review integrity |
| CapturedSemanticScope | HYBRID | Relational resolvable scope anchors plus validated owned semantic sets |
| OwnerPresentationReturnCheckpoint | JSONB / STRUCTURED DOCUMENT VALUE | Meeting-owned bounded semantic checkpoint; no nested handoff stack |
| ImmutablePublicationContent | JSONB / STRUCTURED DOCUMENT VALUE | Owned share body/context/provenance, no independent root |
| AI grounding metadata / accepted AI provenance | JSONB / STRUCTURED DOCUMENT VALUE | Small owned grounding/uncertainty refs; source bodies remain with Sources |
| Bounded scenario understanding | JSONB / STRUCTURED DOCUMENT VALUE | Screen-local intent/constraints/approved understanding as one semantic value |
| Source locator metadata | JSONB / STRUCTURED DOCUMENT VALUE | Typed nested origin descriptor under relational SourceReference |
| Structured snapshot payload | JSONB / STRUCTURED DOCUMENT VALUE | Owner-local bounded capture with optional external image ref |
| Home / ProjectMembership / readiness / counts | NOT STORED | Rebuild from grants and accepted domain records; no competing ownership |
| InteractionContext / runtime input / AI preview | NOT STORED | No raw hand path, ray/gaze/hover/camera trajectory or universal AI truth store |
| MySpaceItem private wrapper | JSONB / STRUCTURED DOCUMENT VALUE | Underlying owner/type/context role, no independent content identity or table |

Document shapes must be validated against a domain-owned contract. Unknown context kinds, stale graph targets, invalid endpoint membership and unsafe visual/provenance fields cannot be accepted merely because JSON can store them. Canonical nodes/edges, participant/grant relationships and outcome links remain normalized; do not bury a second canonical graph or all access control in documents.

Snapshots/captures are owner-local semantic documents anchored by relational owners. Their nested reference lists are not automatically database-enforced foreign keys. Pass 2 must validate permission/scope/consistency when captured; later schema design determines which query-critical sets need a relational projection or association. That does not add a universal context store now.

Credential HYBRID storage describes a protected connector-specific envelope or reference to protected secret storage, never plaintext source metadata or ordinary JSON returned to clients. Upload/image/document bytes remain in artifact storage; only authorized durable artifact references enter PostgreSQL. No raw source bytes in every context or AI provenance value.

# SECTION 6 — CONTEXT PERSISTENCE

**Choice: HYBRID semantic context.** InteractionContext is transient actor/mode/selection/permission resolution. A deliberate save/attach/share/confirm operation captures a validated **CapturedSemanticScope** owned by the saving record. Reuse one semantic vocabulary and validator contract, not one shared mutable context object/table.

Conceptual contract elements, not a JSON layout or column list:

| Meaning | Persisted semantic requirement |
| --- | --- |
| Context identity and kind | Typed descriptor with a contract-format discriminator and a supported target kind; owner gives it identity/lifetime. Format discriminator is not architecture evolution. |
| Principal/project scope | Owner's protected actor/project scope; captured context never supplies its own permission grant. |
| Architecture anchor | Exact Architecture and ArchitectureGraph identity/family when architecture-related; same-project validation. |
| Primary target | WHOLE_ARCHITECTURE, NODE, CONNECTION, LASSO_GROUP or INNER_ARCHITECTURE resolves stable graph-owned target identities. |
| Presentation target | PRESENTATION_SCREEN includes Presentation/screen plus confirmed-definition or meeting-start snapshot binding when frozen; never screen ID alone to latest body. |
| Session target | MEETING_CONTEXT includes Meeting and applicable start snapshot/frozen capture/entry or publication revision, without capturing participant-private state. |
| Supplemental grounding | Exact permitted SourceReference, Snapshot or captured evidence identities, with uncertainty/unavailability distinguished. |
| Capture meaning | Explicit selected/internal/boundary roles, target definition stamp where relevant, safe capture attribution/time conceptually. No raw gesture history. |

For **LASSO_GROUP**, retain the conceptual sets requested by the product: selectedNodeRefs[], internalConnectionRefs[], boundaryConnectionRefs[], externalBoundaryEndpointRefs[], architectureGraphRef and optional presentationScreenRef with its applicable definition/capture binding.

- Selected nodes are the primary context. Internal connections have both endpoints selected.
- Boundary connections have one selected endpoint and one outside endpoint; preserve direction, exact connection identity and external endpoint identity.
- Store semantic IDs/roles, not copied architecture objects or arbitrary traversed connected subgraphs.
- Validate that referenced nodes/edges exist in the anchored graph, edges match endpoint membership, and boundary sets agree with selected/internal sets.
- INNER_ARCHITECTURE pins the documented child graph and parent-node link, not an AI-generated submodel.
- WHOLE describes the exact graph family; it does not enumerate all source documents or imply access to everything connected.
- Multiple KnowledgeContext attachments may target multiple scopes; a screen's one current primary scope follows Step 0B.2. Additional outcome evidence remains supplemental.
- A context descriptor changes with its mutable draft owner; once that owner is frozen, a copy/revision in a new mutable owner cannot rewrite the old descriptor.

| Consumer | Owned persistence rule |
| --- | --- |
| KnowledgeContext | Relational item attachment/primary scope anchor plus owned semantic selection. Changing current attachment set creates/ends bindings; pinned prior consumer descriptor stays intact. |
| Snapshot | Immutable capture descriptor; original screen/graph/session meaning retained independently from current UI. |
| PresentationScreen | Current draft scope and confirmed definition scope; local visual settings use those canonical target refs. |
| SharedMeetingItem | Per-publication-revision scope of intentionally shared content; never a live private context lookup. |
| MeetingReviewItem | Primary frozen entry anchor plus its exact captured scope; review-specific interpretation cannot alter that source scope. |
| Decision | Accepted outcome's stable primary architecture context and permitted captured grounding. |
| ActionItem | Accepted task context and responsibility-at-acceptance fixed; current status cannot retarget task origin. |

Do not persist raw lasso hand paths, ray trajectories, head gaze, hover/pressed UI, per-frame grabs or arbitrary camera history. A meaningful semantic return checkpoint can persist under its approved owner; no universal interaction_contexts table, graph copy, automatic connected-graph expansion or implicit gaze command is introduced.

# SECTION 7 — MY SPACE ISOLATION

**PRIVATE OWNER KEY:** One stable ActorRef per underlying KnowledgeItem/Snapshot/private wrapper: registered User OR restricted guest principal. The conceptual choice is exclusive; a display name/email/client-supplied actor ID is not proof of ownership.

**PROJECT SCOPE:** Optional for standalone private content; required and consistent when content references project architecture. Project association does not change private visibility or make project owner a private reader.

**MEETING SCOPE:** Optional context/admission association, not lifetime ownership. ParticipantPrivateState is MeetingParticipant-owned; the private note/Snapshot remains Knowledge-owned. Leaving/ending a meeting never erases it.

**READ RULE:** Authenticated current actor can read their own private content within their valid account/scoped access. Owner/Architect, collaborator, presenter and ordinary participant rights never imply another actor's private read. Guest identity must still have a valid invited scope. Private body, counts, titles, attachment metadata, search results and AI retrieval are equally protected.

**WRITE RULE:** Only private content owner changes current private content/wrapper through Knowledge policy. Private meeting exploration/checkpoint writes remain actor-only. Other domains cannot overwrite the original through publication/grant/review pointers. AI proposes into an authorized owner's draft; it has no independent write authority.

**SHARE RULE:** Explicit actor action selects intended body/context/attachments for one meeting. Build a safe bounded publication representation; private draft versions, hidden notes, credential metadata, unrelated attachments and private histories are excluded. Project/meeting ownership cannot bypass the content-owner share boundary.

**REVOCATION RULE:** Ending presentation/meeting admission or guest authorization stops new access and mutations for that scope. It does not silently erase underlying private content or rewrite published history. Private deletion/archive changes original availability; withdrawal/update of an existing publication is a separate explicit allowed operation. Retention/erasure policy may require deliberate redaction, never silent replacement with another record.

**HISTORICAL PUBLICATION RULE:** Readers access SharedMeetingItem's intended representation, not its private provenance target. Capture/review retains the applicable revision/authorized bounded copy even if original is edited, removed or no longer readable. Provenance can remain minimally attributable/unavailable without exposing origin body or private revision history.

**GUEST-AUTHORED CONTENT:** Persist under the guest's stable scoped principal, not the meeting owner and not a fabricated registered User. Reconnect within valid scope resolves that same identity and private records. Leaving retains content; expiry/revocation denies further retrieval until legitimate reauthorization of that same identity/scope. There is no automatic project grant, perpetual cross-project My Space account or new guest administration/recovery UI. Identity-linking to a later registered account is not introduced here.

Private storage is therefore **isolated by ownership and authorized projection**, not by a second MySpace content database. Hiding a panel or excluding a field in one Unity response is insufficient: retrieval, artifacts, AI packages, exports, summaries and derived counts all obey the same boundary. Detailed permission enforcement mechanisms are Pass 2.

# SECTION 8 — SHARED PUBLICATION MODEL

A **SharedMeetingItem** is one intentional publication owned by Meetings, scoped to exactly one Meeting, with author attribution and an optional safe private-origin link. It is not another editable KnowledgeItem, a shared folder, a full private-content copy or an unrestricted pointer.

| Component | V1 rule |
| --- | --- |
| Stable identity | One publication identity within one meeting; never migrated between meetings. |
| Scope/authority | Meeting owner governs session lifecycle; publishing author retains ownership of private original. Neither transfers ownership to the other. |
| Attribution/type | Safe author ActorRef, publication category and deliberate share time belong to intended shared representation. |
| Payload | Bounded body and explicitly selected permitted attachment/evidence representation; no notebook-wide metadata. |
| Context | Exact owned CapturedSemanticScope per revision, same canonical graph; source references remain access-checked. |
| Provenance | Minimal original identity/content stamp or explicit direct-input origin; private dereference denied to meeting readers. |
| Revision identity | Publication identity + immutable owner-local revision identity identifies the precise representation. |
| Current envelope | Current revision selection and visibility/withdrawal state may change explicitly under phase/authority rules. |
| Capture/reference | Meeting/review/Snapshot that uses a revision pins that revision or an exact authorized immutable copy with provenance. Never follows current automatically. |

**Simple V1 update rule:** a new explicit share creates a publication identity and its initial immutable representation. An explicit **Update this publication** appends a new immutable revision to the same publication and advances its current selection. Same-intention retry returns the existing identity/revision. Private edit alone creates no publication update.

The same original can be shared again as an intentionally separate publication, including within the same meeting, and can be independently shared into multiple meetings. Treat explicit repeat creation as new intent; do not confuse it with retry. Cross-meeting updates never synchronize.

A revision is never overwritten, even when content appears identical. Retain current representation and every revision still referenced by frozen/accepted/session captures; unreferenced obsolete values may be reclaimed under later retention rules. This is an owner-local publication revision boundary, not a universal history system or “My Shared Things.”

While LIVE, current meeting context may show the explicitly advanced revision. Existing pinned capture/reference still shows its chosen revision. End preserves exact eligible current and deliberately retained referenced representations as identifiable entries; review assesses those entries. After end, publication edits cannot modify that frozen meeting record or reopen the meeting.

Withdrawal changes current visibility; it cannot pretend previously captured content never existed. A frozen entry may carry withdrawal/unavailability information under later policy, but cannot silently switch to a newer private/public body. No retention duration, legal-erasure workflow or public edit-history UI is invented here.

# SECTION 9 — FOREIGN-KEY INTENT

Logical intent only; no SQL syntax, delete clauses, physical column choices or exact foreign-key definitions.

- **STRONG OWNERSHIP:** required owner lifecycle; no new orphan child. Archive/retain owner shell where referenced history needs it.
- **RESTRICTED REFERENCE:** target exists in correct scope and is authorized; referencing owner cannot mutate/delete target.
- **HISTORICAL REFERENCE:** exact immutable meaning must stay resolvable or visibly unavailable; never silently retarget.
- **OPTIONAL SCOPE REFERENCE:** valid when applicable; absence does not imply unscoped access or deletion of independent content.
- **PRIVATE PRINCIPAL REFERENCE:** stable actor ownership/attribution; deactivation is not cascading authored-content deletion.
- **DERIVED REFERENCE:** no independent write-owned relationship/table; calculate from actual grants/accepted state.

The following compact families cover the major Step 0B.2 relationships. Where an association has two roles, its parent is strong ownership and its target is a restricted/principal reference; these are different ends of the same association, not conflicting owners.

| Relationship family | Primary intent | Logical archive/delete/reference behavior |
| --- | --- | --- |
| OrganizationMember → Organization / User (R01) | STRONG OWNERSHIP / RESTRICTED REFERENCE | Organization owns grant; user independent. Ending membership does not delete user/project authorship. |
| AuthSession, UserPreference → User (R02–R03) | STRONG OWNERSHIP | Sessions expire/revoke, preference resets; neither removes independently authored content. |
| ScopedGuestAccess → invited scope / guest actor (R04) | PRIVATE PRINCIPAL REFERENCE | Access expires; scope binding/attribution cannot be reused for another actor. |
| Project → Organization / owner User (R05–R06) | RESTRICTED REFERENCE | Required one of each; archive retains origin, no ownership inference or silent reassignment. |
| ProjectEditorAssignment → Project / User (R07) | STRONG OWNERSHIP / RESTRICTED REFERENCE | Project owns grant; revoking grant changes access only. |
| ProjectStructure / ProjectLayerDefinition → Project (R08–R09) | STRONG OWNERSHIP | Existing structure/layers lifecycle; canonical graph is not a child of mutable template data. |
| Source → Project (R10) | RESTRICTED REFERENCE | Source is separately managed domain root but required project scope; detached historical origin remains attributable. |
| SourceReference / IngestionRun → Source (R11–R12) | STRONG OWNERSHIP | Referenced locator/terminal input provenance retained under archived Source. |
| Source → IntegrationCredential (R13) | RESTRICTED REFERENCE | Optional connector binding; revocation denies reads without deleting graph/evidence. Never expose token. |
| StagedUpload → uploading actor (R14) | PRIVATE PRINCIPAL REFERENCE | Uploader ownership before project creation; cleanup cannot transfer upload to another actor. |
| StagedUpload → consuming Project / resulting Source (R15–R16) | OPTIONAL SCOPE REFERENCE | Unconsumed may expire; after consumption Source/artifact provenance survives stage cleanup; no second consumption. |
| IntegrationCredential → owning User (R17) | PRIVATE PRINCIPAL REFERENCE | Independent authorized connection lifecycle; secret destroyed/revoked under eventual policy, safe origin retained. |
| Architecture → Project (R18) | RESTRICTED REFERENCE | Required project after reconstruction; one architecture family; retained confirmed identity cannot be replaced. |
| ArchitectureGraph → Architecture (R19) | STRONG OWNERSHIP | One candidate root plus documented inner records; confirmed family retained, no orphan graph. |
| Node / Connection → ArchitectureGraph (R20–R21) | STRONG OWNERSHIP | Candidate deletion validates edges; confirmation retains immutable graph elements. |
| Connection → source/destination Node (R22–R23) | RESTRICTED REFERENCE | Both endpoints required in owning graph; reject invalid references; no presentation endpoint mutation. |
| InnerArchitectureReference → parent Node / child graph (R24) | STRONG OWNERSHIP / RESTRICTED REFERENCE | Tree constraint, same family and no cycles; accepted link never repoints. |
| Graph/element → SourceReference (R25) | HISTORICAL REFERENCE | Source inaccessible means identified unavailable grounding, not substituted latest board/doc. |
| KnowledgeItem → Project / author (R26–R27) | OPTIONAL SCOPE REFERENCE / PRIVATE PRINCIPAL REFERENCE | Project context not audience grant; author-private content survives meeting exit and actor access expiry. |
| KnowledgeContext → item / semantic targets (R28) | STRONG OWNERSHIP / HISTORICAL REFERENCE | Current attachment set replaceable; each captured binding stable and target separately authorized. |
| Snapshot → creator / project (R29–R30) | PRIVATE PRINCIPAL REFERENCE / OPTIONAL SCOPE REFERENCE | Creator-owned lifetime; project required for graph context; no meeting cascade. |
| Item → Snapshot / SourceReference evidence (R31–R32) | HISTORICAL REFERENCE | Exact capture/locator retained; reference never makes a private payload public. |
| Presentation → Project / confirmed Architecture (R33–R34) | RESTRICTED REFERENCE / HISTORICAL REFERENCE | One consistent project/graph; archive preserves meeting start meaning. |
| Screen → Presentation (R35) | STRONG OWNERSHIP | Base not removable; removal of authored current screen cannot erase old start snapshots. |
| PresentationAccessGrant → presentation / actor (R36) | STRONG OWNERSHIP / RESTRICTED REFERENCE | Access ends on revocation; no project member insertion. |
| PresentationInvitation → presentation / recipient; resulting grant (R37–R38) | STRONG OWNERSHIP / RESTRICTED REFERENCE | Stable intended recipient; lifecycle change cannot mint multiple recipients/grants. |
| ScreenKnowledgeReference → screen / KnowledgeItem (R39) | STRONG OWNERSHIP / RESTRICTED REFERENCE | Explicit inclusion, private target remains independent; confirmed consumer pins intended safe representation. |
| VisualOverride / ScenarioOverlayConnection / scope → screen (R40–R42) | STRONG OWNERSHIP | Local draft values; canonical targets restricted; old snapshot definitions retained. |
| Meeting → consistent Project / Presentation / owner (R43–R45) | RESTRICTED REFERENCE | One of each; start pins content; temporary presenter not owner. |
| MeetingParticipant → Meeting / ActorRef (R46) | STRONG OWNERSHIP / PRIVATE PRINCIPAL REFERENCE | Reconnect reuses same participation; access expiry does not erase attribution. |
| MeetingInvitation → Meeting / resulting participant (R47–R48) | STRONG OWNERSHIP / RESTRICTED REFERENCE | Invitation may expire after valid admission; participant binding not duplicated/reassigned. |
| SharedMeetingItem → Meeting (R49) | STRONG OWNERSHIP | Publication never migrates; frozen revisions retained after end. |
| Publication → private origin (R50) | HISTORICAL REFERENCE | Optional provenance for direct shared input; origin unavailability does not delete intended publication or authorize origin read. |
| ParticipantPrivateState → participant (R51) | STRONG OWNERSHIP | Private checkpoint ends with scoped state policy; independent private Knowledge content unaffected. |
| Presenter / shared state / pending request → Meeting and admitted participant (R52–R54) | STRONG OWNERSHIP / RESTRICTED REFERENCE | One active presenter/one pending request; stale references cannot restore control after end/take-back. |
| Owner return checkpoint → Meeting (R55) | STRONG OWNERSHIP | Bounded semantic private return; no participant-private broadcast. |
| Start snapshot / end capture → Meeting (R56–R57) | STRONG OWNERSHIP | Creation fixed once; retained under archived meeting for review/history. |
| MeetingReview → ended Meeting / FrozenMeetingCapture (R58) | HISTORICAL REFERENCE | Review separately owned; archive cannot orphan its frozen basis; at most one review. |
| MeetingReviewItem → Review / captured entry (R59–R60) | STRONG OWNERSHIP / HISTORICAL REFERENCE | Assessment cannot rewrite frozen source; missing/redacted source visible, never auto-substituted. |
| Decision / ActionItem → originating Review (R61–R62) | HISTORICAL REFERENCE | Independent accepted outcomes retained as project knowledge; review UI exit is not deletion. |
| ReviewOutcomeLink → assessment / Decision or Action (R63–R64) | STRONG OWNERSHIP / HISTORICAL REFERENCE | Accepted N:M provenance retained; no outcome-body mirror. |
| ActionItem → optional primary Decision (R65) | HISTORICAL REFERENCE | Same originating project/review; archiving decision does not erase action. |
| ActionItem → responsible ActorRef (R66) | PRIVATE PRINCIPAL REFERENCE | Expiry/leave does not erase accepted responsibility; assignment conveys no access. |
| Decision / Action → accepted semantic scope (R67) | HISTORICAL REFERENCE | Exact graph/capture refs stable; current execution state never retargets accepted context. |
| MeetingOutcome manifest → Review / accepted item set (R68) | STRONG OWNERSHIP / HISTORICAL REFERENCE | One immutable accepted result; retry never appends another acceptance. |
| Review / Decision / Action → consistent Project (R69) | RESTRICTED REFERENCE | Derived from origin; accepted outcome never moved into another project/model. |
| Meeting/review references → Snapshot (R70) | HISTORICAL REFERENCE | Snapshot independent of meetings; frozen bounded representation retained without private-source permission escalation. |
| Home / ProjectMembership / readiness / counts | DERIVED REFERENCE | Read from source domains; no authoritative relationship/counter table. |

These intents also govern IDs nested in owned documents. A JSONB reference is not a SQL foreign key and is not exempt from validity, project/graph consistency, retention or permission checks. Later schema design may normalize query-critical references; this document supplies the invariant, not constraint syntax.

# SECTION 10 — FAILURE + RETRY CONSISTENCY

Outcome requirements only. Pass 2 will define transaction scope, operation identity, optimistic concurrency, authorization rechecks and how to distinguish a retry from new intent.

| Operation | Same-intention retry outcome | Distinct intent / changed source outcome | Failure expectation |
| --- | --- | --- | --- |
| Architecture confirm | RETURN EXISTING RESULT | REJECT DUPLICATE if already frozen with incompatible intent; stale candidate requires re-review before acceptance | Keep current candidate/edits; no partially confirmed descendants. |
| Screen confirm | RETURN EXISTING RESULT | CREATE NEW REVISION only for an explicitly edited, valid draft confirmation | Draft survives; no half-confirmed eligible definition. |
| Meeting start | RETURN EXISTING RESULT | REJECT DUPLICATE after start; never create another snapshot of newer Builder state | Remain unstarted with recoverable setup; no LIVE state without exact start snapshot and valid presenter. |
| Initial Share to Meeting | RETURN EXISTING RESULT | CREATE NEW RECORD for explicitly separate publication, including another meeting | Private original unchanged; no visible partial publication. |
| Explicit publication update | RETURN EXISTING RESULT | CREATE NEW REVISION for deliberate later update, only in allowed meeting phase | Prior current revision stays valid; no overwritten old revision. |
| End Meeting | RETURN EXISTING RESULT | REJECT DUPLICATE/refreeze attempt after end | Do not claim ended/review-ready with missing capture; retain structured shared work. |
| Save to Project | RETURN EXISTING RESULT | REJECT DUPLICATE incompatible acceptance after saved review; no new manifest from same review | Preserve autosaved review and intended outcomes; no partial accepted set or Home success. |

RETURN EXISTING RESULT means the original durable result, not recomputing from today's source data. A permission failure still denies disclosure; prior success does not become a bypass around current access policy. Retries cannot duplicate invitations, publication identities/revisions, admitted participants, snapshots or accepted outcomes.

A stale source/candidate/draft is a conflict, not permission to accept the newest unseen state. No operation automatically advances the user's workflow merely because an autosave or AI proposal succeeded. Recovery after an uncertain network response must resolve existing accepted state before attempting a new consequential intent.

# SECTION 11 — STORAGE DUPLICATION RISKS

| Risk | Correct owner | Reference / snapshot strategy |
| --- | --- | --- |
| Canonical graph copied into Presentation | Architecture; Presentation owns local view/scenario definition | Stable confirmed graph/element refs; only local scope/settings/overlays persist. |
| Canonical graph copied into Meeting | Architecture; Meeting owns session content snapshot/state | Start snapshot stores eligible screen definitions plus graph refs, never another graph body. |
| KnowledgeItem mirrored as editable SharedMeetingItem | Knowledge owns private/current content; Meetings owns explicit publication | Immutable intended publication representations with provenance; no synchronization or write-through. |
| MySpace duplicated inside meeting storage | Knowledge creator ownership | Participant checkpoint points to permitted private context; actual items survive meeting exit; captures exclude unshared content. |
| Raw source docs copied into every AI/context | Sources/artifact storage | Exact SourceReference and small safe grounding/cited excerpt only when deliberately needed; no broad prompt warehouse. |
| Review rewrites FrozenMeetingCapture | Meetings owns immutable capture; Outcomes owns editable draft assessment | Stable capture/entry/revision anchors; accepted assessment freezes separately. |
| Accepted Decision copied as editable KnowledgeItem | Outcomes | Project knowledge reads accepted Decision through authorized projection; retain links rather than another editable body. |
| Home counters become truth | Relevant domain owners | Derived accepted-state summaries; failed/draft Save never counts as published. |
| Screen confirmation histories become a universal version system | Presentations | Current draft/last confirmed checkpoint and referenced snapshots only; no private edit-history UI. |
| JSONB descriptor becomes a second authorization database | Owning domain / Identity / Projects | Relational principal/scope/authority anchors; typed document validation; no client-supplied roles as permission. |
| Old share revisions are garbage-collected while referenced | Meetings and frozen consumers | Retain every required representation or equivalent exact authorized immutable captured copy; never substitute latest. |
| Action status overwrites accepted task receipt | Outcomes | Immutable accepted task definition/manifest plus separate allowed operational status; no changed past responsibility by overwriting current fields. |

Bounded snapshot copying is intentional publication/acceptance evidence, not competing mutable source of truth. Every such copy must have a named owner, freeze boundary and origin. If it has none, prefer the authoritative reference.

# SECTION 12 — FINAL V1 STORAGE CONTRACT

This compact register mirrors Section 5, without adding classifications. A–F refer to Section 1. “Revision strategy” names a semantic preservation rule, not a mandatory revisions table. All exact cardinalities/aggregate boundaries remain in Step 0B.2.

| Concept | Mutable? | Freeze Point | Storage Style | Revision Strategy | Privacy/Ownership | Historical Stability |
| --- | --- | --- | --- | --- | --- | --- |
| User | A | None; historical attribution is separately pinned | NORMALIZED RELATIONAL | CURRENT RECORD ONLY | Identity; private security fields | Keep stable actor identity; profile updates never reassign authorship |
| Organization | A | None | NORMALIZED RELATIONAL | CURRENT RECORD ONLY | Identity; current membership controls access | Archive does not erase project origin |
| OrganizationMember | A | None; grant ends without erasing attribution | NORMALIZED RELATIONAL | NO REVISION HISTORY | Identity; not project ownership | Historical authored records retain actor, not a live grant assumption |
| AuthSession | A | None; immutable issued token material is never overwritten for reuse | NORMALIZED RELATIONAL | NO REVISION HISTORY | Identity secrets; never product projections | No domain history requirement; expiry does not delete authored content |
| UserPreference | A | None | NORMALIZED RELATIONAL | CURRENT RECORD ONLY | Actor-private Identity state | No preference history; cannot grant authority |
| ScopedGuestAccess | A | Principal binding fixed once issued; usability mutable | NORMALIZED RELATIONAL | CURRENT RECORD ONLY | Restricted actor; no project membership | Retain minimal stable attribution after session/scope expiry |
| Project | A | None for project metadata; confirmed graph separate | NORMALIZED RELATIONAL | CURRENT RECORD ONLY | Projects; exactly one owner | Archive retains referenced architecture/outcomes; no scope retarget |
| ProjectStructure | A | None; not canonical topology | NORMALIZED RELATIONAL | CURRENT RECORD ONLY | Projects / Project | No automatic rewrite of confirmed graph |
| ProjectLayerDefinition | A | None | NORMALIZED RELATIONAL | CURRENT RECORD ONLY | Projects / Project | Referenced historical label/meaning remains captured, not live layer dereference |
| ProjectEditorAssignment | A | None | NORMALIZED RELATIONAL | NO REVISION HISTORY | Projects; owner remains separate | Revocation changes access, not authorship or accepted history |
| Source | A | Imported provenance locators remain fixed separately | HYBRID | CURRENT RECORD ONLY | Sources; authorized project readers receive safe metadata only | New external content cannot refresh confirmed graph; keep old origin identities |
| SourceReference | C | Creation of locator binding | HYBRID | BOUNDED REVISION / SNAPSHOT | Sources; locator is not access permission | New content/locator uses new identity; availability comes from current source/access, not replacement |
| IngestionRun | D | Terminal success/failure/cancellation | HYBRID | CURRENT RECORD ONLY | Sources; permission-filtered results | Terminal input/result provenance fixed; no unbounded retry event ledger |
| IntegrationCredential | A | None; token usability follows current authorization | HYBRID | NO REVISION HISTORY | Sources credential boundary; encrypted secret or protected-store reference | No historical usable token copies; nonsecret origin survives revocation |
| StagedUpload | D | Consumption or terminal expiry; no reuse | NORMALIZED RELATIONAL | CURRENT RECORD ONLY | Uploader-private until authorized attachment | Source keeps durable artifact origin before stage cleanup; bytes outside database |
| Architecture | D | Explicit Group 2 confirmation | NORMALIZED RELATIONAL | CURRENT RECORD ONLY | Architecture / project owner; readers authorized | Confirmed graph binding immutable; archive/availability separate |
| ArchitectureGraph (formerly ArchitectureVersion) | D | Architecture confirmation of exact candidate graph family | NORMALIZED RELATIONAL | CURRENT RECORD ONLY | Architecture; one project/root candidate | Same root promoted; confirmed root and documented descendants never retarget |
| ArchitectureNode | D | Architecture confirmation | NORMALIZED RELATIONAL | CURRENT RECORD ONLY | Architecture candidate; confirmed read-only | Rename/move preserves identity; frozen node not screen copy |
| ArchitectureConnection | D | Architecture confirmation | NORMALIZED RELATIONAL | CURRENT RECORD ONLY | Architecture; separate from hypothetical overlay | Accepted endpoints/direction/provenance fixed |
| InnerArchitectureReference | D | Architecture confirmation | NORMALIZED RELATIONAL | CURRENT RECORD ONLY | Architecture; source-backed link | Confirmed child reference stays fixed/unavailable; no alternate retarget |
| CorrectionSession value | A | Closes at confirmation or explicit confirmed discard | JSONB / STRUCTURED DOCUMENT VALUE | CURRENT RECORD ONLY | Architecture candidate; owner-only editing | Not graph-version history; cannot reopen frozen graph |
| KnowledgeItem | E | No global content freeze; consumers freeze intentional representations | HYBRID | BOUNDED REVISION / SNAPSHOT | Knowledge; private by default where My Space | Content stamp distinguishes edits; publications/captures retain exact body without private edit history |
| KnowledgeContext | E | Captured descriptor immutable in each frozen consumer | HYBRID | BOUNDED REVISION / SNAPSHOT | KnowledgeItem visibility inherited; target access separately checked | Changing current attachments never changes stored publication/snapshot scope |
| Snapshot | C | Creation | HYBRID | IMMUTABLE PUBLICATION | Knowledge creator-private; explicit sharing separately | New capture is new Snapshot; visibility/archive wrapper may change without rewriting capture |
| MySpace logical state | F | None; underlying content rules apply | NOT STORED | NO REVISION HISTORY | Logical actor-private collection | Survives meeting exit through underlying records |
| Presentation | E | Meeting snapshots freeze selected eligible definitions, not entire authoring package | HYBRID | CURRENT RECORD ONLY | Presentations; scoped grants do not expose My Space | One confirmed graph; meetings do not follow later Builder edits |
| PresentationAccessGrant | A | None | NORMALIZED RELATIONAL | NO REVISION HISTORY | Presentations; no project or attendance grant implied | Revocation ends future access, not accepted author attribution |
| PresentationInvitation | A | Recipient/scope binding never repurposed | NORMALIZED RELATIONAL | CURRENT RECORD ONLY | Presentations intended recipient; not automatic member | Keep admission origin; retry does not duplicate grant |
| PresentationScreen | E | Each screen confirmation freezes that definition; later edits create new draft | HYBRID | BOUNDED REVISION / SNAPSHOT | Presentations; parent authority validated | Current draft excluded at new meeting start; old meeting snapshot unaffected |
| VisualOverride set | E | Included in confirmed screen and start snapshot | JSONB / STRUCTURED DOCUMENT VALUE | BOUNDED REVISION / SNAPSHOT | Screen-local; cannot write canonical graph | One current value per target/property; copied frozen definition retains prior settings |
| ScenarioOverlayConnection | E | Included in confirmed screen/start definition | HYBRID | BOUNDED REVISION / SNAPSHOT | PresentationScreen ownership; separate identity from canonical edges | Old confirmed/start definitions preserve prior hypothetical connection |
| PresentationScreenKnowledgeReference | E | Confirmed definition fixes selected authorized representation/references | HYBRID | BOUNDED REVISION / SNAPSHOT | Presentation scope; never private read-through | Unshared future private content never follows inclusion; inaccessible content omitted/rejected until authorized |
| Meeting | A | Start/end content snapshots immutable; schedule/status envelope mutable by lifecycle | HYBRID | CURRENT RECORD ONLY | Meetings; one presentation and owner | Cannot switch presentation/graph after start; archive not capture rewrite |
| MeetingParticipant | A | Principal/meeting binding fixed; current availability/permissions mutable | NORMALIZED RELATIONAL | CURRENT RECORD ONLY | Meetings; private checkpoint separately filtered | Retain attribution; participation never owns User |
| MeetingInvitation | A | Binding not reusable for a different actor/scope | NORMALIZED RELATIONAL | CURRENT RECORD ONLY | Meetings intended recipient | Retry reuses intended admission; invitation validity not perpetual authority |
| MeetingSharedState | E | Final state included at End Meeting | HYBRID | BOUNDED REVISION / SNAPSHOT | Meeting-shared; private views excluded | Current value plus final capture, no per-frame history |
| ParticipantPrivateState | A | None; meeting lifecycle limits commands, content persists independently | JSONB / STRUCTURED DOCUMENT VALUE | CURRENT RECORD ONLY | Actor-only, never ordinary participant serialization | Return to Live uses NOW; no private trajectory history |
| PresenterTransferRequest | A | No history; cleared/staled on resolution/end | HYBRID | CURRENT RECORD ONLY | Only relevant actors/authority receive necessary request state | One pending maximum; stale acceptance cannot resurrect control |
| SharedMeetingItem | E | Each published representation immutable from creation | HYBRID | IMMUTABLE PUBLICATION | Meeting-visible bounded payload; private origin access separate | Frozen/accepted refs pin publication AND revision; newer revision never overwrites prior content |
| MeetingPresentationSnapshot | C | Creation at successful Start Meeting | JSONB / STRUCTURED DOCUMENT VALUE | IMMUTABLE PUBLICATION | Meeting audience gets authorized content only | No floating screen/body/latest pointers; graph topology stays referenced |
| FrozenMeetingCapture | C | Creation at successful End Meeting | JSONB / STRUCTURED DOCUMENT VALUE | IMMUTABLE PUBLICATION | Eligible shared/session content only | Review cannot overwrite it; no private notebook/audio transcript |
| MeetingReview | D | Successful Save to Project acceptance | HYBRID | CURRENT RECORD ONLY | Outcomes; owner reviews and accepts | Failure keeps mutable draft; success seals accepted reviewed basis |
| MeetingReviewItem | D | Successful Save to Project | HYBRID | IMMUTABLE ACCEPTED RECORD | Outcomes; private source fields excluded | Primary capture anchor fixed; acceptance seals assessment separately from original |
| Decision | B | Successful Save to Project | HYBRID | IMMUTABLE ACCEPTED RECORD | Outcomes project knowledge after acceptance | No accepted decision editing workflow introduced; never a mutable KnowledgeItem duplicate |
| ActionItem | E | Save freezes accepted task definition, responsibility-at-acceptance and context | HYBRID | IMMUTABLE ACCEPTED RECORD | Outcomes; one accepted responsible ActorRef; assignment grants no access | Accepted manifest pins initial definition; current status cannot rewrite acceptance. No new tracking UI/reassignment workflow |
| MeetingOutcome accepted manifest | C | Creation at successful Save to Project | JSONB / STRUCTURED DOCUMENT VALUE | IMMUTABLE ACCEPTED RECORD | Outcomes; approved project visibility | Pins accepted decisions/actions/assessments/capture; status projection may later differ without rewriting receipt |
| ReviewOutcomeLink | D | Successful Save to Project | NORMALIZED RELATIONAL | IMMUTABLE ACCEPTED RECORD | Outcomes / review | Accepted link provenance remains fixed; no outcome body copies |
| CapturedSemanticScope | E | Containing snapshot/publication/screen/acceptance freeze | HYBRID | BOUNDED REVISION / SNAPSHOT | Containing owner visibility; refs are not grants | Pin graph and screen/capture revisions, internal/boundary roles |
| OwnerPresentationReturnCheckpoint | A | None; final capture may include relevant public state only | JSONB / STRUCTURED DOCUMENT VALUE | CURRENT RECORD ONLY | Owner-specific navigation, not shared personal notebook | Different from participant Return to Live; not general camera history |
| ImmutablePublicationContent | C | Creation per publication revision | JSONB / STRUCTURED DOCUMENT VALUE | IMMUTABLE PUBLICATION | Published subset only; no secrets/private history | Retain referenced old representation or captured copy; never replace bytes under a revision |
| AI grounding metadata / accepted AI provenance | D | Containing accepted/frozen result | JSONB / STRUCTURED DOCUMENT VALUE | BOUNDED REVISION / SNAPSHOT | Filtered to recipient/context; no raw private prompt warehouse | Pin exact referenced source/capture revision; later model output not substitute |
| Bounded scenario understanding | E | Scenario understanding acceptance pins input for generated screen definition; later draft changes require reconfirmation | JSONB / STRUCTURED DOCUMENT VALUE | BOUNDED REVISION / SNAPSHOT | Presentation preparation access | Understanding confirmation is not screen confirmation or meeting start |
| Source locator metadata | C | Creation with SourceReference | JSONB / STRUCTURED DOCUMENT VALUE | IMMUTABLE ACCEPTED RECORD | Source permission remains separate | External live URL may be unavailable; never silently resolve to unrelated latest content |
| Structured snapshot payload | C | Snapshot creation | JSONB / STRUCTURED DOCUMENT VALUE | IMMUTABLE PUBLICATION | Snapshot creator-private unless explicit publication | No video/camera stream; saved semantic state persists unchanged |
| Home / ProjectMembership / readiness / counts | F | Not applicable | NOT STORED | NO REVISION HISTORY | Permission-filter before projection | Failed/draft saves cannot appear as accepted outcomes |
| InteractionContext / runtime input / AI preview | F | Not applicable as runtime object | NOT STORED | NO REVISION HISTORY | Actor/mode-filtered runtime; destination owns saved result | Re-resolve permissions; never treat client preview/mode as authority |
| MySpaceItem private wrapper | A | Underlying publication/capture rules apply, not wrapper mutation | JSONB / STRUCTURED DOCUMENT VALUE | CURRENT RECORD ONLY | Underlying creator ActorRef only | Changing private wrapper cannot move/delete shared publications or captured content |

# SECTION 13 — BLOCKERS FOR PASS 2

**No blocking persistence/consistency questions remain for Pass 2.**

Pass 2 can define transactional boundaries, idempotency, optimistic concurrency, Home projection consistency and detailed authorization checks using the six freeze boundaries and stable reference rules above. It must preserve the same candidate graph identities, explicit screen/publication revision intent, owner acceptance and private-content isolation.

Physical revision decomposition, exact JSONB layout, scalar types, foreign-key syntax, retention durations, legal redaction procedures and artifact/credential provider details remain later design tasks. This pass does not silently choose them or authorize implementation. Storage classification is a reviewable conceptual contract; protected privacy and frozen meaning remain mandatory regardless of physical choices.

Verification scope: one document; 13 requested sections; six major freeze boundaries; 57 storage classifications (21 normalized, 20 hybrid, 13 owned JSONB/document values, three not stored). All 38 persistent candidates are covered, with ArchitectureVersion explicitly renamed conceptually to ArchitectureGraph. No new table inventory, product journey, API, WebSocket contract or Unity behavior is created. No application code, schemas, migrations, dependency files or existing design documents are modified.

