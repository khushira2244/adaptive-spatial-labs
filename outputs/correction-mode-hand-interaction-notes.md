# Correction Mode — hand roles and movement discussion

Saved 2026-10-19. Documentation/reference only; no code changes or implementation authorization.

Historical storage note, updated after the user finalized popup UX on 2026-10-19. The user finalized confirmation routing on 2026-10-19: the popup belongs to Group 2 and opens ONLY after an explicit press of Confirm Architecture. Never open it on review load, exploration, Edit/Correction Mode, Group 3 Done, or return from correction. Cancel closes it and leaves the user in Group 2 without confirming. Confirm commits acceptance of the reviewed model; after successful confirmation, show Architecture Confirmed and return to Project Home. Group 3 Done saves corrected candidate work and returns to Group 2 review without final acceptance. Backend save/failure mechanics remain implementation details, not grounds to change this routing. See the Group 2 spec for exact copy.

## References

- `group2-reference-images/06-review-confirmation-actions.png`: review prompt with Edit (Correction Mode) and Confirm Architecture.
- `group2-reference-images/07-review-correction-confirmation-workflow.png`: illustrated confirm popup, home destination, correction branch and return to review.

Both images were copied unchanged and hash-verified. These are discussion references, not approved implementations. Sample home labels such as Learning Paths do not add an education feature to ASL.

## Historical scope conflict — resolved by subsequent handoff

The supplied note originally conflicted with earlier Group 3 Views planning. The subsequent user handoff on 2026-10-19 explicitly locks Group 3 as Correction Editor; see `group3-correction-editor-spec.md`. Earlier spatial-view placement remains a separate future roadmap question. Structural editing still does not occur inside Group 2 review.

## Hand roles and movement summary

| Action | Hand role / movement | Intended feedback / safeguards |
| --- | --- | --- |
| Select box | ray → hover → pinch | hover outline, then stronger selected state and compact actions |
| Move box | select → Move → pinch/grab → move → release | explicit Move for one box; X/Y editing plane, Z locked; snap/alignment; connected arrows follow |
| Rename | select → Rename → voice or virtual keyboard → confirm | preview name; complete workflow remains possible without voice |
| Change type | select → Change Type → preset selection | compact reachable palette |
| Delete box | select → Delete → confirm | show number of removed connections; Undo available |
| Select/delete arrow | ray → hover → pinch → Delete Connection | enlarged hit target and highlight; Undo; no endpoint grabbing |
| Add box | Add → preset → ray-guided ghost → pinch placement → name/confirm | no dragging a box from a menu; cancel available |
| Create connection | Connector → source pinch → destination pinch → confirm | explicit mode/source/destination state, preview, valid-target feedback, cancel |
| Correct wrong connection | delete → create replacement | no separate reverse/reconnect editor proposed |
| Undo / Redo | ray + pinch toolbar controls | visible correction actions |
| Done | ray + pinch | proposed save corrections and return to Group 2 review |
| Recenter | ray + pinch | restore comfortable forward workspace |

Keep a persistent restrained Correction Mode indicator. Proposed correction toolbar: Add, Connector, Undo, Redo, Done; replace rather than overlap the Group 2 review toolbelt. Top navigation: Back to Review, Correction Mode, Recenter. Context menus stay near the selection; no giant inspector, required walking, behind-user controls, or large reach. Avoid extra custom hand poses, double-pinch commands, system palm gestures, and air-drawn connectors.

These are stored interaction intentions, not verified Meta SDK bindings or physical-device test results. Meta guidance, the quoted 22 mm target size, and hackathon eligibility/FPS assertions in the supplied source are unverified here; check current official material and the actual event rules before treating them as requirements. In particular, the source's 60 FPS claim does not establish the ASL headset performance target. Retain existing seated, hands-first, privacy, entry/exit, short-use and measured-performance gates.

## Original supplied discussion (preserved)

The following is source discussion text, including proposals and external claims; the status/qualifications above govern how it is used.

Yes bro. For **Group 3**, we can reuse several Group 2 interaction principles, but tighten them because now the user is actually changing the architecture.

The most important rule is:

> **Group 3 only appears because the user did not confirm Group 2 and chose to correct a minor flaw.**

So Group 3 is not a normal workspace and not a scratch editor. It is a **temporary Correction Mode**.

