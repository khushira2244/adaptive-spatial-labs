# SECTION A — EXECUTIVE RELATIONSHIP MODEL

Backend Step 0B.2 — cardinalities and relationship ownership, 2026-10-23. Design proposal only. Authority: [Step 0A](backend-step0a-domain-interaction-architecture.md) and [Step 0B.1](backend-step0b1-persistence-classification.md), with approved [Group 1](group1-backend-spec.txt), [Group 2](group2-product-design-spec.md), [Group 3](group3-correction-editor-spec.md), [Group 4 entry](group4-stage1-entry-and-open-spec.md), [setup](group4-stage2-presentation-setup-spec.md), [scope](group4-stage3-lasso-selection-spec.md), [preparation](group4-stage4-discussion-preparation-spec.md), [builder](group4-presentation-builder-and-meeting-bridge-spec.md), [Group 5](group5-live-meeting-spec.md) and [Group 6](group6-meeting-review-and-outcomes-spec.md). The latest backend decisions supersede older conflicting exploratory wording/images.

An organization has many projects; every project has one organization and one registered owner. Owner/editor grants retain their existing meaning. A project acquires at most one architecture container. Its one root candidate, plus documented inner graphs, becomes the single immutable confirmed architecture. Presentations reference that graph family and own their screen definitions, not graph copies. One reusable presentation can serve many meetings; each meeting uses exactly one presentation and preserves confirmed content at start.

Meetings own admission, one active presenter, explicit publications and end capture. Private content belongs to its author, even when independently published into several meetings. Outcomes owns the separate review over frozen capture. One successful owner acceptance publishes structured decisions/actions and a result manifest; retries do not create another acceptance. Access relationships never transfer ownership.

```text
Organization --> Project (one User owner; editor assignments)
Project
 +-- Source --> locators / ingestion attempts; optional private credential reference
 +-- Architecture --> one root graph + documented inner graphs --> nodes / edges
 +-- KnowledgeItem / Snapshot (private author ownership; explicit context links)
 +-- Presentation --> base Main Architecture + authored screens --> local values
 |    +-- grants / invitations; knowledge inclusions
 +-- Meeting --> one Presentation; start snapshot; participants / invitations
 |    +-- one presenter; private checkpoints; stable publications; frozen end capture
 +-- MeetingReview --> assessments / outcome links --> Decision / ActionItem
      +-- one accepted result manifest --> derived Home projection
```

Arrows above include references, not all containment. Cross-domain lifecycle roots retain scope references without importing another domain's mutable aggregate. Organization membership, meeting participation and presentation grants are separate access scopes.

**Counting convention:** Section B is the sole relationship register: **70 logical relationship families: 18 one-to-one/optional-one, 40 one-to-many and 12 many-to-many.** An association's two implementation legs are not counted again. Role-specific incoming/outgoing endpoints are separate constraints. R67 and R69 explicitly group identical rules over named outcome types; these are family counts, not counts of SQL constraints, independent tables or all transitive graph paths. Subset relationships (e.g. evidence targets within general contexts) are separately named where their rules differ. Section C restates the same IDs without adding relationships. Step 0B.1 remains **38 table candidates** (12 A, 18 B, 8 C); this pass adds no table candidate.

A record's dependency on a parent means it cannot be a new valid orphan. Retained/archive history may remain after a parent stops being active; that does not imply physical deletion or severed references. No SQL keys, delete clauses, columns, JSONB layouts, APIs, realtime contracts or mutability/revision mechanics are designed here.

# SECTION B — COMPLETE CARDINALITY TABLE

Notation is bidirectional in the Cardinality cell. “Required” refers to the stated lifecycle phase, not an unconditional database constraint. N:M may use an existing association or owned reference values; it does not automatically justify another table.

| Parent / Source | Relationship | Child / Target | Cardinality | Required? | Owner Module | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Organization | R01: N:M | User through OrganizationMember | 0..N users per organization; 0..N organizations per user | Each membership requires one of each | Identity | One membership per organization/user pair; preserve current roles. |
| User | R02: 1:N | AuthSession | 0..N sessions; each session has exactly 1 user | User required for every session | Identity | Guest credential continuity belongs to ScopedGuestAccess, not a fabricated registered user. |
| User | R03: 1:1 / 0..1 | UserPreference | 0..1 preference record; exactly 1 user per record | Optional until initialized; defaults on absence | Identity | Preserve existing lazy/default behavior. |
| Invited scope: Presentation or Meeting | R04: 1:N | ScopedGuestAccess | 0..N guest bindings per scope; each binding has exactly 1 invited scope | Binding requires one restricted recipient identity and scope | Identity | One conceptual ActorRef = User OR scoped guest principal. Separate scope bindings do not create project membership. Reconnect reuses admitted identity. |
| Organization | R05: 1:N | Project | 0..N projects; exactly 1 organization per project | Required for every project | Projects | Matches existing Group 1 required organization. |
| User as project owner | R06: 1:N | Project | 0..N owned projects; exactly 1 owner per project | Always required | Projects | Architect is product role, not designation-based authorization. |
| Project | R07: N:M | User through ProjectEditorAssignment | 0..N editors per project; 0..N projects per editor | Each assignment requires one project and one user | Projects | Existing org eligibility applies. ProjectMembership remains derived; no duplicate grant. |
| Project | R08: 1:1 / 0..1 | ProjectStructure | Exactly 1 structure per successfully created project | Required at Group 1 creation completion | Projects | Transient wizard is not a persisted incomplete project. |
| Project | R09: 1:N | ProjectLayerDefinition | 0..N layers; exactly 1 project per layer | Project required; set may be empty where existing rules permit | Projects | Structure organizes layers logically; existing layers belong directly to Project, no second parent. |
| Project | R10: 1:N | Source | 0..N sources; exactly 1 project per attached source | Project required after attachment | Sources | Do not move one Source between projects; separate attachments may share external board identity. |
| Source | R11: 1:N | SourceReference | 0..N locators; exactly 1 source per locator | Source required | Sources | Frame, section, schema and item locators are not raw document copies. |
| Source | R12: 1:N | IngestionRun | 0..N attempts; exactly 1 source per run | Source required; no ingestion prerequisite for mere attachment | Sources | Retries do not create new confirmed architectures. |
| IntegrationCredential | R13: 1:N | Source | 0..N connected sources per credential; source has 0..1 active credential binding | Required only for connector reads needing credentials | Sources | One authorized account connection can support several project attachments; never place token in metadata. |
| User / restricted uploading actor | R14: 1:N | StagedUpload | 0..N uploads per authorized actor; exactly 1 uploader per upload | Authenticated authorized uploader required; current Group 1 User behavior retained | Sources | No new guest upload capability is granted. |
| Project | R15: 1:N | StagedUpload | 0..N consumed uploads per project; staged upload has 0..1 consuming project | No project before create; exactly 1 if consumed | Sources | Project scope may be supplied for authorization before consumption, without ownership transfer. |
| StagedUpload | R16: 1:1 / 0..1 | Source | 0..1 resulting Source per staged upload; Source has 0..1 staged origin | Optional: external connectors have no upload origin | Sources | Single-use consumption; retry returns same attachment, not another Source. |
| User as integration owner | R17: 1:N | IntegrationCredential | 0..N credentials per user; exactly 1 owning user per credential | Required private owner and authorized connector account | Sources | No organization-wide credential-sharing product added. |
| Project | R18: 1:1 / 0..1 | Architecture | 0..1 before usable reconstruction; exactly 1 after architecture confirmation | Absent is valid pre-reconstruction; confirmation requires one | Architecture | Another materially changed architecture requires another project. |
| Architecture | R19: 1:N | ArchitectureVersion | Exactly 1 root graph when reconstructed; 0..N documented inner graph records | Every version belongs to exactly 1 Architecture | Architecture | One active root candidate, zero confirmed roots before confirmation; one confirmed root afterward and no active candidate. V1 keeps no parallel/superseded root-version series; autosave/concurrency is not another version record. |
| ArchitectureVersion | R20: 1:N | ArchitectureNode | 0..N nodes; exactly 1 owning graph record per node | Owning graph required; usable reconstruction requires meaningful content | Architecture | No sharing mutable node rows between root/inner graph scopes. |
| ArchitectureVersion | R21: 1:N | ArchitectureConnection | 0..N connections; exactly 1 graph per connection | Graph and valid endpoints required | Architecture | An empty edge set can be valid; no fabricated connections for visual completeness. |
| ArchitectureNode as source endpoint | R22: 1:N | ArchitectureConnection | 0..N outgoing edges per node; exactly 1 source node per edge | Required for every canonical connection | Architecture | Endpoints must be in the connection owning graph. |
| ArchitectureNode as destination endpoint | R23: 1:N | ArchitectureConnection | 0..N incoming edges per node; exactly 1 destination node per edge | Required for every canonical connection | Architecture | Source/destination roles are distinct, not an implicit N:M graph association table. |
| ArchitectureNode | R24: 1:1 / 0..1 | InnerArchitectureReference → inner ArchitectureVersion | 0..1 inner link per node; each inner graph has exactly 1 parent link | Optional; only with documented imported depth | Architecture | V1 chooses a containment tree, not multiple alternative inner views/shared child graphs. Child belongs to same Architecture; no cycles. All imported descendants freeze with the single confirmation. |
| ArchitectureVersion / its nodes or connections | R25: N:M | SourceReference via owned provenance | 0..N evidence refs per graph/element; locator may support 0..N graph elements | Source-backed claims require actual grounding; manual candidate additions may have none | Architecture | No new provenance table promised: owned provenance references under existing graph owners; several Sources may contribute to one architecture. |
| Project | R26: 1:N | KnowledgeItem | 0..N items per project; item has 0..1 project scope | Optional for standalone My Space; required if attached to project architecture/meeting | Knowledge | Project association is scope, not public visibility. |
| User or scoped guest author | R27: 1:N | KnowledgeItem | 0..N authored items; exactly 1 author principal per item | Author required; guest limited to invited context | Knowledge | One principal abstraction, no duplicate guest-as-user or automatic project grant. |
| KnowledgeItem | R28: N:M | Semantic context target through KnowledgeContext | 0..N contexts per item; 0..N items per semantic target | Each attachment has exactly 1 item and 1 captured target value | Knowledge | KnowledgeItem → KnowledgeContext rows is physically 1:N, not N:M between two content entities. N:M is item ↔ semantic target; no global Context table. |
| User or scoped guest creator | R29: 1:N | Snapshot | 0..N snapshots; exactly 1 creator per snapshot | Creator required | Knowledge | Private by default; optional image artifact is not identity. |
| Project | R30: 1:N | Snapshot | 0..N snapshots; snapshot has 0..1 project scope | Required when capture includes a project architecture | Knowledge | No canonical context from different projects merged into one V1 capture. |
| KnowledgeItem | R31: N:M | Snapshot through contextual reference | 0..N snapshot refs per item; 0..N items per snapshot | Optional; each intentional reference resolves one stable capture | Knowledge | Reuse KnowledgeContext; no extra SnapshotAttachment candidate. Sharing requires bounded publication of authorized content. |
| KnowledgeItem | R32: N:M | SourceReference through evidence/context | 0..N source refs per item; 0..N items per locator | Optional; evidence claims must identify grounding | Knowledge | Use KnowledgeContext/provenance owned values; no copied document store. |
| Project | R33: 1:N | Presentation | 0..N presentations; exactly 1 project per presentation | Project and confirmed architecture required | Presentations | Scoped collaboration does not confer owner publication authority. |
| Confirmed Architecture | R34: 1:N | Presentation | 0..N presentations per Architecture; exactly 1 confirmed root per presentation | Always required including setup draft | Presentations | Does not own a canonical copy. |
| Presentation | R35: 1:N | PresentationScreen | 1..N screens; exactly 1 presentation per screen | Exactly 1 Main Architecture/base row plus 0..N authored screens | Presentations | Base is a normal screen record with whole-model scope, always usable from confirmed architecture; no scenario-AI wizard needed for base. |
| Presentation | R36: N:M | ActorRef through PresentationAccessGrant | 0..N grantees per presentation; actor can access 0..N eligible presentations | Each grant binds one presentation and one registered or scoped guest actor | Presentations | Guest scope still limits apparent reuse; no project/editor/meeting membership implied. |
| Presentation | R37: 1:N | PresentationInvitation | 0..N invitations; exactly 1 presentation per invitation | Presentation and intended recipient required | Presentations | One intended recipient per invitation; retries do not duplicate sends/grants. |
| PresentationInvitation | R38: 1:1 / 0..1 | PresentationAccessGrant | 0..1 resulting grant per invitation; grant has 0..1 originating invitation | Optional: direct registered-user grant needs no invite | Presentations | No one invitation grants multiple people. |
| PresentationScreen | R39: N:M | KnowledgeItem through PresentationScreenKnowledgeReference | 0..N items per screen; 0..N screens per item | Association requires exactly 1 screen and 1 permitted item | Presentations | No unrestricted live pointer to a private item; preparation reference alone is not public sharing. |
| PresentationScreen | R40: 1:N | VisualOverride owned values | 0..N overrides; each belongs to exactly 1 screen | Optional; one current value per target/property | Presentations | One target can have many different properties; same override object never shared across screens. |
| PresentationScreen | R41: 1:N | ScenarioOverlayConnection | 0..N overlays; exactly 1 screen per overlay | Screen plus 2 valid node endpoints required | Presentations | Endpoints refer to same canonical architecture family and explicit scope; no canonical edge mutation or extra fictitious architecture. |
| PresentationScreen | R42: 1:1 / 0..1 | CapturedSemanticScope | Exactly 1 current semantic scope per screen | WHOLE default; explicit selection otherwise | Presentations | Main Architecture base is WHOLE; lasso changes context, never canonical topology. |
| Project | R43: 1:N | Meeting | 0..N meetings; exactly 1 project, derived consistently from presentation | Project is required scope; not an additional selectable architecture | Meetings | No independent second project choice; any stored scope must agree with presentation. |
| Presentation | R44: 1:N | Meeting | 0..N meetings per presentation; exactly 1 presentation per meeting | Required | Meetings | Reusable presentation; never one meeting per screen. |
| Project Owner / Architect User | R45: 1:N | Meeting | 0..N owned meetings per user; exactly 1 owner per meeting | Must match owning project authority | Meetings | No ownership-transfer workflow introduced. |
| Meeting | R46: N:M | ActorRef through MeetingParticipant | 0..N admitted actors before start; LIVE includes owner; actor may attend multiple eligible meetings | Each participant binds exactly 1 meeting and 1 principal | Meetings | Guest has stable restricted principal, no duplicate registered-user identity; historical presence is not current access. |
| Meeting | R47: 1:N | MeetingInvitation | 0..N invitations; exactly 1 meeting per invitation | Meeting and intended recipient required | Meetings | Presentation collaborators are candidates, not automatically admitted participants. |
| MeetingInvitation | R48: 1:1 / 0..1 | MeetingParticipant | 0..1 resulting participant per invitation; participant has 0..1 originating invitation | Optional: owner/direct permitted admission may lack invite | Meetings | Invitation is not itself participation or presenter authority. |
| Meeting | R49: 1:N | SharedMeetingItem | 0..N publications; exactly 1 meeting per publication | Meeting and sharing principal required | Meetings | One private original can publish independently to many meetings. |
| KnowledgeItem or Snapshot private original | R50: 1:N | SharedMeetingItem | 0..N independent publications per original; publication has 0..1 private origin | Private-origin share requires exactly 1 origin; directly shared item may have none | Meetings | Each publication has one primary authored origin or intentional direct-input provenance; supplemental refs are captured context. |
| MeetingParticipant | R51: 1:1 / 0..1 | ParticipantPrivateState | 0..1 meaningful private checkpoint per participant | Optional until private exploration | Meetings | Never store high-frequency hand/gaze streams. |
| Meeting | R52: 1:1 / 0..1 | Current presenter reference | 0..1 designated presenter overall; exactly 1 while LIVE | LIVE presenter must be admitted participant | Meetings | Logical owner authority remains even if owner is offline; fallback to owner identity does not grant another participant control. |
| Meeting | R53: 1:1 / 0..1 | MeetingSharedState | 0..1 shared checkpoint; exactly 1 once started | Initialized at start; retained at end | Meetings | One stream of accepted stage authority, not multiple presenters. |
| Meeting | R54: 1:1 / 0..1 | PresenterTransferRequest | 0..1 pending request; exactly 1 intended recipient per request | Optional; only LIVE with valid current presenter and admitted receiver | Meetings | Guest receiver requires owner permission; transfers no owner rights. |
| Meeting | R55: 1:1 / 0..1 | OwnerPresentationReturnCheckpoint | 0..1 meaningful owner return checkpoint | Optional until relevant handoff | Meetings | Meaningful screen/focus/depth only. |
| Meeting | R56: 1:1 / 0..1 | MeetingPresentationSnapshot | 0 before start; exactly 1 after successful start | Required for LIVE and ended started meeting | Meetings | Contains definitions or immutable refs, not another canonical graph. |
| Meeting | R57: 1:1 / 0..1 | FrozenMeetingCapture | 0 before end; exactly 1 after successful end of LIVE meeting | Required before review; canceled unstarted meeting has none | Meetings | Ending/start retries never create multiple captures. |
| Meeting | R58: 1:1 / 0..1 | MeetingReview | 0..1 review per meeting; exactly 1 meeting per review | Review requires ended meeting and frozen capture | Outcomes | Scheduled/canceled unstarted meeting cannot produce review. |
| MeetingReview | R59: 1:N | MeetingReviewItem | 0..N assessments; exactly 1 review per item | Review required; empty captured categories allowed | Outcomes | Multiple review categories are projections, not duplicate assessed content. |
| Captured structured item in FrozenMeetingCapture | R60: 1:N | MeetingReviewItem | 0..N assessments per captured item; exactly 1 primary captured anchor per assessment | Required source anchor; supplemental evidence allowed | Outcomes | No invented verbal discussion; synthesis can cite multiple supplemental captured refs without losing primary anchor. |
| MeetingReview | R61: 1:N | Decision | 0..N decisions; exactly 1 originating review per decision in V1 | Review/project scope required; accepted status only after successful Save | Outcomes | Logical origin is not permission to cascade-delete accepted decision. |
| MeetingReview | R62: 1:N | ActionItem | 0..N actions; exactly 1 originating review per action | Review/project scope required | Outcomes | No external ticket system introduced. |
| MeetingReviewItem | R63: N:M | Decision through ReviewOutcomeLink | 0..N decisions per item; 0..N assessed items per decision | Optional; explicit link needs one of each in same review/project | Outcomes | Directly captured decision may lack review-item resolution links but still has capture provenance. |
| MeetingReviewItem | R64: N:M | ActionItem through ReviewOutcomeLink | 0..N actions per item; 0..N assessed items per action | Optional; explicit links limited to same review/project | Outcomes | One association concept supports typed decision/action targets, not a new ninth join candidate. |
| Decision | R65: 1:N | ActionItem | 0..N actions per decision; action has 0..1 primary related decision | Optional: standalone action can address question/evidence directly | Outcomes | V1 chooses one primary decision per action; ReviewOutcomeLink supplies multi-item provenance, not multi-decision task graph. |
| Eligible ActorRef assignee | R66: 1:N | ActionItem | 0..N actions per principal; action has 0..1 assignee while draft, exactly 1 at acceptance | Accepted action requires one responsible principal | Outcomes | Project owner is eligible even without an invitation; guest scope expiry never changes assignee identity or auto-grants project rights. No multiple assignees. |
| Decision / ActionItem | R67: 1:1 / 0..1 | Captured architecture context | 0..1 primary semantic scope per outcome | Optional for administrative action; required when claiming an architecture-specific target | Outcomes | No canonical mutation when recording a decision or task. |
| MeetingReview | R68: 1:1 / 0..1 | Accepted MeetingOutcome manifest | 0 before acceptance; exactly 1 after successful Save to Project | Required for published project outcomes | Outcomes | Autosave is never acceptance; successful commit is the publication boundary. |
| Project | R69: 1:N | MeetingReview / Decision / ActionItem | 0..N of each; each has exactly 1 originating project | Required, derived consistently from originating meeting/review | Outcomes | Three parallel scope references counted as one grouped invariant; originating review relations R61/R62 are lifecycle roles, not extra project tables. |
| Snapshot | R70: N:M | Meeting publications / frozen review contexts | 0..N authorized capture/publication references per Snapshot; each meeting/review may reference 0..N snapshots | Optional; meeting visibility requires intentional publication or approved prepared context | Knowledge | No new join table: use SharedMeetingItem publication and owned frozen/review context refs. Repeated use never transfers private ownership. |

