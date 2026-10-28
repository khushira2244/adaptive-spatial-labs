# SECTION A — ONE-PAGE EXECUTIVE MODEL

Adaptive Spatial Labs backend Step 0A — domain and interaction architecture. Reconciled with the user's nine resolved V1 decisions, 2026-10-22; not implemented. Product authority: the latest written Group 1–6 specifications plus these explicit decisions, which override earlier alternatives only where stated. This pass preserves the existing Group 1 backend. Historical module sketches, old Group 3 Views planning, old Group 6 proposal/ticket plans and image-only controls do not supersede those specifications. Only this document is updated by this reconciliation.

V1 decision baseline: Project Owner / Architect owns project and meeting, confirms architecture, authors presentation, starts/ends meetings, reviews outcomes and saves to project. They are default presenter; temporary presentation authority grants none of those ownership powers. One project has one immutable confirmed architecture, without V1/V2 evolution or source-refresh migration. My Space publications are stable, explicitly updated meeting-visible references. Voice is intentional product input only: no continuous meeting recording/transcription or inferred full-conversation summary. Lasso preserves primary/internal and boundary-crossing context. Meetings use only Main Architecture plus confirmed screens as available at start. One active presenter and at most one pending transfer; owner take-back and temporary-presenter disconnect fallback are explicit. Restricted guests remain scoped. Meaningful drafts autosave; destructive discard requires confirmation; failed saves stay in review and retries cannot duplicate outcomes.

One deployable application and one PostgreSQL database let a project operation coordinate related domain changes without introducing network services for every feature. Nine logical boundaries own distinct behavior: Identity, Projects, Sources/Ingestion, Architecture, Knowledge/Context, Presentations, Meetings, Outcomes/Meeting Review, and AI/Orchestration. Existing auth/users/organizations/preferences folders can implement Identity; existing project submodules can implement Projects. Logical ownership does not require moving any files now. Personal/My Space behavior is a private subdomain within Knowledge, with its own ownership and access rules, not a global state object. AI is an application capability, not a truth-owning aggregate.

Project → reconstructed architecture candidate → human review/correction → confirmed ArchitectureVersion → Presentation with many screens → Meeting session → human-reviewed outcomes → saved project knowledge. A confirmed version is the architecture source of truth. A reconstruction candidate is not yet truth; Group 3 edits it and returns to Group 2. Only Group 2's explicit confirmation dialog commits acceptance. A presentation screen references a confirmed version and adds its own visual overrides/scenario overlays. It never changes canonical topology, identity or source evidence. A meeting uses the presentation, not one separate meeting for every screen.

Meetings own transient shared navigation, presenter authority and session capture. Each participant independently owns private exploration and My Space; Return to Live joins the current shared state. Intentional sharing exposes a bounded shared reference without exposing or destroying the private original. Ending the session freezes eligible shared context; Outcomes organizes it into a review draft. Human Save to Project publishes reviewed structured decisions, actions and retained knowledge, then Home displays derived activity counts.

Selections become explicit, versioned InteractionContexts. Domain-authorized context resolution supplies Attach, Evidence, Open, Snapshot and AI. Workspace mode constrains legal actions; mode is never proof of permission. AI receives filtered structured context, produces sourced answers or bounded proposals, and cannot write domain truth. A domain revalidates permissions, target versions and the user's accepted proposal before committing a consequential change.

Retain Node.js 22, strict TypeScript, Fastify, PostgreSQL, Drizzle, Zod, Argon2id and Vitest as the existing baseline; no dependency/version change is proposed here. Normal application operations remain client-agnostic REST/JSON, with later WebSocket transport for live state. Transport, storage, authentication primitives and observability are infrastructure. Internal events announce accepted changes; this is not event sourcing. Database shapes, endpoints, wire messages, SDK/provider selection and implementations are intentionally deferred.

# SECTION B — MODULE TABLE

| Module | Owns | Reads From | Can Modify | Must Never Modify |
| --- | --- | --- | --- | --- |
| Identity | Accounts, auth sessions, organizations/member identity, preferences | Its records | Identity/profile/session/organization membership/preferences through existing rules | Project, presentation or meeting permissions merely because a user has a designation |
| Projects | Project lifecycle, owner/editor grants, initial structure/layers, project-level access and derived Home projection | Identity; read-only domain activity summaries | Its project records/grants; authorize atomic Group 1 creation | Architecture topology, source parsing, presentation scenarios, private notebooks |
| Sources / Ingestion | Project source attachments, uploaded artifacts, connector credentials, source revisions/locators, parsing/import jobs | Identity/Projects authorization | Source records/artifacts, credential access, job status and normalized source facts | Accepted architecture or project knowledge based solely on extraction |
| Architecture | Reconstruction candidates, versions, nodes, connections, imported inner references, correction sessions and canonical confirmation | Authorized source facts through a narrow input boundary; Projects/Identity | Its candidate graph; explicit acceptance to confirmed version | Source bytes, presentation overrides, meeting state, private/project notes |
| Knowledge / Context | Contextual notes/questions/findings/evidence, contextual snapshots, separately protected My Space, attachment resolution | Architecture/Sources authorized read facades; supplied presentation/meeting scopes | Owned knowledge/context/snapshot/private records and approved publications | Canonical topology, presenter state, saved screens, outcomes acceptance |
| Presentations | Draft setup, scoped collaborators/invitations, screen definitions/revisions, visual overrides and scenario overlays | Confirmed ArchitectureVersion; authorized Knowledge/Source references | Presentation and screen-local data and reference lists | Canonical nodes/connections, meeting host/participants, private originals |
| Meetings | Meeting scheduling/access, participants/guests, host/presenter, handoff requests, shared navigation, separate participant-private view, shared item envelopes and frozen end capture | Presentation snapshot; authorized Architecture/Knowledge projections | Its session/access/shared/private-view records; explicit bounded shared-reference envelopes | Saved presentation content, architecture, users' private notebook contents or final project outcomes |
| Outcomes / Meeting Review | Review draft over frozen capture, question/finding assessments, decisions, actions, outcome acceptance | Frozen Meeting capture and authorized context; source knowledge revisions | Its review/decision/action/outcome records; request bounded Knowledge retention through its owner | Live session, original notes/private items, canonical architecture or presentation screens |
| AI / Orchestration (application capability) | Task orchestration, permission-filtered package assembly, provider adapters, proposal provenance/expiry | Domain-provided authorized context only | Transient/generated proposals and task results; restricted task bookkeeping | Any domain change directly, permission grants, automatic publication, arbitrary visual geometry |

Nine boundaries are sufficient. Do not create independent proposals, actions, realtime, each note category, each hand tool or a universal entity module. Decisions/actions remain Outcomes-owned; My Space remains a protected Knowledge subdomain, and meeting-private navigation remains Meetings-owned. Sources owns Miro-style connectors; AI owns approved intentional voice-input/AI adapters, not continuous meeting transcription or project credentials in source metadata. Domain-specific access remains with each owner; shared auth does not become a business-policy god module.

Dependency direction: Identity ← Projects ← Sources/Architecture ← Knowledge ← Presentations ← Meetings ← Outcomes, with higher-level application composition supplying already-authorized context rather than reciprocal domain calls. Architecture consumes normalized source facts; Sources never calls Architecture mutation methods itself. Knowledge resolves architecture/source attachments without importing Meetings or Presentations aggregates: higher domains provide scope descriptors and authorized projections. SharedMeetingItem envelopes belong to Meetings; their author-owned payload references belong to Knowledge. Outcomes commits its records and asks Knowledge to retain approved content; Knowledge does not import Outcomes classes. AI accepts neutral task packages and returns proposals; domain application services invoke it and validate results, avoiding reciprocal domain-service imports. Home derives summaries via projection/event consumers, not dependencies from Projects aggregates into all higher domains.

Source review register (all local product authority, not new external policy verification): [Group 1 backend](group1-backend-spec.txt), [Group 1 frontend foundation](group1-frontend-task1-spec.txt), [Group 2](group2-product-design-spec.md), [Group 3](group3-correction-editor-spec.md), [Group 4 entry](group4-stage1-entry-and-open-spec.md), [setup](group4-stage2-presentation-setup-spec.md), [lasso](group4-stage3-lasso-selection-spec.md), [discussion preparation](group4-stage4-discussion-preparation-spec.md), [builder/bridge](group4-presentation-builder-and-meeting-bridge-spec.md), [Group 5 with hand addendum](group5-live-meeting-spec.md), [Group 6](group6-meeting-review-and-outcomes-spec.md), [consolidated discussions](product-design-discussion-notes.md), [architecture rules](architecture-rules.md), [global input rules](global-spatial-input-rules.md). Image handoff indices and their discrepancy notes inside those specs govern visual interpretation. Group 1 reports establish implementation status, not future domain completion. The existing schema/package manifest and project authorization were inspected read-only to preserve compatibility.

# SECTION C — GLOBAL OBJECT MAP

Containment below means domain ownership, not physical tables. Arrows mean references. V1 has one confirmed architecture per project, with multiple presentations/sessions permitted against that same architecture. A session uses exactly one presentation. ArchitectureVersion denotes a stable confirmed reference and pre-confirmation candidate revision tracking, not a V1 architecture-evolution workflow. Inner imported graphs are documented subordinate structure, not permission to create another top-level confirmed project architecture.

