# Adaptive Spatial Labs — Group 5: Live Meeting + Private Participant Work + Shared Context

**Status: user-provided product/design handoff — 2026-10-21.** The user explicitly corrected the initial “Group 6” label to **Group 5**. Documentation only. Do not implement backend/Unity, redesign Group 4, or start Group 6 outcome logic.

## Saved references

| File | Coverage |
| --- | --- |
| [01-live-meeting-context-and-private-exploration-composite.png](group5-reference-images/01-live-meeting-context-and-private-exploration-composite.png) | Four-state composite: live meeting/context, shared docs, private My Space/sharing classification, private component exploration/docs |
| [02-my-space-private-note-share.png](group5-reference-images/02-my-space-private-note-share.png) | Private note editor, participant list, explicit Share to Meeting action |
| [03-shared-note-in-meeting-context.png](group5-reference-images/03-shared-note-in-meeting-context.png) | Shared note in Meeting Context and acknowledgment; original remains in My Space |

All three supplied PNGs were copied unchanged and SHA-256 verified. This batch does not include standalone Pass Presentation picker or Accept/Decline request-dialog images. A changed presenter in the composite illustrates the role state, not the complete acceptance interaction. Preserve the written behavior and do not claim missing visual coverage.

## Interpretation and verification boundary

One live meeting contains many prepared screens; screens do not create separate sessions. This does not impose one lifetime presentation or meeting per architecture. Canonical architecture and saved presentation screens are not mutated by live inspection; presenter-controlled transient shared navigation is separate from private participant exploration.

Global hands-first, seated physical-action radius, entry/exit/resume, short-use, privacy and system-keyboard rules continue to apply. Distances below are ASL design targets, not verified Meta standards or mandatory physical reach. SDK bindings, network contracts and device performance are not verified by this document.

## CORE PRINCIPLE

Group 5 is the live use of the presentation prepared in Group 4.

This is NOT:

- Zoom
- Teams
- a video-tile meeting app
- another architecture editor
- another presentation builder

The architecture/presentation remains the center of attention.

People and meeting controls stay around it.


## CORE PRODUCT MODEL

One Architecture
→ One Presentation
→ Many Presentation Screens
→ One Live Meeting Session

Example:

Payments Platform
  └─ Presentation
      ├─ Main Architecture
      ├─ Success Screen
      ├─ Failure Screen
      ├─ Discussion Screen
      └─ Recovery Screen
           ↓
        ONE Meeting

Presentation screens are not separate meetings.


## ENTRY

Group 5 begins after:

Group 4
→ presentation prepared
→ Meeting
→ Start Meeting / scheduled meeting begins

The meeting starts from the screen selected during Meeting Setup.

Usually:

Main Architecture

But another prepared screen may be selected as the initial view.

This changes only the first shared screen.

It does NOT create a separate meeting.


## LIVE MEETING SPATIAL LAYOUT

## TOP HEADER

Example:

← Projects
Payments Platform
Main Architecture ▼
Presenter: Khushboo ▼
Recenter
End Meeting

The exact current screen label changes as the presenter navigates.


## CENTER

CENTER = current shared presentation state.

Examples:

Main Architecture
Success Screen
Failure Screen
Discussion Screen
Recovery Screen

The presenter controls the shared state.

All participants following live see the current presenter state.


## LEFT SIDE

LEFT is collapsible.

Use tabs:

Screens
Participants

## SCREEN TAB:

show presentation screens:

Main Architecture
Success Screen
Failure Screen
Discussion Screen
Recovery Screen

Presenter can use these to change the shared presentation screen.

## PARTICIPANTS TAB:

show compact presence list.

Example:

Khushboo
Host • Presenter

Sarah
Participant

Ravi
Participant

James
Participant

Possible compact status indicators:

- mic state
- raised hand
- active presenter
- host badge
- online/present

Do NOT show giant video tiles.


## RIGHT SIDE

RIGHT = shared meeting context.

Default panel:

Meeting Context

Show:

Current screen

Shared Context:
- Docs
- Questions
- Notes
- AI Findings
- Evidence

Raised in this meeting:
- open discussions
- shared points