# SECTION C — MODULE-BY-MODULE RELATIONSHIPS

All relationships below inherit the authority and phase gates from Step 0A. “Authorized” never means a client-supplied role. Source/guest references are access-checked independently of relationship existence. Each entry names the relationship owner, who can establish/end it, and whether retained history survives lifecycle changes.

## Identity

### R01 — Organization → User through OrganizationMember

**RELATIONSHIP:** Organization → User through OrganizationMember.

**CARDINALITY:** N:M; 0..N users per organization; 0..N organizations per user.

**OWNER / DOMAIN OWNER:** Identity; membership belongs to organization.

**PARENT:** Organization. **CHILD / REFERENCE:** User through OrganizationMember.

**REQUIRED/OPTIONAL:** Each membership requires one of each.

**WHO CREATES RELATIONSHIP:** Existing authorized organization/account flow.

**WHO MAY REMOVE/END IT:** Existing organization authority ends membership.

**CHILD OUTLIVES PARENT?:** User and organization are independent; membership cannot stand alone.

**HISTORICAL REFERENCE RULE:** Retain attribution after membership ends; membership is not project ownership.

**V1 BOUNDARY:** One membership per organization/user pair; preserve current roles.

### R02 — User → AuthSession

**RELATIONSHIP:** User → AuthSession.

**CARDINALITY:** 1:N; 0..N sessions; each session has exactly 1 user.

**OWNER / DOMAIN OWNER:** Identity / User.

**PARENT:** User. **CHILD / REFERENCE:** AuthSession.

**REQUIRED/OPTIONAL:** User required for every session.

**WHO CREATES RELATIONSHIP:** Authentication lifecycle.

**WHO MAY REMOVE/END IT:** Identity revokes/expires; user may sign out own session.

**CHILD OUTLIVES PARENT?:** No independent authentication lifecycle without user.

**HISTORICAL REFERENCE RULE:** Retain only necessary security attribution; expired sessions confer no access.

**V1 BOUNDARY:** Guest credential continuity belongs to ScopedGuestAccess, not a fabricated registered user.

### R03 — User → UserPreference

**RELATIONSHIP:** User → UserPreference.

**CARDINALITY:** 1:1 / 0..1; 0..1 preference record; exactly 1 user per record.

**OWNER / DOMAIN OWNER:** Identity / User.

**PARENT:** User. **CHILD / REFERENCE:** UserPreference.

**REQUIRED/OPTIONAL:** Optional until initialized; defaults on absence.

**WHO CREATES RELATIONSHIP:** User preference initialization.

**WHO MAY REMOVE/END IT:** User resets; Identity manages account lifecycle.

**CHILD OUTLIVES PARENT?:** No.

**HISTORICAL REFERENCE RULE:** No historical preference stream required.

**V1 BOUNDARY:** Preserve existing lazy/default behavior.

### R04 — Invited scope: Presentation or Meeting → ScopedGuestAccess

**RELATIONSHIP:** Invited scope: Presentation or Meeting → ScopedGuestAccess.

**CARDINALITY:** 1:N; 0..N guest bindings per scope; each binding has exactly 1 invited scope.

**OWNER / DOMAIN OWNER:** Identity; scope owner authorizes admission.

**PARENT:** Invited scope: Presentation or Meeting. **CHILD / REFERENCE:** ScopedGuestAccess.

**REQUIRED/OPTIONAL:** Binding requires one restricted recipient identity and scope.

**WHO CREATES RELATIONSHIP:** Identity binds recipient after authorized invitation acceptance.

**WHO MAY REMOVE/END IT:** Identity or inviting scope authority revokes/expires access.

**CHILD OUTLIVES PARENT?:** Access cannot outlive its scope; attribution can be retained.

**HISTORICAL REFERENCE RULE:** Keep stable guest attribution after access expiry; no reassignment to a different person.

**V1 BOUNDARY:** One conceptual ActorRef = User OR scoped guest principal. Separate scope bindings do not create project membership. Reconnect reuses admitted identity.

## Projects

### R05 — Organization → Project

**RELATIONSHIP:** Organization → Project.

**CARDINALITY:** 1:N; 0..N projects; exactly 1 organization per project.

**OWNER / DOMAIN OWNER:** Projects owns project; Identity owns organization.

**PARENT:** Organization. **CHILD / REFERENCE:** Project.

**REQUIRED/OPTIONAL:** Required for every project.

**WHO CREATES RELATIONSHIP:** Existing authorized project creation.

**WHO MAY REMOVE/END IT:** Project owner archives; no cross-organization move introduced.

**CHILD OUTLIVES PARENT?:** Project retained history must not be erased by organization state changes.

**HISTORICAL REFERENCE RULE:** Retain organization association; archive/unavailable rather than retarget.

**V1 BOUNDARY:** Matches existing Group 1 required organization.

### R06 — User as project owner → Project

**RELATIONSHIP:** User as project owner → Project.

**CARDINALITY:** 1:N; 0..N owned projects; exactly 1 owner per project.

**OWNER / DOMAIN OWNER:** Projects owns ownership reference, not User.

**PARENT:** User as project owner. **CHILD / REFERENCE:** Project.

**REQUIRED/OPTIONAL:** Always required.

**WHO CREATES RELATIONSHIP:** Creator becomes owner in existing creation.

**WHO MAY REMOVE/END IT:** No new ownership transfer workflow; archive through existing authority.

**CHILD OUTLIVES PARENT?:** Project history can survive owner account deactivation; no live orphan owner authority.

**HISTORICAL REFERENCE RULE:** Retain original owner attribution; deactivation does not cascade project history.

**V1 BOUNDARY:** Architect is product role, not designation-based authorization.

### R07 — Project → User through ProjectEditorAssignment

**RELATIONSHIP:** Project → User through ProjectEditorAssignment.

**CARDINALITY:** N:M; 0..N editors per project; 0..N projects per editor.

**OWNER / DOMAIN OWNER:** Projects / Project.

**PARENT:** Project. **CHILD / REFERENCE:** User through ProjectEditorAssignment.

**REQUIRED/OPTIONAL:** Each assignment requires one project and one user.

**WHO CREATES RELATIONSHIP:** Existing owner-authorized editor assignment.

**WHO MAY REMOVE/END IT:** Existing project authority revokes editor assignment.

**CHILD OUTLIVES PARENT?:** User independent; assignment not independent of project.

**HISTORICAL REFERENCE RULE:** Retain author attribution elsewhere after editor revocation.

**V1 BOUNDARY:** Existing org eligibility applies. ProjectMembership remains derived; no duplicate grant.

### R08 — Project → ProjectStructure

**RELATIONSHIP:** Project → ProjectStructure.

**CARDINALITY:** 1:1 / 0..1; Exactly 1 structure per successfully created project.

**OWNER / DOMAIN OWNER:** Projects / Project.

**PARENT:** Project. **CHILD / REFERENCE:** ProjectStructure.

**REQUIRED/OPTIONAL:** Required at Group 1 creation completion.

**WHO CREATES RELATIONSHIP:** Atomic project creation.

**WHO MAY REMOVE/END IT:** Existing authorized structure updates/reset; project lifecycle.

**CHILD OUTLIVES PARENT?:** No.

**HISTORICAL REFERENCE RULE:** Preserve meaning of any referenced historical configuration; not canonical graph truth.

**V1 BOUNDARY:** Transient wizard is not a persisted incomplete project.

### R09 — Project → ProjectLayerDefinition

**RELATIONSHIP:** Project → ProjectLayerDefinition.

**CARDINALITY:** 1:N; 0..N layers; exactly 1 project per layer.

**OWNER / DOMAIN OWNER:** Projects / Project.

**PARENT:** Project. **CHILD / REFERENCE:** ProjectLayerDefinition.

**REQUIRED/OPTIONAL:** Project required; set may be empty where existing rules permit.

**WHO CREATES RELATIONSHIP:** Existing authorized setup/layer edits.

**WHO MAY REMOVE/END IT:** Existing authorized layer removal.

**CHILD OUTLIVES PARENT?:** No.

**HISTORICAL REFERENCE RULE:** Layer changes cannot rewrite confirmed architecture or old captured labels.

**V1 BOUNDARY:** Structure organizes layers logically; existing layers belong directly to Project, no second parent.

## Sources

### R10 — Project → Source

**RELATIONSHIP:** Project → Source.

**CARDINALITY:** 1:N; 0..N sources; exactly 1 project per attached source.

**OWNER / DOMAIN OWNER:** Sources / Source; Project is scope.

**PARENT:** Project. **CHILD / REFERENCE:** Source.

**REQUIRED/OPTIONAL:** Project required after attachment.

**WHO CREATES RELATIONSHIP:** Existing authorized attachment/connect workflow.

**WHO MAY REMOVE/END IT:** Authorized source detachment; retain referenced provenance.

**CHILD OUTLIVES PARENT?:** No unrelated source outside project scope; retained historical source survives detachment.

**HISTORICAL REFERENCE RULE:** Referenced source identity/locators retained or marked unavailable.

**V1 BOUNDARY:** Do not move one Source between projects; separate attachments may share external board identity.

### R11 — Source → SourceReference

**RELATIONSHIP:** Source → SourceReference.

**CARDINALITY:** 1:N; 0..N locators; exactly 1 source per locator.

**OWNER / DOMAIN OWNER:** Sources / Source.

**PARENT:** Source. **CHILD / REFERENCE:** SourceReference.

**REQUIRED/OPTIONAL:** Source required.

**WHO CREATES RELATIONSHIP:** Validated ingestion/locator resolution.