```text
Identity
├── User ── AuthSession / UserPreference
└── Organization ── OrganizationMember → User
    └── Project [Projects]
        ├── ProjectMembership / ProjectInvitation → User or invitation identity
        ├── ProjectStructure ── ProjectLayerDefinition
        ├── Source [Sources] ── SourceReference / IngestionRun
        ├── Architecture [Architecture]
        │   ├── ArchitectureVersion (candidate or confirmed)
        │   │   ├── ArchitectureNode
        │   │   ├── ArchitectureConnection → endpoint node IDs
        │   │   └── InnerArchitectureReference → parent node + child version
        │   └── CorrectionSession → candidate revision
        ├── KnowledgeItem [Knowledge] ── KnowledgeContext → versioned target refs
        ├── Snapshot [Knowledge] → contextual/versioned state refs
        ├── User-owned MySpace [Knowledge private subdomain]
        │   └── MySpaceItem → private content / Snapshot / KnowledgeContext
        ├── Presentation [Presentations] → confirmed ArchitectureVersion
        │   ├── PresentationAccessGrant / PresentationInvitation
        │   └── PresentationScreen
        │       ├── VisualOverride → canonical target refs (no topology writes)
        │       └── ScenarioOverlayConnection → screen-local scenario endpoints
        ├── Meeting [Meetings] → Presentation + prepared screen revisions
        │   ├── MeetingParticipant / MeetingInvitation
        │   ├── MeetingSharedState
        │   ├── ParticipantPrivateState → private MySpace refs
        │   ├── PresenterTransferRequest
        │   └── SharedMeetingItem → intentionally shared Knowledge payload revision
        └── MeetingReview [Outcomes] → frozen Meeting capture
            ├── MeetingReviewItem → question/finding/note/discussion source refs
            ├── Decision
            ├── ActionItem → owner + related decision/question
            └── MeetingOutcome → accepted structured result bundle

InteractionContext = transient/versioned selection value; persisted when captured
AIContextPackage / AIProposal = bounded capability contracts, not truth aggregates
Home activity summary = authorized derived projection, not another source of truth
```

# SECTION D — OBJECT DEFINITIONS

Forty-two conceptual domain objects remain inventoried here; ProjectInvitation is deferred, not an active V1 feature. These are conceptual responsibilities/references, not database columns. Grant/attachment/value objects are counted for a clear review inventory; this does not require 42 tables. ProjectMembership normalizes the existing owner/editor representation rather than demanding a new membership table. ProjectInvitation is a reserved project-scoped concept, not a new Group 1 invitation feature.

1. **OBJECT: User.** PURPOSE: stable authenticated professional identity. OWNER MODULE: Identity. KEY REFERENCES: organization memberships and auth sessions. LIFECYCLE: registered/profile updated/authenticated. IMPORTANT INVARIANTS: normalized email identity, no password hash exposure; designation is not permission.
2. **OBJECT: Organization.** PURPOSE: project/account organizational scope. OWNER MODULE: Identity. KEY REFERENCES: members, Projects reference it. LIFECYCLE: created/maintained. IMPORTANT INVARIANTS: membership does not grant every presentation/meeting privilege.
3. **OBJECT: OrganizationMember.** PURPOSE: connect user to organization. OWNER MODULE: Identity. KEY REFERENCES: User/Organization. LIFECYCLE: membership managed under existing rules. IMPORTANT INVARIANTS: preserve existing OWNER/MEMBER meaning; no inferred project ownership.
4. **OBJECT: AuthSession.** PURPOSE: refresh/access authentication continuity. OWNER MODULE: Identity. KEY REFERENCES: User. LIFECYCLE: issued/rotated/revoked/expired. IMPORTANT INVARIANTS: bearer access remains Unity-compatible; never expose stored credential secrets.
5. **OBJECT: UserPreference.** PURPOSE: per-user UI/comfort preferences. OWNER MODULE: Identity. KEY REFERENCES: User. LIFECYCLE: default/read/update. IMPORTANT INVARIANTS: preferences cannot authorize mutations or override other participants' layouts.
6. **OBJECT: Project.** PURPOSE: root of owned architecture and project knowledge. OWNER MODULE: Projects. KEY REFERENCES: organization/owner; domain children reference project identity. LIFECYCLE: ACTIVE/ARCHIVED. IMPORTANT INVARIANTS: creation is atomic, creator owns it, archive semantics preserve existing Group 1 access rules.
7. **OBJECT: ProjectMembership.** PURPOSE: logical OWNER/EDITOR authorization view. OWNER MODULE: Projects. KEY REFERENCES: project owner and existing editor records/User. LIFECYCLE: owner established/editor granted/revoked. IMPORTANT INVARIANTS: no rewrite of existing grants; ORGANIZATION_OPEN access does not become editor authority.
8. **OBJECT: ProjectInvitation.** PURPOSE: distinguish any future project-access invitation from scoped invitations. OWNER MODULE: Projects. KEY REFERENCES: Project/intended recipient. LIFECYCLE: not introduced in current V1 UX; reserved only if explicitly approved. IMPORTANT INVARIANTS: presentation/meeting invitations cannot mint it implicitly.
9. **OBJECT: ProjectStructure.** PURPOSE: initial organization of project layers. OWNER MODULE: Projects. KEY REFERENCES: Project/template. LIFECYCLE: initialize/update under existing rules. IMPORTANT INVARIANTS: templates never generate confirmed architecture truth.
10. **OBJECT: ProjectLayerDefinition.** PURPOSE: project-defined ordered classification. OWNER MODULE: Projects. KEY REFERENCES: Project/Structure. LIFECYCLE: add/rename/reorder/remove. IMPORTANT INVARIANTS: custom layers remain first-class; no implicit rewrite of confirmed versions from preference/layer changes.
11. **OBJECT: Source.** PURPOSE: attached source material or external board association. OWNER MODULE: Sources. KEY REFERENCES: Project, authorized stored artifact or connector reference. LIFECYCLE: existing PENDING/UPLOADED/CONNECTED/PROCESSING/READY/FAILED. IMPORTANT INVARIANTS: reuse Group 1 attachments; credentials separate; bytes outside PostgreSQL.
12. **OBJECT: SourceReference.** PURPOSE: stable source revision plus frame/section/item/schema locator. OWNER MODULE: Sources. KEY REFERENCES: Source and evidence consumers. LIFECYCLE: discovered/resolved/stale or unavailable. IMPORTANT INVARIANTS: retain origin/revision; never silently substitute new source content for old evidence.
13. **OBJECT: IngestionRun.** PURPOSE: bounded processing/parsing attempt. OWNER MODULE: Sources. KEY REFERENCES: source revisions, result/failure. LIFECYCLE: requested/running/succeeded/failed; explicit retry. IMPORTANT INVARIANTS: no endless retry loop; extracted facts cannot confirm architecture.
14. **OBJECT: Architecture.** PURPOSE: identity of the single project architecture, with pre-confirmation candidate revisions and one immutable confirmed result. OWNER MODULE: Architecture. KEY REFERENCES: Project and candidate/confirmed versions. LIFECYCLE: available after usable reconstruction; version lifecycle below. IMPORTANT INVARIANTS: one confirmed architecture per project in V1; meaningful later architecture changes require another project; no blank-canvas Group 3 entry.
15. **OBJECT: ArchitectureVersion.** PURPOSE: pre-confirmation candidate revision or the one accepted immutable graph reference; no V1/V2/V3 evolution workflow. OWNER MODULE: Architecture. KEY REFERENCES: Architecture/source provenance/nodes/connections. LIFECYCLE: reconstructed/under review/correction/confirmed. IMPORTANT INVARIANTS: confirmed revision immutable; exact accepted revision pinned by screens and capture.
16. **OBJECT: ArchitectureNode.** PURPOSE: structured component in a version. OWNER MODULE: Architecture. KEY REFERENCES: stable logical node identity, version, source refs/type. LIFECYCLE: candidate create/change/remove; frozen on acceptance. IMPORTANT INVARIANTS: rename/move/type retain identity; source-backed imported internals only.
17. **OBJECT: ArchitectureConnection.** PURPOSE: directed canonical/candidate relationship. OWNER MODULE: Architecture. KEY REFERENCES: version, endpoint node identities, evidence. LIFECYCLE: candidate create/delete; frozen on acceptance. IMPORTANT INVARIANTS: endpoints exist in the same valid graph scope; no presentation visual changes to relationship truth.
18. **OBJECT: InnerArchitectureReference.** PURPOSE: explicit parent-node-to-known-child-model link. OWNER MODULE: Architecture. KEY REFERENCES: parent version/node, child ArchitectureVersion, source evidence. LIFECYCLE: imported/validated/resolved/unavailable. IMPORTANT INVARIANTS: child exists and is documented; no containment cycles; child status and permissions are explicit, not AI-generated on Open.
19. **OBJECT: CorrectionSession.** PURPOSE: controlled Group 3 edit interval. OWNER MODULE: Architecture. KEY REFERENCES: candidate/base revision, owner actor, ordered reversible changes and meaningful autosaved work. LIFECYCLE: entered/edited with meaningful autosave/saved back to review/explicitly confirmed discard. IMPORTANT INVARIANTS: candidate only; delete restores incident connections on Undo; Done is not confirmation.
20. **OBJECT: KnowledgeItem.** PURPOSE: note/question/AI finding/evidence/discussion-point content with origin and visibility. OWNER MODULE: Knowledge. KEY REFERENCES: author, KnowledgeContext, optional source/AI provenance. LIFECYCLE: authored/draft/saved/explicitly retained; type-specific assessment separate. IMPORTANT INVARIANTS: one content identity, multiple authorized references; evidence is a claim-to-source link, not a second raw document store.
21. **OBJECT: KnowledgeContext.** PURPOSE: durable semantic attachment/selection target. OWNER MODULE: Knowledge (context value vocabulary shared through small contracts). KEY REFERENCES: architecture/version, node/connection/group/inner refs and optional higher-domain descriptors. LIFECYCLE: resolved/captured/re-resolved or unavailable. IMPORTANT INVARIANTS: group membership explicit; context reference never grants access.
22. **OBJECT: Snapshot.** PURPOSE: structured contextual state capture, optionally with an image artifact. OWNER MODULE: Knowledge. KEY REFERENCES: version, screen/session, selection, scenario state, capture time and evidence. LIFECYCLE: captured privately/explicitly shared/retained. IMPORTANT INVARIANTS: not video; read-only capture never mutates source or model.
23. **OBJECT: MySpace.** PURPOSE: owner-private workspace accessible across activities. OWNER MODULE: Knowledge private subdomain. KEY REFERENCES: User; optional Project/Meeting context. LIFECYCLE: available/personal work persisted/reopened. IMPORTANT INVARIANTS: meeting is an association, not the sole lifetime owner; do not erase it at session end.
24. **OBJECT: MySpaceItem.** PURPOSE: private note/question/finding/snapshot wrapper. OWNER MODULE: Knowledge private subdomain. KEY REFERENCES: owner, content revision/Snapshot, context and explicit publications. LIFECYCLE: private authored/refined; optional publication. IMPORTANT INVARIANTS: original remains owner-private even when a publication exists.
25. **OBJECT: Presentation.** PURPOSE: reusable authored package of screens for a confirmed model. OWNER MODULE: Presentations. KEY REFERENCES: Project/confirmed version/access grants/screens. LIFECYCLE: setup draft/preparing/usable revision. IMPORTANT INVARIANTS: includes Main Architecture; later sessions may reuse a presentation; no silent version retargeting.
26. **OBJECT: PresentationAccessGrant.** PURPOSE: scoped preparation/review/view rights. OWNER MODULE: Presentations. KEY REFERENCES: Presentation/User and minimal collaborator/viewer scope. LIFECYCLE: granted/changed/revoked. IMPORTANT INVARIANTS: not project membership or meeting attendance.
27. **OBJECT: PresentationInvitation.** PURPOSE: explicit add-by-email preparation invitation. OWNER MODULE: Presentations. KEY REFERENCES: recipient/Presentation/intended access. LIFECYCLE: pending/accepted/declined or canceled/expired as later specified. IMPORTANT INVARIANTS: only explicit send; scoped guest identity/session is allowed, never implicit project membership; recipient binding and expiry mechanics belong to Step 0B.
28. **OBJECT: PresentationScreen.** PURPOSE: overview/discussion/success/failure/recovery/custom view. OWNER MODULE: Presentations. KEY REFERENCES: presentation version/scope/knowledge refs/overrides/overlays/order. LIFECYCLE: scenario draft/understanding confirmed/view draft/screen confirmed. IMPORTANT INVARIANTS: scenario form precedes AI-confirmed view; draft is not completed content.
29. **OBJECT: VisualOverride.** PURPOSE: deterministic visual property for a screen target. OWNER MODULE: Presentations. KEY REFERENCES: screen and node/connection/group/screen target. LIFECYCLE: proposed/previewed/applied/reset. IMPORTANT INVARIANTS: bounded properties/values and explicit Apply for AI; no arbitrary geometry or topology.
30. **OBJECT: ScenarioOverlayConnection.** PURPOSE: hypothetical screen-only flow explanation. OWNER MODULE: Presentations. KEY REFERENCES: screen/endpoint node refs, label and visual state. LIFECYCLE: preview/explicit add/change/remove/reset. IMPORTANT INVARIANTS: separate identity namespace and visible scenario provenance; cannot masquerade as canonical relationship.
31. **OBJECT: Meeting.** PURPOSE: scheduled or immediate live use of one prepared presentation. OWNER MODULE: Meetings. KEY REFERENCES: presentation/screen revisions, architecture version, host/attendees. LIFECYCLE: setup/scheduled/live/ended; review progression separately. IMPORTANT INVARIANTS: Start From selects initial screen only; host end requires explicit confirmation.
32. **OBJECT: MeetingParticipant.** PURPOSE: meeting-scoped attendance and capabilities. OWNER MODULE: Meetings. KEY REFERENCES: meeting/User or approved guest principal. LIFECYCLE: invited/admitted/present/left. IMPORTANT INVARIANTS: presence and presenter role are distinct; attendance not project authority.
33. **OBJECT: MeetingInvitation.** PURPOSE: scoped admission for known users or generic email recipients. OWNER MODULE: Meetings. KEY REFERENCES: Meeting/intended recipient. LIFECYCLE: requested/delivered/accepted or declined/canceled/expired; restricted guest identity/session bound to the explicitly invited context, with delivery/security mechanics deferred. IMPORTANT INVARIANTS: cannot auto-grant presentation collaboration or project edit rights.
34. **OBJECT: MeetingSharedState.** PURPOSE: authoritative current screen/presenter navigation/shared selections. OWNER MODULE: Meetings. KEY REFERENCES: meeting, prepared screen revision, shared-item refs. LIFECYCLE: initialized/authorized ordered changes/frozen at end. IMPORTANT INVARIANTS: one current presenter; role and meeting state revalidated on every consequential update.
35. **OBJECT: ParticipantPrivateState.** PURPOSE: per-participant view and exploration cursor. OWNER MODULE: Meetings private-state subdomain. KEY REFERENCES: participant, personal target/view and MySpace. LIFECYCLE: following/private exploration/return to current live state. IMPORTANT INVARIANTS: never broadcast private targets/transforms to others by default.
36. **OBJECT: PresenterTransferRequest.** PURPOSE: consentful transfer of stage control. OWNER MODULE: Meetings. KEY REFERENCES: session/current presenter/initiator/intended receiver and resume checkpoint. LIFECYCLE: pending/accepted/declined/canceled or stale. IMPORTANT INVARIANTS: only intended receiver accepts; host authority unchanged; stale acceptance cannot steal control.
37. **OBJECT: SharedMeetingItem.** PURPOSE: bounded published content/context envelope. OWNER MODULE: Meetings. KEY REFERENCES: source Knowledge/MySpace item revision, author, classification and meeting. LIFECYCLE: explicitly shared/captured/reviewed via reference. IMPORTANT INVARIANTS: private original not moved/deleted or exposed as a live unrestricted object.
38. **OBJECT: MeetingReview.** PURPOSE: review draft over ended-session capture. OWNER MODULE: Outcomes. KEY REFERENCES: meeting/capture version/reviewer and review items. LIFECYCLE: captured/draft/reviewing/ready/save confirmed/saved. IMPORTANT INVARIANTS: immutable capture versus editable assessments; human-approved publication only.
39. **OBJECT: MeetingReviewItem.** PURPOSE: meeting-scoped assessment and linkage of question/finding/note/point. OWNER MODULE: Outcomes. KEY REFERENCES: captured source revision/context plus optional decision/action. LIFECYCLE: suggested/edited/confirmed assessment/retained. IMPORTANT INVARIANTS: MeetingQuestion and MeetingFinding are typed assessments of captured references, not blind copies of originals; NOT_DISCUSSED differs from UNRESOLVED.
40. **OBJECT: Decision.** PURPOSE: human-confirmed outcome with rationale/context/provenance. OWNER MODULE: Outcomes. KEY REFERENCES: review/source discussion, confirmer, versioned context. LIFECYCLE: draft/reviewed/accepted in saved outcome. IMPORTANT INVARIANTS: decision is project knowledge, not an implemented canonical change.
41. **OBJECT: ActionItem.** PURPOSE: structured work with owner/due date/status. OWNER MODULE: Outcomes. KEY REFERENCES: review/question/decision/architecture context and assignee. LIFECYCLE: suggested/edited/confirmed/persisted; later work tracking outside this pass. IMPORTANT INVARIANTS: no automatic ticket creation or full tracker feature.
42. **OBJECT: MeetingOutcome.** PURPOSE: accepted structured project publication manifest. OWNER MODULE: Outcomes. KEY REFERENCES: review/confirmed summary/items/decisions/actions/evidence. LIFECYCLE: prepared/committed; retry returns same acceptance result. IMPORTANT INVARIANTS: all-or-nothing logical acceptance; derived Home counts reflect success only.

