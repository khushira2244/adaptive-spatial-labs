# SECTION A — EXECUTIVE DECISION

Backend Step 0B.1, 2026-10-23. Persistence classification proposal only. The reconciled [Step 0A](backend-step0a-domain-interaction-architecture.md), especially its nine resolved V1 decisions, is the architecture authority. Latest Group 1–6 specs remain the product references; older audio, architecture-evolution, draft-sharing and authority alternatives are superseded by Step 0A. No product decisions are reopened.

Propose **30 authoritative domain/child tables: 12 source-of-truth roots and 18 child tables**, plus **8 likely explicit association tables**, approximately **38 persistent tables total**, including existing storage—not 38 new tables. These are logical table candidates, not SQL, finalized cardinalities, columns, formats, foreign keys or indexes. Eleven already exist in the Group 1 schema and are retained. Physical consolidation may be considered in later design only if the stated ownership/recovery requirements remain satisfied; minimizing count is not the goal.

The original 42 Step 0A concepts map to 32 table candidates and ten embedded/derived/deferred concepts. Six additional persistence needs—existing editor assignments and staged uploads, scoped guest access, integration credentials, screen knowledge associations and review outcome associations—bring the inventory to 38. Runtime context, modes, gestures, AI packages/proposals and unapplied previews do not become domain tables. Captured semantic context and approved AI results persist under their domain owners. My Space is a protected logical collection of owner-private content, not another notebook-content database.

Home activity/counts, readiness, contextual counts, membership views and category pages are projections. V1 can compute them from committed records without projection tables. Canonical evolution/diffs, meeting recording/transcripts, presenter queues, simultaneous presenters, a separate My Shared Things product and full task/history products remain deferred. The complete classification register has 82 concepts, each with one primary A–G classification. It includes the 42 Step 0A objects plus application concepts and material storage/derived/deferred distinctions, not 82 new features.

Scope register: [Group 1 backend](group1-backend-spec.txt); [Group 2](group2-product-design-spec.md); [Group 3](group3-correction-editor-spec.md); [Group 4 entry](group4-stage1-entry-and-open-spec.md), [setup](group4-stage2-presentation-setup-spec.md), [lasso](group4-stage3-lasso-selection-spec.md), [discussion](group4-stage4-discussion-preparation-spec.md), [builder/bridge](group4-presentation-builder-and-meeting-bridge-spec.md); [Group 5 and hand addendum](group5-live-meeting-spec.md); [Group 6](group6-meeting-review-and-outcomes-spec.md); [discussion notes](product-design-discussion-notes.md). Existing backend schema was inspected read-only to avoid duplicating Group 1 structures. No existing schema is altered by this document.

# SECTION B — COMPLETE CLASSIFICATION TABLE

Classification legend: **A SOURCE-OF-TRUTH TABLE**, **B CHILD TABLE**, **C JOIN / ASSOCIATION TABLE**, **D DURABLE VALUE / EMBEDDED RECORD**, **E TRANSIENT APPLICATION OBJECT**, **F DERIVED READ PROJECTION**, **G DEFERRED / NOT V1**. A/B/C propose distinct storage identities; D persists only under another owner. F can be recomputed without independent truth; G means no new V1 storage. “Stable ID” describes reference needs, not a column design; owner-scoped identity can suffice. Audience and mutability are noted explicitly below; historical reference needs are distinguished from live-only state.