**WHO MAY REMOVE/END IT:** Sources marks stale/unavailable; do not destroy referenced evidence.

**CHILD OUTLIVES PARENT?:** No independent origin; retain under archived source.

**HISTORICAL REFERENCE RULE:** Exact source revision/locator must stay stable.

**V1 BOUNDARY:** Frame, section, schema and item locators are not raw document copies.

### R12 — Source → IngestionRun

**RELATIONSHIP:** Source → IngestionRun.

**CARDINALITY:** 1:N; 0..N attempts; exactly 1 source per run.

**OWNER / DOMAIN OWNER:** Sources / Source.

**PARENT:** Source. **CHILD / REFERENCE:** IngestionRun.

**REQUIRED/OPTIONAL:** Source required; no ingestion prerequisite for mere attachment.

**WHO CREATES RELATIONSHIP:** Explicit processing/retry via authorized workflow.

**WHO MAY REMOVE/END IT:** Sources ends attempt/cancels under source policy.

**CHILD OUTLIVES PARENT?:** No independent source-less run.

**HISTORICAL REFERENCE RULE:** Keep attempt-to-input/output provenance required by accepted reconstruction.

**V1 BOUNDARY:** Retries do not create new confirmed architectures.

### R13 — IntegrationCredential → Source

**RELATIONSHIP:** IntegrationCredential → Source.

**CARDINALITY:** 1:N; 0..N connected sources per credential; source has 0..1 active credential binding.

**OWNER / DOMAIN OWNER:** Sources owns binding and credential lifecycle.

**PARENT:** IntegrationCredential. **CHILD / REFERENCE:** Source.

**REQUIRED/OPTIONAL:** Required only for connector reads needing credentials.

**WHO CREATES RELATIONSHIP:** Authorized connector connection.

**WHO MAY REMOVE/END IT:** Credential owner disconnects/revokes; source authority detaches.

**CHILD OUTLIVES PARENT?:** Either can be retained without active binding; file source needs none.

**HISTORICAL REFERENCE RULE:** Retain nonsecret integration provenance after revocation; secrets never published.

**V1 BOUNDARY:** One authorized account connection can support several project attachments; never place token in metadata.

### R14 — User / restricted uploading actor → StagedUpload

**RELATIONSHIP:** User / restricted uploading actor → StagedUpload.

**CARDINALITY:** 1:N; 0..N uploads per authorized actor; exactly 1 uploader per upload.

**OWNER / DOMAIN OWNER:** Sources / staged upload.

**PARENT:** User / restricted uploading actor. **CHILD / REFERENCE:** StagedUpload.

**REQUIRED/OPTIONAL:** Authenticated authorized uploader required; current Group 1 User behavior retained.

**WHO CREATES RELATIONSHIP:** Existing upload staging.

**WHO MAY REMOVE/END IT:** Uploader/authorized Sources cleanup.

**CHILD OUTLIVES PARENT?:** Temporary upload may expire; uploader attribution retained as required.

**HISTORICAL REFERENCE RULE:** If consumed, provenance continues on Source; transient staging is not evidence truth.

**V1 BOUNDARY:** No new guest upload capability is granted.

### R15 — Project → StagedUpload

**RELATIONSHIP:** Project → StagedUpload.

**CARDINALITY:** 1:N; 0..N consumed uploads per project; staged upload has 0..1 consuming project.

**OWNER / DOMAIN OWNER:** Sources owns staging; Projects coordinates attachment.

**PARENT:** Project. **CHILD / REFERENCE:** StagedUpload.

**REQUIRED/OPTIONAL:** No project before create; exactly 1 if consumed.

**WHO CREATES RELATIONSHIP:** Authorized atomic project creation/attachment.

**WHO MAY REMOVE/END IT:** Unconsumed expiry or explicit discard; consumption cannot be silently reassigned.

**CHILD OUTLIVES PARENT?:** Unconsumed stage has no parent project; consumed origin retains project scope.

**HISTORICAL REFERENCE RULE:** Attachment must not disappear when staging is cleaned.

**V1 BOUNDARY:** Project scope may be supplied for authorization before consumption, without ownership transfer.

### R16 — StagedUpload → Source

**RELATIONSHIP:** StagedUpload → Source.

**CARDINALITY:** 1:1 / 0..1; 0..1 resulting Source per staged upload; Source has 0..1 staged origin.

**OWNER / DOMAIN OWNER:** Sources.

**PARENT:** StagedUpload. **CHILD / REFERENCE:** Source.

**REQUIRED/OPTIONAL:** Optional: external connectors have no upload origin.

**WHO CREATES RELATIONSHIP:** Atomic stage consumption.

**WHO MAY REMOVE/END IT:** Sources expires staging after safe handoff.

**CHILD OUTLIVES PARENT?:** Source must outlive staging cleanup.

**HISTORICAL REFERENCE RULE:** Source retains durable artifact/origin identity independent of temporary stage.

**V1 BOUNDARY:** Single-use consumption; retry returns same attachment, not another Source.

### R17 — User as integration owner → IntegrationCredential

**RELATIONSHIP:** User as integration owner → IntegrationCredential.

**CARDINALITY:** 1:N; 0..N credentials per user; exactly 1 owning user per credential.

**OWNER / DOMAIN OWNER:** Sources / IntegrationCredential.

**PARENT:** User as integration owner. **CHILD / REFERENCE:** IntegrationCredential.

**REQUIRED/OPTIONAL:** Required private owner and authorized connector account.

**WHO CREATES RELATIONSHIP:** User-authorized connector connection.

**WHO MAY REMOVE/END IT:** Credential owner/Identity revocation policy.

**CHILD OUTLIVES PARENT?:** Secret usability cannot outlive valid authorization; nonsecret history can.

**HISTORICAL REFERENCE RULE:** Keep connector attribution; no historical token copies.

**V1 BOUNDARY:** No organization-wide credential-sharing product added.

## Architecture

### R18 — Project → Architecture

**RELATIONSHIP:** Project → Architecture.

**CARDINALITY:** 1:1 / 0..1; 0..1 before usable reconstruction; exactly 1 after architecture confirmation.

**OWNER / DOMAIN OWNER:** Architecture / Architecture; Project scopes it.

**PARENT:** Project. **CHILD / REFERENCE:** Architecture.

**REQUIRED/OPTIONAL:** Absent is valid pre-reconstruction; confirmation requires one.

**WHO CREATES RELATIONSHIP:** Authorized reconstruction creates candidate container.

**WHO MAY REMOVE/END IT:** Owner may abandon unconfirmed work; confirmed container retained/archived.

**CHILD OUTLIVES PARENT?:** No cross-project independent architecture; retain with project history.

**HISTORICAL REFERENCE RULE:** Confirmed identity cannot be replaced or retargeted.

**V1 BOUNDARY:** Another materially changed architecture requires another project.

### R19 — Architecture → ArchitectureVersion

**RELATIONSHIP:** Architecture → ArchitectureVersion.

**CARDINALITY:** 1:N; Exactly 1 root graph when reconstructed; 0..N documented inner graph records.

**OWNER / DOMAIN OWNER:** Architecture / Architecture.

**PARENT:** Architecture. **CHILD / REFERENCE:** ArchitectureVersion.

**REQUIRED/OPTIONAL:** Every version belongs to exactly 1 Architecture.

**WHO CREATES RELATIONSHIP:** Validated reconstruction; same root candidate promoted at confirmation.

**WHO MAY REMOVE/END IT:** Owner edits/discards candidate; confirmed graph set cannot be removed/changed.

**CHILD OUTLIVES PARENT?:** No.

**HISTORICAL REFERENCE RULE:** All confirmed root and inner references remain fixed.

**V1 BOUNDARY:** One active root candidate, zero confirmed roots before confirmation; one confirmed root afterward and no active candidate. V1 keeps no parallel/superseded root-version series; autosave/concurrency is not another version record.

### R20 — ArchitectureVersion → ArchitectureNode

**RELATIONSHIP:** ArchitectureVersion → ArchitectureNode.

**CARDINALITY:** 1:N; 0..N nodes; exactly 1 owning graph record per node.

**OWNER / DOMAIN OWNER:** Architecture / Architecture.

**PARENT:** ArchitectureVersion. **CHILD / REFERENCE:** ArchitectureNode.

**REQUIRED/OPTIONAL:** Owning graph required; usable reconstruction requires meaningful content.

**WHO CREATES RELATIONSHIP:** Validated import; owner candidate correction.

**WHO MAY REMOVE/END IT:** Owner candidate deletion only, with valid edge cleanup/Undo.

**CHILD OUTLIVES PARENT?:** No.

**HISTORICAL REFERENCE RULE:** Confirmed node identity/content stable; rename before acceptance preserves identity.

**V1 BOUNDARY:** No sharing mutable node rows between root/inner graph scopes.

### R21 — ArchitectureVersion → ArchitectureConnection

**RELATIONSHIP:** ArchitectureVersion → ArchitectureConnection.

**CARDINALITY:** 1:N; 0..N connections; exactly 1 graph per connection.

**OWNER / DOMAIN OWNER:** Architecture / Architecture.

**PARENT:** ArchitectureVersion. **CHILD / REFERENCE:** ArchitectureConnection.

**REQUIRED/OPTIONAL:** Graph and valid endpoints required.

**WHO CREATES RELATIONSHIP:** Validated import; owner candidate connector action.

**WHO MAY REMOVE/END IT:** Owner candidate deletion only.

**CHILD OUTLIVES PARENT?:** No.

**HISTORICAL REFERENCE RULE:** Confirmed connections/endpoints stable.

**V1 BOUNDARY:** An empty edge set can be valid; no fabricated connections for visual completeness.

### R22 — ArchitectureNode as source endpoint → ArchitectureConnection

**RELATIONSHIP:** ArchitectureNode as source endpoint → ArchitectureConnection.

**CARDINALITY:** 1:N; 0..N outgoing edges per node; exactly 1 source node per edge.

**OWNER / DOMAIN OWNER:** Architecture / Architecture.

**PARENT:** ArchitectureNode as source endpoint. **CHILD / REFERENCE:** ArchitectureConnection.

**REQUIRED/OPTIONAL:** Required for every canonical connection.

**WHO CREATES RELATIONSHIP:** Validated import or owner candidate action.

**WHO MAY REMOVE/END IT:** Owner candidate edge/node removal only.

**CHILD OUTLIVES PARENT?:** Edge cannot exist with missing source.

**HISTORICAL REFERENCE RULE:** Historical endpoint identity retained in confirmed graph.

**V1 BOUNDARY:** Endpoints must be in the connection owning graph.

### R23 — ArchitectureNode as destination endpoint → ArchitectureConnection

**RELATIONSHIP:** ArchitectureNode as destination endpoint → ArchitectureConnection.

**CARDINALITY:** 1:N; 0..N incoming edges per node; exactly 1 destination node per edge.

**OWNER / DOMAIN OWNER:** Architecture / Architecture.

**PARENT:** ArchitectureNode as destination endpoint. **CHILD / REFERENCE:** ArchitectureConnection.

**REQUIRED/OPTIONAL:** Required for every canonical connection.

**WHO CREATES RELATIONSHIP:** Validated import or owner candidate action.

**WHO MAY REMOVE/END IT:** Owner candidate edge/node removal only.

**CHILD OUTLIVES PARENT?:** Edge cannot exist with missing destination.

**HISTORICAL REFERENCE RULE:** Historical endpoint identity retained in confirmed graph.

**V1 BOUNDARY:** Source/destination roles are distinct, not an implicit N:M graph association table.

### R24 — ArchitectureNode → InnerArchitectureReference → inner ArchitectureVersion

**RELATIONSHIP:** ArchitectureNode → InnerArchitectureReference → inner ArchitectureVersion.

**CARDINALITY:** 1:1 / 0..1; 0..1 inner link per node; each inner graph has exactly 1 parent link.

**OWNER / DOMAIN OWNER:** Architecture / Architecture.

**PARENT:** ArchitectureNode. **CHILD / REFERENCE:** InnerArchitectureReference → inner ArchitectureVersion.

**REQUIRED/OPTIONAL:** Optional; only with documented imported depth.

**WHO CREATES RELATIONSHIP:** Validated source-backed reconstruction.

**WHO MAY REMOVE/END IT:** Candidate correction/import repair only; confirmed links fixed.

**CHILD OUTLIVES PARENT?:** Inner graph cannot be independently repurposed or orphaned.

**HISTORICAL REFERENCE RULE:** Keep explicit child reference, provenance and graph identity; unavailable does not fabricate replacement.

**V1 BOUNDARY:** V1 chooses a containment tree, not multiple alternative inner views/shared child graphs. Child belongs to same Architecture; no cycles. All imported descendants freeze with the single confirmation.

### R25 — ArchitectureVersion / its nodes or connections → SourceReference via owned provenance

**RELATIONSHIP:** ArchitectureVersion / its nodes or connections → SourceReference via owned provenance.

**CARDINALITY:** N:M; 0..N evidence refs per graph/element; locator may support 0..N graph elements.

**OWNER / DOMAIN OWNER:** Architecture owns attribution references; Sources owns locators.

**PARENT:** ArchitectureVersion / its nodes or connections. **CHILD / REFERENCE:** SourceReference via owned provenance.

**REQUIRED/OPTIONAL:** Source-backed claims require actual grounding; manual candidate additions may have none.

**WHO CREATES RELATIONSHIP:** Validated reconstruction or explicit owner evidence association.

**WHO MAY REMOVE/END IT:** Candidate owner may change; accepted provenance fixed.

**CHILD OUTLIVES PARENT?:** SourceReference independent of graph consumer; referenced origin retained.

**HISTORICAL REFERENCE RULE:** Pin exact locator/revision; inaccessible evidence remains identified/unavailable.

**V1 BOUNDARY:** No new provenance table promised: owned provenance references under existing graph owners; several Sources may contribute to one architecture.

## Knowledge

### R26 — Project → KnowledgeItem

**RELATIONSHIP:** Project → KnowledgeItem.

**CARDINALITY:** 1:N; 0..N items per project; item has 0..1 project scope.

**OWNER / DOMAIN OWNER:** Knowledge / KnowledgeItem.

**PARENT:** Project. **CHILD / REFERENCE:** KnowledgeItem.

**REQUIRED/OPTIONAL:** Optional for standalone My Space; required if attached to project architecture/meeting.

**WHO CREATES RELATIONSHIP:** Authorized author saves own content; approved project retention.

**WHO MAY REMOVE/END IT:** Author controls private content; authorized project lifecycle controls retained content.

**CHILD OUTLIVES PARENT?:** Private item may outlive meeting; scoped historical item retained with project.

**HISTORICAL REFERENCE RULE:** Archive/unavailable preserves intentional accepted publications; do not expose private originals.

**V1 BOUNDARY:** Project association is scope, not public visibility.

### R27 — User or scoped guest author → KnowledgeItem

**RELATIONSHIP:** User or scoped guest author → KnowledgeItem.

**CARDINALITY:** 1:N; 0..N authored items; exactly 1 author principal per item.

**OWNER / DOMAIN OWNER:** Knowledge / KnowledgeItem.

**PARENT:** User or scoped guest author. **CHILD / REFERENCE:** KnowledgeItem.