# SECTION E — WORKSPACE MODE MATRIX

Nine modes: seven requested spatial/domain modes plus the already-approved Home/project setup and presentation setup states. PRESENTATION_PREP has context-selection, discussion-preparation, scenario-definition, understanding-confirmation and visual-authoring phases; these are not extra modes or new screens. Transport infrastructure never owns mode.

| Mode | Purpose | User Can Change | User Cannot Change | Typical Actions | AI Context |
| --- | --- | --- | --- | --- | --- |
| HOME_PROJECT_SETUP | Existing Group 1 account/project flow and Home | Authorized profile/project settings, local wizard draft, explicit complete project creation | Other users' projects, graph truth from templates | Create Project, source attachment, Open or Continue Review; confirmed card Create Presentation | No speculative graph or required AI in Group 1 |
| ARCHITECTURE_REVIEW | Verify reconstruction | Review markers, contextual knowledge, explicit candidate acceptance | Free topology/connector/layout edits | Open, Connections, Attach, Evidence, AI, Snapshot, Lasso; Edit enters CORRECTION; Confirm opens safeguard | Candidate version, source facts, selected context; confidence distinct from accepted truth |
| CORRECTION | Minor correction of existing reconstructed candidate | Explicit X/Y Move, rename/type/add/delete node, delete/create connection, Undo/Redo | Confirmed graph, free XYZ/endpoint/reverse tools, presentation visuals | Select → correction command; Done → review | Owner-only candidate correction; no new AI menu; intentional voice text support does not authorize extra graph commands |
| ARCHITECTURE_OPEN | Inspect a confirmed model normally | Personal inspection/view/context notes | Canonical topology and review acceptance state | Open real depth, Attach/AI/Evidence/Snapshot, contextual Lasso, My Space | Confirmed version and authorized selected project context |
| PRESENTATION_SETUP | Name/purpose/scoped collaborators | Presentation draft/setup and explicit invitations | Architecture, meeting attendance, implicit project grants | Name, purpose, Add people/email, Back/Continue | Purpose is later context, not auto-generated architecture behavior |
| PRESENTATION_PREP | Select context, prepare discussion and author scenario screens | Presentation refs, scenario drafts, confirmed visual overrides/overlays | Canonical architecture and unshared private context | Lasso/Next, Add to Discussion, Add Screen, Understand/Confirm, Preview/Apply, reset, Meeting setup | Exact phase, selected version/scope, screen scenario, permitted evidence and proposal operations |
| LIVE_MEETING_SHARED | Follow or control shared stage | Current presenter controls transient shared screen/view; authorized shared items/roles | Saved screens, canonical graph, others' private work | Screens, approved context, Raise, pass/request/accept, host take-back/end | Meeting-authorized context only; shared AI explicitly selected |
| LIVE_MEETING_PRIVATE | Personal exploration/My Space during session | Own view/notes/questions/findings/snapshots; explicit share | Shared presenter state, private content of others, saved screen | Inspect real depth, private AI, My Space, Share, Return to Live | Private target plus only accessible meeting context and user's authorized private additions |
| MEETING_REVIEW | Post-meeting human assessment and project retention | Authorized review drafts/classification, decisions/actions, final accepted outcomes | Frozen shared capture, private unshared originals, canonical graph | Category/item pagination, Edit/Confirm, View in Architecture, Save to Project | Frozen eligible capture plus draft assessments; no live mic feed assumed |