Optional counts may be shown.

Example:

Docs 3
Questions 2
Notes 4
AI Findings 2
Evidence 1


## SHARED CONTEXT RULE

Participants can access architect-approved context prepared before the meeting.

This may include:

- selected project docs
- selected notes
- prepared questions
- AI findings intentionally shared
- evidence
- presentation discussion points

This is visible to meeting participants.

Do NOT expose unrelated private project material automatically.


## OPEN SHARED DOCS

Participant can select:

Docs

Flow:

right panel
→ Docs
→ pinch

Right panel temporarily becomes:

Shared Docs

Example:

Product Requirements
OpenAPI Specification
Architecture Notes
Failure Analysis

Then:

Open in View
or
Open Document

Back:

returns to Meeting Context.


## QUESTIONS / NOTES / AI FINDINGS / EVIDENCE

Same dynamic right-panel pattern.

Only one right-panel purpose at a time.

Examples:

Questions
→ show shared prepared questions

Notes
→ show architect-shared notes

AI Findings
→ show saved/shared AI findings

Evidence
→ show referenced source evidence

Back
→ Meeting Context

Do NOT stack every context panel simultaneously.


## PRESENTER ROLE

Presenter controls the shared presentation state.

Presenter may:

- change shared presentation screen
- open shared architecture context
- guide shared inspection
- move between prepared screens
- drive meeting discussion

Presenter role can change during the meeting.


## HOST ROLE

Host and Presenter are separate concepts.

HOST controls:

- meeting authority
- End Meeting
- attendee-level meeting management
- reclaim presentation control if needed

PRESENTER controls:

- shared presentation screen
- shared presentation navigation
- shared architecture state during presentation

Passing presentation does NOT change Host.


## PASS PRESENTATION

The top header shows current presenter.

Example:

Presenter: Khushboo ▼

Pinch opens small menu.

Possible actions:

Pass Presentation
Take Back Presentation
About Roles

If current host/presenter selects:

Pass Presentation

show participant picker.

Example:

Sarah
Ravi
James

Select Ravi:

→ Send Request

Do NOT immediately transfer control.


## PRESENTATION CONTROL REQUEST

Selected participant receives:

"Khushboo wants to pass presentation control to you."

Actions:

Decline
Accept

Only after Accept:

Presenter becomes Ravi.

Top header updates:

Presenter: Ravi

Host remains Khushboo.


## TAKE BACK PRESENTATION

If Host is not current Presenter:

Host can choose:

Take Back Presentation

This returns shared presentation control to Host.

No separate image is required if interaction matches the same presenter menu.


## PRIVATE EXPLORATION

Any participant may inspect architecture privately during the meeting.

This MUST NOT disturb shared meeting state.

Example:

Sarah selects Payment Service privately.

Private exploration may allow:

- inspect component
- open known internal view
- view shared related docs
- ask private AI
- add private note
- save private snapshot

Meeting continues for everyone else.


## PRIVATE EXPLORATION STATE

When participant enters private exploration:

show subtle state indicator such as:

Private Exploration

The participant is no longer following shared presenter view temporarily.

The current Presenter and meeting continue independently.


## RETURN TO LIVE

Persistent action:

Return to Live

When selected:

participant immediately returns to the CURRENT presenter state.

Important:

Return to Live does NOT return to the screen that was active when private exploration started.

It returns to whatever the Presenter is showing NOW.


## BOTTOM TOOLBELT

For Group 5 use:

Mic
Raise
Snapshot
## AI
My Space
Return to Live

Some roles may not need Return to Live while already following shared state,
but the control must appear clearly during private exploration.

Do NOT show Group 4 authoring controls such as screen styling settings.


## MIC

Mic controls participant voice participation.

Use:

ray + pinch
or near poke where comfortable.

Do not invent custom voice gestures.


## RAISE

Raise is an explicit shared-participation action.

It may represent:

- raise hand
- raise a question
- surface a point for discussion

Do NOT automatically share private My Space content.


## SNAPSHOT

Snapshot captures contextual meeting state.

Snapshot should be structured, not only flat image.

Conceptually store:

- meetingId
- architectureVersion
- presentationScreenId
- selected nodes/connections
- scenario state
- timestamp
- relevant evidence refs
- optional personal note

By default participant snapshots may be private in My Space.

User can explicitly share later.


## AI

AI may be:

## PRIVATE AI
when participant explores privately

or
## SHARED CONTEXT AI
only when explicitly invoked in shared context.

AI must not silently publish private reasoning.


## MY SPACE

My Space is available to EVERY participant during the meeting.

It is a private working pocket.

Do NOT make My Space a full navigation page.

It appears as a compact near-user panel.

Tabs:

My Notes
My Questions
My AI
My Snapshots

Everything is PRIVATE by default.


## MY NOTES

Participant can:

- add note
- edit note
- use voice note
- type using system keyboard
- save privately

Example:

Payment retry clarification

"Need to confirm how the retry logic works for failed payments."

Possible bullet content:

- retry attempts
- idempotency behavior
- retry window


## MY QUESTIONS

Participant can privately capture questions.

Example:

"Who owns retry handling after DB recovery?"

Private until explicitly shared.


## MY AI

Participant can save useful AI findings privately.

These are not visible to the meeting unless explicitly shared.


## MY SNAPSHOTS

Participant can save private contextual snapshots.

Snapshot stays in My Space until shared.


## MY SPACE VISIBILITY MODEL

Each item has a visibility state.

Minimum V1:

## PRIVATE
SHARED_TO_MEETING

Future/later:

PROJECT_VISIBLE

Default:

## PRIVATE

Never auto-share.


## SHARE TO MEETING

Participant may select a My Space item and choose:

Share to Meeting

Before sharing, participant may edit/refine the item.

Then classify it as:

Question
Finding
Discussion Point
Action Suggestion

Example:

Private note:
"Payment retry clarification"

Share to Meeting
→ Question

Shared meeting context receives:

Ravi raised a question:
"Who owns retry handling after DB recovery?"


## SHARE BEHAVIOR

Sharing creates a SHARED REFERENCE.

Do NOT remove original from My Space.

Original remains private/personal copy.

So:

My Space item
→ shared meeting reference
→ original still remains in My Space


## SHARED NOTES

Once shared:

Meeting Context may show:

Shared Notes

Example:

Payment retry clarification

Shared from My Space
Ravi
Just now

This is now visible to meeting participants.


## SHARED ITEM CATEGORIES

Meeting Context can contain:

Shared Notes
Questions
AI Findings
Evidence
Discussion Points
Action Suggestions

Do NOT make every private item automatically appear.


## PUBLIC / PROJECT-VISIBLE LATER

A user may later choose to promote an item beyond the meeting.

Possible lifecycle:

## PRIVATE
→ SHARED_TO_MEETING
→ PROJECT_VISIBLE

But PROJECT_VISIBLE is not automatic.

This is important for Group 6.


## PARTICIPANT ACCESS TO ARCHITECT-PREPARED CONTEXT

Participants can see:

- presentation screens
- architect-shared Notes
- architect-shared Questions
- architect-shared AI Findings
- architect-approved Evidence
- architect-approved Docs
- shared discussion points
- shared meeting items

Participants cannot automatically see:

- another participant's private My Space
- unrelated private project material
- private drafts not shared to meeting


## PRIVATE COMPONENT EXPLORATION

When participant privately opens a component:

example:
Payment Service

right contextual panel may expose tabs:

Overview
## AI
Notes
Evidence
Docs

Docs here means:

shared component-related docs approved for meeting access.

Participant may:

Open Document
Save Snapshot
Add Note
Ask AI

All personal additions remain private unless shared.


## SHARED VS PRIVATE STATE

Group 5 must maintain two separate state models.

## SHARED MEETING STATE:

- current presentation screen
- current presenter
- shared discussion items
- shared notes/questions/findings
- attendee presence
- presenter-controlled architecture state

## PRIVATE PARTICIPANT STATE:

- private exploration target
- private AI
- My Space
- private notes
- private questions
- private snapshots
- personal view state

Never mix these automatically.


## HAND MOVEMENT — LIVE MEETING

All interactions are hands-first.

## PRIMARY:

hand ray + pinch

Use direct poke only where content is comfortably near.

No controllers required.

No custom gesture vocabulary.


## SELECT PRESENTATION SCREEN

Presenter:

point ray to screen in left panel
→ hover
→ pinch
→ shared current screen changes

Participants following live see the update.


## OPEN PARTICIPANTS

point to Participants tab
→ pinch

Participant list opens.


## PASS PRESENTATION

point to Presenter menu
→ pinch

point to Pass Presentation
→ pinch

participant picker opens

point to person
→ pinch

Send Request
→ pinch


## ACCEPT PRESENTATION

participant:

request dialog appears

point to Accept
→ pinch

Presenter role changes.


## OPEN SHARED DOCS

point to Docs in Meeting Context
→ pinch

Shared Docs appears.

Select doc:
→ ray hover
→ pinch


## OPEN MY SPACE

point to My Space
→ pinch

compact private panel opens near participant.


## WRITE PRIVATE NOTE

point to Add Note
→ pinch

text field active
→ Quest system keyboard

or:

Voice Note
→ pinch
→ speak


## SHARE NOTE

select private note
→ options
→ Share to Meeting
→ pinch

classification menu:

Question
Finding
Discussion Point
Action Suggestion

select category
→ pinch
→ item shared

Show small confirmation:

Shared to meeting ✓


## PRIVATE COMPONENT INSPECTION

participant targets component
→ ray hover
→ pinch

open private inspection context.

Do NOT alter shared meeting state.


## RETURN TO LIVE

point to Return to Live
→ pinch

private exploration closes

participant returns to current Presenter state.


## HEAD GAZE

Head gaze may softly assist targeting of:

- left/right edge controls
- large meeting buttons
- Presenter menu
- My Space
- Return to Live

Head gaze NEVER:

- shares content
- passes presentation
- ends meeting
- opens docs automatically
- changes presentation screen

Pinch confirms.


## SPATIAL DISTANCES

Center shared architecture:
~1.0–1.2 m

Left / Right panels:
~0.9–1.2 m

My Space:
~0.5–0.8 m near-user

Bottom controls:
~0.5–0.8 m

No content behind user.

No standing required.

No large arm sweeping.

No giant reach.


## GROUP 5 DATA MODEL INTENT

Conceptually:

MeetingSession
- id
- projectId
- architectureId
- architectureVersion
- presentationId
- hostId
- presenterId
- participantIds[]
- currentScreenId
- sharedState
- status

ParticipantMeetingState
- meetingId
- userId
- isFollowingLive
- privateSelectedNodeId
- privateSelectedConnectionId
- privateViewState
- mySpaceId

MySpace
- id
- meetingId
- userId
- noteIds[]
- questionIds[]
- aiFindingIds[]
- snapshotIds[]

MySpaceItem
- id
- ownerUserId
- meetingId
- type
- content
- architectureContextRef
- visibility:
    PRIVATE
    SHARED_TO_MEETING
    PROJECT_VISIBLE
- sharedMeetingItemRef
- createdAt
- updatedAt

SharedMeetingItem
- id
- meetingId
- sourceMySpaceItemId
- authorUserId
- type:
    QUESTION
    FINDING
    DISCUSSION_POINT
    ACTION_SUGGESTION
    NOTE
- architectureContextRef
- status
- createdAt


## IMPORTANT GROUP 6 BRIDGE

Group 5 should record enough structure so Group 6 can determine:

- what questions were prepared before meeting
- what questions were raised during meeting
- what notes were shared
- what findings were shared
- what was discussed
- what was addressed
- what remains unresolved
- what became a decision
- what became an action
- what was deferred

Do NOT solve all of that in Group 5.

Group 5 captures/shared state.

Group 6 structures outcomes.


## NON-GOALS

## DO NOT:

- make a Zoom-style video meeting
- expose everyone’s private My Space
- automatically share private notes
- automatically publish AI findings
- change Host when Presenter changes
- mutate presentation screens during meeting
- allow private exploration to change shared state
- create a separate meeting per presentation screen
- create huge participant panels
- show every doc permanently
- make AI dominate the meeting UI
- implement Group 6 here
- implement backend
- implement Unity


