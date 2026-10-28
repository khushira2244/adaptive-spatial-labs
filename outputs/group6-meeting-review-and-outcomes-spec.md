# Adaptive Spatial Labs — Group 6: Meeting Review → Structured Outcomes → Save to Project

**Status: user-supplied product/design handoff — 2026-10-21.** Documentation only. Do not implement backend/Unity, redesign Groups 4/5 or Home, or start Group 7. This detailed handoff supersedes earlier exploratory Group 6 scope lists: Group 6 is the post-meeting review/outcome workflow, not a new live editor or ticket-management application.

## Saved primary visual references

| File | Coverage |
| --- | --- |
| [01-end-meeting-review-and-save-composite.png](group6-reference-images/01-end-meeting-review-and-save-composite.png) | Four-state composite: host End Meeting confirmation, spatial overview categories, Questions drill-down, structured Decisions/Actions/Evidence and Save to Project |
| [02-question-review-close-up.png](group6-reference-images/02-question-review-close-up.png) | Side category cards, central paginated Questions, closer question detail with discussion/decision/action/context links |

Both PNGs were copied unchanged and SHA-256 verified. The images are visual references, not proof of implemented records, actual meeting data, device comfort or performance. The current written specification wins over conflicting visuals. No new Home reference was supplied; reuse the approved existing Home shell/card system.

## GROUP 6 — PURPOSE

Group 6 begins AFTER a live Group 5 meeting ends.

Its purpose is:

"Turn what actually happened in the meeting into reviewed, structured project knowledge."

Group 6 should capture:

- prepared questions
- participant-raised questions
- shared notes
- shared AI findings
- discussion points
- decisions
- action items
- unresolved items
- deferred items
- snapshots
- evidence

AI can organize and summarize.

HUMAN REVIEW IS REQUIRED before saving.


## CORE PRINCIPLE

Group 6 is NOT another presentation editor.

Group 6 is NOT a flat analytics dashboard.

Group 6 is NOT an automatic AI report.

It is a SPATIAL REVIEW WORKSPACE.

Use depth and cards.

High-level categories exist as spatial cards.

Selecting a card brings it closer into CENTER.

If a category contains many items:

split into multiple pages / spatial screens.

Do NOT create long web-style scrolling pages.


## ENTRY FROM GROUP 5

Host selects:

End Meeting

Show a deliberate confirmation:

End Meeting?

"This will end the live meeting and capture shared notes,
questions, discussions and snapshots for review."

Actions:

Cancel
End Meeting

After confirmation:

live meeting ends

→ captured meeting context is frozen for review
→ enter Group 6 Meeting Review.


## END MEETING CAPTURE

Capture only appropriate shared/session data.

Examples:

- shared questions
- shared notes
- shared AI findings
- discussion points
- decisions created during meeting
- action suggestions
- shared snapshots
- evidence references
- presentation screens visited
- relevant architecture context
- timestamps
- who raised each item

Private My Space content that was never shared
MUST remain private and MUST NOT automatically appear.


## MEETING REVIEW OVERVIEW

The first Group 6 review screen is a SPATIAL CARD OVERVIEW.

## CENTER/TOP:

Meeting Review

Example:

Payments Platform
Oct 16, 2026
45 min
4 participants

AI message:

"AI has organised the meeting into key categories.
Review each card to see details, edit and confirm."

Spatial cards may include:

Questions
Notes
Decisions
Action Items
Unresolved
Snapshots & Evidence

Optional AI Findings / Discussion Points may also exist depending on data volume.

Example counts:

Questions 5
Notes 8
Decisions 3
Action Items 4
Unresolved 2
Snapshots & Evidence 6


## SPATIAL CARD RULE

Cards should occupy spatial depth.

They should NOT look like a flat webpage table.

Use:

- slightly different depth positions
- lightweight scale differences
- semantic color/icon identity
- soft 3D panel treatment

The selected card moves forward / center.

Non-selected cards move slightly back or dim.


## SELECTING A CATEGORY CARD

Example:

User selects Questions.

Flow:

ray hover
→ Questions card softly highlights
→ pinch
→ Questions card comes forward
→ Questions content opens in CENTER

Other category cards remain as smaller navigation cards to the side.


## CATEGORY PAGINATION

If content is small:

show all relevant items in one spatial panel.

If there are too many items:

paginate.

Example:

Questions 1 / 3

Previous
Next

Do NOT create long vertical scrolling comparable to a web dashboard.

Use a reasonable V1 page size such as approximately 4–6 items,
depending on readability and panel size.


## QUESTIONS REVIEW

Questions can include:

- architect-prepared questions
- participant-raised questions
- questions shared from My Space

Each question should show:

- question text
- raised by
- timestamp
- architecture/presentation context where available
- current status
- outcome

Possible statuses:

## ADDRESSED
## UNRESOLVED
## DEFERRED
NOT_DISCussed

Examples:

"Who owns retry handling after DB recovery?"
→ Addressed
→ Decision: Worker owns async retry handling.

"What happens after 3 failed attempts?"
→ Addressed
→ Decision: use dead-letter queue.

"How long should queue retention be?"
→ Unresolved
→ Carry forward.

"How to handle fraud service degradation?"
→ Not Discussed
→ Add to future agenda.


## SELECTING ONE QUESTION

Selecting one question:

ray hover
→ pinch

The selected question opens closer in CENTER/RIGHT-CENTER.

Show:

Question title
Raised by
Time
Status

Original question

Discussion summary

Decision, if created

Action item, if created

Related context:

- architecture component
- presentation screen
- document
- evidence
- snapshot

Example:

Who owns retry handling after DB recovery?

Raised by Ravi
## 12:10 PM
Addressed

Discussion:
"Discussed retry flow, idempotency and worker responsibility."

Decision:
"Worker service owns async retry handling."

Action:
Ravi — Document retry policy — Due Oct 20

Related Context:
Payment Service
Failure Screen
Retry Design Doc

Actions:

Edit
Back
View in Architecture


## VIEW IN ARCHITECTURE

"View in Architecture" should open the referenced architecture context.

This is contextual inspection.

It MUST NOT edit canonical architecture.

User can return to Meeting Review.


## NOTES REVIEW

Notes may include:

- architect-shared notes
- participant-shared notes
- meeting notes captured intentionally

Possible status:

Discussed
Not Discussed
Referenced
Converted to Decision
Converted to Action

Users can edit/reclassify before final save.


## AI FINDINGS REVIEW

AI Findings must remain clearly labeled as AI-generated/saved findings.

AI findings may be:

- discussed
- accepted
- rejected
- unresolved
- converted to decision/action

Do NOT silently promote AI findings to project truth.

Human confirmation required.


## DISCUSSION POINTS

Shared discussion points can be reviewed.

Possible outcomes:

Addressed
Decision Created
Action Created
Deferred
Unresolved


## DECISIONS

Decisions are high-value project outcomes.

Each decision should show:

- decision text
- related architecture context
- related question/discussion
- who confirmed it
- meeting reference
- timestamp

Example:

"Worker owns asynchronous retry handling."

"Use dead-letter queue after 3 failed attempts."

"Keep Notification Service decoupled from payment path."

Decision may be edited before final save.


## ACTION ITEMS

Each Action Item should support:

- action text
- owner
- due date
- related question/decision
- architecture context
- status

Example:

Ravi
Document retry policy
Due Oct 20

Sarah
Validate recovery behaviour
Due Oct 22

James
Check queue retention configuration
Due Oct 25

Khushboo
Review fraud service plan
Due Oct 25

Do NOT turn this into a full Jira replacement.

V1 only needs structured ownership and due date.


## UNRESOLVED / DEFERRED

Keep unresolved items explicit.

Examples:

Queue retention duration
Fraud-service degradation

Possible status:

Unresolved
Deferred
Carry Forward
Future Meeting

Do NOT force every item into Decision or Action.


SNAPSHOTS & EVIDENCE

Show relevant:

- shared snapshots
- shared evidence
- referenced docs
- architecture state previews

These remain linked to context.

Do not duplicate large documents into the meeting record unnecessarily.

Store references.


## AI MEETING SUMMARY

AI can generate a concise structured summary.

Example:

"Meeting focused on payment architecture,
retry handling,
database failure recovery
and notification flow.

Key decisions were made on retry ownership
and idempotency behaviour.

Some questions remain open regarding
queue retention and fraud-service degradation."

