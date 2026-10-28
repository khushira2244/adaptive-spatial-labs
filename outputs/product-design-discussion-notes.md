# Adaptive Spatial Labs — Group 1–7 product and design discussion notes

Living discussion reference, consolidated 2026-10-15. Use this file first when discussing the product. These are product intentions, accepted principles, and open design questions—not implementation instructions, finalized API contracts, or proof that a feature is built/tested. Update this reference as the user makes decisions.

## Product purpose and journey

Professional mixed-reality architecture work: understand source material, build a trustworthy model, explore useful spatial views, present to an audience, collaborate, discuss alternatives, decide, and retain actionable knowledge. Product positioning: “See. Decide. Together.”

Journey: identity/project foundation → source review/canonical model → spatial views → presentation → meeting/My Space → discussion/decision/work → history/readiness/administration.

Keep seven groups. Hands, voice, AI, testing, comfort, and optimization run across the groups rather than becoming separate groups. Screens are connected states of these domains, not isolated designs. Maintain consistent navigation, typography, spacing, colors, panel behavior, and spatial interaction language.

Current process: work slowly in user-directed increments. Formalize Groups 2 → 3 → 4 → 5 → deeply design 6 → 7, then settle the combined backend foundations/contracts, then backend before frontend. Earlier four-level implementation suggestions are historical planning, not authorization to build Groups 1+2 together now. Saving or discussing notes never authorizes implementation.

## Mandatory interaction acceptance criteria

For every Group 2–7 interaction, check these during formal design. If a design conflicts with them or compliance is uncertain, explain the specific issue and ask the user before implementing that interaction.

1. **Hands-first:** Enter, perform the primary work, and leave using hands. Voice accelerates intent, repetitive operations, and difficult refinement; it cannot compensate for a broken hand workflow. Lasso → note → Context Pin → save must work without speech.
2. **Airplane-seat test:** Core work fits roughly a two-foot seated radius. No walking, standing, distant reaching, repeated full-arm sweeps, essential content behind the user, or turning around. Comfortable forward/side controls; distance grab, focus, recentering, workspace rotation, and optional voice bring work to the user. Standing/roomscale are optional extensions with the same product, never prerequisites for a better or complete core workflow.
3. **Entry/exit/resume:** Fast cold start, minimal setup, immediate useful architecture, and restore the last useful state. Preserve view, focus, and private work on pause. Clear Back, Full Model, Return to Live, and Leave Meeting where relevant; no hidden state loss. Resolve live-session resume versus exact personal-state restoration explicitly during design.
4. **Bus-stop test:** Complete one meaningful, satisfying unit of work in about ten minutes or less at the user's chosen depth—not a fixed script or session limit. Examples: inspect a dependency path, focus one area, prepare a presentation focus, raise a useful question, save a private note, compare an alternative.

## Global keyboard and text-entry placement

Follow [global-spatial-input-rules.md](global-spatial-input-rules.md) across Groups 1–7. Use the platform/system virtual keyboard rather than a custom ASL keyboard. User-defined targets: main form 0.8–1.2 m in front of the seated head; temporary keyboard 0.5–0.8 m lower-front. Keep active field/value visible, avoid obscuring controls, restore layout when closed, and preserve typed work. Keyboard Done is not form submission. Distances are placement targets, not physical reach requirements or verified Meta rules; OS placement support and actual comfort require verification. Hands-only typing/navigation remains possible without voice or distant touching.
## Shared spatial and state language

- Center: primary architecture. Near-space: persistent personal work. Surrounding panels support the center without clutter or excessive head turning.
- Depth: full model → working View → lasso/focus area → block → internal detail, only where real source data exists. Reverse navigation always works. Hands and voice can navigate.
- Physical scaling/whole-view zoom differs from semantic opening of a block's deeper information. Basic blocks and expandable blocks must communicate the difference.
- AI reasons from context and evidence, proposes interpretations/refinements, and exposes uncertainty. Humans confirm, edit, reject, and decide. Never fabricate internal architecture or silently apply a suggestion.
- Keep canonical/project truth, saved View configuration, shared meeting/session state, and private personal state separate. A View works independently of a presentation or meeting.
- Performance is part of product design: focus gets full detail, immediate context reduced detail, periphery a cheap representation, irrelevant architecture hidden/not rendered. V1 optimizes a working slice rather than rendering the whole enterprise simultaneously.

## Group 1 — Identity + Project Foundation

**Purpose:** Establish who the user is, which project they can enter, and the project's initial structure and sources.

**Screen journey:** Landing → Sign Up/Login → Home/Projects → New Project Basics → Structure → Existing Inputs → Editors → Review/Create → Project Created/Setup. Group 1 reference images also include Meetings, My Space, Inbox, Profile, and Settings entry/shell states; these do not imply later-group functionality is finished.

**Product notes:** Professional identity/organization/team context; project name/description/type/visibility; templates and editable initial layers; optional inputs; creator as Owner and selected editors; a clear review before creation. Project-created state communicates processing/review and the path to review the model or build manually.

