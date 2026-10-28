# Adaptive Spatial Labs — Group 4: Presentation Builder, Scenario Authoring + Meeting Bridge

**Status: supplied product-design handoff saved 2026-10-21; 11 continuation references received and indexed.** Documentation only. Do not implement backend/Unity, generate application code, or start Group 5. This continuation follows the existing Stage 4 Discussion Preparation specification; it does not rewrite or replace it.

## Reference-image status

All 11 continuation images were received on 2026-10-21, inspected from the supplied attachments, copied unchanged, and verified with SHA-256. Existing Stage 1–4 references retain their original roles. Composite images cover several states; they are not separate implementation screens. No new Home image was supplied in this batch.

| Saved reference | State / purpose | Original filename |
| --- | --- | --- |
| [07-builder-add-screen.png](group4-reference-images/07-builder-add-screen.png) | Add Screen launcher; existing context access | Mixed-Reality Architecture Presentation Builder.png |
| [08-create-success-screen-form.png](group4-reference-images/08-create-success-screen-form.png) | Center scenario definition form; screen not created yet | ChatGPT Image Oct 21, 2026, 12_27_56 PM-1.png |
| [09-ai-scenario-understanding-confirmation.png](group4-reference-images/09-ai-scenario-understanding-confirmation.png) | Scenario form plus AI understanding and Confirm | Immersive VR Payment Flow Dashboard.png |
| [10-success-screen-ai-context-flat-reference.png](group4-reference-images/10-success-screen-ai-context-flat-reference.png) | Post-confirm screen with contextual AI; older flat visual variant | ChatGPT Image Oct 21, 2026, 12_28_00 PM-2.png |
| [11-semantic-success-screen-ai-context.png](group4-reference-images/11-semantic-success-screen-ai-context.png) | Semantic light-3D screen, created/draft list and contextual AI | Payments Platform Architecture Dashboard.png |
| [12-component-and-connection-settings-composite.png](group4-reference-images/12-component-and-connection-settings-composite.png) | Composite: component settings and connection settings | Neon Architecture Dashboard Editing Scenes.png |
| [13-lasso-ai-preview-adjust-apply-composite.png](group4-reference-images/13-lasso-ai-preview-adjust-apply-composite.png) | Composite: lasso request, proposal, preview, adjustment and apply | AI-Powered Architecture Editing Dashboard.png |
| [14-builder-add-next-screen.png](group4-reference-images/14-builder-add-next-screen.png) | Return to created screen list and right Add Next Screen | Immersive Payments Architecture Workspace.png |
| [15-presentation-meeting-menu.png](group4-reference-images/15-presentation-meeting-menu.png) | Presentation-level Meeting dropdown | ChatGPT Image Oct 21, 2026, 12_31_48 PM-1.png |
| [16-meeting-setup.png](group4-reference-images/16-meeting-setup.png) | Meeting setup: title, start screen, invitees and time | ChatGPT Image Oct 21, 2026, 12_31_51 PM-2.png |
| [17-meeting-scheduled-confirmation.png](group4-reference-images/17-meeting-scheduled-confirmation.png) | Scheduled confirmation within presentation workspace | ChatGPT Image Oct 21, 2026, 12_31_54 PM-3.png |

Written specification wins over conflicting visual controls. See the image qualifications below.

## Handoff interpretation

The complete supplied product direction follows below. Descriptions such as “architecture copy” or “presentation copies” mean a rendered screen-specific view referencing the same confirmed architecture plus overrides/overlays, never duplicated canonical data. Exact SDK bindings, legal/provider behavior, physical comfort and performance remain to be verified later. Spatial distances are user-defined design targets, not verified Meta standards or required reach distances. All existing hands-first, seated, state/privacy, entry/exit/resume, short-use and system-keyboard rules remain applicable.

CORE PRODUCT PRINCIPLE

Presentation screens NEVER modify the canonical confirmed architecture.

The canonical architecture remains immutable during presentation preparation.

Every presentation screen is conceptually:

BASE ARCHITECTURE
+
SCREEN-SPECIFIC VIEW / SCENARIO OVERRIDES
+
OPTIONAL SCENARIO-ONLY OVERLAYS

Example:

Payments Platform architecture
    ↓
Main Architecture presentation view
    ↓
Success Screen
    ↓
Failure Screen
    ↓
Recovery Screen
    ↓
Discussion Screen

All screens reference the SAME confirmed architecture.

