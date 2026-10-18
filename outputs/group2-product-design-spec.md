# Adaptive Spatial Labs — Group 2: Architecture Review

**Status: LOCKED product/core UX definition — 2026-10-18.**

Documentation/design handoff only. Do not implement Group 2, modify backend/Unity code, or redesign this agreed UX. Structural Edit Mode is deferred to Group 3. This written specification takes precedence over conflicting visual references and earlier exploratory Group 2 notes. Technical APIs, contracts, and device verification are not finalized by this product lock.

## Saved visual references

| File | State shown |
| --- | --- |
| [01-main-architecture-review.png](group2-reference-images/01-main-architecture-review.png) | Main architecture, collapsed edge tabs, top navigation and compact toolbelt |
| [02-project-sources-open.png](group2-reference-images/02-project-sources-open.png) | Sources panel open with Miro, documents and OpenAPI; architecture stays visible |
| [03-lasso-attach-context.png](group2-reference-images/03-lasso-attach-context.png) | Lasso selection, contextual actions, Notes/Questions/AI Findings/Evidence |
| [04-open-imported-depth.png](group2-reference-images/04-open-imported-depth.png) | Selected block actions and source-backed deeper architecture with Back |
| [05-context-ai-voice.png](group2-reference-images/05-context-ai-voice.png) | Context AI panel, supporting sources, and visible voice-listening state |

All five original PNGs were copied unchanged and verified by SHA-256. No sixth confirmation/error reference was supplied; do not fabricate one. Sample people, technologies, sources, architecture internals and findings in the images are illustrative, not facts about an imported project or new provider commitments.

## CORE PURPOSE

Group 2 answers:

“Did Adaptive Spatial Labs correctly understand the company’s existing architecture?”

Group 2 takes sources already connected in Group 1, reconstructs the existing company architecture, preserves recognizable source structure, allows lightweight inspection/contextual discussion, allows ambiguity to be flagged, and lets the architect confirm the basic model.

Group 2 is NOT the architecture editor.

Structural spatial editing is deferred to Group 3.


## ENTRY

Group 1:

Project Created
→ Proceed
→ Group 2 Architecture Review

Do NOT ask the user to upload/connect the same sources again.

Existing project sources may include:
- Miro
- documents
- OpenAPI
- other supported existing project sources

ASL processes those sources and reconstructs the architecture.


## MAIN SPATIAL GRAMMAR

## CENTER-FRONT:
Architecture model is always primary.

## LEFT EDGE:
Collapsed Sources arrow/tab.
It opens only when requested.

## RIGHT EDGE:
Collapsed evidence/context supporting arrow/tab where appropriate.
Do not leave a large permanent inspector open.

## NEAR USER:
Persistent compact toolbelt:

Lasso | Attach | AI | Snapshot | Microphone | My Space

## TOP-FRONT:
← Projects
Architecture Review
Recenter

Essential UI must remain within a comfortable seated field of view.

No important content behind the user.


## SOURCE / MODEL BEHAVIOR

Preserve recognizable Miro/source geometry where possible:

- boxes
- major grouping
- relative X/Y layout
- connectors
- direction
- frames/areas
- known hierarchy

AI may infer semantics, mappings and meaning.

AI must NOT rearrange the imported architecture merely to make it prettier.

Documents/OpenAPI enrich understanding/evidence rather than becoming giant floating documents.


## MODEL STATUS

Keep model statuses visually restrained.

Useful states:

- Confirmed
- Source-backed / likely
- Needs confirmation

Do not clutter every block with large status text.

Only uncertain areas should attract attention.


## GLOBAL HAND INTERACTION LANGUAGE

Hands are primary.

Use Meta-supported interaction concepts:

Far:
hand ray + pinch

Near UI:
direct poke where appropriate

Sustained action:
pinch-hold

Normal spatial object grab:
inspection / manipulation only where defined

Voice:
secondary accelerator

Quest controllers:
optional only; never required for the complete experience

Do not invent unnecessary custom hand poses.

Do not use the Meta system palm-menu gesture for ASL actions.


## TOOLBELT

Persistent toolbelt:

Lasso | Attach | AI | Snapshot | Microphone | My Space

Meaning:

Lasso:
Selects architecture context for conversation/attachment/AI.
In Group 2 it does NOT create a presentation focus and does NOT permanently hide unrelated architecture.

Attach:
Opens collaboration/context material attached to:
- whole architecture
- selected object
- selected relationship
- lasso area
- current imported deeper level

Attach content is generic:
- Notes
- Questions
- AI Findings
- Evidence

Do NOT hardcode “Failure Scenario” as an Attach category.

## AI:
Runs grounded contextual reasoning against the current architecture context and project sources.

Snapshot:
Saves the current review context/state for later reference.
It is NOT video recording.

Microphone:
Voice command / contextual question input.
Quick pinch may toggle listening.
Pinch-hold may be used as push-to-talk.