V1 mode implications: ARCHITECTURE_REVIEW/CORRECTION consequential architecture work and canonical confirmation are owner-controlled; ARCHITECTURE_OPEN is inspection of the one immutable confirmed model. PRESENTATION_SETUP/PREP autosave meaningful drafts, and meeting setup excludes drafts. LIVE modes separate current-presenter stage navigation from owner meeting authority and personal work; temporary presenter departure returns control to owner. MEETING_REVIEW assessments and Save to Project are owner actions over structured captured items only. No continuous audio/transcript enters any mode. Draft persistence never automatically accepts architecture, confirms a screen, sends an invitation or publishes an outcome.

Client-only mechanics: hover/glow, hand ray/path sampling, poke/grab tracking, field focus/system keyboard, soft gaze feedback, panel collapse, view depth and local Recenter. They are not domain events or database writes. Persist only meaningful semantic results/drafts/checkpoints. Per-frame graph layout, snapping and connector path geometry remain Unity rendering; accepted candidate positions and deterministic scenario settings may be persisted by their owning domain. Recenter does not move canonical nodes. For an active presenter, an explicit shared navigation action may change MeetingSharedState, but a participant's comfort recenter is personal.

# SECTION F — TARGET/ACTION MATRIX

Actions below require actor entitlement, target existence/version, lifecycle and visibility checks. “Read context” means authorized projected content only. Omitted actions are not granted. Rendered menus are small contextual projections, never a universal menu. Actions denied on invocation remain denied even if a stale client displayed them. UI helpers and physical gestures are not backend commands. Same mode can differ by phase, host/presenter status, and participant-following state.

### V1 authority overlay for all target matrices

The Project Owner / Architect owns architecture review/correction/confirmation, presentation creation/editing, meeting creation/start/end, Group 6 review and Save to Project. Preserve existing Group 1 owner/editor records and previously scoped collaborator/viewer grants; those do not automatically grant the owner-only lifecycle acceptance actions. Any already-approved limited collaborator preparation stays inside its explicit presentation grant. No schema/refactor or broader delegated project authority is introduced here.

Exactly one current presenter may navigate shared live state; temporary control never grants ownership, architecture editing or Save to Project. Ordinary participants operate their own private state and intentionally shared meeting content. Guest access is limited to the invited presentation/meeting; eligible guest presentation is explicitly owner-permitted. Current-presenter transfer still requires recipient acceptance. Owner can Take Back at any time. At most one request is pending.

All below actions inherit this overlay even when an earlier row says “authorized” generically. Meaningful correction/setup/preparation/screen/review drafts autosave; Back/exit preserves them, with destructive discard explicitly confirmed. Meeting-ready lists/Start From/navigation include only Main Architecture and confirmed screens as fixed at meeting start. Session authoring cannot silently update that running set. Mic/voice actions are intentional product input only, not ongoing meeting audio capture or transcription.

## NODE

| Workspace Mode | Allowed Actions | Notes |
| --- | --- | --- |
| HOME_PROJECT_SETUP / PRESENTATION_SETUP | None | No graph selection in these forms |
| ARCHITECTURE_REVIEW | Inspect identity, Open known depth, Connections, Attach, AI, Evidence, Snapshot, mark needs confirmation | No structural change; Open absent/unavailable when no documented child |
| CORRECTION | Move, Rename, Change Type, Delete; Add through palette | Explicit Move activation; candidate revision only, deletion warns about incident edges, Undo restores them |
| ARCHITECTURE_OPEN | Inspect, bring forward privately, Open, Connections, Attach, AI, Evidence, Snapshot | Inspection pose not saved canonical position |
| PRESENTATION_PREP | Inspect, read context; authoring phase Visual Settings/AI/Attach/Snapshot/reset | Stage 3/4 select context only, not premature screen styling; overrides active-screen-local |
| LIVE_MEETING_SHARED | Approved inspection/shared navigation by presenter; participant selection enters private exploration | Saved screen/model remains unchanged |
| LIVE_MEETING_PRIVATE | Inspect, Open accessible known depth, related docs, private AI/note/snapshot | No shared movement or topology change |
| MEETING_REVIEW | View in Architecture, inspect referenced version/evidence, return | No correction or presentation authoring |

## CONNECTION

| Workspace Mode | Allowed Actions | Notes |
| --- | --- | --- |
| HOME_PROJECT_SETUP / PRESENTATION_SETUP | None | Not a graph surface |
| ARCHITECTURE_REVIEW | Inspect endpoints/type/label, Evidence, AI, Attach, Needs Correction | A verbal proposed correction is not applied topology |
| CORRECTION | Select/Delete; create through explicit source/destination/confirm | No reverse/reconnect/endpoint editing; valid endpoints checked |
| ARCHITECTURE_OPEN | Inspect related context/AI/evidence/snapshot | Read-only relation truth |
| PRESENTATION_PREP | Inspect scope; authoring visual State/Style/Emphasis/Marker/Visibility/Activity/Label; screen-only overlay add/reset | Canonical edge and scenario overlay have distinct identities/actions |
| LIVE_MEETING_SHARED | Authorized presenter view guidance; participant read/private selection | No edge editing |
| LIVE_MEETING_PRIVATE | Private inspect/AI/attach note/snapshot within meeting access | No canonical or shared writes |
| MEETING_REVIEW | Inspect referenced relationship/source, return | Historical reference not current-version substitution |

## LASSO/GROUP

| Workspace Mode | Allowed Actions | Notes |
| --- | --- | --- |
| HOME_PROJECT_SETUP / PRESENTATION_SETUP | None | No spatial selection tool |
| ARCHITECTURE_REVIEW | Context selection, Attach, AI, Snapshot, relevant Connections, clear | No presentation focus or automatic hiding |
| CORRECTION | No lasso/group mutation feature | Approved correction toolbar is Add/Connector/Undo/Redo/Done |
| ARCHITECTURE_OPEN | Contextual selection/AI/notes/snapshot/clear | Does not create a presentation automatically |
| PRESENTATION_PREP | Stage 3 select/clear/Next scope; Stage 4 refilter context/add references; authoring propose/preview/apply supported visual group settings | No selection defaults WHOLE; selected area preview doesn't edit topology; preserve already-added discussion refs on scope change |
| LIVE_MEETING_SHARED | Consume approved shared focus/selection | No new live lasso tool inferred from generic context model |
| LIVE_MEETING_PRIVATE | Resolve private group context if available, private AI/notes/snapshot | Semantic context supported; no extra lasso button added beyond approved meeting toolbelt |
| MEETING_REVIEW | Inspect captured group context/evidence | No new group-authoring surface |

## DOCUMENT/EVIDENCE

| Workspace Mode | Allowed Actions | Notes |
| --- | --- | --- |
| HOME_PROJECT_SETUP | Explicit attach/remove source via existing Group 1 rules | Source ownership separate from evidence interpretation |
| PRESENTATION_SETUP / CORRECTION | No additional document workflow introduced | Source refs remain intact; do not invent menus |
| ARCHITECTURE_REVIEW / ARCHITECTURE_OPEN | Read contextual source locator/evidence, original where accessible | Permission-filter bytes and locators, not just UI labels |
| PRESENTATION_PREP | Explicit contextual read/link to discussion/screen; return to authoring | Docs can temporarily occupy center in builder, not permanently replace design work |
| LIVE_MEETING_SHARED | Open approved shared docs/evidence; Back → Meeting Context | Participant-local reading never changes shared stage unless explicit authorized shared navigation |
| LIVE_MEETING_PRIVATE | Read only meeting-approved related docs, add personal note/snapshot | Private inspection doesn't broaden source access |
| MEETING_REVIEW | Read linked capture evidence/doc context, Back to item | Shared capture not blanket source permission |

## KNOWLEDGE ITEM

| Workspace Mode | Allowed Actions | Notes |
| --- | --- | --- |
| HOME_PROJECT_SETUP / PRESENTATION_SETUP / CORRECTION | No new knowledge-authoring flow added | Personal workspace entry remains separate |
| ARCHITECTURE_REVIEW / ARCHITECTURE_OPEN | Context Attach/read and authorized note/question/finding save | Explicit visibility; no scenario taxonomy hardcoded |
| PRESENTATION_PREP | Read relevant items, Add to Discussion, create scoped project question, explicitly save/add AI finding | Reference existing item; don't move/copy source or auto-publish private content |
| LIVE_MEETING_SHARED | Read shared context, explicitly raise/share item | Shared edits/deletes only with authority once policy is settled; not universal participant edit |
| LIVE_MEETING_PRIVATE | Own private note/question/finding edit and explicit sharing | No project promotion by private save |
| MEETING_REVIEW | Assess/reclassify review view, link decision/action; confirmed retention | Original author content and review summary retain separate provenance |

## PRESENTATION SCREEN

| Workspace Mode | Allowed Actions | Notes |
| --- | --- | --- |
| HOME_PROJECT_SETUP | Create Presentation on confirmed card; Open architecture remains distinct | No inferred extra Home menu actions |
| ARCHITECTURE_REVIEW / CORRECTION | None | Cannot bypass canonical confirmation |
| ARCHITECTURE_OPEN | Read saved presentations through default right purpose | Not another review lifecycle |
| PRESENTATION_SETUP | Edit draft metadata; Continue | No meeting or scenarios yet |
| PRESENTATION_PREP | Select, scenario definition/understanding confirmation, visual preview/apply, confirm screen, add next, explicit reset | Main Architecture base; version and visibility checked; drafts not implicitly ready |
| LIVE_MEETING_SHARED | Presenter selects prepared screen/transient view | Screen selection changes session pointer, not authoring data |
| LIVE_MEETING_PRIVATE | Inspect accessible screen context privately; Return to Live | Private screen exploration cannot become presenter command |
| MEETING_REVIEW | Inspect captured screen revision through related context | No authoring or live return |