| Concept | Classification | Owning Module | Stable ID Needed? | Durable? | Why |
| --- | --- | --- | --- | --- | --- |
| 01 User | A | Identity | Yes; account reference | Yes | Mutable account lifecycle; referenced across domains, sensitive identity kept permission-filtered |
| 02 Organization | A | Identity | Yes | Yes | Existing independent organizational scope; not another project-access grant |
| 03 OrganizationMember | C | Identity | Stable association identity | Yes | Existing mutable user/organization relationship and role; distinct from project permissions |
| 04 AuthSession | B | Identity | Yes; secure session reference | Yes | Existing server-side expiry/rotation/revocation survives restart; secret, not public history |
| 05 UserPreference | B | Identity | Owner identity suffices | Yes | Existing private mutable preferences survive sessions; no new root lifecycle |
| 06 Project | A | Projects | Yes | Yes | Owner-held project lifecycle, root for architecture and reviewed knowledge; existing storage |
| 07 ProjectMembership | F | Projects | Existing project/user identities | Derived | Logical owner/editor view from Project and editor assignments; no redundant membership table |
| 08 ProjectInvitation | G | Projects | No new V1 identity | No V1 addition | Not an approved project-invitation feature; scoped invitations are elsewhere |
| 09 ProjectStructure | B | Projects | Existing stable identity | Yes | Existing project-owned initial structure/configuration, mutable under current rules |
| 10 ProjectLayerDefinition | B | Projects | Yes | Yes | Existing ordered/custom project configuration; not canonical node copies |
| 11 Source | A | Sources | Yes | Yes | Reuses project_sources; independent processing/connection lifecycle and provenance |
| 12 SourceReference | B | Sources | Stable locator identity | Yes | Source-owned frame/section/item provenance must remain resolvable historically; no confirmed-model refresh |
| 13 IngestionRun | B | Sources | Yes; processing attempt | Yes | Restart/retry status and source-to-candidate provenance; not indefinite background retries |
| 14 Architecture | A | Architecture | Yes | Yes | Identity/lifecycle of the project's single confirmed architecture after review |
| 15 ArchitectureVersion | B | Architecture | Yes; stable graph reference | Yes | Internal candidate/confirmation identity and recovery boundary; no exposed V1/V2/V3 evolution |
| 16 ArchitectureNode | B | Architecture | Yes; stable logical node | Yes | Individually corrected candidate component, frozen on confirmation; knowledge/screens reference it |
| 17 ArchitectureConnection | B | Architecture | Yes | Yes | Explicit relationship identity/endpoints/provenance; candidate editable only as approved |
| 18 InnerArchitectureReference | C | Architecture | Stable owned link identity | Yes | Explicit documented parent-node/inner-graph association, never inferred/fabricated on Open |
| 19 CorrectionSession | D | Architecture | Owner-scoped session token may suffice | Yes, under candidate | Bounded autosaved correction/checkpoint state; no standalone editor product/history table required |
| 20 KnowledgeItem | A | Knowledge | Yes | Yes | Private/project note/question/finding/evidence content with provenance; shared via controlled publication |
| 21 KnowledgeContext | C | Knowledge | Stable attachment identity | Yes | Explicit associations support whole/node/edge/group/inner/presentation/meeting attachment; not only node_id |
| 22 Snapshot | A | Knowledge | Yes | Yes | Structured capture has independent references/private sharing/retention needs, not just image bytes |
| 23 MySpace | F | Knowledge private subdomain | No independent container ID | Derived from durable owned items | Logical user-private collection filtered by current context; no new MySpace table or lifetime tied solely to meeting |
| 24 MySpaceItem | D | Knowledge private subdomain | Uses underlying KnowledgeItem/Snapshot ID | Yes, under content owner | Private workspace role/ownership wrapper, not duplicate note content; mutable privately, never public by pointer |
| 25 Presentation | A | Presentations | Yes | Yes | Draft/preparing/confirmed content package and scoped access, same immutable architecture |
| 26 PresentationAccessGrant | C | Presentations | Stable grant identity | Yes | Explicit scoped collaborator/viewer relationship; no project membership escalation |
| 27 PresentationInvitation | B | Presentations | Yes | Yes | Explicit email invitation has pending/accepted/revoked/expired lifecycle, distinct from grant |
| 28 PresentationScreen | B | Presentations | Yes | Yes | Independently selectable draft/confirmed child, autosaves screen-local state and scenario understanding |
| 29 VisualOverride | D | Presentations | Target/property identity in screen suffices | Yes, under screen | Owned deterministic settings; no independent cross-screen truth or effect-history aggregate |
| 30 ScenarioOverlayConnection | B | Presentations | Yes; screen-local overlay identity | Yes | Selectable/removable hypothetical relationship distinct from canonical edge; survives screen reopening |
| 31 Meeting | A | Meetings | Yes | Yes | Owner-held scheduling/live/end lifecycle, stable session and end capture; not a meeting per screen |
| 32 MeetingParticipant | C | Meetings | Stable participant association | Yes | Admission/role relationship to user or guest; private checkpoint has this owner, ephemeral presence not durable truth |
| 33 MeetingInvitation | B | Meetings | Yes | Yes | Known-user/email invitation admission lifecycle, scoped to invited meeting |
| 34 MeetingSharedState | D | Meetings | Meeting identity suffices | Yes, semantic checkpoint only | Current presenter/screen and accepted shared navigation survive restart; no separate state table or per-frame writes |
| 35 ParticipantPrivateState | D | Meetings private state | Participant identity suffices | Yes, minimal checkpoint | Private mode/target and meaningful resume state under participant; excludes raw head/ray/hand state |
| 36 PresenterTransferRequest | D | Meetings | Request token under Meeting | Yes while pending | At most one pending request; restart/stale acceptance protection without queue or historical request table |
| 37 SharedMeetingItem | B | Meetings | Yes; publication identity | Yes | Stable explicit meeting-visible content revision with provenance; later private edits cannot silently change it |
| 38 MeetingReview | A | Outcomes | Yes | Yes | Independently resumable owner review of frozen capture; failure-safe autosaved draft and acceptance boundary |
| 39 MeetingReviewItem | B | Outcomes | Yes; review assessment identity | Yes | Mutable assessment over captured source, not copied original question; confirmed assessment/links retained |
| 40 Decision | A | Outcomes | Yes | Yes | Structured confirmed project outcome referenced beyond review; drafting must not imply acceptance |
| 41 ActionItem | A | Outcomes | Yes | Yes | Structured owner/due-date/status outcome, separately referenced; no Jira clone |
| 42 MeetingOutcome | D | Outcomes | Review acceptance identity suffices | Yes, under MeetingReview | Immutable accepted result manifest references decisions/actions/items; not another content-copy table |
| 43 InteractionContext | E | Application composition / domains | Transient context token only | No as runtime object | Re-resolved selection/permission package; captured semantic scope persists under actual owners |
| 44 WorkspaceMode | E | Application / Unity navigation | No independent identity | No independent record | Runtime action-policy discriminator; checkpoint can store its value without a modes table |
| 45 AIContextPackage | E | AI orchestration | Task correlation only | No full-package domain store | Permission-filtered input assembled for task; owner stores grounding refs when meaningful result accepted |
| 46 AIResponse / AIProposal | E | AI orchestration | Proposal token for approval | No independent truth record | Draft answer/operation proposal; recovery-worthy draft result persists under destination owner, not universal AI truth table |
| 47 Home activity/project summary | F | Projects read projection | Project identity | Recomputable | Derived from accepted project/domain records; V1 query, no independent authoritative counters |
| 48 Domain events | E | Owning domain / application integration | Correlation/processing identity | No domain event ledger | Internal announcements, not event sourcing; delivery bookkeeping choice deferred |
| 49 Transient hand tracking state | E | Unity interaction | No domain ID | No | Runtime gesture tracking, no server-restart or historical requirement |
| 50 Ray targeting state | E | Unity interaction | No domain ID | No | Runtime targeting/hit path, not selected durable context |
| 51 Head-gaze state | E | Unity interaction | No domain ID | No | Soft targeting only; no persisted intent or consequential action |
| 52 Hover / pressed feedback | E | Unity UI | No | No | Immediate local feedback, not domain state |
| 53 Temporary lasso path geometry | E | Unity selection | No independent ID | No | Raw gesture path discarded after selection; durable scope keeps semantic refs and optional boundary description |
| 54 Unapplied AI visual preview | E | Presentation runtime | Preview token only | No as active preview | Discardable render; accepted operations or meaningful proposal draft persist under PresentationScreen |
| 55 Temporary local spatial/camera transforms | E | Unity viewing | No independent ID | No raw transforms | Comfort/inspection pose is not canonical position; semantic checkpoint separately owned if needed |
| 56 ProjectEditorAssignment | C | Projects | Existing stable assignment | Yes | Existing project_editors remains authoritative; no duplicate ProjectMembership table |
| 57 PresentationScreenKnowledgeReference | C | Presentations | Stable owned association | Yes | Explicit Add to Discussion/content inclusion/order, preserving Knowledge ownership and source context |
| 58 ReviewOutcomeLink | C | Outcomes | Stable association identity | Yes | Durable provenance links assessments to decisions/actions without copying outcome text everywhere |
| 59 FrozenMeetingCapture | D | Meetings | Meeting capture identity suffices | Yes, immutable after end | Eligible shared/session items and structured context retained separately from editable review; no audio transcript |
| 60 MeetingPresentationSnapshot | D | Meetings | Meeting-owned snapshot identity | Yes | Confirmed screen content/state fixed at meeting start, not just live pointers into editable authoring |
| 61 ScopedGuestAccess | B | Identity | Yes; restricted principal/session | Yes for invited access lifetime | Minimal guest identity/session binding reused by scoped grants/invitations, not enterprise guest management |
| 62 IntegrationCredential | B | Sources | Yes; private integration binding | Yes, secret | Connector credential lifecycle distinct from source/public metadata; no new generic integration product |
| 63 StagedUpload | B | Sources | Existing stable upload identity | Yes, temporary lifetime | Existing staged_uploads needed before atomic project attachment; bytes remain outside PostgreSQL |
| 64 CapturedSemanticScope | D | Capturing domain | Owner/target identities | Yes under save/attach owner | Selected nodes/internal edges/crossing refs/external endpoint identities and stable architecture context |
| 65 OwnerPresentationReturnCheckpoint | D | Meetings | Meeting/owner scope | Yes, meaningful checkpoint | Owner's prior meaningful screen/focus/depth checkpoint, not unbounded handoff history or personal Return to Live |
| 66 ImmutablePublicationContent | D | Meetings | SharedMeetingItem/revision identity | Yes, bounded stable value | Intended content/context at explicit share/update; legal publication snapshot, not a live private-content mirror |
| 67 AvailableActions | F | Domain policy composition | Target/actor identities | Recomputed | Mode/phase/role/lifecycle/capability intersection; cached menu never grants authority |
| 68 PresentationReadiness | F | Presentations | Presentation identity | Recomputed | Main Architecture plus confirmed screen state; drafts excluded, no readiness truth table |
| 69 MeetingContext category counts | F | Meetings read projection | Meeting/category identities | Recomputed | Counts accessible shared publications/prepared context, not participants' private items |
| 70 LatestActivity | F | Projects read projection | Project identity | Recomputed | Latest accepted activity rather than a competing write source |
| 71 DecisionCount | F | Outcomes / Projects read projection | Project/review identity | Recomputed | Accepted Decision records only, not AI suggestions |
| 72 OpenActionCount | F | Outcomes / Projects read projection | Project/review identity | Recomputed | Accepted ActionItem status, not duplicated manual counter |
| 73 UnresolvedCount | F | Outcomes / Projects read projection | Project/review identity | Recomputed | Accepted review assessments, respecting explicit Deferred/Not Discussed distinction |
| 74 ReviewCategoryPage | F | Outcomes read projection | Review/category/page identity | Recomputed | Bounded spatial pages/counts from durable assessments; no page-content tables |
| 75 Architecture evolution / V2/V3 migration | G | Architecture future | Not V1 | No V1 addition | One immutable confirmed architecture per project; changed architecture requires another project |
| 76 Architecture diff/comparison | G | Architecture future | Not V1 | No | No confirmed-version evolution or comparison workflow |
| 77 Continuous meeting recording/transcript | G | Not a V1 subsystem | Not V1 | No | Voice only intentional input; summaries use captured structured items |
| 78 Full Jira-like task/ticket system | G | Future integrations/outcomes | Not V1 | No additional tracker storage | V1 ActionItem remains structured ownership/due date, no issue-tracker product |
| 79 Group 7 visualization-specific history storage | G | Future history/readiness | Not V1 | No new visualization store | Existing references/outcomes remain durable; no spatial history scenes/materializations designed now |
| 80 Universal presenter queue | G | Not a V1 feature | No | No | Only one pending request; no queue/scheduling aggregate |
| 81 Simultaneous presenters | G | Not a V1 feature | No | No | Sole active presenter, owner retains authority |
| 82 My Shared Things feature | G | Not a V1 feature | No | No | Publications appear directly in relevant Meeting Context categories |