**REQUIRED/OPTIONAL:** Author required; guest limited to invited context.

**WHO CREATES RELATIONSHIP:** Actor deliberately saves/dictates content.

**WHO MAY REMOVE/END IT:** Actor edits own private original within access; project authority only retained shared scope.

**CHILD OUTLIVES PARENT?:** Item attribution can outlive principal access; no loss on meeting exit.

**HISTORICAL REFERENCE RULE:** Stable author reference; identity deactivation not reassignment.

**V1 BOUNDARY:** One principal abstraction, no duplicate guest-as-user or automatic project grant.

### R28 — KnowledgeItem → Semantic context target through KnowledgeContext

**RELATIONSHIP:** KnowledgeItem → Semantic context target through KnowledgeContext.

**CARDINALITY:** N:M; 0..N contexts per item; 0..N items per semantic target.

**OWNER / DOMAIN OWNER:** Knowledge / KnowledgeItem owns association.

**PARENT:** KnowledgeItem. **CHILD / REFERENCE:** Semantic context target through KnowledgeContext.

**REQUIRED/OPTIONAL:** Each attachment has exactly 1 item and 1 captured target value.

**WHO CREATES RELATIONSHIP:** Authorized author/retention workflow attaches context.

**WHO MAY REMOVE/END IT:** Content authority removes current attachment; protected historical refs retained.

**CHILD OUTLIVES PARENT?:** Target independent; association needs its item.

**HISTORICAL REFERENCE RULE:** Pinned scope includes graph identity, selected/internal/boundary roles; changing current attachments cannot retarget captures.

**V1 BOUNDARY:** KnowledgeItem → KnowledgeContext rows is physically 1:N, not N:M between two content entities. N:M is item ↔ semantic target; no global Context table.

### R29 — User or scoped guest creator → Snapshot

**RELATIONSHIP:** User or scoped guest creator → Snapshot.

**CARDINALITY:** 1:N; 0..N snapshots; exactly 1 creator per snapshot.

**OWNER / DOMAIN OWNER:** Knowledge / Snapshot.

**PARENT:** User or scoped guest creator. **CHILD / REFERENCE:** Snapshot.

**REQUIRED/OPTIONAL:** Creator required.

**WHO CREATES RELATIONSHIP:** Explicit Snapshot action.

**WHO MAY REMOVE/END IT:** Creator/authorized retention policy.

**CHILD OUTLIVES PARENT?:** Snapshot can outlive meeting/session and creator access.

**HISTORICAL REFERENCE RULE:** Preserve original capture identity/context; no silent retarget.

**V1 BOUNDARY:** Private by default; optional image artifact is not identity.

### R30 — Project → Snapshot

**RELATIONSHIP:** Project → Snapshot.

**CARDINALITY:** 1:N; 0..N snapshots; snapshot has 0..1 project scope.

**OWNER / DOMAIN OWNER:** Knowledge / Snapshot.

**PARENT:** Project. **CHILD / REFERENCE:** Snapshot.

**REQUIRED/OPTIONAL:** Required when capture includes a project architecture.

**WHO CREATES RELATIONSHIP:** Explicit contextual capture.

**WHO MAY REMOVE/END IT:** Authorized archive/retention; not meeting end.

**CHILD OUTLIVES PARENT?:** Snapshot survives meeting and source authoring changes.

**HISTORICAL REFERENCE RULE:** Keep original graph/screen/session references.

**V1 BOUNDARY:** No canonical context from different projects merged into one V1 capture.

### R31 — KnowledgeItem → Snapshot through contextual reference

**RELATIONSHIP:** KnowledgeItem → Snapshot through contextual reference.

**CARDINALITY:** N:M; 0..N snapshot refs per item; 0..N items per snapshot.

**OWNER / DOMAIN OWNER:** Knowledge; association uses KnowledgeContext target semantics.

**PARENT:** KnowledgeItem. **CHILD / REFERENCE:** Snapshot through contextual reference.

**REQUIRED/OPTIONAL:** Optional; each intentional reference resolves one stable capture.

**WHO CREATES RELATIONSHIP:** Author explicitly attaches snapshot/evidence.

**WHO MAY REMOVE/END IT:** Authorized author removes current attachment; accepted capture keeps its refs.

**CHILD OUTLIVES PARENT?:** Snapshot and item independent.

**HISTORICAL REFERENCE RULE:** Private Snapshot cannot become readable merely because its ID is referenced.

**V1 BOUNDARY:** Reuse KnowledgeContext; no extra SnapshotAttachment candidate. Sharing requires bounded publication of authorized content.

### R32 — KnowledgeItem → SourceReference through evidence/context

**RELATIONSHIP:** KnowledgeItem → SourceReference through evidence/context.

**CARDINALITY:** N:M; 0..N source refs per item; 0..N items per locator.

**OWNER / DOMAIN OWNER:** Knowledge owns attachment; Sources owns reference.

**PARENT:** KnowledgeItem. **CHILD / REFERENCE:** SourceReference through evidence/context.

**REQUIRED/OPTIONAL:** Optional; evidence claims must identify grounding.

**WHO CREATES RELATIONSHIP:** Author/evidence workflow explicitly attaches authorized origin.

**WHO MAY REMOVE/END IT:** Knowledge content authority changes current refs.

**CHILD OUTLIVES PARENT?:** Source independent; item retains historical source attribution.

**HISTORICAL REFERENCE RULE:** Revision pinning and access checks; unavailable does not mean replacement.

**V1 BOUNDARY:** Use KnowledgeContext/provenance owned values; no copied document store.

### R70 — Snapshot → Meeting publications / frozen review contexts

**RELATIONSHIP:** Snapshot → Meeting publications / frozen review contexts.

**CARDINALITY:** N:M; 0..N authorized capture/publication references per Snapshot; each meeting/review may reference 0..N snapshots.

**OWNER / DOMAIN OWNER:** Knowledge owns Snapshot; Meetings/Outcomes own referencing capture values.

**PARENT:** Snapshot. **CHILD / REFERENCE:** Meeting publications / frozen review contexts.

**REQUIRED/OPTIONAL:** Optional; meeting visibility requires intentional publication or approved prepared context.

**WHO CREATES RELATIONSHIP:** Explicit share or approved capture/retention.

**WHO MAY REMOVE/END IT:** Authorized current reference removal; protected frozen/accepted references retained.

**CHILD OUTLIVES PARENT?:** Snapshot can outlive any meeting; frozen published representation can survive private source unavailability.

**HISTORICAL REFERENCE RULE:** Pin original Snapshot identity and intended capture revision; never substitute current viewport.

**V1 BOUNDARY:** No new join table: use SharedMeetingItem publication and owned frozen/review context refs. Repeated use never transfers private ownership.

## Presentations

### R33 — Project → Presentation

**RELATIONSHIP:** Project → Presentation.

**CARDINALITY:** 1:N; 0..N presentations; exactly 1 project per presentation.

**OWNER / DOMAIN OWNER:** Presentations / Presentation.

**PARENT:** Project. **CHILD / REFERENCE:** Presentation.

**REQUIRED/OPTIONAL:** Project and confirmed architecture required.

**WHO CREATES RELATIONSHIP:** Project Owner creates setup draft.

**WHO MAY REMOVE/END IT:** Owner archives/discards subject to autosave safeguards.

**CHILD OUTLIVES PARENT?:** No cross-project independent package; past meetings retain start snapshot.

**HISTORICAL REFERENCE RULE:** Historical meetings survive future authoring/archive.

**V1 BOUNDARY:** Scoped collaboration does not confer owner publication authority.

### R34 — Confirmed Architecture → Presentation

**RELATIONSHIP:** Confirmed Architecture → Presentation.

**CARDINALITY:** 1:N; 0..N presentations per Architecture; exactly 1 confirmed root per presentation.

**OWNER / DOMAIN OWNER:** Presentations owns reference; Architecture owns graph.

**PARENT:** Confirmed Architecture. **CHILD / REFERENCE:** Presentation.

**REQUIRED/OPTIONAL:** Always required including setup draft.

**WHO CREATES RELATIONSHIP:** Owner creates from confirmed architecture.

**WHO MAY REMOVE/END IT:** No V1 retarget; discard/new presentation as authorized.

**CHILD OUTLIVES PARENT?:** Presentation depends on retained architecture; neither owns the other graph.

**HISTORICAL REFERENCE RULE:** Pin root/inner graph family; every screen stays in same architecture.

**V1 BOUNDARY:** Does not own a canonical copy.

### R35 — Presentation → PresentationScreen

**RELATIONSHIP:** Presentation → PresentationScreen.

**CARDINALITY:** 1:N; 1..N screens; exactly 1 presentation per screen.

**OWNER / DOMAIN OWNER:** Presentations / Presentation.

**PARENT:** Presentation. **CHILD / REFERENCE:** PresentationScreen.

**REQUIRED/OPTIONAL:** Exactly 1 Main Architecture/base row plus 0..N authored screens.

**WHO CREATES RELATIONSHIP:** Base initialized with presentation; authorized preparation creates extras.

**WHO MAY REMOVE/END IT:** Owner/scoped authorized preparation removes extras; base not removable.

**CHILD OUTLIVES PARENT?:** No independent screen lifecycle outside package; meeting snapshot survives authoring deletion.

**HISTORICAL REFERENCE RULE:** Meeting-start confirmed definitions remain fixed independently.

**V1 BOUNDARY:** Base is a normal screen record with whole-model scope, always usable from confirmed architecture; no scenario-AI wizard needed for base.

### R36 — Presentation → ActorRef through PresentationAccessGrant

**RELATIONSHIP:** Presentation → ActorRef through PresentationAccessGrant.

**CARDINALITY:** N:M; 0..N grantees per presentation; actor can access 0..N eligible presentations.

**OWNER / DOMAIN OWNER:** Presentations / Presentation.

**PARENT:** Presentation. **CHILD / REFERENCE:** ActorRef through PresentationAccessGrant.

**REQUIRED/OPTIONAL:** Each grant binds one presentation and one registered or scoped guest actor.

**WHO CREATES RELATIONSHIP:** Owner explicitly grants; accepted scoped invitation binds recipient.

**WHO MAY REMOVE/END IT:** Owner revokes; Identity can invalidate session, not silently broaden grant.

**CHILD OUTLIVES PARENT?:** Actor independent; grant ends with scope/access validity.

**HISTORICAL REFERENCE RULE:** Past authored attribution retained after grant ends.

**V1 BOUNDARY:** Guest scope still limits apparent reuse; no project/editor/meeting membership implied.

### R37 — Presentation → PresentationInvitation

**RELATIONSHIP:** Presentation → PresentationInvitation.

**CARDINALITY:** 1:N; 0..N invitations; exactly 1 presentation per invitation.

**OWNER / DOMAIN OWNER:** Presentations / Presentation.

**PARENT:** Presentation. **CHILD / REFERENCE:** PresentationInvitation.

**REQUIRED/OPTIONAL:** Presentation and intended recipient required.

**WHO CREATES RELATIONSHIP:** Explicit owner send, never autosave.

**WHO MAY REMOVE/END IT:** Owner cancels; recipient declines; lifecycle expires.

**CHILD OUTLIVES PARENT?:** No standalone invitation outside presentation.

**HISTORICAL REFERENCE RULE:** Retain admission/invite attribution as required; revoked invite cannot grant later.

**V1 BOUNDARY:** One intended recipient per invitation; retries do not duplicate sends/grants.

### R38 — PresentationInvitation → PresentationAccessGrant

**RELATIONSHIP:** PresentationInvitation → PresentationAccessGrant.

**CARDINALITY:** 1:1 / 0..1; 0..1 resulting grant per invitation; grant has 0..1 originating invitation.

**OWNER / DOMAIN OWNER:** Presentations / Presentation.

**PARENT:** PresentationInvitation. **CHILD / REFERENCE:** PresentationAccessGrant.

**REQUIRED/OPTIONAL:** Optional: direct registered-user grant needs no invite.

**WHO CREATES RELATIONSHIP:** Validated recipient acceptance.

**WHO MAY REMOVE/END IT:** Owner revokes grant/invitation by scope policy.

**CHILD OUTLIVES PARENT?:** Grant may remain after invite expiry once validly accepted; source attribution retained.

**HISTORICAL REFERENCE RULE:** Revocation/expiry cannot rewrite who was admitted.

**V1 BOUNDARY:** No one invitation grants multiple people.

### R39 — PresentationScreen → KnowledgeItem through PresentationScreenKnowledgeReference

**RELATIONSHIP:** PresentationScreen → KnowledgeItem through PresentationScreenKnowledgeReference.

**CARDINALITY:** N:M; 0..N items per screen; 0..N screens per item.

**OWNER / DOMAIN OWNER:** Presentations / Presentation owns association.

**PARENT:** PresentationScreen. **CHILD / REFERENCE:** KnowledgeItem through PresentationScreenKnowledgeReference.

**REQUIRED/OPTIONAL:** Association requires exactly 1 screen and 1 permitted item.

**WHO CREATES RELATIONSHIP:** Explicit Add to Discussion/authorized preparation.

**WHO MAY REMOVE/END IT:** Authorized preparation removes inclusion.

**CHILD OUTLIVES PARENT?:** Knowledge independent of screen; inclusion cannot outlive screen authoring.

**HISTORICAL REFERENCE RULE:** Meeting pins authorized included content revision or stable protected reference.

**V1 BOUNDARY:** No unrestricted live pointer to a private item; preparation reference alone is not public sharing.

### R40 — PresentationScreen → VisualOverride owned values

**RELATIONSHIP:** PresentationScreen → VisualOverride owned values.

**CARDINALITY:** 1:N; 0..N overrides; each belongs to exactly 1 screen.

**OWNER / DOMAIN OWNER:** Presentations / Presentation.

**PARENT:** PresentationScreen. **CHILD / REFERENCE:** VisualOverride owned values.

**REQUIRED/OPTIONAL:** Optional; one current value per target/property.

**WHO CREATES RELATIONSHIP:** Authorized manual setting or explicit AI Apply.

**WHO MAY REMOVE/END IT:** Authorized reset/removal.

**CHILD OUTLIVES PARENT?:** No; captured meeting definitions independent.

**HISTORICAL REFERENCE RULE:** Target/property meaning pinned in start snapshot.

**V1 BOUNDARY:** One target can have many different properties; same override object never shared across screens.

### R41 — PresentationScreen → ScenarioOverlayConnection

**RELATIONSHIP:** PresentationScreen → ScenarioOverlayConnection.

**CARDINALITY:** 1:N; 0..N overlays; exactly 1 screen per overlay.

**OWNER / DOMAIN OWNER:** Presentations / Presentation.

**PARENT:** PresentationScreen. **CHILD / REFERENCE:** ScenarioOverlayConnection.

**REQUIRED/OPTIONAL:** Screen plus 2 valid node endpoints required.

**WHO CREATES RELATIONSHIP:** Explicit accepted scenario authoring/AI Apply.

**WHO MAY REMOVE/END IT:** Authorized screen editing/reset.

**CHILD OUTLIVES PARENT?:** No; never reused as same owned object in another screen.