Changing:

Database color
Database size
connection appearance
node depth
visibility
labels
scenario-only arrow

inside a presentation screen changes ONLY that presentation screen.

It MUST NOT:

- edit canonical architecture
- delete canonical nodes
- add canonical nodes
- permanently disconnect canonical relationships
- modify Group 2 confirmed truth


## SECTION 1 — PRESENTATION AUTHORING SPATIAL MODEL

After Discussion Preparation, Group 4 becomes a PRESENTATION AUTHORING workspace.

Do NOT turn this into:

- PowerPoint
- desktop slide editor
- dashboard
- generic canvas
- giant settings application

The architecture remains the product.

Spatial grammar:

LEFT
= confirmed / already-created presentation content

CENTER
= current content being viewed or authored

RIGHT
= variable action / Add Screen / AI / contextual settings

BOTTOM
= familiar architecture toolbelt

TOP
= architecture/project header + Recenter + later Meeting

Very important:

LEFT = things that already exist / have been created.

RIGHT = things the user can currently add/change/do.

CENTER = active work.


## SECTION 2 — MAIN PRESENTATION BUILDER STATE

After previous discussion preparation is accepted:

show the Presentation Builder state.

LEFT PANEL:

Presentation Screens

This contains the already-created screens.

Example:

Main Architecture
Success Screen
Failure Screen
Discussion Notes
Recovery Screen
etc.

The exact set depends on what the user has created.

Main Architecture always exists as the base presentation screen.

Created screens show:

- screen name
- type/status
- optional short description
- completed/draft state

Example:

Main Architecture
System overview

Success Screen
Payment completed flow

Failure Screen
Draft
Not created yet

Discussion Notes
Draft
Not created yet

LEFT IS NOT PROJECT SOURCES ANYMORE
for the active Presentation Builder mode.

Project Sources/docs remain accessible through contextual tools when needed,
but the presentation-authoring left panel prioritizes the created presentation structure.


## SECTION 3 — NOTES / CONTEXT ACCESS

Project context still exists.

Do not remove:

- Notes
- Questions
- AI Findings
- Evidence
- source documents

But do not permanently occupy the presentation-authoring workspace with docs.

If Notes / Docs / Evidence are explicitly opened:

they may temporarily become CENTER content.

Example:

user selects Notes
→ Notes view comes center
→ presentation screen list remains available where appropriate
→ right retains current variable/action context

When closed/back:

return to presentation authoring.

Design priority is PRESENTATION DESIGN,
not constantly displaying source documents.


## SECTION 4 — RIGHT SIDE: ADD SCREEN

When user wants another presentation screen:

RIGHT panel becomes:

Add Screen

Possible V1 screen types:

Architecture Overview
Discussion Screen
Success Screen
Failure Screen
Recovery Screen
Custom Screen

Do NOT overload with dozens of templates.

The important screen families are:

1. Architecture / base view
2. Discussion
3. Success / normal scenario
4. Failure / exception scenario
5. Recovery / retry scenario
6. Custom

Selecting a screen type does NOT immediately generate the final architecture visualization.

First the user defines the scenario.


## SECTION 5 — SELECTING SUCCESS SCREEN

Example flow:

RIGHT
Add Screen

user points at:

Success Screen

interaction:

ray hover
→ soft highlight
→ pinch

Then:

SUCCESS SCREEN CREATION FORM MOVES TO CENTER.

Do NOT immediately show the architecture.

This is a critical rule.


## SECTION 6 — CREATE SUCCESS SCREEN FORM

CENTER now becomes:

Create Success Screen

Simple information only.

Example fields:

Screen Name
[ Payment Completed ]

Based On
[ Current Selected Area: Payment Flow ]
or
[ Whole Architecture ]

Scenario Goal
[ Show the successful payment journey ]

Description / Notes
[ optional user description ]

Voice input should be available.

User can type or speak.

Text uses Quest/Horizon system keyboard.

Do NOT create custom keyboard.

Example voice:

"Show the successful payment flow where payment is processed,
order is confirmed and the customer receives confirmation."


## SECTION 7 — AI UNDERSTANDING BEFORE SCREEN CREATION

AI is important here.

After the user supplies:

- screen name
- scenario goal
- optional description
- selected architecture scope

AI reads:

- canonical architecture
- attached project docs
- selected architecture context
- relevant existing notes
- relevant questions
- evidence
- previous confirmed findings
- user's voice/text scenario