# SECTION C — PROPOSED PERSISTENT TABLE INVENTORY

Thirty A/B domain table candidates, listed below; eight C association candidates are listed separately in D and must not be added again when totaling. Table labels for new concepts are logical names, not schema identifiers. **Existing** labels name current Group 1 storage only. Every new entry is a recommendation for later design, not a migration or implementation. AI/orchestration has no independent domain-truth table.

## Identity — five A/B candidates

1. **TABLE:** User (A, existing users). **PURPOSE:** authenticated user identity. **OWNER:** Identity. **WHY IT NEEDS ITS OWN TABLE:** stable account referenced across product activities. **WHY IT CANNOT JUST BE EMBEDDED:** embedding in Projects/Meetings would split authentication truth and expose sensitive account data.
2. **TABLE:** Organization (A, existing organizations). **PURPOSE:** organizational identity. **OWNER:** Identity. **WHY IT NEEDS ITS OWN TABLE:** organization lifecycle outlives any particular project. **WHY IT CANNOT JUST BE EMBEDDED:** duplicate organization data per user/project would diverge.
3. **TABLE:** AuthSession (B, existing refresh_sessions). **PURPOSE:** persisted session rotation/revocation. **OWNER:** Identity. **WHY IT NEEDS ITS OWN TABLE:** separately invalidatable secure session records. **WHY IT CANNOT JUST BE EMBEDDED:** placing sessions into each domain owner would duplicate account authentication/recovery concerns.
4. **TABLE:** UserPreference (B, existing user_preferences). **PURPOSE:** private persisted settings. **OWNER:** Identity. **WHY IT NEEDS ITS OWN TABLE:** already-established separately owned user settings boundary. **WHY IT CANNOT JUST BE EMBEDDED:** retaining current storage avoids an unrequested account-schema refactor; embedding is technically possible but is not the V1 recommendation.
5. **TABLE:** ScopedGuestAccess (B, proposed). **PURPOSE:** minimal restricted guest principal/session binding. **OWNER:** Identity. **WHY IT NEEDS ITS OWN TABLE:** invited actor requires durable identity for admission, provenance and permitted temporary presenting. **WHY IT CANNOT JUST BE EMBEDDED:** scattering guest sessions across invitations/publications would duplicate identity checks and lose a consistent restricted principal. No ordinary User/project member is created automatically.

## Projects — three A/B candidates

6. **TABLE:** Project (A, existing projects). **PURPOSE:** owner-held project lifecycle. **OWNER:** Projects. **WHY IT NEEDS ITS OWN TABLE:** cross-domain project identity and archive authority. **WHY IT CANNOT JUST BE EMBEDDED:** architecture/presentation/meeting records cannot independently redefine the project owner.
7. **TABLE:** ProjectStructure (B, existing project_structures). **PURPOSE:** configured initial structure. **OWNER:** Projects. **WHY IT NEEDS ITS OWN TABLE:** current explicit structure identity and storage. **WHY IT CANNOT JUST BE EMBEDDED:** retain existing behavior instead of moving data for table-count reduction; embedding is not inherently impossible.
8. **TABLE:** ProjectLayerDefinition (B, existing project_layers). **PURPOSE:** independently ordered/custom layer definitions. **OWNER:** Projects. **WHY IT NEEDS ITS OWN TABLE:** existing selectable/editable layer records. **WHY IT CANNOT JUST BE EMBEDDED:** replacing these with duplicate template blobs would discard established identity/order semantics and require an unauthorized refactor.

## Sources — five A/B candidates

9. **TABLE:** Source (A, existing project_sources). **PURPOSE:** attached artifact/board identity and processing status. **OWNER:** Sources. **WHY IT NEEDS ITS OWN TABLE:** referenced provenance/processing lifecycle. **WHY IT CANNOT JUST BE EMBEDDED:** sources support graph and evidence consumers independently of one importer or presentation.
10. **TABLE:** SourceReference (B, proposed). **PURPOSE:** stable origin locator in a source artifact. **OWNER:** Sources. **WHY IT NEEDS ITS OWN TABLE:** distinct references recur across nodes, evidence, screens and reviews. **WHY IT CANNOT JUST BE EMBEDDED:** copying locators into all consumers causes provenance drift and loses a single resolvable origin. Source-revision identity is not canonical architecture evolution.
11. **TABLE:** IngestionRun (B, proposed). **PURPOSE:** bounded processing/retry attempt. **OWNER:** Sources. **WHY IT NEEDS ITS OWN TABLE:** persisted progress/result association must survive restart and distinguish attempts. **WHY IT CANNOT JUST BE EMBEDDED:** one Source status cannot alone identify which attempt produced a candidate or failed without replacing previous provenance.
12. **TABLE:** IntegrationCredential (B, proposed). **PURPOSE:** secret connector authentication binding. **OWNER:** Sources. **WHY IT NEEDS ITS OWN TABLE:** credential lifecycle/access is distinct from imported project data. **WHY IT CANNOT JUST BE EMBEDDED:** ordinary source metadata is read as project context; secrets must not follow that path. Cryptographic storage/provider choices are later design, not specified here.
13. **TABLE:** StagedUpload (B, existing staged_uploads). **PURPOSE:** recoverable pre-project file attachment. **OWNER:** Sources. **WHY IT NEEDS ITS OWN TABLE:** upload staging identity exists before final project creation. **WHY IT CANNOT JUST BE EMBEDDED:** the final Project may not yet exist, and bytes are outside PostgreSQL. Preserve existing staging lifecycle.