AI summary is DRAFT.

Show:

AI Generated

Actions:

Edit
Regenerate
Confirm

Do NOT save AI summary automatically.


## AI CLASSIFICATION

AI may suggest:

- Addressed
- Unresolved
- Deferred
- Decision
- Action Item
- Not Discussed

But human reviewer may change any classification.


## FINAL OUTCOME SCREEN

After category review:

show Meeting Outcomes.

Spatial panels may show:

Decisions
Action Items
Unresolved / Deferred
Key Snapshots & Evidence

Example:

Decisions (3)

Action Items (4)

Unresolved / Deferred (2)

Key Snapshots & Evidence (3)

Primary action:

Save to Project


## SAVE TO PROJECT

This is the FINAL Group 6 action.

Before saving:

show small confirmation summary:

Save meeting outcomes to project?

Will save:

- meeting summary
- confirmed decisions
- action items
- unresolved/deferred items
- shared questions
- referenced notes
- snapshots/evidence references

Actions:

Cancel
Save to Project


## WHAT SAVE TO PROJECT DOES

Save to Project should persist structured project knowledge.

Conceptually save:

Meeting record
Meeting summary
Questions
Notes
AI findings selected for retention
Discussion outcomes
Decisions
Action Items
Unresolved / Deferred items
Snapshots
Evidence refs
Architecture context refs
Presentation screen refs

Do NOT flatten everything into one summary document.


## AFTER SAVE — ROUTE TO HOME

After successful Save to Project:

show brief confirmation:

Saved to Payments Platform ✓

Then route user to:

## HOME

Do NOT leave the user stuck inside Meeting Review.

Flow:

Meeting Review
→ Save to Project
→ success confirmation
→ Home


## HOME PAGE UPDATE AFTER SAVE

The Payments Platform project card on Home should reflect the newly completed meeting.

Do NOT redesign Home.

Reuse the existing Home card system.

The project card may show lightweight updated information such as:

Payments Platform

Latest activity:
Payment Reliability Review completed

3 decisions
4 actions
2 unresolved

Updated just now

Possible indicators:

- latest meeting completed
- latest activity timestamp
- unresolved count
- action count

Do NOT turn Home into an analytics dashboard.

Keep it lightweight.


## HOME CARD ENTRY POINTS AFTER GROUP 6

Existing Home actions remain.

For example:

Open Architecture
Open Presentation

Meeting route can be added later when fully implemented.

The important part now:

project state is visibly updated after Group 6 save.


## PROJECT KNOWLEDGE UPDATE

Group 6 should update the project's persistent knowledge layer.

Conceptually:

Project
  Architecture
  Presentation
  Meetings
  Decisions
  Questions
  Actions
  Findings
  Snapshots
  Evidence

Group 7 may visualize history later.

Group 6 only ensures structured information exists.


## SPATIAL DEPTH MODEL

V1 should use a simple spatial hierarchy:

## LEVEL 1
Meeting Review category cards

## LEVEL 2
Selected category comes forward

## LEVEL 3
Selected individual item comes closer

Example:

Meeting Review
→ Questions
→ specific question

Back:

specific question
→ Questions

Back again:

Questions
→ Meeting Review Overview

Do NOT create unlimited nested spatial layers.


## HAND MOVEMENT — GROUP 6

Group 6 remains hands-first.

## PRIMARY:

hand ray + pinch

Direct poke optional for near controls.

No controller required.

No custom gestures.

No giant arm movement.


1. END MEETING CONFIRMATION

Host points to:

End Meeting

ray hover
→ highlight
→ pinch

Confirmation appears.

Cancel / End Meeting

→ pinch

No gaze-only ending.


2. SELECT MEETING REVIEW CARD

Example:

Questions card

Flow:

hand remains near chest
→ ray targets card
→ soft highlight
→ pinch

Selected card moves forward.

No physical dragging required.


3. PAGE THROUGH CATEGORY

For multi-page category:

Previous
Next

ray hover
→ pinch

Do NOT require swipe.


4. SELECT INDIVIDUAL ITEM

Example:

"Who owns retry handling after DB recovery?"

ray hover
→ item highlights
→ pinch

Item detail comes closer.


5. EDIT ITEM

Edit
→ pinch

For text:

system Quest/Horizon keyboard