**Miro connection intention:** Connect Miro → browser authorization → choose board → optionally choose relevant frames → connect. Users should not paste API keys or perform developer setup. Keep integration credentials securely on the backend, outside Unity and source metadata. A project source records board identity/name, team, and selected frames. Integration knowledge and project-source ownership remain separate. Actual OAuth scopes, token lifecycle, callback/status flow, and APIs must be verified against current official documentation before implementation; this is a design intention, not a completed integration.

**Discussion/validation:** Clear progress, back/skip behavior, recoverable drafts/errors, understandable owner/editor/visibility choices, connection cancellation/failure, useful setup success state, and quick re-entry. Group 2 now locks Project Created → Proceed → Architecture Review; see its specification for recovery and confirmation behavior.

## Group 2 — Architecture Review (LOCKED)

Product/core UX locked by the user on 2026-10-18. Read [the Group 2 design specification](group2-product-design-spec.md) for the complete agreed definition and [five saved reference images](group2-reference-images/). Written specification overrides older exploratory notes and conflicting image details. Documentation only; no implementation authorized.

**Purpose:** Did ASL correctly understand the company's existing architecture? Reuse sources connected in Group 1; preserve recognizable source geometry and review imported architecture with contextual evidence and human confirmation.

**Entry/exit:** Project Created → Proceed → Architecture Review. Confirm Architecture → Architecture Confirmed → Project Home. Group 3 is entered intentionally later, never forced automatically.

**Spatial grammar:** Architecture center-front; collapsed Sources tab left and supporting evidence/context tab right; compact near toolbelt: Lasso, Attach, AI, Snapshot, Microphone, My Space. Top: Projects, Architecture Review, Recenter. No giant permanent Inspector.

**Interaction:** Hands primary, controllers optional, voice secondary. Small block/relationship context actions. Lasso selects conversational context, not presentation focus or permanent hiding. Attach supports Notes, Questions, AI Findings, Evidence at whole-model/object/relationship/lasso/imported-depth scope. Open shows real imported depth only; Back restores the prior level. Snapshot saves context/state and is not recording. My Space remains private without replacing the center. AI findings/proposed corrections never silently mutate architecture.

**Boundary:** Group 2 is review, not a structural architecture editor. No box repositioning, connector drawing/endpoint dragging, layout redesign, manual internal-structure authoring, presentation configuration, or scenario system. Structural Edit Mode is deferred to Group 3; Group 3's detailed design remains to be settled.

**Recovery/quality:** Restrained Confirmed/Source-backed or likely/Needs confirmation states; retry/back for source failure, review sources when no usable architecture exists; understandable panel closing, Projects/Back/Recenter and unsaved exit behavior. Retain all cross-cutting comfort, privacy and testing gates. No open questions for Group 2 core UX; technical implementation choices remain separate.

## Follow-up stored 2026-10-19 — confirmation and correction interactions

See [correction-mode-hand-interaction-notes.md](correction-mode-hand-interaction-notes.md) for saved hand roles, movement, original supplied discussion, and two new images indexed in the Group 2 specification. Documentation only. The user finalized confirmation routing on 2026-10-19: the popup belongs to Group 2 and opens ONLY after an explicit press of Confirm Architecture. Never open it on review load, exploration, Edit/Correction Mode, Group 3 Done, or return from correction. Cancel closes it and leaves the user in Group 2 without confirming. Confirm commits acceptance of the reviewed model; after successful confirmation, show Architecture Confirmed and return to Project Home. Group 3 Done saves corrected candidate work and returns to Group 2 review without final acceptance. Backend save/failure mechanics remain implementation details, not grounds to change this routing. The later locked handoff on 2026-10-19 resolves Group 3 as Correction Editor. Earlier Views material is retained below for future placement rather than defining current Group 3 scope. No implementation or scope replacement is authorized by storing these materials.

## Group 3 — Correction Editor (LOCKED 2026-10-19)

The latest user handoff resolves the previous scope conflict: Group 3 is the temporary Correction Editor dependent on Group 2 reconstruction. Read [group3-correction-editor-spec.md](group3-correction-editor-spec.md) for the complete locked definition and its current image inventory. Documentation only; implementation is not authorized.

**Lifecycle:** Group 2 Review → Edit/Correction Mode → correct existing reconstructed candidate → Done/save → Group 2 Review again → Confirm Architecture → Project Home. No empty-canvas entry and no final confirmation owned by Group 3.

**Scope:** Move, rename, change type, delete/add preset boxes; delete/create connections; Undo/Redo; Done. Stable node identity preserves connections through rename/type/move. Move requires explicit activation and stays on X/Y with Z constrained, subtle snapping and automatic rerouting. Connections use source/destination selection and confirmation, never freehand paths, endpoint manipulation, reverse or reconnect tools. Deleting boxes warns about attached connections and supports Undo.

**Hands/layout:** Ray + pinch for selection/activation/confirmation; grab/pinch-hold only in explicit Move mode. Optional voice rename with a hand-only text path. Center-front existing architecture; near toolbar Add/Connector/Undo/Redo/Done replaces the Group 2 toolbelt. Top Back to Review/Correction Mode/Recenter, compact selection menus, visible mode/hover/selection/preview feedback, no giant inspector, roomscale or extra custom gestures.