## Architecture — four A/B candidates

14. **TABLE:** Architecture (A, proposed). **PURPOSE:** single project model identity. **OWNER:** Architecture. **WHY IT NEEDS ITS OWN TABLE:** review/confirmation lifecycle and cross-domain identity. **WHY IT CANNOT JUST BE EMBEDDED:** keeping graph lifecycle independent avoids expanding Project into a model service/blob and gives clear ownership.
15. **TABLE:** ArchitectureVersion (B, proposed internal graph record). **PURPOSE:** candidate/review state plus stable accepted graph reference. **OWNER:** Architecture. **WHY IT NEEDS ITS OWN TABLE:** graph content needs a recoverable candidate boundary and immutable confirmed reference reused by other domains. **WHY IT CANNOT JUST BE EMBEDDED:** embedding mutable graph identity only into Project/Presentation confuses acceptance and revisions. Do not create a new version record for every hand move; exact revision mechanics are later. No user-visible version-switching/evolution workflow.
16. **TABLE:** ArchitectureNode (B, proposed). **PURPOSE:** structured component identity. **OWNER:** Architecture. **WHY IT NEEDS ITS OWN TABLE:** selection, corrections, attachments and stable references target individual nodes. **WHY IT CANNOT JUST BE EMBEDDED:** per-screen component copies cannot preserve one canonical identity and independent contextual references.
17. **TABLE:** ArchitectureConnection (B, proposed). **PURPOSE:** structured canonical/candidate relationship. **OWNER:** Architecture. **WHY IT NEEDS ITS OWN TABLE:** independently selectable relationship with context/evidence and controlled candidate creation/deletion. **WHY IT CANNOT JUST BE EMBEDDED:** hiding relationships inside nodes or visual paths conflates topology with rendering and duplicates identity.

## Knowledge — two A/B candidates

18. **TABLE:** KnowledgeItem (A, proposed). **PURPOSE:** content/provenance for notes, questions, findings and evidence assertions. **OWNER:** Knowledge. **WHY IT NEEDS ITS OWN TABLE:** authored content is referenced in many activities and has visibility independent of view layout. **WHY IT CANNOT JUST BE EMBEDDED:** copies in every presentation/meeting erase source identity and privacy ownership. Private MySpaceItem text lives here, not in another content table.
19. **TABLE:** Snapshot (A, proposed). **PURPOSE:** structured architecture/screen/context capture. **OWNER:** Knowledge. **WHY IT NEEDS ITS OWN TABLE:** snapshot can be privately revisited, explicitly shared and later referenced as evidence. **WHY IT CANNOT JUST BE EMBEDDED:** a text-only note or rendered image cannot own the structured historical state consistently. Optional image bytes remain in artifact storage.

## Presentations — four A/B candidates

20. **TABLE:** Presentation (A, proposed). **PURPOSE:** draft/created presentation package. **OWNER:** Presentations. **WHY IT NEEDS ITS OWN TABLE:** own identity, collaborators and saved screens survive multiple activities. **WHY IT CANNOT JUST BE EMBEDDED:** putting it into Architecture would couple editable presentation preparation to immutable truth.
21. **TABLE:** PresentationInvitation (B, proposed). **PURPOSE:** explicit pending email invitation. **OWNER:** Presentations. **WHY IT NEEDS ITS OWN TABLE:** invitation can exist without an accepted access grant or ordinary account. **WHY IT CANNOT JUST BE EMBEDDED:** a grant alone cannot represent pending/declined/expired invitation history or recipient binding.
22. **TABLE:** PresentationScreen (B, proposed). **PURPOSE:** saved screen scope, scenario and visual state. **OWNER:** Presentations. **WHY IT NEEDS ITS OWN TABLE:** independently selected and confirmed/draft screen identity and autosave. **WHY IT CANNOT JUST BE EMBEDDED:** recreating it only inside a live meeting would lose reusable authoring state and separate confirmations.
23. **TABLE:** ScenarioOverlayConnection (B, proposed). **PURPOSE:** hypothetical screen-local relationship. **OWNER:** Presentations. **WHY IT NEEDS ITS OWN TABLE:** distinct selectable/resettable overlay identity and targetability. **WHY IT CANNOT JUST BE EMBEDDED:** unlike simple scalar settings, it is a contextual relationship target; embedding is possible technically but a separate owned child avoids conflation with canonical edges and improves independent references. It remains screen-owned, not global topology.

## Meetings — three A/B candidates

24. **TABLE:** Meeting (A, proposed). **PURPOSE:** scheduled/live/ended session identity and owned checkpoints. **OWNER:** Meetings. **WHY IT NEEDS ITS OWN TABLE:** separate lifecycle from presentation and durable end capture. **WHY IT CANNOT JUST BE EMBEDDED:** a presentation is not a session, and each screen is not a meeting.
25. **TABLE:** MeetingInvitation (B, proposed). **PURPOSE:** attendance invitation/admission lifecycle. **OWNER:** Meetings. **WHY IT NEEDS ITS OWN TABLE:** invited-but-not-admitted recipients must survive restart without fake participation. **WHY IT CANNOT JUST BE EMBEDDED:** a participant record is not a sent invitation, and presentation collaboration is a different scope.
26. **TABLE:** SharedMeetingItem (B, proposed). **PURPOSE:** intentional stable meeting-visible publication. **OWNER:** Meetings. **WHY IT NEEDS ITS OWN TABLE:** own shared identity/content boundary, provenance, explicit updates and later capture references. **WHY IT CANNOT JUST BE EMBEDDED:** a private-item pointer leaks later edits, while a Meeting-wide collection with no item identity makes review provenance/sharing retry ambiguous. No separate My Shared Things screen or module.

## Outcomes — four A/B candidates