AI then opens a RIGHT-SIDE AI panel.

The AI panel does NOT immediately redesign the architecture.

Its first responsibility is:

UNDERSTAND THE SCENARIO.

Example:

AI Assistant

Understanding from Docs & Selected Flow

"This scenario represents a successful payment journey:
payment is authorized,
the order is confirmed,
persistence succeeds,
and the customer receives confirmation."

Possible grounded understanding:

✓ Payment is successfully authorized/captured
✓ Order is confirmed and stored
✓ Downstream event processing occurs
✓ Confirmation notification is sent

Suggested Description:

"Show the successful payment journey where payment is processed,
order is confirmed,
and the customer receives confirmation."

Optional Comment
[ Add any specific detail or adjustment... ]

Actions:

Use Draft
Edit
Confirm


## SECTION 8 — AI GROUNDING RULE

AI MUST distinguish:

SOURCE-GROUNDED FACT
vs
USER-SPECIFIED SCENARIO
vs
ASSUMPTION

Do not silently turn assumptions into architecture truth.

If documentation does not establish an exact successful flow:

AI may say:

"Based on the available architecture and your scenario,
I understand the intended presentation as..."

The architect confirms the interpretation.

NOTHING becomes the presentation screen until user confirms.


## SECTION 9 — CONFIRM SCENARIO

Flow:

user reviews AI understanding
→ optionally edits
→ optionally speaks adjustment
→ optionally adds comment
→ Confirm

Only after Confirm:

the architecture becomes CENTER again.

Now the newly-created presentation screen is active.

Example header:

Payments Platform — Success Screen

LEFT:

Presentation Screens

Success Screen is now listed as created.

CENTER:

Success Screen architecture view.

RIGHT:

AI can be available contextually.

Do NOT immediately expose a huge settings form.


## SECTION 10 — SEMANTIC 2.5D / LIGHT-3D ARCHITECTURE

Presentation architecture should NOT look like identical flat boxes.

V1 uses SIMPLE SEMANTIC 2.5D / LIGHT-3D OBJECTS.

Goal:

recognizable
professional
performant
easy to manipulate
Quest-friendly

Do NOT make hyper-realistic heavy 3D models.

Use recognizable silhouettes.

Canonical V1 visual object types:

Frontend
→ monitor / screen-like object

API Gateway
→ routing hub / gateway object

Service
→ raised rounded service module/card

Database
→ cylinder

Queue
→ stacked layers / message stack

Worker
→ gear / cog object

Notification
→ envelope/message object

Fraud / Security
→ shield object

Storage / Files
→ folder / document stack

External Provider
→ connector / plug-like neutral module

These must share one coherent visual system.

Examples:

Payment Service
= raised service module

Database
= visible cylinder

Queue
= stacked message object

Worker
= gear/cog

Notification
= envelope/message object

Fraud Service
= shield object


## SECTION 11 — COMMON PRESENTATION VISUAL STATE

Presentation copies may apply screen-specific visual overrides.

Allowed basic V1 visual concepts:

- Normal
- Success
- Warning
- Failure
- Disabled / inactive

Possible visual controls:

- emphasis
- color treatment
- opacity
- scale
- depth
- label
- marker
- simple highlight
- simple pulse
- visibility
- connection visual state

These are presentation overrides only.


## SECTION 12 — SELECTING A COMPONENT

When user selects a component in CENTER:

Example:

Payment Service

interaction:

ray hover
→ component highlights
→ pinch

Open a compact contextual settings panel.

Do NOT permanently occupy the entire workspace.

The selected component should remain visible.

Component panel should support a SMALL deterministic design vocabulary.

Possible V1:

State
Normal
Success
Warning
Failure

Emphasis
Normal
Highlight
Dim

Size
Small
Medium
Large
or controlled scale range

Depth
Back
Normal
Forward

Marker
None
✓
!
×

Visibility
Show
Hide

Label
Show
Hide

Highlight
on/off

Optional:
simple pulse

AI / Voice entry is available.

Do NOT expose dozens of advanced controls.


## SECTION 13 — VOICE EDITING A COMPONENT

AI should translate voice into deterministic visual operations.

Example:

user selects Database.

User says:

"Make this database bigger, red and bring it forward."

AI maps to:

Database
State → Failure
Scale → 130%
Depth → Forward
Emphasis → Highlight

Then show:

Preview
Apply
Change