My Space:
Private, user-anchored workspace for personal notes/research/drafts.
It must not replace the main architecture.


## LASSO

Interaction:

1. Pinch Lasso tool.
2. Lasso mode visibly activates.
3. Point toward architecture.
4. Pinch-hold.
5. Draw enclosing path.
6. Release.
7. Selected architecture objects/relationships highlight.

The selection now acts as context.

Possible contextual actions:
- Attach
- AI
- Snapshot
- Connections where relevant

Group 2 lasso must NOT become a full spatial focus/presentation feature.


## SELECTING AN ARCHITECTURE BLOCK

Far:
ray + pinch

Near:
direct interaction where appropriate

Selection should show only a SMALL identity/context element.

Do NOT automatically open a giant Inspector panel.

Example:

Payment Service
Service
Source-backed

Contextual actions may include:

Open
Connections
Attach
## AI
Evidence


## OPEN / DEPTH

Open means:

“Show me what ASL already knows beneath this component.”

If real/imported deeper architecture exists:
→ open/show that deeper structure.

Examples could include imported service internals or another linked detailed source.

If no deeper architecture exists:
→ do not fabricate internal architecture.
→ indicate that no deeper structure is currently available.

V1 Group 2 does NOT provide a full manual “Create Internal Structure” workflow.

Imported deeper levels remain reviewable.

Back returns to the previous architecture level.

Keep orientation/context understandable when navigating depth.


## RELATIONSHIPS

A relationship/arrow can be selected.

Show lightweight information such as:

Payment Service → Queue
Publishes To
Source: Miro

Possible actions:
- Evidence
- AI
- Attach
- Needs Correction

Do NOT build complex connector manipulation in Group 2.

Wrong/misunderstood relationships may be marked as needing correction or described through text/voice.

Actual hand-driven structural editing of boxes/connectors belongs to Group 3 Edit Mode.


## AI

AI may reason over:

- whole architecture
- selected object
- selected relationship
- lasso context
- imported deeper layer
- project documents/evidence

Examples:

“Explain this payment flow.”

“Which document supports this relationship?”

“What does the source material say about this component?”

“Are these two sources describing the same service?”

“Did you find a relationship between Payment and Queue?”

AI outputs remain suggestions/findings unless confirmed.

AI never silently mutates canonical architecture.


## VOICE

Voice is an accelerator, not the only interaction method.

Examples:

“Show Payment connections.”

“Open Payment Service.”

“What does the documentation say about this area?”

“Attach a note saying this relationship needs review.”

If the user verbally describes a correction, ASL may interpret and show a proposed understanding.

Example:

User:
“Payment sends the event to Queue, not directly to Retry Worker.”

## ASL:
Suggested interpretation:
Payment → Queue

The user may confirm the understanding / flag for later editing.

Do NOT build full spatial connector editing here.


## SOURCES

Left collapsed arrow opens a compact left-front Project Sources panel.

Possible source states:

Miro Board     Connected / Processed
Product Docs   Processed
OpenAPI        Imported / Parsed

The architecture remains visible while the source panel is open.

The panel can collapse back into the edge tab.


## EVIDENCE

Evidence is contextual and temporary.

It can show where information came from, such as:

Miro / Payments frame
Architecture document / relevant section
payments-openapi.yaml

Do not keep Evidence permanently open.


## PANEL / EXIT BEHAVIOR

Temporary side/context panels:
close/collapse back to their originating tab/tool.

Main center architecture:
does NOT close like a window.

Global navigation:

← Projects
= exit Architecture Review and return to project area/home.

Back
= one architecture/depth level backward.

Recenter
= restore architecture/tooling into comfortable seated positions.

If autosaved:
exit directly.

If meaningful unsaved state exists:
show an appropriate save/exit confirmation.


## FAILURE / EMPTY STATES

Keep V1 recovery simple.

Source processing failed:

“We couldn't process this source.”

Actions:
Retry
Back

One internal retry is acceptable.
Do not create endless retry loops.

No usable architecture detected:

“We couldn't identify a usable architecture model from the connected sources.”

Action:
Back to Project / review sources.


## CONFIRMATION / END OF GROUP 2

When the architect is satisfied:

Confirm Architecture

This establishes the basic confirmed architecture model.

Then:

Architecture Confirmed
→ Project Home

Do NOT automatically force the user directly into Group 3.

Project Home becomes the stable project base.

From Home, the user can later intentionally create/refine spatial views/presentations.


## EXPLICIT NON-GOALS FOR GROUP 2

DO NOT include:

- free spatial movement/repositioning of architecture boxes
- manual connector drawing
- dragging connector endpoints
- architecture layout redesign
- advanced architecture edit mode
- color/depth presentation configuration
- hardcoded failure-scenario workflow
- scenario authoring system
- presentation creation
- roomscale navigation
- giant permanent Inspector panel

Those are outside Group 2.

The difficult hand-accurate Edit Mode will be designed in Group 3.