27. **TABLE:** MeetingReview (A, proposed). **PURPOSE:** owner-held review workflow and durable accepted manifest. **OWNER:** Outcomes. **WHY IT NEEDS ITS OWN TABLE:** independently resumable draft over fixed session capture. **WHY IT CANNOT JUST BE EMBEDDED:** Meeting's ended/live truth and review's editable classification are different owners; do not rewrite capture to store edits.
28. **TABLE:** MeetingReviewItem (B, proposed). **PURPOSE:** typed assessment/provenance over captured question/finding/note/point. **OWNER:** Outcomes. **WHY IT NEEDS ITS OWN TABLE:** category pages and specific-item review need distinct recoverable assessments. **WHY IT CANNOT JUST BE EMBEDDED:** assessment is not an update to original KnowledgeItem or publication, and must remain independently linkable to decisions/actions.
29. **TABLE:** Decision (A, proposed). **PURPOSE:** reviewed structured project decision. **OWNER:** Outcomes. **WHY IT NEEDS ITS OWN TABLE:** stable outcome identity is referenced beyond one review page. **WHY IT CANNOT JUST BE EMBEDDED:** a summary paragraph or copied question label cannot own confirmation/provenance and contextual links. Draft Decision is not accepted truth until owner publication.
30. **TABLE:** ActionItem (A, proposed). **PURPOSE:** reviewed structured action with responsibility/due date. **OWNER:** Outcomes. **WHY IT NEEDS ITS OWN TABLE:** independent actionable reference/state distinct from prose notes. **WHY IT CANNOT JUST BE EMBEDDED:** burying actions in a summary loses explicit ownership and linked question/decision context. No full tracker or external ticket feature is added.

# SECTION D — ASSOCIATION / JOIN TABLE INVENTORY

Eight candidate association tables. These are explicit durable relationships, without prescribing cardinality, column shape, physical polymorphism or foreign-key rules. Existing table names describe current implementation only.

| Association concept | Owner | Why explicit relationship storage is justified | Not an additional duplicate |
| --- | --- | --- | --- |
| OrganizationMember | Identity | Existing organization membership/role relation persists independently of screen | Reuse organization_members |
| ProjectEditorAssignment | Projects | Existing editor grant, actor/context remain authoritative | Reuse project_editors; owner still authoritative on Project, no owner duplicate |
| InnerArchitectureReference | Architecture | Provenance-aware parent node to real documented child structure | Store relationship, not another top-level project architecture or fabricated child |
| KnowledgeContext | Knowledge | Knowledge attaches explicitly to whole/node/connection/group/inner/presentation/meeting context | Attachment association holds an owned semantic context value; not universal interaction logging |
| PresentationAccessGrant | Presentations | Accepted collaboration/view scope must differ from pending invitation and project grants | No ProjectMembership creation |
| PresentationScreenKnowledgeReference | Presentations | Explicit selected discussion/source knowledge references and inclusion meaning | Original note/document remains owned by Knowledge/Sources |
| MeetingParticipant | Meetings | Attendee/admitted user or guest relation needs durable scope and private checkpoint owner | Not a screen-to-meeting relation and not project membership |
| ReviewOutcomeLink | Outcomes | Link assessments to accepted/draft decisions/actions and provenance without copying content | No repeated Decision/ActionItem body under each question |

Meeting ↔ SharedMeetingItem already has child ownership, so no second meeting_shared_item_refs association candidate is added. A review references captured publications through its owned items/context; it does not need a generic duplicate join for every navigable link. Screen nodes/edges and boundary context are owned semantic scope references, not automatically separate association tables in this classification pass. Whether an owned collection later needs finer relational structure is for the subsequent design, not decided here.

# SECTION E — EMBEDDED / OWNED VALUES

Twelve D concepts are durable under named owners, not independent table/root recommendations. Stable operation tokens or reference sets can exist without independent object/table lifecycles. This section chooses ownership only, not a storage format.

1. **OWNER:** Architecture candidate/ArchitectureVersion. **VALUE:** CorrectionSession meaningful edit/recovery checkpoint and bounded reversible command state. **WHY NO INDEPENDENT ID/LIFECYCLE IS NEEDED:** session token belongs to the candidate being corrected; it cannot outlive/reopen canonical confirmation. Persist meaningful recoverable commands/positions, not every grab sample or full event-sourced editor log. Exact Undo recovery granularity is later design.
2. **OWNER:** private KnowledgeItem or Snapshot. **VALUE:** MySpaceItem ownership/type/private workspace context. **WHY NO INDEPENDENT ID/LIFECYCLE IS NEEDED:** underlying item already has a stable identity and content lifecycle; another MySpaceItem content table duplicates it. Snapshot-type private entry refers to Snapshot identity, not another stored snapshot body.
3. **OWNER:** PresentationScreen. **VALUE:** VisualOverride set and active-screen deterministic settings. **WHY NO INDEPENDENT ID/LIFECYCLE IS NEEDED:** target/property ownership is screen-local; no standalone visual-effect aggregate or canonical writes.
4. **OWNER:** Meeting. **VALUE:** MeetingSharedState semantic checkpoint. **WHY NO INDEPENDENT ID/LIFECYCLE IS NEEDED:** session already owns authoritative presenter/current screen/committed shared navigation. Freeze at end; no per-frame transform persistence.
5. **OWNER:** MeetingParticipant. **VALUE:** ParticipantPrivateState meaningful following/private-mode, target and exploration-return checkpoint. **WHY NO INDEPENDENT ID/LIFECYCLE IS NEEDED:** private participant relation already owns it; private reads/writes remain actor-only, never bundled into shared participant projections. Return to Live reads current shared state rather than an old saved screen.
6. **OWNER:** Meeting. **VALUE:** PresenterTransferRequest pending recipient/token/current-state preconditions. **WHY NO INDEPENDENT ID/LIFECYCLE IS NEEDED:** V1 permits only one pending request. Store/clear/stale it under the meeting; do not create queue/audit-history tables or restore an accepted request after restart. Authority recovery falls back to owner when a temporary presenter disconnects.
7. **OWNER:** MeetingReview. **VALUE:** MeetingOutcome accepted result manifest and accepted summary. **WHY NO INDEPENDENT ID/LIFECYCLE IS NEEDED:** review acceptance identity plus immutable manifest suffices to reference saved outcomes; decisions/actions remain their own records. Mutable review draft is separate from this accepted value.
8. **OWNER:** Meeting. **VALUE:** FrozenMeetingCapture. **WHY NO INDEPENDENT ID/LIFECYCLE IS NEEDED:** eligible shared session capture is an end-of-session value owned by that meeting. It has a stable capture reference but not a separate user workflow/root. Freeze content/provenance; no transcript or unshared private content.
9. **OWNER:** Meeting. **VALUE:** MeetingPresentationSnapshot. **WHY NO INDEPENDENT ID/LIFECYCLE IS NEEDED:** session pins confirmed screen state available at start. Store a bounded immutable semantic definition or equivalent immutable revision references so later Builder edits cannot change it; referencing mutable authoring state alone is insufficient. No canonical graph copy.
10. **OWNER:** KnowledgeContext attachment, Snapshot, PresentationScreen, SharedMeetingItem or review context as appropriate. **VALUE:** CapturedSemanticScope. **WHY NO INDEPENDENT ID/LIFECYCLE IS NEEDED:** exact selection has meaning under its capturing owner: selected nodes/internal edges, incoming/outgoing crossing refs and external endpoint identities. Same semantic contract across tools; no global selections/interaction_contexts truth table or automatic connected-graph expansion.
11. **OWNER:** Meeting. **VALUE:** OwnerPresentationReturnCheckpoint. **WHY NO INDEPENDENT ID/LIFECYCLE IS NEEDED:** owner's saved meaningful presentation navigation belongs to the bounded handoff/session; no nested presenter-history product. This differs from every participant's personal exploration checkpoint.
12. **OWNER:** SharedMeetingItem. **VALUE:** ImmutablePublicationContent. **WHY NO INDEPENDENT ID/LIFECYCLE IS NEEDED:** publication already provides durable identity. Capture intentionally shared content/context and provenance as a stable owned value or reference to equivalently protected immutable content; later private edits cannot change it. Explicit update may replace the current publication representation only while preserving capture/accepted references; revision representation is a later pass, not a full private edit-history store.