**HISTORICAL REFERENCE RULE:** Snapshot protects accepted scenario definition.

**V1 BOUNDARY:** Endpoints refer to same canonical architecture family and explicit scope; no canonical edge mutation or extra fictitious architecture.

### R42 — PresentationScreen → CapturedSemanticScope

**RELATIONSHIP:** PresentationScreen → CapturedSemanticScope.

**CARDINALITY:** 1:1 / 0..1; Exactly 1 current semantic scope per screen.

**OWNER / DOMAIN OWNER:** Presentations / Presentation.

**PARENT:** PresentationScreen. **CHILD / REFERENCE:** CapturedSemanticScope.

**REQUIRED/OPTIONAL:** WHOLE default; explicit selection otherwise.

**WHO CREATES RELATIONSHIP:** Setup/preparation default or explicit lasso Next.

**WHO MAY REMOVE/END IT:** Authorized scope change; preserve meaningful draft.

**CHILD OUTLIVES PARENT?:** No independent scope lifecycle.

**HISTORICAL REFERENCE RULE:** Captured meetings retain former selection/internal/boundary refs.

**V1 BOUNDARY:** Main Architecture base is WHOLE; lasso changes context, never canonical topology.

## Meetings

### R43 — Project → Meeting

**RELATIONSHIP:** Project → Meeting.

**CARDINALITY:** 1:N; 0..N meetings; exactly 1 project, derived consistently from presentation.

**OWNER / DOMAIN OWNER:** Meetings / Meeting.

**PARENT:** Project. **CHILD / REFERENCE:** Meeting.

**REQUIRED/OPTIONAL:** Project is required scope; not an additional selectable architecture.

**WHO CREATES RELATIONSHIP:** Project Owner creates.

**WHO MAY REMOVE/END IT:** Project Owner cancels/ends/archives.

**CHILD OUTLIVES PARENT?:** Retained meeting remains with project history; not independent cross-project session.

**HISTORICAL REFERENCE RULE:** Preserve scope despite authoring/ownership account state changes.

**V1 BOUNDARY:** No independent second project choice; any stored scope must agree with presentation.

### R44 — Presentation → Meeting

**RELATIONSHIP:** Presentation → Meeting.

**CARDINALITY:** 1:N; 0..N meetings per presentation; exactly 1 presentation per meeting.

**OWNER / DOMAIN OWNER:** Meetings / Meeting.

**PARENT:** Presentation. **CHILD / REFERENCE:** Meeting.

**REQUIRED/OPTIONAL:** Required.

**WHO CREATES RELATIONSHIP:** Owner creates immediate/scheduled meeting.

**WHO MAY REMOVE/END IT:** Owner cancels/ends; no presentation switching for live meeting.

**CHILD OUTLIVES PARENT?:** Meeting capture survives later presentation archive/edit.

**HISTORICAL REFERENCE RULE:** Freeze eligible state at START, not scheduling time.

**V1 BOUNDARY:** Reusable presentation; never one meeting per screen.

### R45 — Project Owner / Architect User → Meeting

**RELATIONSHIP:** Project Owner / Architect User → Meeting.

**CARDINALITY:** 1:N; 0..N owned meetings per user; exactly 1 owner per meeting.

**OWNER / DOMAIN OWNER:** Meetings owns owner reference; Projects supplies authority.

**PARENT:** Project Owner / Architect User. **CHILD / REFERENCE:** Meeting.

**REQUIRED/OPTIONAL:** Must match owning project authority.

**WHO CREATES RELATIONSHIP:** Project Owner creates and is default presenter.

**WHO MAY REMOVE/END IT:** Only Project Owner ends; presenter transfer cannot end ownership.

**CHILD OUTLIVES PARENT?:** Retain attribution after account deactivation; no orphan authority invented.

**HISTORICAL REFERENCE RULE:** Meeting owner and temporary presenter stay separate.

**V1 BOUNDARY:** No ownership-transfer workflow introduced.

### R46 — Meeting → ActorRef through MeetingParticipant

**RELATIONSHIP:** Meeting → ActorRef through MeetingParticipant.

**CARDINALITY:** N:M; 0..N admitted actors before start; LIVE includes owner; actor may attend multiple eligible meetings.

**OWNER / DOMAIN OWNER:** Meetings / Meeting.

**PARENT:** Meeting. **CHILD / REFERENCE:** ActorRef through MeetingParticipant.

**REQUIRED/OPTIONAL:** Each participant binds exactly 1 meeting and 1 principal.

**WHO CREATES RELATIONSHIP:** Authorized admission/owner initialization; guest from invited scope.

**WHO MAY REMOVE/END IT:** Owner admission policy or participant leave; Identity invalidates session.

**CHILD OUTLIVES PARENT?:** Actor independent; participant retained under meeting.

**HISTORICAL REFERENCE RULE:** One participant per meeting/principal, reconnect reuses record; presence not a new row.

**V1 BOUNDARY:** Guest has stable restricted principal, no duplicate registered-user identity; historical presence is not current access.

### R47 — Meeting → MeetingInvitation

**RELATIONSHIP:** Meeting → MeetingInvitation.

**CARDINALITY:** 1:N; 0..N invitations; exactly 1 meeting per invitation.

**OWNER / DOMAIN OWNER:** Meetings / Meeting.

**PARENT:** Meeting. **CHILD / REFERENCE:** MeetingInvitation.

**REQUIRED/OPTIONAL:** Meeting and intended recipient required.

**WHO CREATES RELATIONSHIP:** Explicit owner send.

**WHO MAY REMOVE/END IT:** Owner cancels; recipient declines; expiry.

**CHILD OUTLIVES PARENT?:** No independent invitation outside meeting.

**HISTORICAL REFERENCE RULE:** Retain invitation provenance without granting ongoing access.

**V1 BOUNDARY:** Presentation collaborators are candidates, not automatically admitted participants.

### R48 — MeetingInvitation → MeetingParticipant

**RELATIONSHIP:** MeetingInvitation → MeetingParticipant.

**CARDINALITY:** 1:1 / 0..1; 0..1 resulting participant per invitation; participant has 0..1 originating invitation.

**OWNER / DOMAIN OWNER:** Meetings / Meeting.

**PARENT:** MeetingInvitation. **CHILD / REFERENCE:** MeetingParticipant.

**REQUIRED/OPTIONAL:** Optional: owner/direct permitted admission may lack invite.

**WHO CREATES RELATIONSHIP:** Validated invitation acceptance.

**WHO MAY REMOVE/END IT:** Admission authority ends access; recipient may leave.

**CHILD OUTLIVES PARENT?:** Participant history can outlive invitation validity.

**HISTORICAL REFERENCE RULE:** Retries/reinvite reconnect to same meeting/principal admission.

**V1 BOUNDARY:** Invitation is not itself participation or presenter authority.

### R49 — Meeting → SharedMeetingItem

**RELATIONSHIP:** Meeting → SharedMeetingItem.

**CARDINALITY:** 1:N; 0..N publications; exactly 1 meeting per publication.

**OWNER / DOMAIN OWNER:** Meetings / Meeting owns publication.

**PARENT:** Meeting. **CHILD / REFERENCE:** SharedMeetingItem.

**REQUIRED/OPTIONAL:** Meeting and sharing principal required.

**WHO CREATES RELATIONSHIP:** Explicit authorized Share to Meeting or explicit shared item creation.

**WHO MAY REMOVE/END IT:** Authorized explicit update/withdrawal under meeting phase; end freezes capture.

**CHILD OUTLIVES PARENT?:** Publication retained under ended meeting; cannot migrate as same record to another meeting.

**HISTORICAL REFERENCE RULE:** Intended content revision stable; withdrawn current view does not rewrite frozen review basis.

**V1 BOUNDARY:** One private original can publish independently to many meetings.

### R50 — KnowledgeItem or Snapshot private original → SharedMeetingItem

**RELATIONSHIP:** KnowledgeItem or Snapshot private original → SharedMeetingItem.

**CARDINALITY:** 1:N; 0..N independent publications per original; publication has 0..1 private origin.

**OWNER / DOMAIN OWNER:** Meetings publication; Knowledge original remains separately owned.

**PARENT:** KnowledgeItem or Snapshot private original. **CHILD / REFERENCE:** SharedMeetingItem.

**REQUIRED/OPTIONAL:** Private-origin share requires exactly 1 origin; directly shared item may have none.

**WHO CREATES RELATIONSHIP:** Original owner explicitly shares permitted content.

**WHO MAY REMOVE/END IT:** Original owner edits/deletes private source; publication update must be explicit.

**CHILD OUTLIVES PARENT?:** Publication can outlive original availability/access.

**HISTORICAL REFERENCE RULE:** Preserve bounded intended content, author and source revision; private edits/history never synchronize.

**V1 BOUNDARY:** Each publication has one primary authored origin or intentional direct-input provenance; supplemental refs are captured context.

### R51 — MeetingParticipant → ParticipantPrivateState

**RELATIONSHIP:** MeetingParticipant → ParticipantPrivateState.

**CARDINALITY:** 1:1 / 0..1; 0..1 meaningful private checkpoint per participant.

**OWNER / DOMAIN OWNER:** Meetings private-state boundary / actor.

**PARENT:** MeetingParticipant. **CHILD / REFERENCE:** ParticipantPrivateState.

**REQUIRED/OPTIONAL:** Optional until private exploration.

**WHO CREATES RELATIONSHIP:** Participant explicitly explores; semantic recovery checkpoint.

**WHO MAY REMOVE/END IT:** Same actor updates/resets; expiry policy does not erase My Space.

**CHILD OUTLIVES PARENT?:** No; notes/snapshots are independent Knowledge roots.

**HISTORICAL REFERENCE RULE:** No shared broadcast; Return to Live resolves current shared state.

**V1 BOUNDARY:** Never store high-frequency hand/gaze streams.

### R52 — Meeting → Current presenter reference

**RELATIONSHIP:** Meeting → Current presenter reference.

**CARDINALITY:** 1:1 / 0..1; 0..1 designated presenter overall; exactly 1 while LIVE.

**OWNER / DOMAIN OWNER:** Meetings / Meeting.

**PARENT:** Meeting. **CHILD / REFERENCE:** Current presenter reference.

**REQUIRED/OPTIONAL:** LIVE presenter must be admitted participant.

**WHO CREATES RELATIONSHIP:** Owner default; accepted intended-recipient transfer.

**WHO MAY REMOVE/END IT:** Owner Take Back/end; temporary presenter departure restores owner.

**CHILD OUTLIVES PARENT?:** Pointer cannot outlive meeting authority phase.

**HISTORICAL REFERENCE RULE:** Capture actor attribution as required; no presenter history product.

**V1 BOUNDARY:** Logical owner authority remains even if owner is offline; fallback to owner identity does not grant another participant control.

### R53 — Meeting → MeetingSharedState

**RELATIONSHIP:** Meeting → MeetingSharedState.

**CARDINALITY:** 1:1 / 0..1; 0..1 shared checkpoint; exactly 1 once started.

**OWNER / DOMAIN OWNER:** Meetings / Meeting.

**PARENT:** Meeting. **CHILD / REFERENCE:** MeetingSharedState.

**REQUIRED/OPTIONAL:** Initialized at start; retained at end.

**WHO CREATES RELATIONSHIP:** Start and authorized presenter navigation.

**WHO MAY REMOVE/END IT:** Owner end freezes final state; authorized navigation replaces current value.

**CHILD OUTLIVES PARENT?:** No independent state record.

**HISTORICAL REFERENCE RULE:** Keep accepted semantic state separately from private checkpoints.

**V1 BOUNDARY:** One stream of accepted stage authority, not multiple presenters.

### R54 — Meeting → PresenterTransferRequest

**RELATIONSHIP:** Meeting → PresenterTransferRequest.

**CARDINALITY:** 1:1 / 0..1; 0..1 pending request; exactly 1 intended recipient per request.

**OWNER / DOMAIN OWNER:** Meetings / Meeting.

**PARENT:** Meeting. **CHILD / REFERENCE:** PresenterTransferRequest.

**REQUIRED/OPTIONAL:** Optional; only LIVE with valid current presenter and admitted receiver.

**WHO CREATES RELATIONSHIP:** Current presenter explicitly requests eligible recipient.

**WHO MAY REMOVE/END IT:** Recipient accepts/declines; owner take-back/end/disconnect invalidates.

**CHILD OUTLIVES PARENT?:** No.

**HISTORICAL REFERENCE RULE:** Stale acceptance cannot restore ended request; no queue retention requirement.

**V1 BOUNDARY:** Guest receiver requires owner permission; transfers no owner rights.

### R55 — Meeting → OwnerPresentationReturnCheckpoint

**RELATIONSHIP:** Meeting → OwnerPresentationReturnCheckpoint.

**CARDINALITY:** 1:1 / 0..1; 0..1 meaningful owner return checkpoint.

**OWNER / DOMAIN OWNER:** Meetings / Meeting.

**PARENT:** Meeting. **CHILD / REFERENCE:** OwnerPresentationReturnCheckpoint.

**REQUIRED/OPTIONAL:** Optional until relevant handoff.

**WHO CREATES RELATIONSHIP:** Owner/current authorized handoff saves owner position.

**WHO MAY REMOVE/END IT:** Owner updates/clears; meeting lifecycle.

**CHILD OUTLIVES PARENT?:** No.

**HISTORICAL REFERENCE RULE:** Separate from participant Return to Live; no nested checkpoint stack.

**V1 BOUNDARY:** Meaningful screen/focus/depth only.

### R56 — Meeting → MeetingPresentationSnapshot

**RELATIONSHIP:** Meeting → MeetingPresentationSnapshot.

**CARDINALITY:** 1:1 / 0..1; 0 before start; exactly 1 after successful start.

**OWNER / DOMAIN OWNER:** Meetings / Meeting.

**PARENT:** Meeting. **CHILD / REFERENCE:** MeetingPresentationSnapshot.

**REQUIRED/OPTIONAL:** Required for LIVE and ended started meeting.

**WHO CREATES RELATIONSHIP:** Validated start captures confirmed definitions.

**WHO MAY REMOVE/END IT:** No silent replacement; retain after end.

**CHILD OUTLIVES PARENT?:** No independent sessionless snapshot; survives authoring source changes.

**HISTORICAL REFERENCE RULE:** Main Architecture + confirmed screens at start only; draft edits excluded.

**V1 BOUNDARY:** Contains definitions or immutable refs, not another canonical graph.

### R57 — Meeting → FrozenMeetingCapture

**RELATIONSHIP:** Meeting → FrozenMeetingCapture.

**CARDINALITY:** 1:1 / 0..1; 0 before end; exactly 1 after successful end of LIVE meeting.

**OWNER / DOMAIN OWNER:** Meetings / Meeting.

**PARENT:** Meeting. **CHILD / REFERENCE:** FrozenMeetingCapture.

**REQUIRED/OPTIONAL:** Required before review; canceled unstarted meeting has none.

**WHO CREATES RELATIONSHIP:** Owner-confirmed End Meeting freezes eligible structured input.

**WHO MAY REMOVE/END IT:** No review edit mutates capture.

