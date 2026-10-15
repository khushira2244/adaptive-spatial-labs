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

**Discussion/validation:** Clear progress, back/skip behavior, recoverable drafts/errors, understandable owner/editor/visibility choices, connection cancellation/failure, useful setup success state, and quick re-entry. Exact source-processing timing and the Project Created → Proceed destination remain to be settled for Group 2.

## Group 2 — Source Review + Canonical Model

**Purpose:** Turn Miro/documents and other supported sources into a trustworthy, human-reviewed canonical architecture model.

**Screens/states:** Imported Model Review; Project Main Workspace; Layer Configuration; Architecture Object Library; Object Inspector; Source/Evidence; Product ↔ Architecture Mapping.

**Design notes:** Start from a source-faithful Miro projection, preserving meaningful positions/connectors. AI performs the heavy initial interpretation into candidate blocks, connections, hierarchy, and mappings with evidence and uncertainty. Confirm/Edit/Reject controls determine accepted truth. Support basic/expandable blocks and deeper hierarchy only where supported by real source data. Define block properties, layers, relationship visibility, lasso, context boxes, and hands select/grab/move/rotate/scale/open. Voice can refine a selection, for example direct relationships only. Context Pins link notes/questions to the correct block, area, or relationship.

**Design questions:** Exact first workspace after creation; center and left/right/top/near panels; candidate versus accepted appearance; partial confirmation; unsupported/missing source detail; manual creation; lasso membership/refinement; evidence display and context anchoring.

**Tests designed with this group:** Seated select/pinch/lasso accuracy; bring distant blocks near; recognizable expandable behavior and Back. Check source geometry/connectors, evidence, Confirm/Edit/Reject, no fake depth, and correct pin attachment. Increase block/arrow counts and profile selection, lasso, labels, and relationship rendering.

## Group 3 — Views + Spatial Representation

**Purpose:** Decide how an existing canonical model is shown without rewriting its truth.

**Screens/states:** Create View; Spatial Configuration; View Suggestions; Saved View/Preview.

**Design notes:** Save purpose/audience, chosen layers/objects, spatial layout, labels, relationship visibility, grouping, and block visual profiles: width, height, depth, scale, style/color. Distinguish whole-view manipulation from per-box semantic depth. Focus reveals useful detail while context boxes represent real hidden architecture. Support connected-object context, distance interaction, recentering, and understandable navigation back. Built-in, user-created, or AI suggestions are previewed and selected by the user; nothing auto-applies.

**Design questions:** What belongs to canonical truth versus a View; visual defaults/overrides; focus/context semantics; save/duplicate behavior; how deeper layers come forward while prior context remains understandable.

**Tests designed with this group:** Seated whole-view scale/rotation, distance interaction, semantic Open versus physical scale, and recenter. Verify View edits never mutate canonical truth and settings persist per View. Measure zoom/focus frame time, visibility culling, and appropriate detail reduction; consider batching/instancing/LOD when evidence supports them.

## Group 4 — Presentation + Audience

**Purpose:** Prepare and present a View for an audience and purpose.

**Screens/states:** Presentation Creation; Visibility/Permissions; Sequence/Stages; Invitations; Schedule/Start.

**Design notes:** Project → View → Presentation → Audience → Visibility/permissions → Meeting. Compose multiple focus/discussion areas, stage order, block-specific depth, and reveal/focus behavior. Presentation motive and voice can refine lasso/filtering. Move between full model, focused area, small objects, and internal detail with clear returns. Keep controls uncluttered. Temporary presentation changes must not silently rewrite the saved View.

**Presenter-control principle:** Meeting host ownership and shared-stage presenter control are separate. A participant prepares privately → requests presentation → receives control → presents → returns control. Restore the prior presenter's exact previous presentation state. Canonical truth is unaffected.

**Design questions:** Audience access versus project editing; stage persistence; allowed temporary overrides; request/give/return/take-back control; precise state captured for restoration; invitations and scheduling boundaries.

**Tests designed with this group:** Entire presentation seated; lasso → focus → open → Back/Full View; relaxed head/hand movement; optional voice refinement. Revisit multiple focus areas and exact return points. Measure transition/open/collapse spikes and avoid loading every region simultaneously.

## Group 5 — Meeting + Shared State + My Space

**Purpose:** Run a live shared architecture session while preserving private participant work.

**Screens/states:** Meetings Home; Pre-Meeting Preparation; Presenter/Participant Live Views; My Space During Meeting; Raise Point; Shared Question state. Discussion content continues into Group 6.

**Design notes:** Meeting creation/tags, chosen View/presentation, host, presenter, participants, shared architecture/focus, and clear participant controls. Persistent My Space is available while viewing, presenting, attending, inside a lasso, or exploring detail. It contains private notes, marks, questions, exploration, drafts, and AI assistance; it never replaces the central shared stage. Leave shared focus privately and Return to Live explicitly. Support multiple focus areas through a long meeting and temporary presenter handoff with saved return-state.

**State principle:** Project persistent knowledge, session/shared state, and personal/private state remain separately owned. Private → ready to share → raise point → shared session is explicit. Define what other people see at every transition.

**Design questions:** Host/presenter permissions; request acceptance; private versus live focus indicators; reconnect and pause/resume; what happens if the shared stage changes while a user is away; handoff interruption/take-back; comfortable panel arrangement.

**Tests designed with this group:** Near-space comfort; obvious Return to Live; control handoff and restoration; private exploration without disorientation. Verify privacy, reconnect, and state separation. Test multiple users; measure network frequency separately from rendering, avoid unnecessary transform synchronization, and profile shared architecture plus My Space together.

## Group 6 — Questions → Discussion → Trade-offs → Decisions → Work

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