Meta’s current hand guidance strongly supports using a small number of consistent interactions, especially **ray + pinch for distant selection**, clear hover/selection feedback, larger hit areas, and avoiding tiny closely packed targets. Meta also recommends minimizing reach, keeping frequent interactions close, and favoring neutral seated posture. [Meta Developers](https://developers.meta.com/vr/design/hands-interaction-types/?utm_source=chatgpt.com)

I would lock the hand interaction model like this:

| Group 3 action | Hand interaction | Behavior |
|---|---|---|
| Select box | hand ray → hover → pinch | box highlights, contextual actions appear |
| Move box | select box → choose `Move` → pinch/grab and move | constrained to architecture plane, arrows follow automatically |
| Rename box | select box → `Rename` | voice or virtual keyboard, then confirm |
| Change type | select box → `Change Type` | choose preset type |
| Delete box | select box → `Delete` → confirm | also removes attached connections |
| Select arrow | hand ray → hover → pinch | arrow highlights using enlarged invisible hit area |
| Delete arrow | selected arrow → `Delete Connection` | remove connection, Undo available |
| Add box | pinch `+ Add` → choose preset | ghost box follows ray on editing plane → pinch to place |
| Create connection | pinch `Connector` → source → destination → confirm | system draws arrow automatically |
| Undo / Redo | ray + pinch | global correction controls |
| Done | ray + pinch | save correction and return to Group 2 review |
| Recenter | ray + pinch | restores comfortable workspace position |

For **selection**, I would not use direct touching as the main pattern. Our architecture is usually in front of the user, so **ray + pinch should be the default**. Meta specifically recommends ray interaction for distant objects, with cursor/hover feedback and pinch selection. [Meta Developers](https://developers.meta.com/vr/design/hands-interaction-types/?utm_source=chatgpt.com)

For example:

```text
hand ray reaches Payment Service
        ↓
Payment Service gets hover outline
        ↓
pinch
        ↓
selected outline becomes stronger
        ↓
Move | Rename | Change Type | Delete
```

That gives the user clear feedback at every step.

For **moving a box**, I would make it a two-stage action to prevent accidents:

```text
Select Payment Service
        ↓
choose Move
        ↓
Move mode activates for THIS box only
        ↓
pinch/grab and reposition
        ↓
release
        ↓
snap/alignment
```

Meta supports grab interactions with constraints, and constraining movement to defined axes/planes is an established pattern. [Meta Developers](https://developers.meta.com/vr/design/grab_usage/?utm_source=chatgpt.com)

For us, that means the box moves only in:

```text
X ↔ horizontal
Y ↕ vertical

Z = locked
```

So the architecture remains a stable editing plane.

This is much safer than free 3D movement.

While moving:

```text
Payment Service
      ╔══════════╗
      ║ selected ║
      ╚══════════╝

------- alignment guide -------
```

Then release.

All attached arrows automatically reroute.

The user never has to grab an arrow endpoint.

For **arrows**, keep the interaction extremely simple:

```text
ray → arrow
      ↓
arrow gets thicker / highlighted
      ↓
pinch
      ↓
Delete Connection
```

The visual line can remain thin, but technically we should give it a much larger invisible collider/hit target.

That follows Meta's warning against small and closely packed interaction targets. [Meta Developers](https://developers.meta.com/vr/design/hands-interaction-types/?utm_source=chatgpt.com)

We already decided correctly:

> There is no Reconnect/Reverse editor.

If the connection is wrong:

```text
Delete wrong connection
        ↓
Connector
        ↓
select source
        ↓
select destination
        ↓
Confirm
```

That is much easier with hands.

For **Connector Mode**, I would make the states visually obvious.

First:

```text
Connector
```

After pinch:

```text
CONNECTOR MODE
Select source
```

User points to Payment Service and pinches.

Then:

```text
Source:
Payment Service ✓

Select destination
```

Valid destination boxes get a subtle highlight.

User selects Queue.

Now:

```text
Payment Service ─────→ Queue

[Cancel] [Create Connection]
```

Only after confirmation is it written to the architecture model.

That reduces accidental connection creation.

For **Add Box**, use the same pattern.

Global toolbar:

```text
+ Add | Connector | Undo | Redo | Done
```

Pinch `+ Add`.

A compact palette opens near the working area:

```text
Service
API
Database
Cache
Queue/Event
Gateway
Frontend
External
Generic
```

These buttons must not be tiny. Meta recommends direct-touch targets at least around 22 mm × 22 mm with spacing when using poke, and more generally warns against cramped hand targets. [Meta Developers](https://developers.meta.com/vr/design/hands-interaction-types/?utm_source=chatgpt.com)

I would still use **ray + pinch** here unless the palette is intentionally placed close enough for comfortable poke.

After choosing Database:

```text
Database ghost
        ↓
ray moves across editing plane
        ↓
ghost follows ray-plane intersection
        ↓
pinch
        ↓
placed
```

Then immediately:

```text
Name component
[ voice / keyboard ]

[Cancel] [Confirm]
```

No dragging the box out of a menu.

That would be harder and less reliable.

For **Delete Box**, we need protection because deleting a node can destroy connections.

```text
select Payment DB
        ↓
Delete
        ↓

Delete Payment DB?

This will also remove
3 connections.

[Cancel] [Delete]
```

Undo should remain available after the deletion.

For **Rename**, voice can be particularly good:

```text
select Payment Service
→ Rename
→ mic
→ "Payment Orchestrator"
→ preview
→ Confirm
```

Typing remains fallback.

### Group 3 visual state

The user must always know they're editing.

I would put one restrained persistent indicator:

```text
CORRECTION MODE
```

Maybe red/orange accented, but not alarm-like.

And the toolbar changes from the Group 2 toolbar:

**Group 2**

```text
Lasso | Attach | AI | Snapshot | Mic | My Space
```

**Group 3**

```text
+ Add | Connector | Undo | Redo | Done
```

That creates a strong mental shift:

> Group 2 = understand/review  
> Group 3 = correct

Do not show both toolbars simultaneously.

### Keep these Group 2 rules

Several Group 2 principles should stay exactly the same:

**Architecture remains center-front.**

No giant property inspector.

Temporary menus appear near the selected object.

Top area still keeps:

```text
Back to Review
Correction Mode
Recenter
```

No essential UI behind the user.

No locomotion needed.

No room-scale requirement.

The user stays seated and architecture comes to them.

Meta explicitly recommends keeping the body neutral, arms close to the torso, and avoiding frequent long reaches. [Meta Developers](https://developers.meta.com/vr/design/hands/?utm_source=chatgpt.com)

### Hackathon-specific Group 3 rules

The contest makes several things non-negotiable.

**1. Hands-first**

The complete correction flow must work without pairing controllers. Pasted markdown(10)

So we must physically test:

```text
Select box
Move box
Rename
Change type
Delete box
Add box
Delete arrow
Create connection
Undo
Done
```

with hands only.

**2. Airplane-seat test**

All of this should work within roughly a **2-foot seated radius**, with no reaching behind or walking around. Pasted markdown(10)

Our editing plane supports that perfectly.

**3. Comfortable FoV**

Essential controls and architecture should stay in the forward comfortable field of view because the judging criteria explicitly call out FoV-aware design. Pasted markdown(10)

So don't put:

```text
Undo behind left shoulder
Done far upper-right
palette below knees
```

Everything stays center/front/near-hand.

**4. Performance**

The judging rules require good Quest performance and list **60 FPS minimum**. Pasted markdown(10)

So moving a box must not cause:
- expensive full graph rebuild every frame
- hundreds of temporary objects
- complex real-time physics
- heavy particle effects

During grab:

```text
update selected node
update only connected arrows
```

not rebuild the entire architecture.

**5. Original experience**

This editor helps us here.

We are not embedding Miro or wrapping a web diagram editor. The structured architecture renderer and Correction Mode are ASL-built functionality, which fits the competition's “original, not a wrapper” requirement. Pasted markdown(10)

**6. Productivity relevance**

The competition defines Productivity around making users more effective and requires hands-first implementation. Pasted markdown(10)

Our story is strong:

> AI reconstructed an existing company architecture → architect finds one mistake → fixes it spatially with hands → confirms the corrected architecture.

That's much stronger than showing hand interaction simply because Quest supports it.

### One more Meta-specific choice

Meta's newer guidance says to start simple with one or two primary interaction models rather than mixing lots of gestures. [Meta Developers](https://developers.meta.com/vr/design/hands-choosing-an-interaction-model/?utm_source=chatgpt.com)

So our Group 3 interaction grammar should be:

> **Ray + pinch = choose/select/confirm.**  
> **Grab = move, only after explicit Move activation.**

That's enough.

We should **not** add:
- double pinch
- fist commands
- custom palm gestures
- two-finger special gestures
- air drawing for connectors
- pinch duration differences for five different commands

That would make the demo harder to learn and harder to track reliably.

So the final hand grammar for Group 3 is very simple:

```text
POINT + PINCH
Select / activate / confirm

MOVE MODE + GRAB
Move selected box

RAY + PINCH
Select arrow

CONNECTOR MODE + TWO PINCH SELECTIONS
Source → Destination

VOICE
Rename / optional command accelerator
```

That is what I would lock before we start making the remaining Group 3 images.