**State/safety:** Corrections edit the structured candidate, not source pixels. Back to Review must handle changed work through candidate autosave or an appropriate save/discard prompt and never confirm implicitly. Group 2 owns canonical acceptance. Use incremental node/connected-arrow updates; verify actual Meta primitives/event rules before implementation. The supplied 60 FPS event claim remains unverified. Existing comfort/privacy/short-use criteria apply.

### Historical spatial-view planning — former Group 3 label, placement pending

The material below is retained for future spatial-view design. It is not the current Group 3 correction scope; its final group placement has not been decided.


**Purpose:** Decide how an existing canonical model is shown without rewriting its truth.

**Screens/states:** Create View; Spatial Configuration; View Suggestions; Saved View/Preview.

**Design notes:** Save purpose/audience, chosen layers/objects, spatial layout, labels, relationship visibility, grouping, and block visual profiles: width, height, depth, scale, style/color. Distinguish whole-view manipulation from per-box semantic depth. Focus reveals useful detail while context boxes represent real hidden architecture. Support connected-object context, distance interaction, recentering, and understandable navigation back. Built-in, user-created, or AI suggestions are previewed and selected by the user; nothing auto-applies.

**Design questions:** What belongs to canonical truth versus a View; visual defaults/overrides; focus/context semantics; save/duplicate behavior; how deeper layers come forward while prior context remains understandable.

**Tests designed with this group:** Seated whole-view scale/rotation, distance interaction, semantic Open versus physical scale, and recenter. Verify View edits never mutate canonical truth and settings persist per View. Measure zoom/focus frame time, visibility culling, and appropriate detail reduction; consider batching/instancing/LOD when evidence supports them.

## Group 4 — Presentation + Audience

### Stage 1 — Home entry + Open confirmed architecture (LOCKED 2026-10-20)

Read [group4-stage1-entry-and-open-spec.md](group4-stage1-entry-and-open-spec.md) for the complete written handoff and three indexed [reference images](group4-reference-images/). Only two logical screens are locked: Home card actions and the opened confirmed architecture (collapsed/open panel variants). Documentation only; no implementation or redesign.

Confirmed Home cards expose only Open/Create Presentation; unconfirmed cards continue review and cannot create presentations. Preserve Home/Meetings/My Space/Inbox/Settings navigation. Open and Create Presentation are distinct; presentation setup is a later stage.

Open reuses Group 2 spatial grammar without review/confirmation/correction prompts: actual architecture name in the top Projects/name/Recenter header, architecture center-front, familiar toolbelt, collapsed Sources tab on the left, Presentations as the default right-side purpose. Attach/AI/Evidence temporarily replace that purpose, and closing returns to Presentations; never stack all purposes. No permanent Home navigation or profile avatar in the immersive workspace.

Lasso selects context and never creates a presentation automatically. Inspection grab/depth leaves parent architecture visible and does not edit topology; no fabricated internals. Head gaze can softly pre-focus large cards/edge tabs, but action requires explicit pinch; precise object/UI actions remain hand-directed. Source images contain outdated Home sidebar labels and a Home-versus-Projects back-label difference; the written handoff wins.

### Stage 2 — Presentation Setup (agreed handoff 2026-10-20)

Read [group4-stage2-presentation-setup-spec.md](group4-stage2-presentation-setup-spec.md) and its [saved image](group4-reference-images/04-stage2-presentation-setup.png). Entry: confirmed Home architecture card → overflow → Create Presentation; architecture is already selected. Keep normal app shell, not immersive drawers/toolbelt. Collect only name, purpose (picker/Custom), and optional presentation collaborators.

Collaborator picker offers known members and Add by email with minimal Collaborator/Viewer permissions. Explicit invitation behavior is scoped to the presentation; it neither grants project authority nor adds meeting attendees. Compact people chips allow review/removal. Use the global system-keyboard rule for text input; no custom keyboard. Head gaze only softly assists targeting; hands explicitly act.

Back returns to prior Home/project context, with Stay/Discard protection for meaningful unsaved data unless an agreed draft-autosave behavior preserves it. No unnecessary X/new Exit. Continue requires a name and confirmed architecture, saves a draft and proceeds to Discussion Scope / Presentation Content Selection; it does not start presenting or join a meeting. No backend/Unity implementation authorized. Later stages remain to be designed.
### Stage 3 — Presentation context / optional lasso (handoff 2026-10-20)

Read [group4-stage3-lasso-selection-spec.md](group4-stage3-lasso-selection-spec.md) with its [primary reference](group4-reference-images/05-stage3-lasso-selection.png). Setup Continue leaves the Home shell for a Group-2-style immersive architecture workspace. Full confirmed architecture is visible; whole architecture is the default context. No separate Whole/Lasso choice screen. Side panels stay collapsed unless explicitly opened; no new dashboard/navigation, thumbnails or progress wizard.

Optional focused path: choose Lasso → hand ray + pinch-hold → small comfortable arc projected onto architecture plane → release → subtle selected-area preview. Grab is inspection-only and never defines scope or becomes a prerequisite for Next. Selected nodes retain canonical layout/IDs; a temporary 5–15 cm-equivalent depth preview is allowed. Non-selected architecture stays visible with reduced emphasis.

Next accepts whole architecture when no selection exists, or the lasso context when selected, with no popup. Clear Selection restores whole default. Context stores existing architecture/version/node/connection/evidence/content references, not duplicated architecture/documents or automatic access to private content. Gaze softly assists targets only; pinch remains required.