## REFERENCE IMAGE AUTHORITY

Use latest supplied Group 5 reference images for:

1. Live Meeting shared presentation view
2. Pass Presentation
3. Accept new Presenter
4. Private Exploration
5. Meeting Context with Docs / Questions / Notes / AI Findings / Evidence
6. Shared Docs
7. My Space private panel
8. Share private note to Meeting
9. Shared Note appearing in Meeting Context
10. Private component exploration with Docs / Evidence / AI / Notes

If an older image conflicts with this written spec,
THIS WRITTEN SPEC WINS.

Ignore outdated image elements such as:

- giant permanent AI panel
- missing shared docs
- no My Space
- My Space visible to everyone
- auto-sharing
- different meeting per screen
- host changing when presenter changes
- desktop/video-call style layout

## Consistency notes / image differences

- The shared-note image also shows a compact My Space acknowledgment below Meeting Context. Treat this as temporary feedback, not a second permanent right-side workspace; retain one active right-panel purpose and private contents hidden from others.
- Share to Meeting requires explicit user action/classification. The standalone note image shows a direct Share button but does not remove the written classification step. Meeting participants receive only the intentionally shared content/context, never the rest of the private notebook, AI history or future edits automatically.
- PRIVATE versus SHARED_TO_MEETING describes intentional publication/access status; sharing creates a meeting-scoped reference while retaining the personal original. It must not expose a live unrestricted pointer to the owner's entire private record. Exact reference/version/update semantics remain a future data-contract decision; no silent ongoing synchronization or publication is implied.
- PROJECT_VISIBLE appears in the conceptual schema for future use, not V1 automatic promotion. Group 6 will structure outcomes later; Group 5 captures shared meeting context without implementing those outcome rules.
- End Meeting belongs to host authority even where a participant-oriented illustration displays the button. Appearance does not grant every participant host power. Participant leave/Projects behavior and end-confirmation details must follow no-hidden-loss expectations and be settled before implementation; this handoff does not invent them.
- Earlier accepted product notes require preserving a prior presenter's return state during temporary handoff. This handoff specifies request/accept/decline and host take-back without replacing that principle. Exact saved-state restoration and interruption/disconnect cases remain to be specified before implementation, not silently assumed identical to Return to Live (which always follows the current presenter NOW).
- Sample colored presence dots, participant names, question counts, architecture topology and timestamps are illustrative, not additional state semantics or actual live data. Source access remains restricted to meeting-approved context.

No contradiction blocks saving this design handoff. Publication/reference semantics, presenter return-state details and participant exit behavior above need explicit contracts before implementation; no new product features or backend decisions have been invented to fill those gaps.

## Change boundary

Only Group 5 documentation, image copies and the main discussion summary were updated. Backend code was not modified. Unity application code was not modified. No meetings/messages/invitations were sent, and no Group 6 implementation or runtime/device testing was performed.

## Remaining Group 5 interaction details — added 2026-10-21

This user-provided addendum extends the existing specification without replacing shared/private state rules. All distance values are user-defined visual placement targets, not verified Meta requirements, mandatory reach distances, or guaranteed system-keyboard coordinates. Follow `global-spatial-input-rules.md` for keyboard/form behavior; verify current Meta interaction support and physical comfort before implementation.

Role restrictions still apply: only an authorized presenter changes shared screens; host-controlled End Meeting requires the confirmation specified below; host Take Back remains distinct from request/Accept transfer. Private exploration and ordinary participant selections never alter shared state. Raising never auto-activates the microphone or shares private content. AI opens privately by default unless an explicitly chosen shared-context workflow says otherwise. Session mic participation and deliberate AI/voice-note input must have clear separate context and status.

**End Meeting safeguard is now specified:** authorized host selects End Meeting → small End Meeting? dialog → Cancel / End Meeting. Cancel keeps the session active; only explicit confirmation ends it. No gaze/gesture shortcut ends a session. Participant leave behavior and post-end destination remain separate from this host action and are not invented here.

### Complete supplied hand / pinch / distance addendum

GROUP 5 — HAND MOVEMENT / PINCH / DISTANCE