AI cannot create arbitrary unsupported visual commands.

It maps natural-language intent to known supported operations.


## SECTION 14 — CONNECTION / ARROW SETTINGS

Selecting a connection:

ray hover connection
→ enlarged invisible hit target
→ pinch

Open compact connection panel.

Possible V1 settings:

State
Normal
Active
Blocked
Broken

Style
Solid
Dashed

Emphasis
Normal
Highlight
Dim

Marker
None
✓
!
×

Visibility
Show / Hide

Activity
Static
Flow

Label
optional short label

State/color treatment:
Normal
Success
Warning
Failure

Do NOT modify canonical relationship truth.

Example:

"Break this connection and make it red."

Maps to presentation override:

state = Broken
failure treatment = active
marker = ×
style = dashed


## SECTION 15 — SCENARIO-ONLY OVERLAY CONNECTION

Sometimes a presentation scenario needs to explain a possible flow
that is not a canonical architecture relationship.

Example:

Payment Service → Queue
Label: Retry

Allow SCENARIO-ONLY OVERLAY CONNECTION.

It must:

- belong only to the presentation screen
- be visually distinguishable from canonical connections
- never alter canonical architecture
- never be mistaken for confirmed truth
- support label/status/style
- be removable/resettable from screen


## SECTION 16 — LASSO + AI

This is one of the most important Group 4 interactions.

Lasso selects a region.

Then AI / voice may transform the selected presentation area using the allowed deterministic visual vocabulary.

Flow:

Lasso
→ pinch
→ pinch-hold on architecture plane
→ small hand movement
→ release
→ region selected

Then user speaks or types.

Example:

"Show this area as degraded.
Make the database red and bigger,
dim the queue,
lower this group slightly,
and break the connection after the worker."

AI interprets.


## SECTION 17 — AI TRANSLATION FOR LASSO

AI converts the request into explicit operations.

Example:

GROUP
Tint → Warning / failure treatment
Depth → -10 cm visual offset
Outside area → Dim 40%

DATABASE
State → Failure
Scale → 130%
Depth → Forward

QUEUE
Opacity → 60%
Emphasis → Dim

CONNECTION
State → Broken
Style → Dashed
Marker → ×

Other components:
Keep normal

Then:

Preview Changes
Apply
Adjust

Nothing is applied silently.


## SECTION 18 — LASSO PREVIEW

Preview should show the actual proposed scenario state.

User may then say:

"Also make the worker orange and add a warning label 'Job failing'."

AI updates proposal.

Example:

Worker
Treatment → Warning
Label → Job failing

Then:

Update Preview

User confirms:

Apply

Only the ACTIVE PRESENTATION SCREEN receives these overrides.

Canonical architecture remains untouched.


## SECTION 19 — ALLOWED V1 AI VISUAL OPERATIONS

Lock AI to a deterministic V1 visual vocabulary.

AI may request/apply only supported operations such as:

- make component larger/smaller
- bring forward/send backward
- highlight/dim
- normal/success/warning/failure/disabled
- opacity
- marker ✓ / ! / ×
- show/hide label
- show/hide component
- simple pulse
- group tint
- dim outside selected area
- show group boundary
- connection highlight
- connection dashed/solid
- connection active/blocked/broken
- connection marker
- simple connection flow animation
- scenario-only overlay connection
- reset selected component
- reset selected area
- reset presentation screen

Do NOT give AI arbitrary geometry-generation authority.


## SECTION 20 — RETURN AFTER SCREEN CONFIRMATION

After a Success / Failure / Recovery / Custom presentation screen has been created and confirmed:

return user to the Presentation Builder.

LEFT:

confirmed/created screens now appear in the Presentation Screens list.

Example:

Main Architecture
Success Screen ✓
Failure Screen Draft
Discussion Notes Draft

RIGHT:

Add Next Screen

This is the important spatial rule:

LEFT
= created / confirmed presentation content

RIGHT
= variable next actions

CENTER
= currently selected presentation screen


## SECTION 21 — ADD NEXT SCREEN

Right panel can show:

Add Next Screen

Failure Screen
Retry / Timeout Variant
Discussion View
Recovery Flow
Custom Screen

Do NOT automatically prescribe every possible presentation screen.

This panel is an authoring launcher.

When one is selected:

same pattern repeats:

1. scenario details form in center
2. AI understands scenario
3. user confirms
4. architecture copy opens
5. user visually edits
6. confirm screen
7. screen enters left list