Additional properties of these owners—scenario understanding drafts, purpose, selected comments, accepted review summaries, schedule, source artifact locators and command acceptance metadata—do not become extra conceptual tables by default. They are not extra counted D concepts in the register. File bytes live outside PostgreSQL; durable owner records reference artifacts. Approved AI-derived text/operations can persist under a screen/review/item even though the generic runtime proposal is transient.

# SECTION F — TRANSIENT OBJECTS

Twelve E concepts from the register. Transience of a runtime object does not permit losing meaningful drafts; preserve its accepted or recovery-worthy semantic result under the destination owner.

| Runtime concept | Why transient | What replaces it durably when appropriate |
| --- | --- | --- |
| InteractionContext | Actor/mode/selection/permissions resolved for one operation; no universal context lifecycle | Owned semantic scope on knowledge attachment, snapshot, screen, shared publication or review context |
| WorkspaceMode | UI/application action-policy state, not domain identity | Minimal mode value in an existing recovery checkpoint where meaningful; never a standalone table |
| AIContextPackage | Filtered task input assembled from existing truth; retaining every package leaks/duplicates documents | Bounded provenance/input references and meaningful destination draft, not another copy of all source data |
| AIResponse / AIProposal | Unaccepted output is neither architecture truth nor a published decision | Saved personal finding, screen's scenario/operation draft, applied overrides or review draft; provenance follows result |
| Domain events | Announcements, not an authoritative domain ledger | Accepted owner records are truth; any later durable delivery bookkeeping is technical reliability, not event sourcing |
| Transient hand tracking | Continuous client sampling | Explicit semantic command/result only |
| Ray targeting | Continuous local hit-test state | Selected identity only if deliberately saved/attached/shared |
| Head-gaze state | Soft visual assist only | No automatic persisted command; a pinch action may later save a domain result |
| Hover/pressed feedback | Immediate UI response | Nothing; successful semantic operation already has owner record |
| Temporary lasso path geometry | Raw motion is not durable topology or selection authority | Captured scope refs and optional meaningful boundary description, not raw per-frame path |
| Unapplied visual preview | Temporary render of proposed deterministic operations | Recoverable screen draft may retain the proposal/meaningful instruction; only explicit Apply stores applied override state |
| Temporary local spatial/camera transforms | Per-frame inspection/recenter tracking | Owner's compact semantic view checkpoint only if required for meaningful resume; no raw camera stream |

AI proposal approval may need a correlation token and verifiable current-proposal representation across transient execution. That does not require a universal persistent proposal table: the domain's autosaved draft can preserve a bounded proposal and approval preconditions. Restart can regenerate/revalidate transient UI without silently applying changes. Temporary mic input buffers are runtime input, not a continuous recording/transcript domain; deliberately dictated saved text is KnowledgeItem or owner draft content. Do not create audio storage merely because keyboard/voice input exists.

# SECTION G — DERIVED PROJECTIONS

Eleven F concepts. Recommend ordinary authorized queries for V1. A later read cache/materialization can improve measured query costs but must be rebuildable from the listed truth, never a second authoritative domain table. No projection table is included in the 38-table estimate.

| Projection | Persistent sources / owner | Design choice |
| --- | --- | --- |
| ProjectMembership | Project owner plus existing ProjectEditorAssignment and applicable organization access | Logical authorization view; actual grants remain their current owners |
| MySpace | Owner-private KnowledgeItem/Snapshot content and context/publication refs | Virtual collection; author-private result filtering, no per-meeting-only container lifetime |
| Home activity/project summary | Projects plus committed architecture/presentation/meeting/outcome activity | Authorized lightweight query; no new Home navigation/redesign |
| AvailableActions | Actor grants, mode/phase, lifecycle/target capabilities | Recomputed on read and revalidated at invocation; never stored permission truth |
| PresentationReadiness | Main Architecture and current confirmed screen states; drafts distinguished | Query predicate; meeting pins the eligible state only at start |
| MeetingContext category counts | Meeting-visible publications and explicitly approved prepared context | Filter before counting; no private-item leakage |
| LatestActivity | Actual committed domain activity and accepted outcome | Query/rebuild from source; failed Save cannot mark completed |
| DecisionCount | Accepted Decision records selected by committed review acceptance | No counting draft AI decisions as confirmed |
| OpenActionCount | Accepted ActionItem status within authorized project context | No hand-maintained authoritative count |
| UnresolvedCount | Accepted review assessments and their explicit status | Keep UNRESOLVED distinct from DEFERRED/NOT_DISCUSSED; counts follow actual category definition |
| ReviewCategoryPage | Durable review items/outcome links, permitted evidence | Spatial page/read result, not stored pages or long-scroll artifacts |

Counts are projections of domain truth, not an event-sourced counter ledger. Decisions/actions autosaved as drafts do not count as accepted project outcomes. Read optimization consistency and update delivery belong to later passes; successful acceptance must support truthful updated Home feedback without inventing an authoritative Home summary object.

# SECTION H — DEFERRED / NOT V1

Nine G concepts in the register:

1. **ProjectInvitation:** new project-wide invitation product/storage is not introduced; existing project editor storage and scoped presentation/meeting invitations suffice.
2. **Architecture V2/V3 evolution/migration:** no new post-confirmation versions, refresh migration or presentation migration. Candidate recovery records do not expose this product workflow.
3. **Architecture diff/comparison:** no canonical version comparison storage/features.
4. **Continuous recording/full transcript/audio store:** not a V1 meeting subsystem. Intentional voice input does not authorize it.
5. **Full Jira-like action/ticket system:** do not add ticket boards/workflows/external ticket entities; accepted V1 ActionItem remains in scope.
6. **Group 7 visualization-specific storage:** preserve existing version/context/outcome records for future history, but no new history-view scenes, replay datasets or specialized spatial timeline persistence.
7. **Universal presenter queue:** no queue or standalone backlog table; one pending request is an owned value.
8. **Simultaneous presenters:** no joint-authority state/storage; one active presenter.
9. **My Shared Things feature:** no new dashboard/container/table; SharedMeetingItem appears directly under relevant meeting categories.

This classification does not add distributed services, event sourcing or an arbitrary AI geometry engine. Those were never V1 requirements; they are not separately counted concepts just to inflate the deferred count.

# SECTION I — DUPLICATION / OWNERSHIP RISKS