or

Mic
→ pinch
→ speak

No custom keyboard.


6. CHANGE STATUS

Possible status chips:

Addressed
Unresolved
Deferred
Not Discussed

Flow:

point
→ pinch

If action materially changes classification:

show clear visual feedback.


7. OPEN RELATED CONTEXT

Example:

Payment Service
Failure Screen
Retry Design Doc

ray hover
→ pinch

Open contextual preview.

Back
→ pinch

returns to current review item.


8. VIEW IN ARCHITECTURE

point to View in Architecture
→ pinch

architecture context opens.

Use:

Back to Review

to return.

Do NOT require physical locomotion.


9. REVIEW DECISION

point to Decision card
→ pinch

Decision panel comes forward.

Edit
→ pinch

Confirm / Back
→ pinch


10. ACTION ITEM EDITING

Select action item
→ pinch

User may edit:

owner
due date
text

Use system keyboard or known user selector.

No drag-and-drop assignment required.


11. SAVE TO PROJECT

Point to Save to Project
→ hover
→ pinch

Show confirmation.

Confirm Save
→ pinch

After successful save:

brief Saved ✓ feedback
→ route to Home.


## HEAD GAZE

Head gaze may softly pre-highlight:

- category cards
- large Back controls
- Next/Previous
- Save to Project
- Home return controls

Head gaze NEVER:

- changes category
- changes status
- saves project
- confirms decision
- edits action
- exits review

Pinch confirms.


## DISTANCES

Meeting Review overview cards:
~0.9–1.2 m

Selected category:
~0.8–1.0 m

Selected item close-up:
~0.6–0.9 m

Bottom / primary controls:
~0.5–0.8 m

System keyboard:
~0.5–0.8 m

All content remains forward-facing.


## SEATED COMFORT

User remains seated.

No locomotion required.

No behind-user content.

No repeated shoulder-height interaction.

No giant lateral reach.

Use:

small hand movement
wrist targeting
short ray
pinch


## 2-FOOT RADIUS TEST

Entire Group 6 workflow must work inside approximately a 2-foot seated interaction radius.

User must be able to:

- end meeting
- select category
- review questions
- edit outcomes
- inspect decision
- edit action item
- open evidence
- save project
- return Home

without standing.


## SPATIAL CARD MOVEMENT

Cards may animate slightly:

selected:
→ forward 5–15 cm equivalent visual depth

non-selected:
→ slightly back / dim

Do NOT use dramatic flying transitions.

Keep motion comfortable.


## FEEDBACK

hover
→ subtle outline/glow

pinch
→ pressed state

classification change
→ updated status chip

saved decision/action
→ small confirmation

Save to Project complete
→ Saved ✓

Then route Home.


## GROUP 6 DATA MODEL INTENT

Conceptually:

MeetingReview
- meetingId
- projectId
- architectureId
- architectureVersion
- presentationId
- summary
- reviewStatus
- reviewedBy
- reviewedAt

MeetingQuestion
- id
- meetingId
- sourceType
- raisedBy
- content
- architectureContextRef
- presentationScreenRef
- status:
    ADDRESSED
    UNRESOLVED
    DEFERRED
    NOT_DISCUSSED
- decisionRef
- actionRefs[]
- evidenceRefs[]

MeetingDecision
- id
- meetingId
- content
- architectureContextRef
- sourceDiscussionRef
- confirmedBy
- createdAt

MeetingAction
- id
- meetingId
- content
- ownerUserId
- dueDate
- status
- relatedQuestionRef
- relatedDecisionRef
- architectureContextRef

MeetingFinding
- id
- meetingId
- source
- content
- status
- architectureContextRef

MeetingSnapshotRef
- id
- meetingId
- snapshotId
- architectureContextRef
- evidenceRefs[]

MeetingOutcome
- meetingId
- decisionIds[]
- actionIds[]
- unresolvedIds[]
- deferredIds[]
- snapshotRefs[]
- summary


## HOME UPDATE INTENT

After Save to Project:

Home project card should be able to retrieve:

latestMeetingId
latestMeetingTitle
latestMeetingCompletedAt
decisionCount
openActionCount
unresolvedCount
latestActivity

Example:

Payments Platform

Payment Reliability Review completed

3 Decisions
4 Actions
2 Unresolved