## SECTION 22 — SCREEN STATUS

Presentation Screens panel should clearly distinguish:

CREATED / CONFIRMED
vs
DRAFT / NOT CREATED

Example:

Success Screen
Payment completed flow
Created

Failure Screen
Draft
Not created yet

Discussion Notes
Draft
Not created yet

Do not accidentally imply that a draft screen is already part of the final presentation.


## SECTION 23 — NOTES IN PRESENTATION SCREENS

Do NOT remove Discussion Notes / relevant presentation notes from the left screen structure when the product needs them.

Presentation may contain contextual discussion content alongside architecture scenario screens.

Example:

Main Architecture
Success Screen
Failure Screen
Discussion Notes

Discussion Notes can store:

- key points
- questions
- tradeoffs
- decisions to discuss

It is still part of the SAME presentation.


## SECTION 24 — HEADER

Once presentation construction is available, preserve the project/architecture identity.

Top header should stay simple.

Example:

← Projects     Payments Platform     Recenter     Meeting ▾

Do NOT create a different header for every presentation screen.

Presentation screens are views within the same Payments Platform presentation.


## SECTION 25 — MEETING IS A PRESENTATION-LEVEL ACTION

Meeting belongs to the WHOLE presentation.

It does NOT belong separately to:

Success Screen
Failure Screen
Main Architecture
Discussion Screen

All those screens are parts of the SAME presentation.

Correct conceptual model:

Architecture
    ↓
Presentation
    ├── Main Architecture
    ├── Success Screen
    ├── Failure Screen
    ├── Discussion Screen
    └── Recovery Screen
            ↓
        ONE Meeting Session

Therefore:

Meeting appears in the top header.


## SECTION 26 — MEETING MENU

Selecting:

Meeting ▾

opens compact options such as:

Start Meeting
Schedule Meeting

Do not immediately start meeting from a single presentation screen.


## SECTION 27 — MEETING SETUP

Meeting Setup is the Group 4 → Group 5 bridge.

Keep it simple.

Possible fields:

Title
[ Payment Reliability Review ]

Start From
[ Main Architecture ]

Presentation Includes
[ presentation screens belonging to this presentation ]

Invite People
[ existing relevant participants ]

Additional Invitees
[ Add by email ]

Time
Start Now
Schedule for Later

Actions:

Cancel
Confirm Meeting


## SECTION 28 — PRESENTATION COLLABORATORS VS MEETING INVITEES

This distinction is critical.

PRESENTATION COLLABORATORS:

people who helped prepare/review the presentation.

MEETING INVITEES:

people attending the actual live meeting.

Meeting invitees may include:

- project members
- presentation collaborators
- additional team members
- managers
- senior stakeholders
- external/restricted guests
- additional people invited by email

Meeting participation DOES NOT automatically grant:

- permanent project membership
- architecture editing authority
- presentation collaboration authority


## SECTION 29 — ADDITIONAL MEETING INVITEES

Meeting setup supports:

Add attendees

existing known user
or
generic email

Use system Quest keyboard for email entry.

Do not call it Gmail.

Meeting-level invite is scoped to the meeting unless other access is separately granted.


## SECTION 30 — START FROM

The meeting uses the complete presentation.

Start From only determines which presentation screen appears first.

Default:

Main Architecture

Possible alternative:

Success Screen
Failure Screen
etc.

This does NOT create different meetings.

It is simply the initial shared screen of the same meeting.


## SECTION 31 — AFTER MEETING CONFIRMATION

If scheduled:

return to presentation workspace.

Show small confirmation:

Meeting scheduled
6 invitees
Starts from Main Architecture

Do not replace the presentation with a new product shell.

Meeting remains accessible from the header.

If Start Now:

transition into Group 5 Live Meeting.


## SECTION 32 — HAND MOVEMENT FOR PRESENTATION BUILDER

All interactions remain hands-first.

PRIMARY:

hand ray + pinch

Use direct hand interaction only for comfortably close content.

No controllers required.

No custom gesture vocabulary.


SELECT PRESENTATION SCREEN

point toward left Presentation Screens card
→ ray hover
→ soft highlight
→ pinch
→ screen becomes center


ADD SCREEN

point toward right Add Screen item
→ hover
→ pinch
→ selected screen creation form becomes center


FORM INPUT

point to text field
→ pinch
→ Quest system keyboard

or:

point to mic
→ pinch
→ speak