1. **RISK:** ArchitectureNode versus presentation screen component copy. **CORRECT OWNER:** Architecture for canonical node; Presentations for visual state. **HOW TO AVOID DUPLICATION:** screen references same stable graph and stores scoped overrides only. A semantic 3D depiction does not create a second component.
2. **RISK:** ArchitectureVersion treated as user-visible evolution. **CORRECT OWNER:** Architecture. **HOW TO AVOID DUPLICATION:** internal candidate/accepted reference boundary, one confirmed architecture per project, no confirmed V2/V3 paths. Do not make a fresh architecture for each screen or lasso.
3. **RISK:** KnowledgeItem versus SharedMeetingItem. **CORRECT OWNER:** Knowledge for authored/private/project source; Meetings for intentional publication. **HOW TO AVOID DUPLICATION:** distinct purpose and explicit source provenance. A stable bounded publication is necessary publication-state persistence, not a competing editable original. Reading a share cannot read all private source fields.
4. **RISK:** MySpaceItem versus a duplicated private note body. **CORRECT OWNER:** private KnowledgeItem/Snapshot. **HOW TO AVOID DUPLICATION:** MySpace is a logical owner-filtered collection; MySpaceItem role/context uses underlying identity. No second note table that must sync on every edit.
5. **RISK:** MeetingReviewItem versus a copied original question. **CORRECT OWNER:** Outcomes for meeting-specific assessment; Knowledge/Meeting publication for original content. **HOW TO AVOID DUPLICATION:** retain source/capture references and assessment content only; frozen original excerpt for provenance is not permission to overwrite original question or status globally.
6. **RISK:** Decision versus KnowledgeItem with an independently mutable copy of decision text. **CORRECT OWNER:** Outcomes. **HOW TO AVOID DUPLICATION:** accepted decisions/actions are first-class outcome truth read through authorized project knowledge views. Do not also mint a new editable KnowledgeItem decision copy; links/read projections suffice.
7. **RISK:** MeetingOutcome duplicates every decision/action/retained note. **CORRECT OWNER:** Outcomes, accepted manifest under MeetingReview. **HOW TO AVOID DUPLICATION:** manifest references accepted structured records and includes accepted summary; it does not own another editable outcome-content dataset.
8. **RISK:** FrozenMeetingCapture replaced by editable review draft. **CORRECT OWNER:** Meetings for frozen shared/session capture; Outcomes for assessments/draft. **HOW TO AVOID DUPLICATION:** keep capture immutable and review separate, referencing capture. Human edits do not rewrite what was intentionally captured.
9. **RISK:** MeetingSharedState versus participant view checkpoint. **CORRECT OWNER:** Meetings shared authority versus actor-private participant value. **HOW TO AVOID DUPLICATION:** only current presenter/owner authorized commands update shared state; private selected node/recenter never becomes shared navigation. Return to Live fetches current shared state.
10. **RISK:** Home counters versus domain decisions/actions/review acceptance. **CORRECT OWNER:** source domains. **HOW TO AVOID DUPLICATION:** derive counts/latest activity, exclude drafts/failures and do not allow client-written summary truth.
11. **RISK:** ProjectMembership duplicates existing project owner/editor grants. **CORRECT OWNER:** Projects. **HOW TO AVOID DUPLICATION:** logical view of current records; preserve owner and editor distinctions and existing authorization. Scoped guests/collaborators never insert a project membership automatically.
12. **RISK:** CapturedSemanticScope interpreted as universal interaction history. **CORRECT OWNER:** each saving domain. **HOW TO AVOID DUPLICATION:** semantic references only, including internal/boundary roles; no raw ray/gaze/path capture or automatic recursive traversal. No new architecture or duplicate docs.
13. **RISK:** Meeting starts with live references to mutable PresentationScreen drafts. **CORRECT OWNER:** Presentations for authoring; Meetings for start-time content view. **HOW TO AVOID DUPLICATION:** meeting-owned confirmed-state snapshot/reference protects historical screen definition without duplicating canonical graph. Draft screens never enter it.
14. **RISK:** Evidence/SourceReference/raw document copies under every screen/review. **CORRECT OWNER:** Sources artifact and locator; Knowledge evidence association; consumers own authorized references. **HOW TO AVOID DUPLICATION:** keep byte artifacts outside PostgreSQL and reference stable origins; unavailable/revoked material cannot be substituted with unauthorized current content.

# SECTION J — AMBIGUOUS CASES AND RECOMMENDATIONS

These are classification alternatives resolved by this proposal, not reopened product questions. They recommend persistence ownership only; exact cardinalities and physical representation are next.

**OBJECT:** ArchitectureVersion. **OPTION A:** embed candidate/confirmed graph state entirely in Architecture. **OPTION B:** persistent owned graph record with stable identity. **RECOMMENDATION:** B, child table. **WHY:** candidate recovery and immutable graph references need an explicit boundary; confirmed evolution is still deferred. Do not append a record per hand move or expose a version selector.

**OBJECT:** ProjectMembership. **OPTION A:** another membership table. **OPTION B:** logical read/authorization view of Project owner and existing editor assignments. **RECOMMENDATION:** B, projection. **WHY:** no new independent grant lifecycle justifies duplicating current storage. Existing project_editors association remains physical truth.

**OBJECT:** KnowledgeContext. **OPTION A:** embed all attachments only inside a note. **OPTION B:** explicit knowledge-to-context association storage whose semantic target value is owned by the attachment. **RECOMMENDATION:** B, primary classification C. **WHY:** contextual selection/retrieval across different target kinds needs identifiable attachment relationships. The context value is D under its owner; no independent global contexts pool is added. Reuse the semantic contract, not a single runtime interaction table. Exact decomposition remains later.

**OBJECT:** MySpace. **OPTION A:** separate container table and copied item records. **OPTION B:** owner-private collection over durable KnowledgeItem/Snapshot with MySpaceItem context as owned value. **RECOMMENDATION:** B, MySpace F and wrapper D. **WHY:** approved privacy/persistence does not demand an independent container lifecycle, collaborative ACL or meeting-only notebook. Items survive exit/session end without a container table.

**OBJECT:** Snapshot. **OPTION A:** note-only attachment with image. **OPTION B:** own persistent structured Snapshot record. **RECOMMENDATION:** B, source-of-truth table. **WHY:** selection/screen/scenario/provenance state can be revisited independently and published as an intentional snapshot. Optional image artifact is not the identity or full content.

**OBJECT:** MeetingSharedState. **OPTION A:** separate table/root for live state. **OPTION B:** durable semantic value under Meeting, with motion/transport state transient. **RECOMMENDATION:** B. **WHY:** one owner/lifecycle and restart recovery without duplicating meeting authority. Persist accepted screen/presenter/navigation checkpoints, not every frame.

**OBJECT:** ParticipantPrivateState. **OPTION A:** all transient, or a standalone private-state root. **OPTION B:** minimal durable actor-private checkpoint under MeetingParticipant plus transient render/gesture state. **RECOMMENDATION:** B. **WHY:** resume meaningful exploration without inventing a transform history or losing privacy. Durable notes/snapshots stay Knowledge-owned. Return to Live is current presenter state, not checkpoint replay.