Updated just now

Keep this lightweight.


## GROUP 7 BOUNDARY

Do NOT implement full spatial project history here.

Group 7 may later visualize:

- historical meetings
- decisions across time
- architecture evolution
- snapshots in depth
- accumulated knowledge

Group 6 only SAVES structured outcomes so Group 7/backend can use them.


## NON-GOALS

## DO NOT:

- create flat web-dashboard review screens
- create long infinite scroll
- auto-save AI conclusions
- auto-convert AI finding to decision
- expose unshared private My Space content
- force every question into a decision
- force every unresolved item into an action
- create Jira clone
- edit canonical architecture
- redesign Home
- implement Group 7
- implement backend
- implement Unity


## REFERENCE IMAGE AUTHORITY

Use latest supplied Group 6 images as references for:

1. End Meeting confirmation
2. Meeting Review spatial category cards
3. Category card coming forward
4. Questions pagination
5. specific question close-up
6. decision / action linkage
7. snapshots & evidence
8. final Save to Project state

Important:

Use the CLOSE-UP reference image to understand:

- category cards remain on side
- selected category occupies center
- selected question detail opens another level closer
- related architecture/doc context is available
- pagination exists
- no long web scrolling

Ignore outdated Group 6 imagery that looks like:

- flat admin dashboard
- giant browser tables
- traditional sidebar web application
- analytics page
- long scroll page

Written specification wins.

## Consistency notes and visual overrides

- Live Mic/Raise/Return to Live controls appear in the question close-up image even though Group 6 begins after the session ends. Do not infer an active live meeting, broadcasting microphone, raising queue or Return to Live route from this leftover toolbar. Follow the written post-meeting review controls; any exact adapted toolbar remains a design detail to settle before implementation.
- The composite caption suggests users may “move closer.” In ASL that means selected content comes forward automatically after ray + pinch, never required physical locomotion. Three bounded review levels and small depth transitions preserve seated comfort.
- Example question counts/statuses differ between overview and close-up, and the same fraud-service question is Deferred in one image versus Not Discussed in another. They are sample states, not a rule that these statuses are equivalent. Use consistent actual counts and explicit Addressed/Unresolved/Deferred/Not Discussed values. Source typo NOT_DISCussed is normalized conceptually to NOT_DISCUSSED without adding a new status.
- End-of-meeting capture freezes appropriate shared/session context for review; this is separate from human-confirmed Save to Project. AI drafts/classifications remain editable proposals, never automatically confirmed decisions. “Capture discussions” does not authorize recording audio or transcribing all conversation: only intentionally captured/shared data with applicable permissions may feed review.
- Decisions saved as project knowledge do not mutate canonical architecture or certify a proposed architectural change as already implemented. View in Architecture is reversible contextual inspection only. Preserve architecture/version/screen references and provenance.
- Unshared My Space records remain excluded. A previously shared reference grants access only to intentionally shared content/context, not to private originals, unrelated notes or future private edits. Project persistence must respect the defined project/meeting access boundaries; exact reviewer authority and retention/access contracts require later implementation design.
- Save success is the trigger for Saved feedback → Home. A canceled confirmation stays in review; a failed save must not be represented as success or lose the review work. Retry/error UI and persistence mechanics are not invented in this handoff.
- Home examples mentioning Open Architecture/Open Presentation do not silently replace Group 4 Stage 1's minimal confirmed-card Open/Create Presentation menu. This handoff authorizes lightweight latest-meeting activity/outcome indicators and Home return; any expansion of card actions remains to be settled, with no redesign or invented navigation.

No contradiction blocks saving the supplied handoff. The outdated live toolbar and illustrative status differences above are explicitly not requirements; exact post-meeting toolbar, reviewer permissions and additional Home actions need resolution before their implementation. All distances and 5–15 cm transitions are user-defined placement targets, not verified Meta standards or mandatory physical reach. Apply the global system-keyboard and seated two-foot physical-action rules, and verify current supported primitives/device comfort later.

## Change boundary

Only documentation, reference-image copies and the consolidated product notes were updated. Backend code was not modified. Unity application code was not modified. Group 7 implementation was not started. No meeting capture, AI processing, project save, UI implementation or runtime/device tests were performed for this documentation task.