**CHILD OUTLIVES PARENT?:** Retain with ended meeting; consumer review independent.

**HISTORICAL REFERENCE RULE:** Only shared/intentional items and exact revisions; no unshared My Space/audio.

**V1 BOUNDARY:** Ending/start retries never create multiple captures.

## Outcomes

### R58 — Meeting → MeetingReview

**RELATIONSHIP:** Meeting → MeetingReview.

**CARDINALITY:** 1:1 / 0..1; 0..1 review per meeting; exactly 1 meeting per review.

**OWNER / DOMAIN OWNER:** Outcomes / MeetingReview.

**PARENT:** Meeting. **CHILD / REFERENCE:** MeetingReview.

**REQUIRED/OPTIONAL:** Review requires ended meeting and frozen capture.

**WHO CREATES RELATIONSHIP:** Owner enters review; AI may assist draft under authority.

**WHO MAY REMOVE/END IT:** Owner edits/discards draft safely; accepted review retained.

**CHILD OUTLIVES PARENT?:** Can survive source operational archive; frozen basis must remain resolvable.

**HISTORICAL REFERENCE RULE:** Same review survives failed Save/retry; no duplicate reviews.

**V1 BOUNDARY:** Scheduled/canceled unstarted meeting cannot produce review.

### R59 — MeetingReview → MeetingReviewItem

**RELATIONSHIP:** MeetingReview → MeetingReviewItem.

**CARDINALITY:** 1:N; 0..N assessments; exactly 1 review per item.

**OWNER / DOMAIN OWNER:** Outcomes / MeetingReview.

**PARENT:** MeetingReview. **CHILD / REFERENCE:** MeetingReviewItem.

**REQUIRED/OPTIONAL:** Review required; empty captured categories allowed.

**WHO CREATES RELATIONSHIP:** Eligible capture organization/owner review.

**WHO MAY REMOVE/END IT:** Owner edits/removes draft assessment; accepted references retained.

**CHILD OUTLIVES PARENT?:** No.

**HISTORICAL REFERENCE RULE:** Assessment references exact capture, never rewrites question original.

**V1 BOUNDARY:** Multiple review categories are projections, not duplicate assessed content.

### R60 — Captured structured item in FrozenMeetingCapture → MeetingReviewItem

**RELATIONSHIP:** Captured structured item in FrozenMeetingCapture → MeetingReviewItem.

**CARDINALITY:** 1:N; 0..N assessments per captured item; exactly 1 primary captured anchor per assessment.

**OWNER / DOMAIN OWNER:** Outcomes owns assessment; Meetings owns capture.

**PARENT:** Captured structured item in FrozenMeetingCapture. **CHILD / REFERENCE:** MeetingReviewItem.

**REQUIRED/OPTIONAL:** Required source anchor; supplemental evidence allowed.

**WHO CREATES RELATIONSHIP:** Owner/AI-assisted draft derives from eligible capture.

**WHO MAY REMOVE/END IT:** Owner edits assessment; frozen source never edited.

**CHILD OUTLIVES PARENT?:** Assessment cannot lose historical anchor; archive does not erase it.

**HISTORICAL REFERENCE RULE:** Exact item/revision pinned; reference cannot float to current publication.

**V1 BOUNDARY:** No invented verbal discussion; synthesis can cite multiple supplemental captured refs without losing primary anchor.

### R61 — MeetingReview → Decision

**RELATIONSHIP:** MeetingReview → Decision.

**CARDINALITY:** 1:N; 0..N decisions; exactly 1 originating review per decision in V1.

**OWNER / DOMAIN OWNER:** Outcomes / Decision, coordinated by review acceptance.

**PARENT:** MeetingReview. **CHILD / REFERENCE:** Decision.

**REQUIRED/OPTIONAL:** Review/project scope required; accepted status only after successful Save.

**WHO CREATES RELATIONSHIP:** Owner drafts/reviews; AI only proposes.

**WHO MAY REMOVE/END IT:** Owner modifies draft; accepted result follows later mutability rules.

**CHILD OUTLIVES PARENT?:** Accepted project decision survives review UI/session lifecycle; provenance retained.

**HISTORICAL REFERENCE RULE:** Keep origin review/capture/context and confirmer.

**V1 BOUNDARY:** Logical origin is not permission to cascade-delete accepted decision.

### R62 — MeetingReview → ActionItem

**RELATIONSHIP:** MeetingReview → ActionItem.

**CARDINALITY:** 1:N; 0..N actions; exactly 1 originating review per action.

**OWNER / DOMAIN OWNER:** Outcomes / ActionItem, coordinated by review acceptance.

**PARENT:** MeetingReview. **CHILD / REFERENCE:** ActionItem.

**REQUIRED/OPTIONAL:** Review/project scope required.

**WHO CREATES RELATIONSHIP:** Owner drafts/reviews/confirms.

**WHO MAY REMOVE/END IT:** Owner edits draft; postacceptance lifecycle left to Step 0B.3.

**CHILD OUTLIVES PARENT?:** Accepted action persists as project outcome with retained review origin.

**HISTORICAL REFERENCE RULE:** Failed save retains draft; retries reuse intended action identities.

**V1 BOUNDARY:** No external ticket system introduced.

### R63 — MeetingReviewItem → Decision through ReviewOutcomeLink

**RELATIONSHIP:** MeetingReviewItem → Decision through ReviewOutcomeLink.

**CARDINALITY:** N:M; 0..N decisions per item; 0..N assessed items per decision.

**OWNER / DOMAIN OWNER:** Outcomes / MeetingReview owns link.

**PARENT:** MeetingReviewItem. **CHILD / REFERENCE:** Decision through ReviewOutcomeLink.

**REQUIRED/OPTIONAL:** Optional; explicit link needs one of each in same review/project.

**WHO CREATES RELATIONSHIP:** Owner reviews explicit resolution/provenance link.

**WHO MAY REMOVE/END IT:** Owner changes draft link; accepted attribution retained.

**CHILD OUTLIVES PARENT?:** Linked decision independent; association retains review provenance.

**HISTORICAL REFERENCE RULE:** One decision can address several questions; no forced duplicated decisions.

**V1 BOUNDARY:** Directly captured decision may lack review-item resolution links but still has capture provenance.

### R64 — MeetingReviewItem → ActionItem through ReviewOutcomeLink

**RELATIONSHIP:** MeetingReviewItem → ActionItem through ReviewOutcomeLink.

**CARDINALITY:** N:M; 0..N actions per item; 0..N assessed items per action.

**OWNER / DOMAIN OWNER:** Outcomes / MeetingReview owns link.

**PARENT:** MeetingReviewItem. **CHILD / REFERENCE:** ActionItem through ReviewOutcomeLink.

**REQUIRED/OPTIONAL:** Optional; explicit links limited to same review/project.

**WHO CREATES RELATIONSHIP:** Owner reviews action provenance.

**WHO MAY REMOVE/END IT:** Owner changes draft link; accepted attribution retained.

**CHILD OUTLIVES PARENT?:** Action independent after acceptance; review association retained.

**HISTORICAL REFERENCE RULE:** One item can generate many actions; one action may address several items.

**V1 BOUNDARY:** One association concept supports typed decision/action targets, not a new ninth join candidate.

### R65 — Decision → ActionItem

**RELATIONSHIP:** Decision → ActionItem.

**CARDINALITY:** 1:N; 0..N actions per decision; action has 0..1 primary related decision.

**OWNER / DOMAIN OWNER:** Outcomes / ActionItem owns reference.

**PARENT:** Decision. **CHILD / REFERENCE:** ActionItem.

**REQUIRED/OPTIONAL:** Optional: standalone action can address question/evidence directly.

**WHO CREATES RELATIONSHIP:** Owner explicitly relates during review.

**WHO MAY REMOVE/END IT:** Owner edits draft relation; accepted provenance protected.

**CHILD OUTLIVES PARENT?:** Action can survive decision archival; retained reference remains meaningful.

**HISTORICAL REFERENCE RULE:** Same originating review/project for new V1 linkage; no silent replacement.

**V1 BOUNDARY:** V1 chooses one primary decision per action; ReviewOutcomeLink supplies multi-item provenance, not multi-decision task graph.

### R66 — Eligible ActorRef assignee → ActionItem

**RELATIONSHIP:** Eligible ActorRef assignee → ActionItem.

**CARDINALITY:** 1:N; 0..N actions per principal; action has 0..1 assignee while draft, exactly 1 at acceptance.

**OWNER / DOMAIN OWNER:** Outcomes / ActionItem.

**PARENT:** Eligible ActorRef assignee. **CHILD / REFERENCE:** ActionItem.

**REQUIRED/OPTIONAL:** Accepted action requires one responsible principal.

**WHO CREATES RELATIONSHIP:** Owner assigns during review.

**WHO MAY REMOVE/END IT:** Owner changes draft; future status/reassignment mutability next pass.

**CHILD OUTLIVES PARENT?:** Action survives assignee leaving/expiry; retained attribution.

**HISTORICAL REFERENCE RULE:** Registered project user or admitted participant, including scoped guest from originating meeting, is eligible; assignment grants no access.

**V1 BOUNDARY:** Project owner is eligible even without an invitation; guest scope expiry never changes assignee identity or auto-grants project rights. No multiple assignees.

### R67 — Decision / ActionItem → Captured architecture context

**RELATIONSHIP:** Decision / ActionItem → Captured architecture context.

**CARDINALITY:** 1:1 / 0..1; 0..1 primary semantic scope per outcome.

**OWNER / DOMAIN OWNER:** Outcomes / Decision or ActionItem.

**PARENT:** Decision / ActionItem. **CHILD / REFERENCE:** Captured architecture context.

**REQUIRED/OPTIONAL:** Optional for administrative action; required when claiming an architecture-specific target.

**WHO CREATES RELATIONSHIP:** Owner confirms contextual association.

**WHO MAY REMOVE/END IT:** Owner edits draft; accepted scope cannot silently retarget.

**CHILD OUTLIVES PARENT?:** Context value owned; canonical graph independent.

**HISTORICAL REFERENCE RULE:** Whole/node/edge/group/inner references use same immutable architecture; supplemental evidence permitted.

**V1 BOUNDARY:** No canonical mutation when recording a decision or task.

### R68 — MeetingReview → Accepted MeetingOutcome manifest

**RELATIONSHIP:** MeetingReview → Accepted MeetingOutcome manifest.

**CARDINALITY:** 1:1 / 0..1; 0 before acceptance; exactly 1 after successful Save to Project.

**OWNER / DOMAIN OWNER:** Outcomes / MeetingReview.

**PARENT:** MeetingReview. **CHILD / REFERENCE:** Accepted MeetingOutcome manifest.

**REQUIRED/OPTIONAL:** Required for published project outcomes.

**WHO CREATES RELATIONSHIP:** Owner explicit accepted Save after review.

**WHO MAY REMOVE/END IT:** No duplicate acceptance on retry; later mutability design must preserve accepted result.

**CHILD OUTLIVES PARENT?:** No independent manifest lifecycle; referenced decisions/actions retained.

**HISTORICAL REFERENCE RULE:** Exact accepted set/summary protected; failure preserves draft and no false Home update.

**V1 BOUNDARY:** Autosave is never acceptance; successful commit is the publication boundary.

### R69 — Project → MeetingReview / Decision / ActionItem

**RELATIONSHIP:** Project → MeetingReview / Decision / ActionItem.

**CARDINALITY:** 1:N; 0..N of each; each has exactly 1 originating project.

**OWNER / DOMAIN OWNER:** Outcomes owns records; Projects owns scope.

**PARENT:** Project. **CHILD / REFERENCE:** MeetingReview / Decision / ActionItem.

**REQUIRED/OPTIONAL:** Required, derived consistently from originating meeting/review.

**WHO CREATES RELATIONSHIP:** Originating review and explicit Save.

**WHO MAY REMOVE/END IT:** Owner archive; retain accepted outcomes.

**CHILD OUTLIVES PARENT?:** Outcomes remain project-scoped and retain origin even after source archive.

**HISTORICAL REFERENCE RULE:** No moving accepted outcome to a different project/architecture.

**V1 BOUNDARY:** Three parallel scope references counted as one grouped invariant; originating review relations R61/R62 are lifecycle roles, not extra project tables.

# SECTION D — AGGREGATE OWNERSHIP

Propose **12 aggregate roots**, aligned with the 12 A concepts from Step 0B.1. This is logical consistency ownership, not a requirement for one repository per table. Child operations may be targeted efficiently while validating the owning root; they do not gain independent authority. Cross-root owner acceptance may coordinate within the existing modular monolith.

## User

**ROOT:** User.

**OWNED CHILDREN:** AuthSession, UserPreference; account-owned identity state.

**REFERENCED EXTERNAL OBJECTS:** Organizations via membership; owned projects; authored content by reference.

**WHAT MUST BE MODIFIED THROUGH ROOT:** Account/session/preference lifecycle and identity validation.

**WHAT MAY BE MODIFIED INDEPENDENTLY:** Other domains change their own content/grants; never through User as a universal product root.

## Organization

**ROOT:** Organization.

**OWNED CHILDREN:** OrganizationMember associations.

**REFERENCED EXTERNAL OBJECTS:** User; Projects referencing organizational scope.

**WHAT MUST BE MODIFIED THROUGH ROOT:** Membership and organization lifecycle under current Group 1 policy.

**WHAT MAY BE MODIFIED INDEPENDENTLY:** Projects retain their own owner/lifecycle; organization membership never substitutes for ownership.

## Project

**ROOT:** Project.

**OWNED CHILDREN:** ProjectStructure, ProjectLayerDefinition, ProjectEditorAssignment.

**REFERENCED EXTERNAL OBJECTS:** Organization, owner User; Source, Architecture, Knowledge, Presentation, Meeting, Outcomes roots.

**WHAT MUST BE MODIFIED THROUGH ROOT:** Project creation, owner/editor authority, initial structure/layers and archive.

**WHAT MAY BE MODIFIED INDEPENDENTLY:** Domain content through its own root; same-project references do not make one giant Project transaction for every edit.

## Source

**ROOT:** Source.

**OWNED CHILDREN:** SourceReference, IngestionRun.

**REFERENCED EXTERNAL OBJECTS:** Project, authorized IntegrationCredential, consumed upload origin.

**WHAT MUST BE MODIFIED THROUGH ROOT:** Attachment/source status, locator origins and processing attempt lifecycle.

**WHAT MAY BE MODIFIED INDEPENDENTLY:** IntegrationCredential is a user-bound Sources child with secret revocation rules; StagedUpload is a pre-project actor-owned child. Neither requires inventing another aggregate root or a fake Source before staging.

## Architecture

**ROOT:** Architecture.

**OWNED CHILDREN:** ArchitectureVersion graphs, nodes, edges, InnerArchitectureReference, CorrectionSession value.

**REFERENCED EXTERNAL OBJECTS:** Project, SourceReference provenance.

**WHAT MUST BE MODIFIED THROUGH ROOT:** Candidate reconstruction/correction, graph validation, single confirmation of root and imported descendants.

**WHAT MAY BE MODIFIED INDEPENDENTLY:** No independent graph-element truth writes; rendering/inspection remains local; no confirmed graph mutation.