## MY SPACE ITEM

| Workspace Mode | Allowed Actions | Notes |
| --- | --- | --- |
| HOME_PROJECT_SETUP | Existing My Space entry; later personal features not expanded here | Global access does not imply notebook publicness |
| PRESENTATION_SETUP / CORRECTION | No new dedicated notebook UI added | Existing private data preserved |
| ARCHITECTURE_REVIEW / ARCHITECTURE_OPEN / PRESENTATION_PREP | Own private work via approved My Space tool | Stage-specific tool availability still applies |
| LIVE_MEETING_SHARED / LIVE_MEETING_PRIVATE | Own Notes/Questions/AI/Snapshots; edit before explicit Share to Meeting/classify | Retain private original; confirmation on sharing; no dragging required |
| MEETING_REVIEW | Own original remains private; review consumes only published envelope | No bulk harvest of private items; project retention is an explicit review publication |

## MEETING PARTICIPANT

| Workspace Mode | Allowed Actions | Notes |
| --- | --- | --- |
| HOME_PROJECT_SETUP / ARCHITECTURE_REVIEW / CORRECTION / ARCHITECTURE_OPEN / PRESENTATION_SETUP | No live participant control | Presentation collaborators are not attendees |
| PRESENTATION_PREP | Meeting setup explicit add known/email invitees; choose Start From | Minimal scoped admission, not project permission |
| LIVE_MEETING_SHARED / LIVE_MEETING_PRIVATE | Presence, own mic/Raise; authorized initiator requests transfer; intended receiver accepts/declines; host takes back/ends | Role commands allowed from either personal viewing mode only if actor has the authority; being private never grants it |
| MEETING_REVIEW | Owner reviews captured authorship/presence metadata and assigns reviewed actions within authorized context | No live presenter transfer or participant management |

# SECTION G — INTERACTION CONTEXT MODEL

InteractionContext is a small immutable semantic selection descriptor passed between application capabilities, not a universal aggregate containing every domain. It binds actor identity (server-resolved), workspace mode/phase, project boundary, version/revision, target kind and reference set. Optional enclosing presentation/screen, meeting and review-item descriptors narrow interpretation. Visibility audience, provenance links, context revision and parent-return path are explicit metadata; they do not confer rights. Server derives effective permissions independently of client claims.

Scope types: WHOLE_ARCHITECTURE, NODE, CONNECTION, GROUP, INNER_ARCHITECTURE, PRESENTATION_SCREEN, MEETING_SHARED, MEETING_PRIVATE and REVIEW_ITEM. Enclosing session/presentation can accompany a NODE or GROUP without losing the selected target. Candidate contexts name their candidate revision; confirmed contexts name their immutable version. Node and connection references carry graph/version identity, not globally ambiguous naked IDs. Overlay references additionally carry screen/overlay identity. WHOLE is explicit, not an overloaded empty lasso array. An inactive/cleared lasso uses the approved WHOLE default; a zero-result lasso must not silently imply a broader selection than its explicit UI state.

Hover/selection normally stays transient on the client. Attach persists a KnowledgeContext; presentation Next persists scope references; Snapshot persists a capture; My Space save persists owner context; a presenter explicitly changes shared selection through Meetings. Persisted context records selected IDs and version, optional boundary description, selection origin and navigation ancestry, not raw camera images or continuous hand traces.

Lasso path projection, hover hit regions and drawing remain client interaction logic. Server validates submitted identity sets and permissions. The resolved V1 context explicitly separates selected node references, internal connections between selected nodes, incoming/outgoing boundary connections and boundary external endpoint identities. Boundary references remain known/visible without selecting the entire external subsystem. Optional boundary geometry never replaces IDs. All reference the same architecture; nothing is cropped, copied, disconnected or deleted. In presentation/focus contexts internal edges can stay strong, outside architecture de-emphasized and crossing edges lighter/dashed with endpoint labels; those are visual treatments, never canonical relationship semantics. Attach, AI, Evidence, Snapshot and presentation preparation consume this same InteractionContext, preserving primary versus boundary roles. User controls any deeper external expansion.

Examples (conceptual, not public request schemas):

1. **Node:** architect in ARCHITECTURE_REVIEW selects Payment Service in candidate R3. Resolver returns that identity/type/provenance, related visible connection summaries and documented child availability. Open resolves an existing child; AI answers about the candidate without certifying it.
2. **Connection:** same actor selects Payment → Queue in candidate R3. Resolve endpoint identities, direction/type, evidence and attached items. Needs Correction records review intent; it does not reconnect endpoints.
3. **Lasso:** presentation context step selects Payment/Queue/Worker in confirmed V1. Next captures GROUP/selected IDs with V1; Clear returns to explicit WHOLE. No graph copy or node movement is committed.
4. **Screen:** author selects Failure screen S2 revision P7 based on V1. A node visual selection retains S2/P7; an overlay operation targets that screen only. Reset removes overrides, not canonical nodes.
5. **Private exploration:** participant Ravi in meeting M1 privately opens Payment in V1/screen S2. Context contains M1 access audience plus PRIVATE actor identity. Private AI/notes use only Ravi-authorized content. Return to Live reads M1's current shared state, not the stored private starting screen.

Available actions are computed as mode/phase allowlist ∩ actor grants ∩ lifecycle guards ∩ target capabilities ∩ visibility ∩ supported operation vocabulary. Invalid state and missing children produce explicit unavailable/no-content results rather than invented data. Selection resolution is read-only. Re-run guards at change acceptance because context or authority can become stale.

# SECTION H — CONTEXT RESOLUTION

Resolution sequence: authenticate actor → establish project or scoped presentation/meeting entitlement → load exact candidate/confirmed/screen/capture revision → validate selection membership → resolve graph identities/known inner links → query relevant visible attachments/source locators → return a bounded categorized result with provenance and action decisions. Do not load everything and filter after AI processing. Counts and category existence are permission-filtered too.

Notes/questions/findings attach through KnowledgeContext association, not only knowledge.node_id. A knowledge item may have multiple explicit versioned contexts without duplicated content. Evidence associates an assertion/target with SourceReference revision/locator and origin; Docs are retrieved source artifacts or excerpts, not separate knowledge duplicates. Findings retain AI origin, uncertainty and human acceptance separately. Questions retain original authorship; the same question can have different meeting-specific assessments through MeetingReviewItem.

Relevance precedence: exact selected target/explicit group attachment, then overlapping selected members, then explicitly architecture-wide context and source evidence that explains those targets. Return separate labels for direct scope, architecture-wide and boundary context. Do not present weak overlap as exact grounding or inherit all parent/child knowledge implicitly. Deduplicate by item/revision and source locator. Preserve source reference, generation/author origin, version, visibility and matching reason per result. Bounded pagination/excerpts make large models practical without suggesting all content fits in every AI request.

For Payment + Queue + Worker: return their direct questions/notes, evidence supporting internal relations, explicit group attachments and relevant docs tied to those identities. Preserve all accessible incoming/outgoing crossing relationship references and external endpoint identities as labeled BOUNDARY CONTEXT. A Worker → Notification crossing remains contextually known/visible without selecting Notification or sending its entire subsystem. Include architecture-wide notes only when relevant and label them. Exclude others' private notes, unrelated sources, unapproved guest-visible docs and findings. A saved discussion reference outside a changed lasso retains its original context; Stage 4 does not silently delete it. AI can use boundary identities/relationships to understand the subsystem, but must suggest explicit add/open for deeper external context rather than traversing the whole connected architecture automatically.

**Inner architecture:** InnerArchitectureReference binds parent version/node to a real documented child version plus source provenance. Open resolves the child and its status; missing/inaccessible/unavailable are different outcomes. Child confirmation is not inferred from parent confirmation. Parent stays in return context; parent graph is visible as required by Group 4 inspection. Navigation may visit imported levels but may not create unlimited manual nesting. Detect containment cycles; do not confuse a dependency graph cycle with an invalid containment cycle. Existing documented child inspection remains available. The approved minor-correction scope is not expanded into manual nested-architecture authoring; no separate child-version evolution or new child-confirmation UI is introduced. No AI extrapolation may create a child merely to fill the Open action.

**Historical context:** snapshots, review and meeting screen references stay tied to the single confirmed project architecture. A later source cannot refresh/migrate it, switch its canonical version or retarget a presentation in V1; a changed architecture requires another project. Revocation/removal should produce unavailable/redacted context with intact provenance, not a substitute current version or unauthorized cached content. Exact retention/deletion policy is deferred to Step 0B.

# SECTION I — AI CONTRACT

AIContextPackage is an internal conceptual capability contract, not a REST DTO or prompt. It carries a task and user instruction; authenticated actor/audience; project; mode and phase; immutable architecture version or candidate revision; selected target sets including overlay distinction; explicitly permitted boundary context; authorized source excerpts/evidence/knowledge revisions; scenario description and assumptions; pinned presentation/screen state; session shared or actor-private context; frozen review capture when relevant; permitted operation vocabulary and target limits; provenance manifest; and domain revision/authority preconditions. Permissions are computed by domains, not delegated to a model to enforce. Do not include passwords, integration tokens, unrelated private records or raw microphone streams by default.

AIResponse/AIProposal contains answer or interpretation; referenced input/source/evidence identities; fact versus user-specified scenario versus assumption markers; uncertainty/missing-data explanation; and zero or more explicit suggested operations. Each operation identifies target, supported property/value and expected scope/revision. A proposal binds actor/context/input revisions and approval state so Apply cannot accidentally approve a different or regenerated proposal. Unsupported operations produce clarification/refusal, not arbitrary executable commands. Validate citations against supplied authorized material; model-provided URLs or IDs are not trusted retrieval permissions. Source documents may contain instructions; treat those as evidence content, not authority to change tool permissions or application behavior.