**OBJECT:** PresenterTransferRequest. **OPTION A:** transient process memory only or separate requests/queue table. **OPTION B:** short-lived durable value under Meeting. **RECOMMENDATION:** B. **WHY:** preserves single pending identity across restart while rejecting stale acceptance and owner take-back races; no request-history/queue product. Runtime connected presence remains transient; accepted authority and fallback are durable semantic results.

**OBJECT:** SharedMeetingItem. **OPTION A:** live pointer to MySpaceItem. **OPTION B:** persistent owned publication record with stable intended content/provenance. **RECOMMENDATION:** B, child table. **WHY:** private edits must not change visible meeting content. A bounded publication value or equivalent immutable source revision is necessary; no unrelated private fields/history cross the boundary. Explicit re-share/update changes published content intentionally, not by synchronization.

**OBJECT:** MeetingReviewItem. **OPTION A:** mutate originals or store an opaque entire summary only. **OPTION B:** child assessments referencing frozen captured items. **RECOMMENDATION:** B. **WHY:** question statuses, findings assessments, related decisions/actions and paginated item detail must survive failure independently of original authored content. MeetingQuestion/MeetingFinding are type-specific review views, not additional table requirements.

**OBJECT:** MeetingOutcome. **OPTION A:** separate accepted-outcome table duplicating review summary and results. **OPTION B:** immutable acceptance manifest/value in MeetingReview with references to accepted records. **RECOMMENDATION:** B. **WHY:** independent acceptance identity can be owner-scoped; no separate lifecycle exists in approved V1 beyond review Save. Failed Save retains draft; success publishes accepted manifest and structured records without duplicate actions.

**OBJECT:** Home projection. **OPTION A:** authoritative summary/counter records. **OPTION B:** query-derived summary, optionally rebuildable read cache later. **RECOMMENDATION:** B, projection without V1 table. **WHY:** accepted source-domain outcomes already define activity/counts. Cache is optional optimization, not domain truth.

**OBJECT:** Frozen capture / review / accepted result. **OPTION A:** one mutable meeting-summary blob for everything. **OPTION B:** frozen Meetings-owned capture value, independent Outcomes-owned MeetingReview identity/draft and accepted manifest. **RECOMMENDATION:** B. **WHY:** freeze what was captured without freezing review edits or publishing AI automatically. Decision/ActionItem have separate stable identities; capture/outcome do not need new root tables just to preserve these stages.

**OBJECT:** ScopedGuestAccess. **OPTION A:** ordinary project member or duplicate guest details per publication. **OPTION B:** minimal guest principal/session record used by scoped admission/grants. **RECOMMENDATION:** B, Identity-owned child table. **WHY:** accountable sharing/presentation provenance and reconnect need stable restricted identity. No project authority or enterprise guest-management complexity.

**OBJECT:** AI recovery / delivery bookkeeping. **OPTION A:** treat every proposal/event as a new domain table. **OPTION B:** preserve meaningful destination draft and accepted owner records, with runtime task/event objects transient. **RECOMMENDATION:** B for this domain classification. **WHY:** autosave and publication need domain truth, not a prompt warehouse/event store. If later reliability requires an outbox or job ledger, classify that explicitly as technical storage then; it is neither promised here nor included in 38 domain/association candidates.

# SECTION K — TABLE COUNT SUMMARY

The classification table is the counting register. Each of its 82 rows has exactly one primary classification. Embedded scope/publication values can occur under multiple owner records without increasing the table count.

| Category | Count | Interpretation |
| --- | ---: | --- |
| Definite source-of-truth table candidates (A) | 12 | User, Organization, Project, Source, Architecture, KnowledgeItem, Snapshot, Presentation, Meeting, MeetingReview, Decision, ActionItem |
| Definite child-table candidates (B) | 18 | Recoverable owner-bound records, including existing preferences/sessions/staging and proposed guest/credential records |
| Likely join/association table candidates (C) | 8 | Section D inventory; not counted again as A/B |
| Embedded/value concepts (D) | 12 | Section E, no separate table candidates |
| Transient concepts (E) | 12 | Section F; meaningful results captured by domain owners when appropriate |
| Derived projections (F) | 11 | Section G; no V1 projection tables proposed |
| Deferred/not-V1 concepts (G) | 9 | Section H |
| Total classified concepts | 82 | Original 42 plus 40 explicitly assessed application/related concepts |
| Proposed persistent table candidates A+B+C | 38 | Approximately 30 domain/child plus eight association tables |

Module inventory reconciliation:

| Module | A | B | C | Total persistent candidates |
| --- | ---: | ---: | ---: | ---: |
| Identity | 2 | 3 | 1 | 6 |
| Projects | 1 | 2 | 1 | 4 |
| Sources | 1 | 4 | 0 | 5 |
| Architecture | 1 | 3 | 1 | 5 |
| Knowledge | 2 | 0 | 1 | 3 |
| Presentations | 1 | 3 | 2 | 6 |
| Meetings | 1 | 2 | 1 | 4 |
| Outcomes | 3 | 1 | 1 | 5 |
| Total | 12 | 18 | 8 | 38 |

Existing physical tables included: users, organizations, organization_members, refresh_sessions, user_preferences, projects, project_editors, project_structures, project_layers, project_sources, staged_uploads — **11 retained**. This leaves **approximately 27 additional logical candidates**, not a migration plan. Original 42 concepts account for A12+B15+C5 = 32 table candidates; the six extra candidates are ScopedGuestAccess, IntegrationCredential, StagedUpload, ProjectEditorAssignment, PresentationScreenKnowledgeReference and ReviewOutcomeLink. This is why neither “42 objects = 42 new tables” nor “82 classifications = 82 tables” is correct.

No new table is selected for CorrectionSession, MySpace, MySpaceItem wrapper, VisualOverride, MeetingSharedState, ParticipantPrivateState, PresenterTransferRequest, MeetingOutcome, frozen capture, start-time presentation snapshot, private owner checkpoint, publication content or generic contexts/AI previews. Their durability requirements are satisfied by explicit owning records/values or underlying content identities.

# SECTION L — BLOCKERS FOR STEP 0B.2 CARDINALITIES

**No blocking persistence-classification questions remain for Step 0B.2.** The alternatives in J have concrete recommendations and do not reopen Step 0A's nine resolved decisions. They are design choices for review, not unapproved product redesign.

Step 0B.2 can now examine object relationships/cardinalities and confirm the logical inventory before any columns, SQL/JSONB/ORM shapes, constraints/indexes, delete behavior, APIs or WebSocket contracts. Preserve one immutable confirmed project architecture, start-time confirmed-only meeting screens, owner authority, private/publication separation, meaningful autosaved drafts and explicit reviewed outcome acceptance. Domain count is a reviewable estimate, not authorization to build or mechanically create every table.

Only this Markdown document was created for Step 0B.1. Existing backend, Unity, migrations, schema/package files and Step 0A were not modified. No database operations, endpoints, WebSocket messages, code generation, provider setup or runtime/device tests were performed.
