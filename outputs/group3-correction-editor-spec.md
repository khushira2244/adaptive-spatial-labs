# Adaptive Spatial Labs — Group 3: Correction Editor

**Status: LOCKED core product/UX direction — 2026-10-19.**

Documentation/design handoff only. Do not implement Group 3 or modify backend/Unity application code. No additional editor features are authorized. This written specification overrides conflicting images and earlier discussions. It supersedes the earlier use of “Group 3” for Views + Spatial Representation; those spatial-view requirements remain historical product material whose future placement must be settled separately, not silently deleted or renumbered into another group.

Group 3 depends on an architecture reconstructed in Group 2. It is a temporary correction flow, not a standalone workspace or blank-canvas authoring tool. Done saves corrected candidate architecture and returns to Group 2; Group 2 alone owns final canonical confirmation and return to Project Home.

## Reference images currently available

| Saved file | Coverage |
| --- | --- |
| [01-group2-confirm-or-edit-entry.png](group3-reference-images/01-group2-confirm-or-edit-entry.png) | Group 2 review with Edit (Correction Mode) and Confirm Architecture |
| [00-review-correction-workflow-composite.png](group3-reference-images/00-review-correction-workflow-composite.png) | Composite showing confirmation/home, Correction Mode with a selected box and toolbar, and return to Group 2 review |

Copied unchanged from the two previously supplied references and hash-verified. The composite is not seven separate screens. Standalone expected screens 02 through 08 have not been supplied as individual files; do not fabricate or relabel images as evidence of states they do not show. Expected filenames and descriptions are preserved below.

## Verification and handoff qualifications

The supplied 60 FPS minimum is recorded as the user's performance target/event claim, not a verified quotation of current hackathon rules or a statement that hardware tests have passed. No official event rule document was available in this handoff for verification. Verify the actual event rules and current Meta SDK/API guidance before implementation, including supported hand primitives and hardware refresh targets. All existing seated, hands-first, privacy and measured-performance acceptance criteria continue to apply, including one meaningful unit of work in about ten minutes.

The persistence choices explicitly allowed below for Back to Review remain implementation choices; they do not reopen core UX. An operation confirmation can add a relationship to the editable candidate, while Done saves that corrected candidate; neither implies final canonical confirmation. Do not invent persistence, concurrency, or API guarantees here.

## GROUP 3 PURPOSE

Group 3 is NOT a standalone architecture editor.

Group 3 exists ONLY when Group 2 has already reconstructed the architecture and the user notices one or more minor problems and does not want to confirm the architecture yet.

Primary flow:

Group 2 Architecture Review
        ↓
User reviews reconstructed architecture
        ↓
## IF CORRECT
Confirm Architecture
        ↓
Project Home

## IF MINOR CORRECTION REQUIRED
Edit / Correction Mode
        ↓
## GROUP 3
        ↓
Fix reconstructed architecture
        ↓
Done
        ↓
Return to Group 2 review
        ↓
Confirm Architecture
        ↓
Project Home

Without Group 2 reconstruction, Group 3 does not appear.

Group 3 does NOT start from an empty canvas.

Group 3 does NOT provide full architecture-from-scratch authoring.

It is specifically a controlled correction environment for the architecture reconstructed in Group 2.


## CORE PRODUCT PRINCIPLE

Group 2:

Understand / inspect / verify architecture.

Group 3:

Correct minor reconstruction errors.

Therefore:

Group 3 must feel temporary, controlled and safe.

The user should never feel that they have entered a completely different application.

The same reconstructed architecture remains center-front.


## GROUP 3 ENTRY

From Group 2, the architecture review screen eventually exposes:

Edit / Correction Mode
Confirm Architecture

## IMPORTANT:

Do NOT add any left-side step/status wizard such as:

1 Input
2 AI Reconstruction
3 Review & Confirm
4 Spatial View
5 Scenarios
6 Save

That UI does NOT exist in our Group 2 design.

The Group 3 transition must come naturally from the existing Group 2 Architecture Review experience.

The final Group 2 review remains the source of entry.