## KnowledgeItem

**ROOT:** KnowledgeItem.

**OWNED CHILDREN:** KnowledgeContext associations, private MySpaceItem role/value.

**REFERENCED EXTERNAL OBJECTS:** Author ActorRef, optional Project, authorized Sources/Snapshot/context refs.

**WHAT MUST BE MODIFIED THROUGH ROOT:** Authored content, private visibility, attachments and authorized retention.

**WHAT MAY BE MODIFIED INDEPENDENTLY:** Snapshot remains its own root; Meetings alone changes its own publication; no two-way content synchronization.

## Snapshot

**ROOT:** Snapshot.

**OWNED CHILDREN:** Structured capture, optional artifact reference, captured semantic scope.

**REFERENCED EXTERNAL OBJECTS:** Creator, Project where applicable, architecture/screen/meeting/evidence origins.

**WHAT MUST BE MODIFIED THROUGH ROOT:** Deliberate capture and bounded visibility/retention.

**WHAT MAY BE MODIFIED INDEPENDENTLY:** References/publications managed by their consuming owners; original never becomes another domain’s editable child.

## Presentation

**ROOT:** Presentation.

**OWNED CHILDREN:** PresentationScreen, grants, invitations, ScreenKnowledgeReference, overlays, visual/scope values.

**REFERENCED EXTERNAL OBJECTS:** Project, one confirmed Architecture, authorized Knowledge and ActorRef.

**WHAT MUST BE MODIFIED THROUGH ROOT:** Setup/preparation, screen creation/confirmation, access and inclusion; child writes validate package phase/authority.

**WHAT MAY BE MODIFIED INDEPENDENTLY:** Meeting’s start snapshot/navigation cannot mutate this root; no independently published screen root.

## Meeting

**ROOT:** Meeting.

**OWNED CHILDREN:** MeetingParticipant, MeetingInvitation, SharedMeetingItem and publication values; shared/private checkpoints, handoff, start snapshot, frozen capture.

**REFERENCED EXTERNAL OBJECTS:** Project owner, Presentation, canonical graph, author/guest identities.

**WHAT MUST BE MODIFIED THROUGH ROOT:** Admission and stage authority; owner start/end; explicit stable share; freeze eligible capture.

**WHAT MAY BE MODIFIED INDEPENDENTLY:** Each participant privately updates only their own checkpoint through restricted meeting operations; Knowledge private content and Outcomes review remain separately owned.

## MeetingReview

**ROOT:** MeetingReview.

**OWNED CHILDREN:** MeetingReviewItem, ReviewOutcomeLink, accepted MeetingOutcome value.

**REFERENCED EXTERNAL OBJECTS:** One ended Meeting/frozen capture; Decision and ActionItem roots.

**WHAT MUST BE MODIFIED THROUGH ROOT:** Autosaved assessments, reviewed linkage, owner acceptance and retry-consistent manifest.

**WHAT MAY BE MODIFIED INDEPENDENTLY:** Decisions/actions have own identity; review acceptance coordinates publication across these roots without making AI or autosave an acceptance authority.

## Decision

**ROOT:** Decision.

**OWNED CHILDREN:** Accepted rationale/context and outcome attribution values.

**REFERENCED EXTERNAL OBJECTS:** Project, one originating MeetingReview; linked ReviewItems/Actions.

**WHAT MUST BE MODIFIED THROUGH ROOT:** Decision draft validation and approved decision content; review coordinates acceptance.

**WHAT MAY BE MODIFIED INDEPENDENTLY:** Related actions retain their own responsibility/status lifecycle; decision does not modify graph or source note.

## ActionItem

**ROOT:** ActionItem.

**OWNED CHILDREN:** Responsibility, due-date/status and captured-context values.

**REFERENCED EXTERNAL OBJECTS:** Project, originating Review; optional primary Decision; eligible assignee ActorRef; ReviewItems.

**WHAT MUST BE MODIFIED THROUGH ROOT:** Action validation, single responsible assignee and action lifecycle subject to acceptance rules.

**WHAT MAY BE MODIFIED INDEPENDENTLY:** Linked decisions/review assessments remain distinct; no ticket/subtask/assignment-history aggregate introduced.

A child’s physical storage independence is not aggregate independence. In particular ArchitectureVersion, PresentationScreen, MeetingParticipant and SharedMeetingItem are not extra roots. The Identity/Sources staging and credential sub-lifecycles use their actual actor/account authorization rather than creating an umbrella integration or upload product. No cyclic module ownership is required by contextual references; higher-domain descriptors and authorized read projections preserve the Step 0A dependency direction.

# SECTION E — N:M RELATIONSHIPS

Twelve semantic families below; eight C association candidates remain sufficient. Some N:M edges are references within owned values, not new relational entities. An association record itself always has one left owner and one target; the number of records yields the semantic N:M relationship.

## R01 — Organization ↔ User through OrganizationMember

**LEFT:** Organization.

**RIGHT:** User through OrganizationMember.

**ASSOCIATION OWNER:** Identity; membership belongs to organization.

**WHY N:M IS REQUIRED:** 0..N users per organization; 0..N organizations per user.

**WHAT CONTEXT/MEANING THE ASSOCIATION STORES:** One membership per organization/user pair; preserve current roles. Retain attribution after membership ends; membership is not project ownership.

## R07 — Project ↔ User through ProjectEditorAssignment

**LEFT:** Project.

**RIGHT:** User through ProjectEditorAssignment.

**ASSOCIATION OWNER:** Projects / Project.

**WHY N:M IS REQUIRED:** 0..N editors per project; 0..N projects per editor.

**WHAT CONTEXT/MEANING THE ASSOCIATION STORES:** Existing org eligibility applies. ProjectMembership remains derived; no duplicate grant. Retain author attribution elsewhere after editor revocation.

## R25 — ArchitectureVersion / its nodes or connections ↔ SourceReference via owned provenance

**LEFT:** ArchitectureVersion / its nodes or connections.

**RIGHT:** SourceReference via owned provenance.

**ASSOCIATION OWNER:** Architecture owns attribution references; Sources owns locators.

**WHY N:M IS REQUIRED:** 0..N evidence refs per graph/element; locator may support 0..N graph elements.

**WHAT CONTEXT/MEANING THE ASSOCIATION STORES:** No new provenance table promised: owned provenance references under existing graph owners; several Sources may contribute to one architecture. Pin exact locator/revision; inaccessible evidence remains identified/unavailable.

## R28 — KnowledgeItem ↔ Semantic context target through KnowledgeContext

**LEFT:** KnowledgeItem.

**RIGHT:** Semantic context target through KnowledgeContext.

**ASSOCIATION OWNER:** Knowledge / KnowledgeItem owns association.

**WHY N:M IS REQUIRED:** 0..N contexts per item; 0..N items per semantic target.

**WHAT CONTEXT/MEANING THE ASSOCIATION STORES:** KnowledgeItem → KnowledgeContext rows is physically 1:N, not N:M between two content entities. N:M is item ↔ semantic target; no global Context table. Pinned scope includes graph identity, selected/internal/boundary roles; changing current attachments cannot retarget captures.

## R31 — KnowledgeItem ↔ Snapshot through contextual reference

**LEFT:** KnowledgeItem.

**RIGHT:** Snapshot through contextual reference.

**ASSOCIATION OWNER:** Knowledge; association uses KnowledgeContext target semantics.

**WHY N:M IS REQUIRED:** 0..N snapshot refs per item; 0..N items per snapshot.

**WHAT CONTEXT/MEANING THE ASSOCIATION STORES:** Reuse KnowledgeContext; no extra SnapshotAttachment candidate. Sharing requires bounded publication of authorized content. Private Snapshot cannot become readable merely because its ID is referenced.

## R32 — KnowledgeItem ↔ SourceReference through evidence/context

**LEFT:** KnowledgeItem.

**RIGHT:** SourceReference through evidence/context.

**ASSOCIATION OWNER:** Knowledge owns attachment; Sources owns reference.

**WHY N:M IS REQUIRED:** 0..N source refs per item; 0..N items per locator.

**WHAT CONTEXT/MEANING THE ASSOCIATION STORES:** Use KnowledgeContext/provenance owned values; no copied document store. Revision pinning and access checks; unavailable does not mean replacement.

## R36 — Presentation ↔ ActorRef through PresentationAccessGrant

**LEFT:** Presentation.

**RIGHT:** ActorRef through PresentationAccessGrant.

**ASSOCIATION OWNER:** Presentations / Presentation.

**WHY N:M IS REQUIRED:** 0..N grantees per presentation; actor can access 0..N eligible presentations.

**WHAT CONTEXT/MEANING THE ASSOCIATION STORES:** Guest scope still limits apparent reuse; no project/editor/meeting membership implied. Past authored attribution retained after grant ends.

## R39 — PresentationScreen ↔ KnowledgeItem through PresentationScreenKnowledgeReference

**LEFT:** PresentationScreen.

**RIGHT:** KnowledgeItem through PresentationScreenKnowledgeReference.

**ASSOCIATION OWNER:** Presentations / Presentation owns association.

**WHY N:M IS REQUIRED:** 0..N items per screen; 0..N screens per item.

**WHAT CONTEXT/MEANING THE ASSOCIATION STORES:** No unrestricted live pointer to a private item; preparation reference alone is not public sharing. Meeting pins authorized included content revision or stable protected reference.

## R46 — Meeting ↔ ActorRef through MeetingParticipant

**LEFT:** Meeting.

**RIGHT:** ActorRef through MeetingParticipant.

**ASSOCIATION OWNER:** Meetings / Meeting.

**WHY N:M IS REQUIRED:** 0..N admitted actors before start; LIVE includes owner; actor may attend multiple eligible meetings.

**WHAT CONTEXT/MEANING THE ASSOCIATION STORES:** Guest has stable restricted principal, no duplicate registered-user identity; historical presence is not current access. One participant per meeting/principal, reconnect reuses record; presence not a new row.

## R63 — MeetingReviewItem ↔ Decision through ReviewOutcomeLink

**LEFT:** MeetingReviewItem.

**RIGHT:** Decision through ReviewOutcomeLink.

**ASSOCIATION OWNER:** Outcomes / MeetingReview owns link.

**WHY N:M IS REQUIRED:** 0..N decisions per item; 0..N assessed items per decision.

**WHAT CONTEXT/MEANING THE ASSOCIATION STORES:** Directly captured decision may lack review-item resolution links but still has capture provenance. One decision can address several questions; no forced duplicated decisions.

## R64 — MeetingReviewItem ↔ ActionItem through ReviewOutcomeLink

**LEFT:** MeetingReviewItem.

**RIGHT:** ActionItem through ReviewOutcomeLink.

**ASSOCIATION OWNER:** Outcomes / MeetingReview owns link.

**WHY N:M IS REQUIRED:** 0..N actions per item; 0..N assessed items per action.

**WHAT CONTEXT/MEANING THE ASSOCIATION STORES:** One association concept supports typed decision/action targets, not a new ninth join candidate. One item can generate many actions; one action may address several items.

## R70 — Snapshot ↔ Meeting publications / frozen review contexts

**LEFT:** Snapshot.

**RIGHT:** Meeting publications / frozen review contexts.

**ASSOCIATION OWNER:** Knowledge owns Snapshot; Meetings/Outcomes own referencing capture values.

**WHY N:M IS REQUIRED:** 0..N authorized capture/publication references per Snapshot; each meeting/review may reference 0..N snapshots.

**WHAT CONTEXT/MEANING THE ASSOCIATION STORES:** No new join table: use SharedMeetingItem publication and owned frozen/review context refs. Repeated use never transfers private ownership. Pin original Snapshot identity and intended capture revision; never substitute current viewport.

KnowledgeContext is the item-to-target association, not a second globally shared context aggregate. Its owned CapturedSemanticScope may hold many selected/internal/boundary references; those references do not create more architecture ownership. R31/R32 specialize the attachment model for snapshot/evidence targets rather than add tables. R25 is provenance under graph owners; R70 is intentional publication/capture linkage. ReviewOutcomeLink supports both R63 and R64 as typed outcome linkage; no extra action-question join candidate is added.

The eight association candidates are explicitly accounted for: OrganizationMember (R01), ProjectEditorAssignment (R07), InnerArchitectureReference (R24, a constrained optional-one tree link, not N:M), KnowledgeContext (R28/R31/R32), PresentationAccessGrant (R36), PresentationScreenKnowledgeReference (R39), MeetingParticipant (R46), ReviewOutcomeLink (R63/R64). Association classification alone does not force unrestricted N:M: the V1 inner-tree link is deliberately constrained.

# SECTION F — 1:1 / 0..1 RELATIONSHIPS

Eighteen families. Exact-one requirements are lifecycle-qualified and may require coordinated owner validation; this document does not prescribe database constraints.

- **R03, User → UserPreference:** 0..1 preference record; exactly 1 user per record. Optional until initialized; defaults on absence. Timing/meaning: Preserve existing lazy/default behavior.
- **R08, Project → ProjectStructure:** Exactly 1 structure per successfully created project. Required at Group 1 creation completion. Timing/meaning: Transient wizard is not a persisted incomplete project.
- **R16, StagedUpload → Source:** 0..1 resulting Source per staged upload; Source has 0..1 staged origin. Optional: external connectors have no upload origin. Timing/meaning: Single-use consumption; retry returns same attachment, not another Source.
- **R18, Project → Architecture:** 0..1 before usable reconstruction; exactly 1 after architecture confirmation. Absent is valid pre-reconstruction; confirmation requires one. Timing/meaning: Another materially changed architecture requires another project.
- **R24, ArchitectureNode → InnerArchitectureReference → inner ArchitectureVersion:** 0..1 inner link per node; each inner graph has exactly 1 parent link. Optional; only with documented imported depth. Timing/meaning: V1 chooses a containment tree, not multiple alternative inner views/shared child graphs. Child belongs to same Architecture; no cycles. All imported descendants freeze with the single confirmation.
- **R38, PresentationInvitation → PresentationAccessGrant:** 0..1 resulting grant per invitation; grant has 0..1 originating invitation. Optional: direct registered-user grant needs no invite. Timing/meaning: No one invitation grants multiple people.
- **R42, PresentationScreen → CapturedSemanticScope:** Exactly 1 current semantic scope per screen. WHOLE default; explicit selection otherwise. Timing/meaning: Main Architecture base is WHOLE; lasso changes context, never canonical topology.
- **R48, MeetingInvitation → MeetingParticipant:** 0..1 resulting participant per invitation; participant has 0..1 originating invitation. Optional: owner/direct permitted admission may lack invite. Timing/meaning: Invitation is not itself participation or presenter authority.
- **R51, MeetingParticipant → ParticipantPrivateState:** 0..1 meaningful private checkpoint per participant. Optional until private exploration. Timing/meaning: Never store high-frequency hand/gaze streams.
- **R52, Meeting → Current presenter reference:** 0..1 designated presenter overall; exactly 1 while LIVE. LIVE presenter must be admitted participant. Timing/meaning: Logical owner authority remains even if owner is offline; fallback to owner identity does not grant another participant control.
- **R53, Meeting → MeetingSharedState:** 0..1 shared checkpoint; exactly 1 once started. Initialized at start; retained at end. Timing/meaning: One stream of accepted stage authority, not multiple presenters.
- **R54, Meeting → PresenterTransferRequest:** 0..1 pending request; exactly 1 intended recipient per request. Optional; only LIVE with valid current presenter and admitted receiver. Timing/meaning: Guest receiver requires owner permission; transfers no owner rights.
- **R55, Meeting → OwnerPresentationReturnCheckpoint:** 0..1 meaningful owner return checkpoint. Optional until relevant handoff. Timing/meaning: Meaningful screen/focus/depth only.
- **R56, Meeting → MeetingPresentationSnapshot:** 0 before start; exactly 1 after successful start. Required for LIVE and ended started meeting. Timing/meaning: Contains definitions or immutable refs, not another canonical graph.
- **R57, Meeting → FrozenMeetingCapture:** 0 before end; exactly 1 after successful end of LIVE meeting. Required before review; canceled unstarted meeting has none. Timing/meaning: Ending/start retries never create multiple captures.
- **R58, Meeting → MeetingReview:** 0..1 review per meeting; exactly 1 meeting per review. Review requires ended meeting and frozen capture. Timing/meaning: Scheduled/canceled unstarted meeting cannot produce review.
- **R67, Decision / ActionItem → Captured architecture context:** 0..1 primary semantic scope per outcome. Optional for administrative action; required when claiming an architecture-specific target. Timing/meaning: No canonical mutation when recording a decision or task.
- **R68, MeetingReview → Accepted MeetingOutcome manifest:** 0 before acceptance; exactly 1 after successful Save to Project. Required for published project outcomes. Timing/meaning: Autosave is never acceptance; successful commit is the publication boundary.