Group 5 must remain fully hands-first and seated-friendly.

PRIMARY INTERACTION:

hand ray + pinch

Use direct poke only for controls that are comfortably near the user.

Controllers are optional only.
They are NOT required for the core meeting workflow.

The user should never need:
- large arm swings
- standing
- reaching behind
- giant circular gestures
- repeated shoulder-height interaction

Most hand movement should remain around chest-to-lap height.


### 1. PRESENTATION SCREEN NAVIGATION

Presenter opens the left Screens panel.

Flow:

look / point toward left edge tab
→ soft highlight
→ pinch
→ panel opens

Select a presentation screen:

point hand ray toward screen card
→ card softly highlights
→ pinch once
→ selected screen becomes the shared live screen

Example:

Main Architecture
→ Success Screen
→ Failure Screen

No swipe navigation is required.

No automatic screen change from head movement.


### 2. PARTICIPANTS PANEL

Select Participants tab:

ray hover
→ pinch

Participant list opens.

The panel remains slightly left-front and should not cover the center architecture.

Select participant:

ray hover participant
→ pinch

Possible contextual actions may appear depending on role.


### 3. PRESENTER MENU / PASS PRESENTATION

Top header:

Presenter: Khushboo ▼

User raises hand naturally.

Flow:

ray points toward Presenter menu
→ hover highlight
→ pinch
→ small presenter menu opens

Select:

Pass Presentation

→ pinch

Participant picker appears.

Select participant:

ray hover
→ pinch

Then:

Send Request
→ pinch

No drag/drop is required.


### 4. ACCEPT / DECLINE PRESENTATION CONTROL

Receiving participant sees a compact centered request.

Example:

"Khushboo wants to pass presentation control to you."

Actions:

Decline
Accept

Flow:

point
→ hover
→ pinch

Only Accept transfers presenter control.


### 5. TAKE BACK PRESENTATION

Host:

point to Presenter menu
→ pinch

Take Back Presentation
→ pinch

No special gesture.


### 6. SHARED MEETING CONTEXT

Right-side Meeting Context is opened through its edge control or existing contextual panel.

Flow:

look / point toward right edge
→ soft highlight
→ pinch

Inside:

Docs
Questions
Notes
AI Findings
Evidence

Interaction:

ray hover
→ pinch

The selected context replaces the right panel temporarily.


### 7. OPEN DOCUMENT

Participant points to a shared document.

Flow:

ray hover
→ document card highlight
→ pinch

Open Document / Open in View
→ pinch

Document content may move toward center for comfortable reading.

Close / Back:

ray → pinch

returns to Meeting Context.


### 8. PRIVATE COMPONENT EXPLORATION

Participant selects a component without changing shared meeting state.

Example:

Payment Service

Flow:

point ray at component
→ component outline appears
→ pinch

The component enters private inspection context.

If deeper known structure exists:

user may use direct grab or approved bring-forward interaction.

Do NOT require grabbing for simple selection.

Shared presenter state continues in background.


### 9. RETURN TO LIVE

During private exploration:

Return to Live is prominently available in the bottom toolbelt.

Flow:

point ray
→ hover
→ pinch

Private context closes.

Participant returns to the PRESENT CURRENT PRESENTER STATE.

No gesture shortcut is required.


### 10. MY SPACE

My Space is a near-user private panel.

Open:

point to My Space in bottom toolbar
→ pinch

The My Space panel appears closer than the shared architecture.

It should sit around lower-front / right-front or comfortable near-user position.

Tabs:

My Notes
My Questions
My AI
My Snapshots

Use ray + pinch or direct poke if close enough.


### 11. ADD NOTE / QUESTION

Select:

Add Note
or
Add Question

Flow:

ray hover
→ pinch

Text field activates.

Typing:

Quest / Horizon system keyboard opens.

Voice:

Mic / Voice Note
→ pinch
→ speak

No custom keyboard.


### 12. SHARE FROM MY SPACE

Select private item:

ray hover
→ pinch

Item actions appear.

Select:

Share to Meeting

→ pinch

Then classify:

Question
Finding
Discussion Point
Action Suggestion