## GROUP 3 SCREEN

When Edit / Correction Mode is selected:

The SAME architecture remains visible.

The interface changes into:

## CORRECTION MODE

Top/front:

← Back to Review
Correction Mode
Recenter

Center/front:

Existing reconstructed architecture

Near-user/global toolbar:

+ Add
Connector
Undo
Redo
Done

Do NOT show the Group 2 toolbelt simultaneously.

Group 2 toolbelt:

Lasso | Attach | AI | Snapshot | Mic | My Space

is replaced while Correction Mode is active.


## WHAT CAN BE CORRECTED

Group 3 V1 supports:

1. Move existing box
2. Rename existing box
3. Change existing box type
4. Delete incorrect box
5. Add a missing box from preset types
6. Delete incorrect connection
7. Create missing connection
8. Undo
9. Redo
10. Done / Save corrections

That is the complete V1 correction scope.


## WHAT GROUP 3 DOES NOT DO

Do NOT add:

- blank-canvas architecture creation
- complete architecture authoring from scratch
- unlimited diagram editor functionality
- freeform drawing
- hand-drawn connectors
- editable connector control points
- arbitrary curved-line editing
- reconnect-arrow tool
- reverse-arrow tool
- drag connector endpoints
- complex routing editor
- unlimited nested architecture creation
- presentation styling
- scenario design
- architecture color/theme designer
- free XYZ placement of boxes
- roomscale editing
- large Inspector panels
- desktop-style property panels
- external Miro/Draw.io/Excalidraw editor embedded inside ASL


## ARCHITECTURE DATA PRINCIPLE

Group 3 edits the structured architecture model created/reconstructed during Group 2.

It does NOT edit the original screenshot/image pixels.

Conceptually:

Source image / Miro / docs
        ↓
Group 2 reconstruction
        ↓
Structured ArchitectureModel
        ↓
Group 3 Correction Editor
        ↓
Corrected ArchitectureModel

The original source remains evidence/reference only.


## NODE / BOX MODEL

Architecture nodes should conceptually contain:

- stable node ID
- name
- type
- position
- metadata
- source/evidence references

Important:

Node identity should remain stable when:

- renamed
- moved
- type changed

Example:

nodeId = payment-service-01

name:
Payment Service
↓
Payment Orchestrator

The node ID remains unchanged.

Therefore existing connections remain attached automatically.


## BOX PRESETS

Adding a missing box uses a small controlled preset palette.

Suggested V1 types:

Service
## API
Database
Cache
Queue / Event
Gateway
Frontend / Client
External System
Generic

Do NOT create a huge component library.

Preset types primarily change:

- icon
- semantic type
- label presentation
- default visual appearance

They may use one common base node prefab/component.


## BOX SELECTION

Default distant interaction:

hand ray
→ hover feedback
→ pinch
→ box becomes selected

The selected box receives a clear but restrained highlight.

Only after selection should contextual actions appear.

Box contextual actions:

Move
Rename
Change Type
Delete

Do NOT automatically move a box merely because the user selected or touched it.


## MOVE BOX

Moving a box is intentionally a two-stage action.

Flow:

Select box
→ choose Move
→ Move mode activates for this selected node
→ grab/pinch-hold selected node
→ reposition
→ release
→ snap/alignment applies

Important:

The user should never accidentally reposition topology while merely inspecting/selecting.


## EDITING PLANE

Structural corrections occur on a stable architecture plane.

Movement:

X = horizontal
Y = vertical
Z = locked/constrained

Do NOT allow arbitrary free 3D XYZ movement of architecture nodes during Group 3 correction.

Reason:

- hand accuracy
- seated comfort
- predictable architecture layout
- easier connection routing
- easier snapping
- lower cognitive load


## SNAPPING / ALIGNMENT

When moving nodes:

- show subtle alignment guides
- snap when appropriate
- preserve spacing where possible
- keep other architecture visible
- avoid jumping or aggressive auto-layout

The system should assist placement without fighting the user.


## CONNECTION BEHAVIOR WHEN BOX MOVES