Pipeline: domain application service resolves allowed input → AI proposes → schema/domain validation rejects illegal claims/operations → actual preview shows target changes → user confirms the current proposal → owning domain rechecks revision/permissions/lifecycle and commits. Stale proposal requires revalidation/review, not silent rebasing. Transient AI-result bookkeeping may persist for recovery, but it is not canonical/project publication. Preview is disposable screen render state until Apply.

| Capability | INPUT | OUTPUT | HUMAN CONFIRMATION REQUIRED? | DOMAIN THAT COMMITS RESULT |
| --- | --- | --- | --- | --- |
| AskContextAI | Resolved whole/node/edge/group/inner/screen/shared/private scope plus explicit question | Grounded answer, references, uncertainty; optional bounded proposal | Reading answer needs no extra popup; saving/sharing or proposed consequential changes require explicit action | Knowledge for saved finding; Meetings for explicit sharing; relevant domain for an allowed change |
| SuggestDiscussionPoints | Stage 4 scope and relevant permitted questions/notes/evidence | Advisory point candidates and provenance | Explicit Add to Discussion; never auto-insert | Presentations owns reference inclusion; Knowledge retains a deliberately saved finding |
| UnderstandScenario | Scenario name/goal/notes, selected scope and docs | Interpretation distinguishing documented facts/user scenario/assumptions | Yes: Use Draft/Edit is not final Confirm; scenario Confirm precedes generated screen view | Presentations accepts interpretation into the screen draft |
| TranslateVisualCommand | Selected screen/target/group, visual vocabulary, existing overrides and instruction | Deterministic operation list and preview intent | Yes: Preview → Adjust if needed → Apply current proposal | Presentations only; never Architecture |
| SummarizeMeeting | Frozen eligible shared capture, provenance and reviewed corrections | AI-labeled summary draft and support refs | Edit/Regenerate/Confirm; final project publication additionally requires Save to Project | Outcomes owns review summary; Knowledge only through authorized retention |
| ClassifyMeetingOutcomes | Captured questions/points/findings, explicitly recorded discussions/decisions and draft review | Suggested ADDRESSED/UNRESOLVED/DEFERRED/NOT_DISCUSSED and linked outcome candidates | Yes: Project Owner / Architect corrects/confirms classification; no automatic decisions | Outcomes owns assessments/decisions/actions and final acceptance |

Group 2 reconstruction can use bounded source interpretation, but Architecture owns candidate construction and Group 2 human acceptance. Group 3 gains no autonomous AI editor. V1 voice is intentional input only (AI request/explanation, note/question dictation or visual/context instruction). Do not design continuous meeting audio capture, full transcripts or automatic full-conversation summaries. SummarizeMeeting/ClassifyMeetingOutcomes consume only shared questions/notes/findings, explicit decisions/actions, snapshots/evidence and other intentionally captured structured records. No captured structured support means no claim that a verbal discussion happened; the owner reviews uncertainty rather than AI inventing discussion. This supersedes earlier live-mic-participation/media assumptions; a session-wide recording/transcription or conferencing voice subsystem is not introduced.

# SECTION J — STATE MACHINES

Proposed names express domain state, not finalized enums/wire schemas. Keep independent concerns separate rather than one all-purpose lifecycle field.

**ArchitectureVersion / reconstruction:**

```text
source processing --usable result--> RECONSTRUCTED --> UNDER_REVIEW
source processing --failure/no model--> recoverable source/empty state (not confirmed)
UNDER_REVIEW --Edit--> CORRECTION_REQUIRED --> CORRECTING
CORRECTING --Done/save candidate--> UNDER_REVIEW
CORRECTING --Back--> UNDER_REVIEW (meaningful corrections autosaved; discard only if explicitly confirmed)
UNDER_REVIEW --press Confirm Architecture--> confirmation dialog (UI only)
dialog --Cancel--> UNDER_REVIEW
dialog --Confirm + validated accepted revision--> CONFIRMED --> Project Home
```

Opening dialog is not a version mutation. Confirmed is terminal for that version; later work must not reopen it in place. A failed save stays unconfirmed with work preserved. Candidate correction commands use stable node IDs; local preview/undo history is separate from accepted server candidate revisions. Redo is invalidated by a new branch of edits. Future confirmed-version evolution is not enabled by this state diagram.

**V1 confirmed architecture rule:** One project accepts one confirmed architecture. Confirmed graph/identity is immutable for that project. Candidate revisions before acceptance are recovery/concurrency mechanics, not exposed architecture versions. No source-refresh migration, architecture diff, canonical-version switching or presentation migration exists in V1. Future evolution remains explicitly deferred; create another project for a meaningfully changed architecture.

**Presentation:**

```text
eligible confirmed model --> SETUP_DRAFT --Continue--> PREPARING
PREPARING --screen drafts/confirmed screens--> PREPARING
PREPARING --validated usable content--> usable presentation revision
usable revision --> meeting setup/schedule/start (presentation not consumed)
```

Usable readiness is a predicate, not a new Finish Presentation screen. Main Architecture always exists once builder starts. Drafts remain in authoring only and are excluded from meeting content, Start From and live navigation. At meeting start, capture the confirmed presentation state available then: Main Architecture plus confirmed screens. Later authoring never silently changes that session. Opening a presentation or creating a meeting does not confirm architecture again. Meaningful setup/preparation/screen drafts autosave; only explicit screen confirmation marks created content.

**PresentationScreen:**

```text
type selected --> SCENARIO_DRAFT (center form, not generated graph)
SCENARIO_DRAFT --> UNDERSTANDING_PROPOSED --Edit--> SCENARIO_DRAFT
UNDERSTANDING_PROPOSED --Confirm--> VIEW_DRAFT
VIEW_DRAFT --visual proposal--> preview --Adjust--> preview
preview --Apply--> VIEW_DRAFT (screen-local overrides)
VIEW_DRAFT --screen confirmation--> CONFIRMED --> builder created-screen list
```

Main Architecture is a base screen referencing the existing confirmed model, not an AI scenario prerequisite. Created/confirmed scenario revisions edited later become new draft changes; a previously approved revision must not silently change in an active meeting. Presentation-screen confirmation never changes canonical ArchitectureVersion status.

**Meeting and participant view:**

```text
SETUP_DRAFT --confirm later time--> SCHEDULED --start/admit--> LIVE
SETUP_DRAFT --confirm Start Now--> LIVE
LIVE --host End Meeting dialog Cancel--> LIVE
LIVE --host confirms End Meeting--> ENDED + eligible shared capture frozen
ENDED --review starts--> REVIEWING --accepted outcomes saved--> COMPLETED

participant: FOLLOWING_LIVE <--> PRIVATE_EXPLORATION
PRIVATE_EXPLORATION --Return to Live--> CURRENT shared state, not old checkpoint
```

REVIEWING/COMPLETED derive from Outcomes status; Meetings owns live/ended state, Outcomes owns review/saved state. Do not let two modules independently write one shared status. Project Owner / Architect is host and default presenter. Participant leave does not end the session. At most one transfer request is pending: current presenter chooses one recipient → Send Request → recipient Accept/Decline. Only valid acceptance changes the sole active presenter. No queue or simultaneous authority. Owner Take Back is always available and invalidates the pending transfer; temporary presenter disconnect/leave returns control to owner. End invalidates all live requests/commands. Return to Live remains current-state following, not personal-checkpoint restoration. Exact request timeout/storage handling belongs to persistence design, not an unresolved product choice.

**MySpace visibility/publication:**

```text
owner original: PRIVATE --edit--> PRIVATE
explicit Share + classification --> meeting-scoped published reference
aggregate display: PRIVATE --> SHARED_TO_MEETING (publication exists)
original still PRIVATE; personal content not moved or auto-synchronized
accepted Group 6 retention --> PROJECT_VISIBLE outcome/reference where authorized
```

Do not implement this as an ACL switch on the private original. The stable shared version appears directly in the relevant Meeting Context category (Questions, Notes, AI Findings, snapshot/evidence context). There is no permanent My Shared Things UI. Later private edits do not change the meeting-visible version. Only explicit re-share/update publishes another intended version, with provenance to the source item and no private history/unrelated material. Group 6 owner-reviewed retention publishes accepted shared content as structured project knowledge, never the whole private item. Fine-grained storage/deletion mechanics belong to the persistence pass without reopening this stable-publication rule.

**Shared question/item assessment:**

```text
prepared authorized reference OR explicitly raised shared item
--> captured meeting item --> review assessment draft
--> human assessment: ADDRESSED | UNRESOLVED | DEFERRED | NOT_DISCUSSED
--> optional linked Decision / ActionItem (never forced)
--> confirmed retention in MeetingOutcome
```

Pre-review discussion status may be unknown; absence of captured discussion is not proof of NOT_DISCUSSED. Assessment changes remain meeting-scoped and do not rewrite an original question's content or force a single universal status across meetings. Findings also track accepted/rejected/uncertain independently of question resolution; notes can be referenced/discussed or linked to an outcome.

**MeetingReview:**

```text
frozen capture --> DRAFT (AI proposals optional) --> REVIEWING
REVIEWING --human confirms/edit items/summary--> READY_TO_SAVE
READY_TO_SAVE --Save to Project--> confirmation summary (UI only)
Cancel --> READY_TO_SAVE
confirmed Save --> commit reviewed structured outcome --> SAVED --> Home
failed save --> retained review draft, not success/Home
```

READY_TO_SAVE means the Project Owner / Architect has accepted the retained summary/items; it does not require every question to be resolved or manufacture a mandatory review checklist UI. Retry must not duplicate decisions/actions. Regenerate cannot silently overwrite already confirmed manual edits. Meaningful review drafts autosave for recovery; this never replaces the explicit owner Save to Project safeguard. On failed Save remain in review, preserve all work and permit retry without duplicate outcomes/decisions/actions. On successful Save show success and return Home.