→ pinch

Show confirmation:

Shared to Meeting ✓

No drag-and-drop.

No physical movement of note into meeting panel.


### 13. SNAPSHOT

Point to Snapshot in bottom toolbelt.

→ hover
→ pinch

Snapshot captures current contextual state.

Do NOT require a camera-like hand pose.

Do NOT require holding hands still for long periods.


### 14. RAISE

Point to Raise.

→ pinch

Raise state appears clearly.

If Raise opens options:

Raise Hand
Question
Discussion Point

selection uses:

ray + pinch

No automatic microphone activation.


### 15. AI

Private AI:

point to AI
→ pinch

AI opens in participant-private context.

If typing:
system keyboard

If voice:
mic
→ pinch
→ speak

AI result remains private unless user explicitly shares it.


### 16. MIC

Mic:

point
→ pinch

Clear state change:

Muted
↔
Live

Do NOT use head gesture or palm gesture for microphone toggle.


### 17. HEAD GAZE ASSIST

Head gaze is ONLY soft targeting assistance.

Useful for:

- left/right edge controls
- Presenter menu
- End Meeting
- large shared-context buttons
- My Space
- Return to Live

Head movement alone NEVER:

- changes presentation screen
- passes presenter control
- shares private content
- opens documents
- ends meeting
- activates microphone

Pinch remains the confirmation.


### 18. DIRECT HAND INTERACTION

Direct hand interaction is optional where physically comfortable.

Suitable for:

- near My Space controls
- near floating note cards
- close inspection objects

Do NOT require direct touch for distant architecture.

Distant architecture should use ray + pinch.


### 19. DISTANCES

Recommended approximate placement:

Shared architecture:
~1.0–1.2 m in front of user

Top meeting header:
~1.0–1.3 m
slightly above central architecture

Left Screens / Participants panel:
~0.9–1.2 m
slightly left-front

Right Meeting Context:
~0.9–1.2 m
slightly right-front

Bottom meeting toolbar:
~0.5–0.8 m
lower-front / chest-to-lap zone

My Space:
~0.5–0.8 m
near-user private working zone

Private component brought forward:
~0.6–0.9 m

System keyboard:
~0.5–0.8 m
lower-front


### 20. SEATED COMFORT

Design for stationary seated Quest use.

Primary content must remain within forward FoV.

No essential content behind user.

User should not need:

- torso twisting
- standing
- large shoulder extension
- repeated overhead targeting
- large lateral reach

Use:

small wrist motion
small elbow movement
short ray targeting
pinch confirmation


### 21. AIRPLANE-SEAT CONSTRAINT

Core Group 5 workflow must work in approximately a 2-foot-radius seated interaction space.

User must still be able to:

- switch screens
- open participants
- pass presentation
- open docs
- use My Space
- write/share note
- privately inspect
- Return to Live
- End Meeting

without locomotion.


### 22. END MEETING

End Meeting is a deliberate top-header action.

Flow:

point
→ hover
→ pinch

Because it ends the live session:

show small confirmation:

End Meeting?

Cancel
End Meeting

→ pinch

Do NOT end meeting from gaze alone.


### 23. INTERACTION PRINCIPLE

Use the same ASL grammar:

Pinch commands.
Grab manipulates.

In Group 5:

Pinch
= activate / select / share / navigate

Grab
= optional physical inspection/manipulation of eligible near objects

Voice
= communication / AI / note input

AI
= assistance

Humans
= decisions


### 24. PERFORMANCE / FEEDBACK

Every hand interaction needs immediate lightweight feedback.

Examples:

hover
→ outline / glow

pinch
→ pressed state

successful action
→ brief confirmation

shared item
→ Shared ✓

presenter transferred
→ header updates

Do not use heavy particle effects.


### 25. ACCESSIBILITY / ERROR PREVENTION

Targets should be large enough for comfortable ray selection.

Use enlarged invisible hit regions for:

- small icons
- connections
- edge tabs

Destructive actions require deliberate confirmation:

- End Meeting
- removing shared item if destructive
- presenter role transfer where necessary

Do not require precision comparable to desktop mouse interaction.