Connections remain attached to their nodes automatically.

Example:

Payment Service moves
        ↓
its node position changes
        ↓
connected arrows recalculate their paths
        ↓
connections remain intact

The user does NOT manually reposition arrow geometry.


## RENAME

Flow:

Select box
→ Rename
→ voice or keyboard/text input
→ preview new name
→ Confirm

Voice is encouraged as an accelerator.

Example:

“Rename this Payment Orchestrator.”

But voice is not mandatory.

Hand-only operation must remain possible.


## CHANGE TYPE

Flow:

Select box
→ Change Type
→ compact preset palette
→ select new type
→ Confirm

Changing a type must NOT automatically destroy existing connections.

Because the same logical node identity remains.


## DELETE BOX

Flow:

Select box
→ Delete

If no relationships:
simple confirmation.

If relationships exist:

Delete Payment Service?

This will also remove 3 connections.

Cancel
Delete

After delete:

Undo must remain available.


## ADD MISSING BOX

Global:

+ Add

Flow:

+ Add
→ compact preset palette
→ choose component type
→ ghost/preview node appears
→ preview follows ray intersection with architecture plane
→ pinch to place
→ name component
→ Confirm

Do NOT require the user to drag an item physically out of the palette.

Placement should use the ray against the editing plane.

Example:

+ Add
→ Database
→ ghost Database node
→ point to location
→ pinch
→ name “Payment Ledger”
→ Confirm


## CONNECTION PHILOSOPHY

Connections are intentionally simpler than boxes.

Existing arrows are NOT fully edited.

For V1:

Existing connection:
- keep
- delete

Missing connection:
- create

There is NO:

- reconnect
- reverse
- endpoint editing
- line geometry manipulation

If an arrow is wrong:

Delete wrong connection
        ↓
create correct connection

This is deliberate.


## SELECT CONNECTION

Visible arrows may remain visually thin.

However, implementation should provide a larger invisible selection/hit region around the connection.

Flow:

hand ray
→ connection hover feedback
→ pinch
→ connection highlights
→ contextual action:

Delete Connection

That is enough for V1.


## DELETE CONNECTION

Flow:

Select connection
→ Delete Connection
→ remove relationship
→ Undo available

No complex editor appears.


## CREATE CONNECTION

Global toolbar:

Connector

Flow:

Connector
→ Connector Mode activates

State 1:
Select source

User points + pinches source box.

State 2:
Source selected
Select destination

Valid destination boxes subtly highlight.

User points + pinches destination.

State 3:
Preview connection

Source → Destination

Actions:

Cancel
Create Connection

Only after confirmation is the relationship persisted.


## IMPORTANT CONNECTION RULE

Creating a connection is NOT freehand drawing.

The user never draws the arrow path.

User chooses:

source
destination

The runtime generates the connector.


## UNDO / REDO

Undo and Redo are essential because hand input may produce accidental corrections.

Actions that should be undoable include:

- move box
- rename box
- change type
- add box
- delete box
- add connection
- delete connection

Undo/Redo should be continuously available in Correction Mode.


## DONE

Done means:

“Finish this correction session and review the updated architecture.”

Flow:

Done
→ save/update corrected candidate architecture
→ exit Correction Mode
→ return to Group 2 Architecture Review
→ display corrected architecture
→ user reviews again

Then Group 2 again gives:

Edit / Correction Mode
Confirm Architecture

If still wrong:
Group 3 can be entered again.

If correct:
Confirm Architecture
→ save confirmed canonical architecture
→ Project Home


## BACK TO REVIEW

Back to Review:

returns to Group 2 without pretending the architecture is confirmed.

If current corrections have changed:

either autosave candidate corrections

## OR

show an appropriate discard/save prompt according to final persistence implementation.

Do NOT implicitly mark architecture as confirmed.


## CONFIRMATION IS GROUP 2 RESPONSIBILITY

Group 3 does not own final architecture confirmation.

Group 3 finishes correction.

Group 2 owns:

Confirm Architecture

This keeps the lifecycle clear:

Review
→ Correct
→ Review again
→ Confirm


## HAND INTERACTION GRAMMAR

Keep gestures minimal and consistent.

## PRIMARY:

Ray + pinch
= select / activate / confirm

## MOVE:

Select node
→ choose Move
→ grab/pinch-hold
= reposition selected node

## CONNECTION:

Connector Mode
→ source pinch
→ destination pinch
→ confirm

## VOICE:

optional accelerator for rename and commands

Do NOT create custom gesture vocabulary unless absolutely necessary.

Do NOT add:

- double-pinch commands
- fist commands
- custom palm gestures
- gesture-based delete
- air drawing
- multi-finger connector gestures


## META HAND / XR PRINCIPLES

Group 3 must remain hands-first.

Controllers may exist as optional fallback/debug only.

The complete correction workflow must work without ever pairing controllers.

Use Meta Interaction SDK / supported interaction primitives rather than creating hand tracking from scratch.

High-level implementation layers:

Meta hand tracking
        ↓
Meta Interaction SDK
        ↓
ASL interaction controllers
        ↓
Correction model commands

For example:

ray + pinch
→ ASL SelectionController
→ node selected

grab in Move Mode
→ ASL NodeMoveController
→ constrain to architecture plane
→ update node position


## SEATED / AIRPLANE-SEAT TEST

Group 3 must be fully usable seated.

Every essential interaction should work inside roughly a 2-foot working radius.

Do not require:

- walking
- turning behind the user
- reaching far above/below
- wide arm swings
- room-scale navigation

Architecture comes to the user.


## FOV-AWARE DESIGN

Essential UI remains in comfortable forward FoV.

Center:

architecture

Near/front:

correction toolbar

Top/front:

Back to Review
Correction Mode
Recenter

Temporary contextual controls:

near selected node/connection

No essential UI behind the user.

No huge side inspector.


## COMFORT

Reduce hand fatigue.

Use:

- ray selection for distant architecture
- minimal reaching
- large enough interaction targets
- clear hover states
- clear selected states
- predictable modes

Avoid requiring users to keep arms raised continuously.


## VISUAL FEEDBACK

Every interaction must have visible state feedback.

For nodes:

default
hover
selected
move-active
ghost/add-preview

For connections:

default
hover
selected
creation-preview

For modes:

Correction Mode
Connector Mode
Move Mode

The user must always understand what will happen before a destructive or structural action.


## MODE CLARITY

Correction Mode must be visibly distinct from Group 2 review.

However, it should not become visually noisy.

Persistent restrained indicator:

## CORRECTION MODE

Global toolbar changes to:

+ Add | Connector | Undo | Redo | Done

When Connector is active:

## CONNECTOR MODE

When a node is actively movable:

## MOVE MODE

Avoid multiple simultaneous modes.


## PERFORMANCE

Hackathon minimum performance target:

60 FPS minimum on Meta Quest hardware.

Prefer higher stable performance where practical.

Do not rebuild the whole graph every frame while moving one node.

While moving:

update selected node transform
+
update only connected relationships
+
update lightweight alignment guides

Do not perform expensive complete architecture regeneration every frame.


## UNITY RUNTIME ARCHITECTURE

Do not use Unity GraphView as the runtime editor.

Do not embed Miro/Draw.io/Excalidraw.

This is an ASL-owned Unity runtime correction system.

Conceptual runtime modules:

ArchitectureWorkspace

ArchitectureRenderer

ArchitectureNode

ArchitectureConnector

SelectionController

CorrectionModeController

NodeMoveController

NodePalette

ConnectionCreateController

UndoRedoController

CorrectionToolbar

These names are conceptual and may be adapted later during implementation.


## RUNTIME DATA FLOW

Backend / architecture model
        ↓
ArchitectureRenderer
        ↓
Unity node + connection objects
        ↓
Meta hand interactions
        ↓
ASL correction commands
        ↓
update ArchitectureModel
        ↓
update rendered objects
        ↓
save corrected candidate
        ↓
return to Group 2 review


## HACKATHON ALIGNMENT