Internal graph clarification: R19 is a 1:N family because one Architecture contains the root plus documented inner graph records. It does not authorize multiple confirmed top-level versions. Reuse one root candidate record through review/correction and promotion; no parallel candidate roots, root revision series or post-confirmation replacements in V1. All referenced imported descendants become fixed with the accepted root. Concurrency/autosave representation is deferred to the next pass, without converting every save into a graph record.

Main Architecture clarification: R35 contains exactly one base PresentationScreen row. Additional screens are optional, including during setup. The base references the confirmed whole architecture and is available without generating a scenario. Only this base and additional CONFIRMED screen definitions enter R56. Draft authoring never overwrites a meeting’s pinned definition.

# SECTION G — HISTORICAL REFERENCE MATRIX

“Source changes” below includes change to the record holding the reference and to its referenced origin. Preservation means exact semantic identity and permitted content, never perpetual access to otherwise restricted/private data. Legal erasure/redaction is a separate policy design; references must fail visibly rather than disclose data or silently point elsewhere.

| Source Object | Referenced Object | Must Stay Stable? | What happens if source changes? |
| --- | --- | --- | --- |
| Presentation | Confirmed Architecture/root and inner graph family | Yes | Presentation authoring changes local screens only; confirmed graph cannot change or be retargeted in V1. |
| Meeting | Presentation content at start | Yes | Builder changes/archive/removes current screens without altering the start-time confirmed definitions. Meeting ends against its pinned content. |
| SharedMeetingItem | Private KnowledgeItem/Snapshot origin and intentionally published revision | Yes | Private edits/deletion/unavailability never synchronize or disclose future content. Explicit publication update preserves frozen/accepted references. |
| MeetingReviewItem | Frozen captured item/revision | Yes | Assessment edits alter assessment only. Publication edits/withdrawal do not rewrite frozen input or silently retarget it. |
| Decision | Architecture context and captured discussion/evidence | Yes | Decision refers to the exact graph/scope and supporting capture; no canonical mutation. Unavailable source is labeled rather than substituted. |
| ActionItem | Originating review, related decision, assignee attribution and context | Yes, for accepted provenance | Assignee access expiry or participant departure does not erase responsibility/history. Later permitted status/reassignment semantics are deferred. |
| Snapshot | Architecture/screen/session and captured scope | Yes | Current camera, screen or selection changes never retarget the saved capture; repeat use shares/references that capture intentionally. |
| Architecture graph/element | SourceReference/revision | Yes | Reconnecting/changing external board cannot refresh accepted canonical truth; old evidence can become unavailable without becoming new evidence. |
| PresentationScreen inclusion | KnowledgeItem and approved content for session use | Yes when captured for meeting | Current authorized preparation may change inclusion; meeting pins the authorized content revision/representation rather than reading unrestricted private future edits. |
| MeetingReview / accepted manifest | Frozen capture, reviewed item set, decisions/actions | Yes | Draft Save failure preserves work and publishes nothing; retry accepts the same intended result once. Accepted references cannot drift with draft regeneration. |
| Participant / invitation / guest grant | Stable ActorRef | Yes for attribution | Revoking access ends authority, not author identity; reconnect/reinvite must not turn one actor into duplicate participants or another person. |
| Project / editor / organization scope | Existing identity and authority origin | Yes for attribution | Revoked editor/membership grant changes access prospectively; it does not rewrite author history or transfer meeting ownership. |
| Meeting start / frozen capture | Snapshot and authorized evidence refs | Yes | Snapshot’s original privacy remains intact; only intended published/captured content is retained. No full My Space or raw document harvest. |

# SECTION H — OWNERSHIP / CASCADE INTENT

These are logical lifecycle intentions only. No SQL foreign-key or delete behavior is prescribed.

1. **Strong child ownership:** preference/session belongs to its account; structure/layers/editor assignments to Project; locators/runs to Source; graphs/nodes/edges/inner links to Architecture; screen/grants/invitations/inclusions/overlays to Presentation; participant/invitation/publication/state/capture to Meeting; assessments/links/manifest to MeetingReview. A new child cannot exist with a missing required owner.
2. **Independent lifecycle:** Users, Organizations, Sources, canonical Architecture, authored Knowledge/Snapshot, Presentations, Meetings and accepted Outcomes are distinct roots/scopes. A participant does not own User; a grant does not own its recipient; a contextual reference does not own its target.
3. **Archive before destructive loss of referenced truth:** ending/canceling/archiving a parent is not permission to delete accepted evidence, snapshot identities, frozen captures, reviewed assessments or project outcomes. Retain historical shells/references when operational content is unavailable. No new archive UI or retention duration is introduced.
4. **Private source versus publication:** publication retains bounded intended content separately from the private original. Removing a private original cannot cascade through published meetings/reviews, nor can publication dereferencing recover unrelated private history. Access/erasure policy may require explicit redaction; mark unavailable rather than substitute/expose.
5. **Session independence from authoring:** meeting start snapshot survives later presentation edits or authoring-screen removal; confirmed graph remains independently referenced. Ending meeting freezes eligible content but never deletes My Space.
6. **Review independence:** frozen capture cannot be changed by review; accepted Decision/ActionItem outlive the review UI and remain project knowledge with retained origin. Draft discard is deliberate and cannot delete a successful accepted result. Failed acceptance cannot cascade/delete the user's draft.
7. **Identity/access expiry:** guest scope or auth/session revocation stops access; durable participant/author/assignee attribution survives without creating new privileges. No hard-delete identity design is settled here. Minimal historical attribution may be unavailable/redacted when required.
8. **Temporary staging/credential cleanup:** unconsumed stage can expire; consumed Source artifact identity must survive stage cleanup. Credential revocation removes usability and secrets under the eventual policy without destroying nonsecret provenance or accepted graph evidence.
9. **Current references versus immutable history:** authorized current attachment/grant/publication changes end current relationships only as allowed. Meeting/review history keeps the exact applicable definition/revision, not a floating pointer to “latest.” How to represent retained revisions is Step 0B.3, not this pass.
10. **Ownership is enforced by domain operation:** parent permission/phase checks apply even for direct child operations. My Space/private checkpoints are actor-only; admission or owner status does not grant access to another person's private drafts. All start/end/confirmation/outcome-acceptance gates preserve Step 0A owner authority.

# SECTION I — CARDINALITY RISKS

| Wrong relationship | Product failure | Required V1 rule |
| --- | --- | --- |
| Project has many confirmed root architectures | Screens/evidence/outcomes silently switch meaning | One confirmed architecture; one root candidate promoted once; descendants are imported depth. |
| Independent graph node shared by several graph owners | Correction in one scope corrupts another | Exactly one graph owner per node/edge; both endpoints valid in that graph. |
| Multiple arbitrary inner views or containment cycles | Open becomes unapproved authoring/navigation graph | Zero/one documented child per node; one parent per inner graph; same Architecture; no cycles. |
| Presentation references multiple architectures | Scenario becomes a copied/merged model | Exactly one confirmed architecture family across all screens. |
| Base is an optional removable scenario row | Meeting lacks required Main Architecture entry | Exactly one base screen, always whole confirmed model. |
| Meeting owns mutable live screen pointers | Later Builder changes rewrite live/history | Exactly one start snapshot of eligible confirmed content. |
| Meeting requires one new session per screen | Shared session fragments and participant state resets | One presentation per meeting, multiple navigable start-time screens. |
| Private original globally 1:1 with SharedMeetingItem | Sharing again overwrites another meeting or exposes future edits | Original may have many independent publications; each publication has one meeting. |
| KnowledgeItem limited to one node | Group/edge/whole/inner evidence and reused discussion fail | Item ↔ semantic targets is N:M, with stable scope and boundary refs. |
| Snapshot owned by one meeting | Personal capture disappears at exit or cannot be reused | Creator-owned Snapshot with many explicit consumer refs. |
| Multiple participation rows on reconnect | Duplicated identity/presenter ambiguity | One admitted participant per meeting/principal. |
| Presenter equals meeting owner or has multiple active values | Temporary presenter gains end/save powers or conflicting stage control | Separate owner; exactly one admitted active presenter while LIVE; zero/one pending request. |
| Review replaces frozen capture | Human edits erase what happened | Separate single review and single frozen capture; assessment retains exact source anchor. |
| Review item forced to one action/decision | Duplicate tasks/decisions or lost follow-up | ReviewOutcomeLink supports both N:M outcome types. |
| Action requires many decision parents/assignees | Unnecessary task graph and unclear responsibility | Zero/one primary decision; exactly one responsible ActorRef at acceptance. |
| Guest assignment interpreted as project membership | Private project information leaks | Scope-bound attribution; assignment grants no access. |
| Every Save retry creates another manifest/review | Duplicated decisions/actions and false Home counts | At most one review and accepted manifest; same intended outcome acceptance. |
| Home gets authoritative relationship/count records | Counters diverge from failed/draft outcomes | Projection only from accepted domain truth; no Home aggregate/table. |

# SECTION J — DECISIONS FOR NEXT PASS

Step 0B.3 — **IMMUTABLE / VERSIONED / MUTABLE RECORD DESIGN** — must assume:

1. Preserve all 38 Step 0B.1 persistent candidates and their ownership. The 70 relationship families do not add tables. ProjectMembership, MySpace and Home remain projections; captured scope/state remain owned values.
2. One required organization and registered owner per Project; editor and organization relations remain independent access relationships. ProjectStructure is exactly one at completed creation; layers remain directly project-owned.
3. A Project has zero/one Architecture before reconstruction/confirmation and exactly one confirmed architecture afterward. One root candidate is edited/promoted, with zero/many documented descendant graph records. No parallel candidate roots or saved V2/V3 series. Root/descendants share the immutable acceptance boundary.
4. Graph nodes/edges belong to exactly one graph record; endpoints must exist in that graph. Each node has zero/one source-backed child graph; each child has one parent, same architecture, acyclic. No multiple alternative imported inner-view product is added.
5. Sources have many locators/attempts; connector Source has at most one active credential binding; credentials may serve many authorized sources. Stage upload is actor-owned and consumed at most once into one project/Source; provenance survives staging cleanup.
6. Knowledge content has one author principal and optional project scope, required when project-contextual. Item-to-context and evidence/snapshot references are multi-use relationships. Snapshot has one creator and independent lifetime. Neither context links nor publication IDs grant private access.
7. Presentation references one confirmed architecture. Exactly one normal base Main Architecture screen plus zero/many authored screen children; each screen has one scope and screen-local owned overrides/overlays. Scope defaults WHOLE. Screen knowledge inclusion is N:M, with publication/privacy checks at consumption.
8. One Presentation may be reused by many Meetings; one Meeting uses one Presentation and one consistent project scope. Start preserves base plus confirmed definitions available then. Scheduling does not freeze early; no draft enters live content.
9. Meeting participation/grants use one conceptual ActorRef: registered User OR restricted scoped guest principal, never both for the same actor binding. One participation per meeting/principal. Invitations bind one intended recipient; reconnect/retry reuses identity/admission. No new Actor table is proposed.
10. One owner retained separately from exactly one presenter while LIVE; owner default and fallback. One pending intended-recipient request; acceptance required. Owner take-back/end/disconnect handling invalidates stale requests. Owned private/owner-return checkpoints are separate from live-following state.
11. One publication belongs to one meeting; an original may have many publications. Each publication preserves intentionally shared content/context independently from private edits and may retain its intended representation after private source unavailability. Direct shared input uses explicit origin attribution without inventing a private source.
12. End creates exactly one frozen structured capture; one Meeting has at most one Review. ReviewItem has one primary captured anchor, supplementary eligible references if needed, and many possible outcome links. No continuous audio/transcript or inferred verbal-only discussion is introduced.
13. Decisions/actions each originate in one review and project. Review-item links to either outcome type are N:M. Decision has many actions; ActionItem has at most one primary Decision. Accepted action has exactly one responsible registered project user or admitted originating-meeting participant, including scoped guest; draft may be unassigned. Assignment adds no access rights.
14. Accepted outcome/context provenance remains stable. Version/revision representation, later permitted content/status mutations and acceptance consistency are the NEXT design pass. This pass specifies relationship preservation, not edit-history formats.
15. One accepted result manifest per Review. Autosave is separate from publication; failed Save preserves work; successful retries must not duplicate accepted records. Home/latest activity/counts derive only from actual committed/accepted truth.

These are relationship recommendations within the authorized V1 product, ready to use as the next design baseline. No Step 0B.3 record layout, versioning mechanism or implementation is started.

# SECTION K — BLOCKERS

No blocking cardinality questions remain for Step 0B.3.

The explicit V1 recommendations above settle the choices requested in this pass, including inner-depth tree, base-screen representation, one active root candidate, multi-context knowledge, reusable snapshots, N:M review outcome links and single assignee/primary decision. They do not reopen Step 0A product decisions. Erasure/retention durations, physical association storage, revision mechanics, expiry security details and runtime disconnected-owner UX are later design/technical considerations, not missing cardinalities.

Verification: all 38 A/B/C candidates from Step 0B.1 are explicitly mapped; sections A–K present; Section B contains 70 uniquely numbered relationship families (18 optional/exact-one, 40 one-to-many, 12 many-to-many). The 12 proposed roots are named in D. Counts describe logical families, not SQL constraints or new tables. Only this design document is created; no application code, schema, migration, API, WebSocket contract, Unity, dependency or product image is changed.