User placement targets: working plane 0.9–1.3 m (main focus 1.0–1.2 m), lower-front toolbelt 0.5–0.8 m, Next/Clear 0.7–1.0 m; these are visual distances, not required reach or verified Meta specifications. Keep the seated two-foot action radius. No implementation authorized; next preparation stage remains separate.
### Stage 4 — Discussion Preparation (handoff 2026-10-20)

Read [group4-stage4-discussion-preparation-spec.md](group4-stage4-discussion-preparation-spec.md) and its [primary image](group4-reference-images/06-stage4-discussion-preparation.png). Stage 3 Next enters this immersive stage: Project Sources left (existing collapse behavior), unchanged canonical architecture/current scope center, Discussion Preparation right, familiar bottom toolbelt/top header. No Home shell or new layout.

Right panel shows Current Scope, relevant existing Questions/Notes/Evidence/AI Findings and grounded advisory AI suggestions. Select an item → Add to Discussion → small confirmation; no card dragging, copying or automatic AI insertion. New Question creates contextual project knowledge and is optionally referenced by the presentation. Ask AI/Evidence temporarily replace the right-side purpose, then Back returns to Discussion Preparation. One right-side purpose at a time.

Lasso changes update scope/context/suggestions without editing topology or silently removing already-added items. Stage Back returns to context selection preserving work; Next saves references/scope and advances to Success / Normal Flow preparation, not a meeting or completed presentation.

All detailed actions use small hand ray + hover + pinch; lasso uses pinch-hold/small arc/release. Optional voice/text inputs use global system-keyboard rules. Head movement only softly pre-highlights; it never activates. User placement targets: architecture 1.0–1.2 m, panels 0.9–1.2 m, toolbelt 0.5–0.8 m; seated physical action stays within roughly two feet. The reference's four-component label/boundary is illustrative and must not override accurate scope membership. No backend/Unity implementation authorized.
### Continuation — Presentation Builder / Scenario Authoring / Meeting Bridge (prompt and 11 images saved 2026-10-21)

Read [group4-presentation-builder-and-meeting-bridge-spec.md](group4-presentation-builder-and-meeting-bridge-spec.md). This follows and preserves Discussion Preparation. Eleven continuation images are saved/indexed in the spec (references 07–17), including settings/lasso composites and the meeting bridge. Generated-image conflicts are explicitly recorded. Documentation only; no implementation, code generation or Group 5 work authorized.

All scenario screens reference the same immutable confirmed architecture with screen-specific visual overrides and distinguishable scenario-only overlay connections. Builder grammar: created content/screens left, active work center, variable Add Screen/AI/settings right. Draft placeholders remain visibly distinct from completed screens. Context/docs are temporarily accessible without dominating authoring; Discussion Notes remain supported.

Add Screen → center scenario form → right AI grounded understanding (facts versus user scenario versus assumptions) → explicit confirmation → semantic light-3D architecture view → compact component/connection visual controls → preview/adjust/apply → screen confirmation → builder list. AI maps voice/text only to supported deterministic visual operations and never silently applies changes or mutates canonical truth. Lasso selects targets for these scoped operations.

Meeting is a presentation-level header action. Setup chooses attendees/additional emails and initial Start From screen for the whole presentation. Collaboration permissions and meeting attendance are separate. Scheduled confirmation returns to the presentation workspace; Start Now bridges to Group 5. Detailed source/reference and interaction rules remain in the handoff; images will be indexed later.
**Ending clarification (2026-10-21):** The user wants Home after the final Group 4 preparation sequence. The last image shows the immediate meeting-scheduled acknowledgment inside the builder; then finish/return to the approved Home/project context with work preserved. The exact trigger/timing is not yet specified; do not invent an automatic redirect or extra control. Start Now retains its explicit Group 5 route. No new Home image was included. The meeting setup illustration includes a not-created draft as a shared-screen chip; this visual inconsistency does not approve draft sharing and needs resolution before implementation.
### Earlier broader presentation planning — retained discussion context

**Purpose:** Prepare and present a View for an audience and purpose.

**Screens/states:** Presentation Creation; Visibility/Permissions; Sequence/Stages; Invitations; Schedule/Start.

**Design notes:** Project → View → Presentation → Audience → Visibility/permissions → Meeting. Compose multiple focus/discussion areas, stage order, block-specific depth, and reveal/focus behavior. Presentation motive and voice can refine lasso/filtering. Move between full model, focused area, small objects, and internal detail with clear returns. Keep controls uncluttered. Temporary presentation changes must not silently rewrite the saved View.

**Presenter-control principle:** Meeting host ownership and shared-stage presenter control are separate. A participant prepares privately → requests presentation → receives control → presents → returns control. Restore the prior presenter's exact previous presentation state. Canonical truth is unaffected.

**Design questions:** Audience access versus project editing; stage persistence; allowed temporary overrides; request/give/return/take-back control; precise state captured for restoration; invitations and scheduling boundaries.

**Tests designed with this group:** Entire presentation seated; lasso → focus → open → Back/Full View; relaxed head/hand movement; optional voice refinement. Revisit multiple focus areas and exact return points. Measure transition/open/collapse spikes and avoid loading every region simultaneously.