Group 3 should explicitly satisfy:

## HANDS-FIRST
Complete correction without controller.

## SEATED OPTIMIZED
Airplane-seat style interaction.

## EASY IN / OUT
Enter correction only when necessary.
Done returns directly to review.

## ORIGINAL EXPERIENCE
ASL owns the graph/correction interaction.
Do not wrap a third-party editor.

## PRODUCTIVITY
Architect can quickly correct AI/source reconstruction and continue working.

## FOV AWARE
Essential controls stay front/near.

## PERFORMANCE
Minimum 60 FPS target.

## POLISH
No cluttered desktop-editor interface.
No tiny hit targets.
No unnecessary modes.


## REFERENCE IMAGE RULE

Use the Group 3 images I supplied as visual references.

However:

WRITTEN SPECIFICATION WINS if an image conflicts with this document.

## IMPORTANT KNOWN OUTDATED ELEMENTS:

If any earlier image contains:

- left-side Input/AI Reconstruction/Review status wizard
- Reconnect
- Reverse
- complex arrow editing
- giant inspector panel
- scratch architecture creation

IGNORE those elements.

They are NOT part of final Group 3.


## EXPECTED GROUP 3 REFERENCE SCREENS

We will likely need/reference approximately these screens:

01-group2-confirm-or-edit-entry.png

Shows the actual Group 2 Architecture Review with:

Edit / Correction Mode
Confirm Architecture

No left-side step wizard.

02-correction-mode-main.png

Existing architecture in Correction Mode.

Global toolbar:

+ Add
Connector
Undo
Redo
Done

03-box-selected.png

Selected existing box.

Context menu:

Move
Rename
Change Type
Delete

04-move-box.png

Selected box being moved on stable architecture plane.

Alignment/snap guidance visible.

Connections remain attached.

05-add-box.png

Compact preset component palette.

Ghost box placement.

06-delete-create-connection.png

Connection selection → delete.

Connector mode → source → destination → preview.

07-return-to-review.png

Done
→ back to Group 2
→ corrected architecture visible
→ Edit again or Confirm Architecture.

08-confirm-to-home.png

Group 2 confirmation
→ Project Home.


## OPEN QUESTIONS

Do NOT invent open questions merely to create work.

Group 3 core UX is largely LOCKED.

Only record an open question if there is a true unresolved contradiction that prevents implementation.

## Open questions and consistency status

No unresolved contradiction blocks the documented Group 3 core UX. The latest user handoff explicitly resolves the earlier Group 3 scope conflict in favor of Correction Editor. Placement/numbering of previously discussed spatial-view functionality is outside this correction increment and remains a future roadmap discussion.

The user finalized confirmation routing on 2026-10-19: the popup belongs to Group 2 and opens ONLY after an explicit press of Confirm Architecture. Never open it on review load, exploration, Edit/Correction Mode, Group 3 Done, or return from correction. Cancel closes it and leaves the user in Group 2 without confirming. Confirm commits acceptance of the reviewed model; after successful confirmation, show Architecture Confirmed and return to Project Home. Group 3 Done saves corrected candidate work and returns to Group 2 review without final acceptance. Backend save/failure mechanics remain implementation details, not grounds to change this routing.

Popup copy and the complete routing are recorded in outputs/group2-product-design-spec.md. Done = finish corrections; Confirm Architecture = request acceptance; popup Confirm = commit acceptance. These are separate actions.

## Explicit image overrides and review results

No left-side step/status wizard, Reconnect/Reverse actions, complex arrow geometry tools, giant inspector, or scratch-authoring feature is authorized, even if such elements appear in older references. The two saved references do not visibly show those prohibited editor controls. The workflow composite's Home mockup contains education-oriented labels such as Learning Paths; these do not add educational product scope to ASL or replace the existing Project Home design. Diagram labels, technologies, people and connections are illustrative rather than real reconstructed project data.

## Change boundary

Only documentation and reference-image copies were changed. Backend code was not modified. Unity application code was not modified. No product implementation or runtime/device tests were performed for this documentation handoff.