CONFIRM AI UNDERSTANDING

point at AI panel
→ inspect
→ optionally edit/comment
→ point to Confirm
→ pinch

Only then generate screen view.


SELECT COMPONENT

point ray toward semantic architecture object
→ hover outline
→ pinch
→ component settings open


SELECT CONNECTION

connection has enlarged invisible hit target
→ hover highlight
→ pinch
→ connection settings open


LASSO

point to Lasso
→ pinch
→ pinch-hold on architecture plane
→ move through small seated arc
→ release

No giant arm circles.


VOICE DESIGN

select target:

component
connection
lasso group
or screen

then:

mic
→ pinch
→ speak

AI operates ONLY on currently selected target/context unless user explicitly says otherwise.


PREVIEW / APPLY

AI visual operation:

request
→ proposal
→ Preview
→ optional Adjust
→ Apply

Never apply silently.


## SECTION 33 — SPATIAL DISTANCES

Architecture center:

approximately 1.0–1.2 m

Left / right panels:

approximately 0.9–1.2 m,
slightly left-front / right-front

Bottom toolbelt:

approximately 0.5–0.8 m

Semantic architecture objects remain comfortably readable within forward FoV.

No content behind user.

No standing required.

No major shoulder movement.

No giant reaching.


## SECTION 34 — PERFORMANCE / V1 VISUAL RULE

Semantic 3D objects must remain light enough for Quest.

Use:

- simple meshes
- reusable materials
- restrained transparency
- limited glow
- minimal active animation
- pooled/simple markers where possible

Do NOT build:

- high-poly realistic databases
- complex machinery
- physics-heavy architecture objects
- unlimited particle systems
- expensive continuous effects

The 3D look should primarily improve:

recognition
depth
presentation clarity

not become a game scene.


## SECTION 35 — IMPORTANT NON-GOALS

DO NOT:

- mutate canonical architecture
- treat presentation screens as independent architectures
- create separate meetings per presentation screen
- create Zoom-style video grid
- create a giant permanent AI panel everywhere
- let AI autonomously redesign architecture
- expose unlimited styling controls
- duplicate canonical notes/docs into each screen
- make docs the dominant presentation-builder experience
- create a desktop slide editor
- use locomotion
- require controllers
- create complex 3D simulation engine for V1
- implement anything in this task


## SECTION 36 — DATA MODEL INTENT

Conceptually:

Presentation
- id
- projectId
- architectureId
- architectureVersion
- name
- collaboratorIds
- screenIds[]
- meetingRefs[]

PresentationScreen
- id
- presentationId
- architectureId
- architectureVersion
- type
- name
- description
- scopeType
- selectedNodeIds[]
- selectedConnectionIds[]
- discussionRefs[]
- visualOverrides[]
- scenarioOverlayConnections[]
- screenOrder
- status

VisualOverride
- targetType: NODE | CONNECTION | GROUP | SCREEN
- targetIds[]
- property
- value

ScenarioOverlayConnection
- fromNodeId
- toNodeId
- label
- visualState
- presentationScreenId

Canonical architecture is NOT copied or mutated.

Meeting
- id
- presentationId
- projectId
- architectureId
- startingScreenId
- attendeeIds[]
- guestInvites[]
- schedule
- status


## SECTION 37 — REFERENCE IMAGE INTERPRETATION

Use latest supplied images as references for:

1. Create Success Screen form
2. AI scenario-understanding confirmation
3. semantic 3D success architecture
4. component settings
5. connection settings
6. Lasso + AI scenario design
7. Lasso Preview / Apply
8. return to Add Next Screen
9. Presentation Screens list with completed/draft states
10. Meeting top-header dropdown
11. Meeting Setup
12. post-schedule confirmation

Ignore visual inconsistencies in generated images such as:

- older flat identical-box architecture
- giant permanent AI analysis panels
- irrelevant "Potential improvements" lists
- old Architecture Review title where Payments Platform is more appropriate
- presentation screens being treated as separate meetings
- missing Discussion Notes
- incorrect Home/app sidebar inside immersive workspace
- giant desktop-style navigation
- AI automatically applying changes
- any image where Success Screen opens before scenario definition/AI confirmation

Written specification wins.

## Consistency notes for future discussion