## Group 5 — Meeting + Shared State + My Space

**Detailed handoff saved 2026-10-21:** [group5-live-meeting-spec.md](group5-live-meeting-spec.md), with [three reference images](group5-reference-images/). The user corrected an initial Group 6 label to Group 5. This handoff governs live meeting behavior; earlier broad notes below remain discussion context.

Group 4's prepared presentation supplies many screens within one live session. Left collapsible Screens/Participants; center presenter-controlled shared state; right Meeting Context with approved Docs/Questions/Notes/AI Findings/Evidence and explicitly raised items. Temporary shared-doc/component/context views use one right-side purpose, not stacked permanent panels.

Host and Presenter are separate. Pass Presentation sends a request; selected participant Accepts/Declines before control changes. Host retains meeting authority and Take Back control. Private exploration never changes shared state; Return to Live returns to the current presenter state NOW.

Every participant has private-by-default near-user My Space: Notes, Questions, AI, Snapshots. Explicit Share to Meeting creates a scoped shared reference with classification (Question/Finding/Discussion Point/Action Suggestion), preserving the private original. No automatic private/project exposure or AI publication; PROJECT_VISIBLE promotion is later. Shared-reference update semantics and temporary presenter return-state restoration remain to be settled before implementation.

Meeting toolbelt: Mic, Raise, Snapshot, AI, My Space, Return to Live. Hands ray + pinch; optional near poke/voice; system keyboard for text. Head gaze never activates. Snapshots preserve structured meeting/architecture/screen context and are private by default. Group 6 later structures addressed/unresolved/decision/action outcomes; none implemented here.

**Purpose:** Run a live shared architecture session while preserving private participant work.

**Screens/states:** Meetings Home; Pre-Meeting Preparation; Presenter/Participant Live Views; My Space During Meeting; Raise Point; Shared Question state. Discussion content continues into Group 6.

**Design notes:** Meeting creation/tags, chosen View/presentation, host, presenter, participants, shared architecture/focus, and clear participant controls. Persistent My Space is available while viewing, presenting, attending, inside a lasso, or exploring detail. It contains private notes, marks, questions, exploration, drafts, and AI assistance; it never replaces the central shared stage. Leave shared focus privately and Return to Live explicitly. Support multiple focus areas through a long meeting and temporary presenter handoff with saved return-state.

**State principle:** Project persistent knowledge, session/shared state, and personal/private state remain separately owned. Private → ready to share → raise point → shared session is explicit. Define what other people see at every transition.

**Design questions:** Host/presenter permissions; request acceptance; private versus live focus indicators; reconnect and pause/resume; what happens if the shared stage changes while a user is away; handoff interruption/take-back; comfortable panel arrangement.

**Tests designed with this group:** Near-space comfort; obvious Return to Live; control handoff and restoration; private exploration without disorientation. Verify privacy, reconnect, and state separation. Test multiple users; measure network frequency separately from rendering, avoid unnecessary transform synchronization, and profile shared architecture plus My Space together.

**Group 5 interaction addendum (2026-10-21):** The live-meeting spec now contains the remaining 25 hand/pinch/distance rules. Small chest-to-lap ray + hover + pinch actions govern screen/participant navigation, control transfer, docs, private inspection, My Space, explicit classified sharing, snapshots, Raise, AI and Mic. No swipes, dragging notes, camera hand poses, custom palm/head commands or required distant touch. Return to Live follows the current presenter NOW. Raise never unmutes; private AI stays private.

Host End Meeting now explicitly opens End Meeting? → Cancel / End Meeting; gaze alone never ends it. Transfer still requires the recipient's Accept, with host Take Back separately authorized. Lightweight hover/pressed/success feedback and enlarged hit targets support error prevention. Placement targets: architecture 1.0–1.2 m; header 1.0–1.3 m; side panels 0.9–1.2 m; toolbelt/My Space/keyboard 0.5–0.8 m; private inspection object 0.6–0.9 m. These are visual targets, not required reach; physical actions stay within the seated two-foot radius. No implementation authorized.
## Group 6 — Meeting Review → Structured Outcomes → Save to Project

**Detailed handoff saved 2026-10-21:** [group6-meeting-review-and-outcomes-spec.md](group6-meeting-review-and-outcomes-spec.md), with [two saved reference images](group6-reference-images/). This latest scope supersedes earlier exploratory live-discussion/proposal/ticket plans below; no extra features are authorized by those older notes.

After host-confirmed End Meeting, freeze appropriate shared/session context for review; exclude unshared My Space. Spatial category cards show Questions, Notes, Decisions, Actions, Unresolved, Snapshots/Evidence, with optional Findings/Discussion categories. Selected category comes forward, then an individual item comes closer; Back reverses those bounded levels. Use pagination (roughly 4–6 readable items), not long dashboard scrolling or required walking.

AI organizes/summarizes/classifies as drafts; humans review/edit/confirm. Questions distinguish Addressed/Unresolved/Deferred/Not Discussed and link discussion, decisions, actions and architecture context. Preserve structured decisions, action owner/due date/status, unresolved/deferred work and referenced snapshots/evidence. No automatic promotion of findings to truth, forced resolution, duplicated documents, canonical edits or new recording scope.