# SECTION K — DOMAIN EVENTS

These are high-level internal integration events after successful ownership changes, not WebSocket payload definitions, an append-only truth log or event-sourced reconstruction. Deliver/consume within the monolith with retry-safe semantics; Step 0B chooses consistency and delivery mechanics. Do not put private content in broad event payloads.

| Event | Produced By | Consumers | Why It Exists |
| --- | --- | --- | --- |
| ProjectCreated | Projects | Home projection; source processing orchestration | Real committed project, not wizard-step side effects |
| SourceProcessingCompleted / Failed | Sources | Reconstruction application orchestration; status projection | Bound parsing facts/error state without accepting architecture |
| ArchitectureCandidateRevised | Architecture | Context/proposal invalidation; review continuation | Candidate corrections invalidate stale selections/approvals |
| ArchitectureConfirmed | Architecture | Presentations eligibility; Home projection | Accepted version enables presentation path |
| PresentationCreated | Presentations | Home/project projection | Draft preparation identity, explicitly not completed content |
| PresentationScreenConfirmed | Presentations | Presentation readiness/list projection | Distinguish created revision from drafts |
| MeetingScheduled / MeetingStarted | Meetings | Notifications/delivery adapters if configured; meeting projection | Scheduling/start committed at presentation level |
| PresenterChanged | Meetings | Live authorized view delivery; role projection | Shared stage authority changed without changing host |
| MySpaceItemShared | Meetings application orchestration after Knowledge-authorized publication | Meeting Context; capture index | Meeting-scoped envelope exists; private original remains protected |
| MeetingEnded | Meetings | Outcomes review initializer | Frozen eligible capture becomes review input exactly once |
| DecisionConfirmed / ActionCreated | Outcomes | Approved project-knowledge projections | Issued on final accepted publication, not every AI draft |
| MeetingReviewCompleted | Outcomes | Meeting composite lifecycle; Home/project summary; Knowledge retention projection | Structured acceptance succeeded and Home can show updated activity |

Delivery callbacks never create project grants from a meeting invitation. UI hover, every pinch, ray samples, panel opening and AI token streaming are not global domain events. Shared stage updates use Meetings-owned transient ordering rather than an event per render frame.

# SECTION L — GLOBAL INVARIANTS

Twenty-four core rules reconciled with nine explicit V1 decisions. Section M preserves the historical gap list and records the user-approved resolutions. The following V1 constraints qualify every numbered rule: one immutable confirmed architecture per project; owner-held lifecycle authority; one active presenter/one pending request with owner fallback on temporary-presenter leave; stable explicit shared publications in existing context categories; intentional voice input only; primary plus crossing lasso context without automatic expansion; only start-time confirmed screens in a meeting; scoped guests; meaningful autosave and retry-safe explicit publication.

1. **RULE:** Presentation writes never mutate confirmed architecture. **WHY:** scenario design is explanation, not topology correction. **WHAT BREAKS IF VIOLATED:** a red/hidden database changes company truth for every screen.
2. **RULE:** One project has one immutable confirmed architecture. Presentation/screens/history reference it; no multi-version evolution, source-refresh migration, diffing or canonical switching is included in V1. **WHY:** consistent evidence and identity. **WHAT BREAKS IF VIOLATED:** screens/meetings mix incompatible models after import refresh.
3. **RULE:** Scenario overlays have screen-local identity/provenance and never become canonical edges. **WHY:** hypothetical retry paths must be distinguishable. **WHAT BREAKS IF VIOLATED:** invented relationships are accepted as source-backed fact.
4. **RULE:** My Space is owner-private by default and excluded from broad retrieval/capture. **WHY:** personal reasoning must be safe. **WHAT BREAKS IF VIOLATED:** attendees/AI summaries leak unshared material.
5. **RULE:** Explicit sharing publishes a stable meeting-visible version into its relevant Meeting Context category; private original remains available with its edit history hidden. Later edits do not silently synchronize; an explicit re-share/update is required. **WHY:** sharing one note is not permission for its private history/future edits. **WHAT BREAKS IF VIOLATED:** reference dereferencing exposes the notebook or deletes personal work.
6. **RULE:** Project Owner / Architect retains project/meeting ownership, review and Save to Project authority; temporary presenter role grants none of these or architecture editing. **WHY:** stage handoff does not transfer meeting ownership. **WHAT BREAKS IF VIOLATED:** a temporary presenter can implicitly grant access or end the session.
7. **RULE:** One active presenter and one pending request at most. Pass requires recipient acceptance; owner Take Back is separate and always available. Temporary presenter disconnect/leave returns control to owner, with no presenter queue. **WHY:** avoid accidental/stale control transfers. **WHAT BREAKS IF VIOLATED:** racing accept actions steal stage control.
8. **RULE:** Private exploration never writes shared meeting navigation. **WHY:** participants may research independently. **WHAT BREAKS IF VIOLATED:** another user's private selection moves everybody's stage.
9. **RULE:** AI has no direct consequential domain write authority. **WHY:** user approves a validated proposal, not arbitrary output. **WHAT BREAKS IF VIOLATED:** inferred assumptions become published truth or unwanted visual changes.
10. **RULE:** Project outcomes publication requires human review and successful Save to Project acceptance. **WHY:** drafts/capture are not finalized knowledge. **WHAT BREAKS IF VIOLATED:** auto-generated decisions/actions appear on Home as approved.
11. **RULE:** Inner Open resolves only explicit documented child references. **WHY:** absence of detail is meaningful. **WHAT BREAKS IF VIOLATED:** AI fabricates internals on inspection.
12. **RULE:** Context and provenance remain versioned and access-checked at every use. **WHY:** source evidence and historical captures must be reproducible. **WHAT BREAKS IF VIOLATED:** an old decision opens unrelated current data or unauthorized docs.
13. **RULE:** Home summaries derive from accepted domain state, not client-supplied counters. **WHY:** latest activity must reflect real commits. **WHAT BREAKS IF VIOLATED:** failed saves show completed meetings or wrong outcome counts.
14. **RULE:** Only Group 2 explicit Confirm Architecture dialog acceptance confirms the exact candidate revision; Group 3 Done only returns to review. **WHY:** correction and acceptance are different choices. **WHAT BREAKS IF VIOLATED:** unseen changes are marked confirmed or users are forced into Group 3.
15. **RULE:** Corrections preserve node identity through rename/type/move, constrain position to editing plane, and maintain valid edges. **WHY:** stable context and manageable hand editing. **WHAT BREAKS IF VIOLATED:** connections/notes detach and Undo cannot restore intended graph.
16. **RULE:** Workspace mode restricts behavior but cannot grant authority. **WHY:** clients and proposals can be stale or forged. **WHAT BREAKS IF VIOLATED:** supplying CORRECTION/host mode bypasses owner/editor/role checks.
17. **RULE:** Project, presentation, meeting and organization access scopes are independent. **WHY:** guest attendance/collaboration is narrower than ownership. **WHAT BREAKS IF VIOLATED:** an external invite grants project-wide secrets or editing rights.
18. **RULE:** Lasso captures selected nodes/internal edges plus incoming/outgoing crossing refs and external endpoint identities on the same architecture. It is not a crop, copy, disconnect or automatic expansion to connected subsystems. **WHY:** selection has different uses per mode. **WHAT BREAKS IF VIOLATED:** notes, screens and live views fork into divergent graphs.
19. **RULE:** Group 4 context Next uses WHOLE when no selection or the explicit selected scope, without an extra confirmation popup; Grab is not a prerequisite. **WHY:** preserve the approved low-friction workflow. **WHAT BREAKS IF VIOLATED:** backend readiness invents a scope wizard or demands extra interaction.
20. **RULE:** Scenario form and human AI-understanding confirmation precede generated scenario view; AI visual changes require preview/Apply. **WHY:** scenario interpretation and visual execution are distinct. **WHAT BREAKS IF VIOLATED:** screen generated before intent review or unseen operations applied.
21. **RULE:** Session content/navigation/Start From uses only Main Architecture and confirmed screens available at meeting start, excluding drafts and later silent authoring changes. Return to Live reads the current presenter state. **WHY:** live session and saved presentation are distinct. **WHAT BREAKS IF VIOLATED:** private return jumps to stale state or live actions corrupt saved screens.
22. **RULE:** End Meeting requires Project Owner / Architect confirmation and freezes only intentionally captured eligible shared/session records. V1 has no continuous recording/full transcript or inferred verbal-discussion summary. **WHY:** review needs a stable bounded basis, not covert recording/private harvesting. **WHAT BREAKS IF VIOLATED:** late updates alter what was reviewed or private data enters review.
23. **RULE:** Meaningful correction/setup/preparation/screen/review drafts autosave; destructive discard requires confirmation. Save/retry preserves work and never duplicates outcomes, decisions, actions or shared items. Failed project save stays in review; only success routes Home. **WHY:** pause/reconnect and deliberate confirmation must be trustworthy. **WHAT BREAKS IF VIOLATED:** lost drafts, repeated invitations, double actions or success navigation after failure.
24. **RULE:** Hand/gaze/layout mechanics do not become mandatory high-frequency backend writes or implicit commands. **WHY:** hands-first small seated actions and predictable feedback must remain responsive. **WHAT BREAKS IF VIOLATED:** network latency blocks selection; looking ends a meeting; per-frame rebuilds undermine the comfort/working-view target.

# SECTION M — RESOLVED V1 DECISIONS

Historical record: Step 0A originally identified nine pre-persistence gap groups on 2026-10-22. The user subsequently supplied explicit V1 decisions resolving those groups. They are recorded below, not erased or reopened as questions. These decisions qualify earlier product documents only where explicitly stated. They are documentation reconciliation, not implemented behavior. Technical persistence/security details are deferred without treating resolved product rules as blockers.

## Gap 1 — Meeting / project authority: RESOLVED

**Previously identified:** authority for architecture acceptance, meetings, project review/publication, temporary presentation and scoped guests was insufficiently bounded.