- The left-side role changes intentionally after Discussion Preparation: Project Sources was the prior stage's stable left panel; Presentation Builder prioritizes Presentation Screens. Source/context access remains available through explicit contextual tools. This is a mode-specific change, not replacement of Stage 4.
- “Left = already-created content” coexists with examples of Draft / Not created yet entries. Preserve clear draft status; a placeholder is not a completed presentation screen. Which draft placeholders appear is not a mandate to auto-create every suggested screen.
- “One Meeting Session” illustrates one session covering the whole presentation, not a permanent one-meeting-per-presentation restriction: the conceptual Presentation retains meetingRefs[]. Start From chooses the initial screen of a session, not a separate meeting for each screen.
- Natural-language examples propose defaults, not facts: “red” does not itself prove a component has failed, and “bring forward/lower” require an explicit visual-axis interpretation in the proposed operation preview. User approval applies to visible deterministic changes only; no silent additions or canonical mutations.
- The selected-target-only rule must be reconciled visibly with examples that dim outside the selection: include outside-area operations explicitly in the proposal and require explicit user approval, rather than silently broadening AI scope.
- Scenario understanding Confirm, visual Apply, screen confirmation, Group 2 canonical confirmation and Confirm Meeting are different actions with different state ownership. They must not be conflated.
- A new draft scenario is not a created/final screen. The first user confirmation accepts scenario interpretation and permits its screen view; later screen confirmation marks the authored screen created/confirmed. Exact intermediate status labels remain implementation detail.
- Private notes and restricted source content do not become shared or sent to AI merely because relevant. Presentation/meeting references preserve authorization boundaries and intentional sharing. Guest attendance never automatically grants project or authoring authority.

No application changes are authorized while these notes and images are being collected. Any unresolved behavior conflict must be raised before implementation. Image-specific discrepancies are recorded in the received-image qualifications below.

## Image qualifications — received 2026-10-21

- References 07 and 09 retain older Architecture Review wording; use the architecture/project identity required by this handoff. Reference 09's “Laser” label does not rename the established Lasso tool. Sample character counters do not finalize validation limits.
- Reference 10 is an older flat-box variant. References 11–17 show richer semantic objects; retain the written lightweight semantic vocabulary, simple meshes/materials and restrained effects rather than treating heavy glow, pedestals or detailed models as performance-approved assets.
- Reference 07 does not show the full final Presentation Screens-left grammar and emphasizes notes below the architecture. Use it for the Add Screen launcher/context-access concept; later list references and the written builder grammar govern created content on the left. It does not authorize permanently making docs dominant.
- Reference 12 illustrates settings, but its canonical-looking Name/Provider/description edits, Duplicate/Delete, lock-position, connection endpoints, One-way/Two-way and thickness controls do not add capabilities beyond the written deterministic V1 vocabulary. No canonical rename, delete, duplication, rewiring or direction change is authorized. Use screen-only visual controls; scenario overlays remain separately distinguishable/removable.
- Contextual AI panels in 11–13 are examples while explicitly invoked, not permanent analysis panels. Sample assertions, risks, providers and source lists are not verified architecture facts. Preview/Adjust/Apply remains mandatory for proposed visual changes.
- Draft/Not created yet cards are not completed content. Reference 16 includes a Failure Screen chip while the left list marks it Draft/Not created yet; do not infer approval to share an unfinished screen. Meeting-ready draft inclusion behavior must be settled before implementation. Removable screen chips likewise do not silently override the presentation-level meeting model.
- Source topology/direction and component silhouettes differ across illustrations. They do not replace the same confirmed canonical model with unrelated architectures. Every screen uses that model plus screen-specific overrides and optional scenario-only overlays.
- Reference 17's “6 invitees” and other people/status/time labels are sample UI data, not actual invitations or meetings. Nothing was sent or scheduled.

## User clarification — Home follows the final Group 4 sequence

The user states that Home comes after the last Group 4 step. Record the end-of-preparation path as finishing the authoring/scheduling sequence and returning to the existing Home/project context, preserving the presentation. Reference 17 still illustrates the immediate scheduled-success acknowledgment in the presentation workspace, after which the sequence can finish at Home. The exact user action/timing for that final Home transition is not specified by this batch; do not invent an automatic redirect, extra Done button, or new Home design. The prior explicit Start Now → Group 5 Live Meeting route remains distinct; this Home clarification is not authorization to redesign that route.

No Home image was supplied in this batch. Reuse the approved Home reference when documenting that final destination, without fabricating a new reference. No backend/Unity code changed and Group 5 implementation has not started.