Save to Project → small confirmation of structured outcomes → successful save → Saved feedback → Home. Existing Home cards receive lightweight latest-meeting activity/outcome counts without redesign. View in Architecture is reversible inspection. Hands ray + hover + pinch, optional voice/system typing, soft gaze assist without activation, forward seated distances and two-foot actions remain required. Old live Mic/Raise/Return to Live controls in the close-up image are not post-meeting requirements.

### Historical Group 6 exploration — superseded where inconsistent with the post-meeting handoff

**Purpose:** Preserve context from a private thought through collective reasoning to an actionable outcome. This remains the main unfinished design area.

**Screens/states:** Questions/findings; Trade-Off Discussion; Decision Capture; Proposal/Architecture Modification; Current versus Proposed Compare; Decision → Action/Ticket; Meeting Summary.

**Lifecycle:** Private thought → question/finding → raise into meeting → discussion → alternative/trade-off → decision → proposal/change where applicable → action/ticket → project persistence.

**Design notes:** Attach content to exact blocks, connections, lasso areas, and semantic depth; support selected-area and whole-system reasoning. Keep content, context, and visibility separate. PRIVATE → SESSION → PROJECT transitions must be explicit. AI may surface risks, drawbacks, missing cases, evidence, and alternatives; people select findings, share, decide, and approve resulting work. Voice can help capture thoughts, compare alternatives, create private notes, and share a selected finding. Preserve current versus proposed distinction rather than silently modifying canonical architecture.

**Design questions:** Full question lifecycle/status/ownership; multiple simultaneous contributors; tags/threads; context versioning; sharing/retraction; decision authority; proposal acceptance; action/ticket handoff; summaries and unresolved items. Avoid filling the model with floating cards.

**Tests designed with this group:** Hands-only Context Pin/note/question creation, seated capture, return from note to architecture context, and manageable card density. Preserve exact context and explicit visibility transitions. Lightweight markers, fully render active discussion only, and test long meetings without accumulating hundreds of live cards.

## Group 7 — History + Readiness + Administration

**Purpose:** Turn previous work into persistent project knowledge, transparent readiness, and manageable administration.

**Screens/states:** Product/Feature Readiness; Discussion History/Decision Timeline; Global My Space; Inbox; Integrations; Project Settings; Profile/Preferences.

**Design notes:** Meeting/focus-area history; useful presenter-handoff records; summaries; decisions; linked actions/tickets; unresolved questions and review coverage. Readiness derives transparently from mappings, discussions, reviews, decisions, and outstanding work. Global My Space retains private prep/drafts. Inbox collects relevant mentions, invites, requests, and decisions awaiting input. Integrations/settings expose understandable connection, access, project, and comfort preferences.

**Design questions:** Readiness criteria and authority; old context after model changes; history visibility/retention; ticket status updates; private persistence; notification priorities; archive/access administration. These rules remain to be finalized rather than inferred.

**Tests designed with this group:** Comfortable forward history navigation, clear Back/exit, and return to the correct architecture context. Verify decision/action links and useful-state restoration, including historical context resolution. Lazy-load history/evidence and measure performance as history grows.

## Testing and quality planned alongside design

Each group discussion includes design, hands, seated/optional-standing behavior, state/privacy, AI/voice, exit/resume, performance, and a future physical Quest check. Test plans are intentions until executed; never label simulator/core tests as device verification.

Five cross-group gates from the latest note: airplane-seat comfort; hands-only entry/work/exit; reversible depth plus pause/rejoin/resume; measured frame-time performance; and excellent medium-working-view quality. The bus-stop acceptance criterion remains mandatory alongside these gates.

**Working-view benchmark proposal:** Roughly 20–40 meaningful blocks, useful relationships, some source-backed internal depth, multiple source types, notes/questions, presentation, and meeting interactions. Final fixture sizes/content remain to be agreed. First make this realistic medium slice excellent; test larger models separately to find degradation rather than claiming unlimited scale.

**Performance planning:** Confirm the actual refresh target during device setup. Arithmetic frame budgets are approximately 16.7 ms at 60 FPS, 13.9 ms at 72 FPS, and 11.1 ms at 90 FPS (1000/FPS); these are reference calculations, not a verified Meta requirement or chosen ASL target. The pasted note's 13.7 ms at 72 FPS is corrected here. Verify current Meta guidance through official tooling before Quest implementation.

Measure CPU/GPU frame time, draw calls, visible blocks/relationships, focus/semantic-depth transition spikes, My Space opening, and meeting synchronization. Average FPS alone is insufficient. Select optimizations from profiling rather than assumption.

**Future Quest feeling check:** After simulator checks, validate on hardware: Is this easier than its flat equivalent? Does depth help? Are hands relaxed? Is location/context understandable? Can the user instantly go back? Would this work in a real architecture meeting? Functional correctness and frame rate do not establish comfort or usefulness. These checks are especially relevant to Groups 2–6 and should inform the whole journey.

## Checklist for each future group discussion