**V1 decision:** Project Owner / Architect owns project and meeting and can review/correct/confirm architecture, create/edit presentation, create/start/end meeting, review Group 6 outcomes and Save to Project. Owner is default presenter. Temporary presentation control transfers none of project ownership, meeting ownership, architecture-edit or Save to Project authority. Exactly one active presenter, at most one pending transfer. Current presenter selects one recipient and sends a request; only recipient Accept changes presenter. Owner Take Back is always available; temporary-presenter disconnect/leave returns control to owner. No queue, simultaneous presenters or collaborative authority manipulation.

**Architecture consequence:** derive owner capabilities from actual project ownership, not professional designation. Existing Group 1 editor records remain untouched; they do not imply the new owner-only acceptance powers. Preserve previously approved limited presentation collaboration without inferring owner authority. Role transfer changes only stage authority. Enforcement details belong to persistence/application design, not a new permission-management product.

## Gap 2 — My Space sharing: RESOLVED

**Previously identified:** private originals versus shared references, later edits and retention could leak private work.

**V1 decision:** explicit Share to Meeting publishes a stable meeting-visible version/reference directly into the appropriate Meeting Context category: Question → shared Questions; Note → shared Notes; AI Finding → shared AI Findings; Snapshot → shared snapshot/evidence context. No permanent My Shared Things area. Owner's private original remains in My Space. Private edit history, unrelated items and the rest of My Space remain inaccessible. Later edits do not silently alter the publication; explicit re-share/update is necessary. Preserve provenance from private source to publication.

**Architecture consequence:** publication record/reference is bounded to intentionally shared content/context revision, not an unrestricted pointer to private state. Group 6 explicitly retains only reviewed shared content. Physical storage, update identity, retention/deletion and retry mechanisms remain Step 0B details without reopening stable-publication behavior.

## Gap 3 — Voice / transcription: RESOLVED

**Previously identified:** post-meeting summaries lacked a defined input basis and risked assuming a full meeting transcript/media pipeline.

**V1 decision:** no continuous recording, full meeting transcription or automatic full-conversation summary. Voice is only intentional product input: contextual AI requests/explanations, dictated notes/questions, visual/context commands and deliberate voice-to-text actions. Group 6 summarizes only actual captured structured/shared questions, notes, findings, explicit decisions/actions, snapshots, evidence and other intentionally captured items. Never infer a verbal discussion without a structured supporting record.

**Architecture consequence:** remove assumed live-voice/media/transcript subsystem from V1. Old Mic wording means explicit input here, not background meeting audio capture. AI packages carry eligible intentional input; summaries cite captured material and expose insufficient support rather than inventing conversation. Choice of an input speech provider and its disclosed handling is a later technical task, not authorization to record meetings.

## Gap 4 — Architecture after confirmation: RESOLVED

**Previously identified:** confirmed version evolution, refresh and historical references needed a boundary.

**V1 decision:** one project has one confirmed architecture, immutable after acceptance. Meaningfully changed architecture requires another project. No Architecture V1/V2/V3 workflow, source-refresh migration, presentation migration, architecture diffing or canonical-version switching. Future evolution is explicitly deferred. Historical references remain anchored to their confirmed architecture.

**Architecture consequence:** ArchitectureVersion may retain a stable reference identity and candidate revisions for recovery/concurrency, but not expose or implement evolution. Imported known inner structure remains source-backed context within the approved architecture; do not expand into new nested-authoring/version workflows. Existing inspection and minor pre-confirmation correction constraints remain unchanged.

## Gap 5 — Lasso / crossing connections: RESOLVED

**Previously identified:** selected/internal versus crossing edges and external context needed explicit semantics.

**V1 decision:** lasso is a context boundary, not a crop or topology mutation. PRIMARY CONTEXT contains selected nodes and their internal relationships. BOUNDARY CONTEXT preserves incoming/outgoing crossing connections and external endpoint identity. All remain references to the same architecture; no copying/disconnection/deletion. Internal edges may be emphasized, outside architecture de-emphasized and boundary edges lighter/dashed with endpoint labels. Styling never changes canonical connection semantics.

**Architecture consequence:** InteractionContext explicitly retains both roles. Attach/AI/Evidence/Snapshot/presentation preparation consume the same context. AI may use boundary information to interpret the selected subsystem, but cannot silently traverse/expand to the entire connected architecture; it suggests explicit add/open for deeper external context. Gesture hit-testing and placement details remain client/technical concerns, not another product scope question.

## Gap 6 — Presentation screens in meeting: RESOLVED

**Previously identified:** draft chips in generated meeting imagery conflicted with prepared/confirmed content and session stability.

**V1 decision:** meeting content is Main Architecture plus CONFIRMED screens only. Drafts never enter meeting content, Start From choices or live navigation. At meeting start use the confirmed presentation state available then. Live authoring cannot silently change an already-running meeting. Draft editing remains inside Builder.

**Architecture consequence:** start-time session content is a bounded confirmed-state reference set. A scheduled meeting does not freeze content earlier merely because it was scheduled; validate confirmed eligibility again at start. Persistence snapshot/revision mechanics remain later design. Ignore the old draft Failure chip as an approval to share drafts.

## Gap 7 — Presenter handoff / disconnect: RESOLVED

**Previously identified:** competing transfers, temporary-presenter departure and live-following needed clear role behavior.

**V1 decision:** one presenter and one pending transfer, no queue. Current presenter sends one request; intended recipient Accept/Decline controls the transfer. Project Owner / Architect remains meeting owner, can Take Back anytime, and automatically regains presenter authority on temporary-presenter disconnect/leave. Owner-permitted temporary guest presentation remains meeting-scoped. Return to Live follows whatever the current presenter is showing NOW, not the participant's previous checkpoint.

**Architecture consequence:** the request and active authority must be checked together; take-back/end/disconnect invalidate stale requests. Preserve the earlier agreed owner presentation return-state where applicable as an owner checkpoint, without an unbounded nested presenter stack or confusing it with Return to Live. Do not re-open the resolved transfer/fallback product behavior; exact checkpoint/storage/timeout mechanics are technical follow-up.

## Gap 8 — External guest: RESOLVED

**Previously identified:** generic email invitations needed scoped identity/access rather than implicit project membership.

**V1 decision:** generic email may create a restricted presentation/meeting guest identity/session, limited to explicitly invited context. No automatic ProjectMembership, editor rights, architecture acceptance or Save to Project authority. Guest can participate; owner may explicitly allow temporary presentation under meeting permission. This never broadens project access. No full enterprise guest administration system.

**Architecture consequence:** guest admission uses scoped grants separate from existing Group 1 project authorization, with source/knowledge projection filtering. Identity binding, expiry and revocation implementation details are for Step 0B; no new project invitation feature or account-management UI is invented.

## Gap 9 — Draft / exit / failure recovery: RESOLVED

**Previously identified:** autosave versus discard, failed-save behavior and retries could lose or duplicate work.

**V1 decision:** meaningful Group 3 corrections, presentation setup/preparation/screen drafts and Group 6 review drafts autosave. Back/exit never silently discards meaningful work; destructive discard requires explicit confirmation. Successful Group 6 Save → success feedback → Home. Failed Save stays in Meeting Review with all reviewed work preserved and retry available. Retries never duplicate meeting outcomes, decisions, actions or shared items.

**Architecture consequence:** durable recovery drafts and explicit acceptance are distinct. Autosave must not confirm architecture, approve a screen, publish outcomes or send invitations. Exact consistency/idempotency mechanics belong to persistence design; no UX decision is reopened here.

## Genuinely remaining blocking gaps

**No blocking gaps remain from the nine recorded Step 0A product/backend gaps after applying the supplied V1 decisions.** This is readiness to design persistence, not proof of implementation or a claim that every storage/security parameter is finalized. No additional product questions are invented here. Existing unexpanded details (such as provider choice, technical checkpoint representation or exact final-preparation Home control) do not change these resolved domain rules and are not grounds to reopen them.

## UI follow-up — lasso references (later correction only)

Group 4 Stage 3 lasso context-selection image must be updated later to show the selected region, intact internal edges, intact incoming/outgoing crossing relationships, external endpoint labels at the boundary, outside architecture de-emphasized rather than deleted, and Attach/AI/Evidence/Snapshot operating on the same contextual area. Check Group 2 lasso imagery for the same conceptual consistency. This is a UX-reference follow-up only: no image was generated, modified or replaced in this reconciliation, and no backend feature was implemented.

# SECTION N — NEXT BACKEND DESIGN PASS

Proceed next to Step 0B — **domain persistence and authorization design**, using the resolved V1 decisions above. Do not repeat the nine product questions or introduce version evolution, background audio/transcription, draft meeting screens, presenter queues or broadened guest/project rights. The nine module boundaries, 42 conceptual-object inventory and nine modes remain; conceptual objects are not a required table count.

Step 0B should define ownership/cardinality for the one confirmed architecture and its pre-confirmation candidate; durable correction/setup/screen/review drafts; stable shared publication versus private original references; captured structured meeting input and owner-reviewed outcomes; start-time confirmed presentation content; single presenter/pending request and owner fallback; restricted guest identity/session admission; permission enforcement; historical reference/retention behavior; atomic acceptance boundaries and retry identity; and derived Home summary consistency. Preserve existing Group 1 schema/contracts unless a later explicit additive migration is approved. Do not mechanically create a table for every object.

This update designs no tables, SQL/ORM models, migrations, REST endpoints, WebSocket messages, services, AI prompts or Unity implementation. Detailed storage choices and API/realtime contracts are later authorized passes. Existing stack is unchanged. Intentional voice-input provider choice is a later technology decision; there is no continuous meeting-media subsystem to implement.

Document verification scope: A–N structure preserved, nine historical gaps retained as RESOLVED, no remaining blocking gap asserted from those nine, lasso UI follow-up recorded. Only `outputs/backend-step0a-domain-interaction-architecture.md` changed during this reconciliation. No database, backend, API, Unity, image, dependency or implementation work was performed.