## GROUP 2 REFERENCE SCREENS

Save the images I provide using names similar to:

01-main-architecture-review.png
02-project-sources-open.png
03-lasso-attach-context.png
04-open-imported-depth.png
05-context-ai-voice.png

If I provide an additional state/reference image, save it as:

06-confirmation-error-state.png

The images are visual references, not absolute implementation truth.
Where an older image conflicts with this written specification, THIS WRITTEN SPECIFICATION WINS.


## TEST / DESIGN CONSTRAINTS

Every Group 2 implementation later must pass:

## HANDS-FIRST TEST
Entire main experience works without a controller.

## AIRPLANE-SEAT TEST
Core interactions function within roughly a 2-foot seated radius.

## STANDING COMPATIBILITY
Standing works naturally but is never required.

## ENTRY/EXIT TEST
Projects, Back, Recenter and panel close behaviors are always understandable.

## PERFORMANCE TEST
Architecture should use detail strategically:
active context = richer detail
near context = moderate detail
periphery = simplified
irrelevant = culled where appropriate

Quest performance must later be measured rather than guessed.

## Group 2 interaction mapping

User-provided interaction design table. Meta interaction primitives are intended mappings, not verified SDK/API claims; verify them against current official Meta tooling before implementation. “Hackathon rule check” records the intended design alignment, not verified compliance with any specific event's rules. Controllers remain optional; every primary workflow must work with hands. Voice accelerates AI input but is not required to complete the AI workflow.

| Group 2 action | User intent | Meta interaction primitive | Exact hand action | Near/far behavior | Voice alternative | Controller fallback | Seated test | Hackathon rule check | Notes / risks |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Select block | inspect architecture object | Ray / direct interaction | point + pinch / poke | both | optional | trigger | must work seated | hands-first | avoid tiny targets |
| Lasso | select context region | custom interaction built on pinch-hold | activate Lasso → pinch-hold → draw → release | mainly far | optional refine | trigger-hold | within 2 ft | hands-first | show visible path |
| Attach | open context workspace | UI selection | pinch Attach | near/far | “open attached context” | trigger | seated | hands-first | no forced notes taxonomy |
| AI | ask about selected context | UI selection + voice | pinch AI | near/far | primary accelerator | trigger | seated | productivity | human confirms meaningful changes |
| Snapshot | save review context | UI selection | pinch Snapshot | near/far | “save this context” | trigger | seated | short-use value | not video |
| Microphone | speak command/question | UI selection | pinch / pinch-hold | near | — | optional | seated | accessibility/productivity | visible listening state |
| My Space | private workspace | UI selection | pinch My Space | near-user | “open My Space” | trigger | seated | hands-first | stays user-anchored |
| Open block | inspect imported depth | contextual action | select block → pinch Open | both | “open Payment” | trigger | seated | spatial depth | no fake depth |
| Back | previous depth | UI action | pinch Back | near/far | “go back” | button | seated | easy exit | predictable |
| Recenter | restore comfort | UI action | pinch Recenter | near/far | “recenter” | button | seated | airplane-seat test | global |
| Projects | leave Group 2 | global navigation | pinch Projects | near/far | optional | button | seated | easy in/out | autosave/confirm if needed |

“No forced notes taxonomy” means generic attached context rather than a hardcoded scenario workflow; it preserves the agreed Notes, Questions, AI Findings, and Evidence categories. The two-foot constraint applies to the user's physical action, not the architecture's rendered extent. Controller button mappings are fallback intentions, not finalized hardware bindings.

## Open Questions: NONE for Group 2 core UX

No blocking contradiction was found within the locked core UX. Earlier exploratory notes that included manual model creation/editing, permanent inspectors, or presentation focus inside Group 2 are superseded by this specification. Group 2 supports review, confirmation, correction flags and proposed understanding; it does not provide free structural editing.

Visual discrepancy recorded: image 03 labels four selected components and names API Gateway, Payment Service, Queue and Database, but the dashed outline does not clearly include API Gateway. This does not change the locked interaction: actual selection highlighting/count/list must agree. Do not infer selection geometry rules from this illustration.

## Cross-cutting acceptance and policy carry-forward

Retain the hands-only, seated two-foot-radius, standing-optional, clear entry/pause/resume/exit and meaningful-work-in-about-ten-minutes criteria from the consolidated discussion notes. Preserve private state on pause/resume, and never silently lose meaningful work. Snapshots save review context/state, not video; permissions, data scope and visibility still need implementation-level verification.

The existing policy/privacy layer remains applicable: timely microphone/AI disclosures and permissions, explicit private/session/project sharing, appropriate source access, and no invented recording scope. Verify Meta-supported gestures and APIs against current official tooling before future implementation; this document records UX intent rather than API verification.

## Handoff boundary

Application code was not modified. Saved design decisions are not proof of implementation, testing, performance, headset comfort, or platform compliance. Future implementation remains a separate user-directed increment.