- Entry: how the user arrives and what useful state is restored.
- Center and surroundings: primary stage plus left/right/top/near panels.
- Blocks: visible information, real internal depth, focus and context.
- Hands: select, lasso, grab, move, rotate, scale, open, and leave.
- Zoom: physical whole-view manipulation versus semantic depth.
- AI/voice: permitted actions, evidence, uncertainty, human confirmation.
- State: canonical/project, View, session/shared, personal/private ownership.
- Transition: next group, Back, Full Model, Return to Live, pause/resume/exit.
- Acceptance/testing: seated radius, hands-only path, meaningful short-session outcome, state/privacy, performance, and future hardware experience.
- Open decisions: ask the user when a rule conflicts or behavior is unspecified; do not quietly turn an assumption into an accepted requirement.

## Policy, privacy, and legal design layer — Groups 1–7

Added from the user's policy note; sources checked 2026-10-15. These are planning notes, not final legal documents or a compliance certification. Recheck policy versions before implementation/distribution. Resolve audience, launch territories, distribution channel, data handling, and applicable law before finalizing obligations and wording.

### Verified policy foundations

- Meta distinguishes developer/platform obligations from user-facing product rules. Platform-hosted apps must follow its app/content policies; a user checkbox does not discharge developer responsibilities. [Developer Policy Overview](https://developers.meta.com/vr/policy/)
- App policies also affect future commercial design. Review payment/subscription rules and available business licensing exceptions before choosing checkout or licensing UI. No ASL billing model is decided here. [App Policies](https://developers.meta.com/vr/policy/app-policies/)
- Meta's content guidelines require ongoing action on user conduct/content violations. Closed collaboration spaces still need accountable administrators and a developer escalation path. [Content Guidelines](https://developers.meta.com/vr/policy/content-guidelines/)
- The virtual-experience code assigns primary handling of closed-experience issues to creators/admins and expects developers to act when issues remain unresolved. ASL moderation controls below are our proposed means of supporting that duty, not an exact Meta-prescribed button list. [Code of Conduct](https://www.meta.com/in/legal/quest/code-of-conduct-for-virtual-experiences/)
- Privacy information must accurately explain data, processing, purposes, and a specific deletion-request route. Plan an accessible HTTPS policy and submission link for Store distribution; a deletion request can use support rather than a complete self-service UI. Do not defer every deletion path to a later release. [Privacy Policy Requirements](https://developers.meta.com/vr/policy/privacy-policy/)
- Obtain applicable permissions/consents or another appropriate legal basis; notice is not automatically consent. The data-use policy includes a private business-channel exception to public availability, while still requiring privacy information before use. Confirm the chosen channel's exact obligations. [Developer Data Use Policy](https://developers.meta.com/vr/policy/data-use/)
- The supplied Start terms concern participation in the Meta Horizon Start Program, not general ASL end-user terms. Do not copy them into onboarding as ASL terms. [Start Program Terms](https://developers.meta.com/vr/start/terms/)
- The supplied [Community Standards](https://transparency.meta.com/policies/community-standards/) page returned HTTP 429 during review. Retain the reference but mark its contents/applicability as pending verification; do not assume every rule automatically applies to every ASL feature.

### ASL design direction to formalize

Use our own Terms of Use, Privacy Notice, and Collaboration Rules, with relevant Meta links in Settings/Legal. Distinguish contractual acceptance, privacy notice acknowledgment, OS permissions, and feature-specific consent; do not bundle them into one mandatory “agree to everything” checkbox. Record versions/choices where needed and determine when changed terms require renewed action. Final legal basis and consent requirements depend on actual processing and jurisdiction.

| Moment/group | Proposed UI and product behavior |
| --- | --- |
| Group 1 account/onboarding | Accessible ASL terms/privacy/collaboration information, clear required acceptance where appropriate, and readable short summaries. Avoid a giant developer-policy popup. |
| Groups 1–2 source connection/import | Explain source access, selected boards/frames/files, import/storage, authorization and disconnect behavior. Confirm users have authority to share source material; integration authorization does not grant unlimited downstream use. |
| Groups 2–7 first AI use or changed processing | Explain which selected context goes to which configured provider and for what purpose. Define retention/training settings and organization controls before promising them. Do not send private notes or whole projects merely because visible context is selected. Provider selection, including any transcription service, remains undecided. |
| Any microphone/voice feature | Timely explanation plus OS permission; visible listening/processing status and stop/mute control. Distinguish voice commands, transcription, live communication, and recording. Denial must preserve the hands-only primary workflow. |
| Groups 3–4 View/presentation sharing | Show audience and effective access; hidden-for-layout is not an authorization boundary. Preview what recipients see and identify intentional sharing. |
| Groups 4–6 meetings/discussions | Lightweight conduct information, clear private/session/project visibility, and host/admin controls such as mute, remove, report concern, scoped access restrictions, and presenter privileges. Define authorization, user feedback, escalation, and enforcement persistence. |
| Capture/recording, only if later approved | Deliberate capture, clear scope and participant indicators; assess personal/confidential data even in architecture-only screenshots. Recording is not authorized by microphone permission or joining a meeting. Finalize participant notice/consent, refusal, stop, access, retention, and deletion rules before introducing recording. A host's choice alone is not assumed sufficient. |
| Group 7 Settings/Legal & Privacy | Terms, privacy, collaboration rules, AI/voice/provider information, integrations, relevant Meta links, privacy contact, and a working deletion-request path. Define export, revocation/disconnect, retention, and organization ownership rather than promising unfinished controls. |

### Policy/consent acceptance gate for each group

During design, identify: data touched; who owns/can access it; private/session/project visibility; microphone, AI, other participants, capture, or third-party processing; purposes, recipients, storage/retention, and deletion; whether notice, permission, consent, another legal basis, or no extra prompt is appropriate. Define decline/revoke/disconnect behavior and check that disclosures match backend behavior. Do not add repetitive prompts without a specific reason.

Tests must cover permission denial/revocation, non-voice operation, private data excluded from shared/AI context unless intentionally authorized, access enforcement despite visually hidden content, clear sharing boundaries, moderation permissions, capture indicators if implemented, and a usable deletion-request route. Verify these alongside functional tests; UI wording alone is not evidence of compliance.

### Decisions still needed

Intended age audience; countries of operation; Store versus private business distribution; identity/project ownership and customer contracts; AI/transcription vendors and their processing terms; raw audio/transcript retention; whether any recording exists in V1; report handling; retention versus meeting history; deletion/export responsibilities for organizational projects; and any paid licensing model. Raise the relevant question when designing the affected group. Final terms, notices, and jurisdiction-specific decisions need qualified legal review before release.

This layer guides future UI and backend design; it does not add screens, processing, recording, vendors, or application behavior now.

## Reference boundaries

This file is the consolidated product-discussion reference. `screens.md` retains the detailed original 46-screen inventory; `group-screens.md` retains original grouping history; `group2-7-product-refinements.md` retains earlier refinement notes. Group 1 images remain visual references in `Screens_group1`. Architecture rules and implementation reports remain separate from product thinking. No application behavior was changed by creating this document.

## Appendix — Provisional backend structure proposal

User-requested proposal, kept at the end of this document. Backend only; not the current directory tree, an approved refactor, or authorization to create modules. Finalize Group 2–7 behavior and state transitions before settling domain boundaries. This qualifies earlier illustrative module lists, particularly a standalone `proposals/` module.

```text
backend/
├─ src/
│  ├─ app/
│  │  ├─ server.ts
│  │  ├─ routes.ts
│  │  └─ plugins/
│  ├─ modules/
│  │  ├─ auth/
│  │  ├─ users/
│  │  ├─ organizations/
│  │  ├─ projects/
│  │  │  ├─ editors/
│  │  │  ├─ structure/
│  │  │  ├─ layers/
│  │  │  └─ sources/
│  │  ├─ model/                     # Group 2
│  │  │  ├─ object-types/
│  │  │  ├─ objects/
│  │  │  ├─ relationship-types/
│  │  │  ├─ relationships/
│  │  │  ├─ evidence/
│  │  │  └─ import-review/
│  │  ├─ views/                     # Group 3
│  │  │  ├─ view-config/
│  │  │  ├─ focus-regions/
│  │  │  ├─ block-visual-state/
│  │  │  └─ context-groups/
│  │  ├─ presentations/             # Group 4
│  │  ├─ meetings/                  # Group 5
│  │  │  ├─ participants/
│  │  │  ├─ presenter-state/
│  │  │  ├─ shared-state/
│  │  │  └─ focus-history/
│  │  ├─ personal-workspace/
│  │  │  ├─ notes/
│  │  │  ├─ drafts/
│  │  │  └─ private-ai/
│  │  ├─ discussions/               # Group 6
│  │  │  ├─ questions/
│  │  │  ├─ findings/
│  │  │  ├─ tradeoffs/
│  │  │  └─ decisions/
│  │  ├─ actions/                   # Ownership pending Group 6
│  │  ├─ readiness/                 # Group 7
│  │  ├─ integrations/
│  │  ├─ ai/
│  │  └─ realtime/
│  └─ shared/
│     ├─ auth/
│     ├─ config/
│     ├─ database/
│     ├─ errors/
│     ├─ storage/
│     ├─ validation/
│     └─ observability/
├─ migrations/
├─ scripts/
└─ tests/
```

**Ownership principles:** One modular monolith. Domain modules own business behavior; shared contains infrastructure. Each domain owns routes, schemas, services/use-cases, repositories/queries, authorization rules, its realtime event semantics, and tests. Small project concepts can stay internally separated under `projects` without becoming independent top-level domains. Existing Group 1 folders remain unchanged until a separately authorized refactor.

**Cross-cutting boundaries to reserve conceptually:** `ai`, `realtime`, and `integrations`. Centralize provider access, AI processing/context infrastructure, and transport/session synchronization without leaking their implementations across features or moving all domain logic into them. Domain-specific context permissions and event meaning retain clear owners. Miro or a future transcription provider are integration examples, not new provider commitments.

**Still undecided:** Do not create top-level `proposals/` yet. Determine whether a proposal is an independent aggregate or a state/type owned by model, discussions, or decisions. Decide action ownership after Group 6 despite its illustrative placement above. Clarify project-configuration layers versus canonical model layers. The sketch is not exhaustive: existing preferences and other established responsibilities must retain an explicit owner in any future migration. No domain or data is removed merely because it is absent from this sketch.

Keep this proposal appendix last when extending the main product-discussion sections.













