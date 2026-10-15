# Group 2–7 product refinements

Saved from the user's planning note on 2026-10-15. This records product direction, not authorization to implement. Formal interaction design comes first, then backend, then frontend. Existing architecture rules remain applicable.

## Group structure stays the same

No additional groups for hands, voice, testing, or optimization: these are cross-cutting requirements.

| Group | Updated scope |
| --- | --- |
| 2 — Model + Source Review | Miro/documents to canonical model; hands-first manipulation; basic/expandable blocks; source-backed semantic depth; lasso and voice refinement; never fabricate internals. |
| 3 — Spatial Views | Canonical model to spatial views; block visual profiles, dimensions and scale; distinguish whole-view zoom from per-block semantic zoom; distance manipulation; focus/context optimization; seated layouts. |
| 4 — Presentation | Purpose-driven lasso refinement; voice-assisted filtering; multiple focus areas; block-specific depth; temporary presenter control. |
| 5 — Meeting + My Space | Shared sessions with persistent personal near-space; presenter handoff; saved return-state; private exploration; voice; explicit shared/personal separation. |
| 6 — Discussion + Decision | Main unfinished design area: voice, AI findings, private/shared lifecycle, selected-area and whole-model context. |
| 7 — History + Readiness | Focus history; useful presenter-handoff history; summaries; decisions/actions; unresolved items and persistent outcomes. |

## Cross-cutting requirements

- Hands handle spatial manipulation; voice expresses intent and simplifies repetitive operations/refinement; AI provides contextual reasoning; humans confirm and decide.
- Optimize for seated/stationary use, hands-first interaction throughout, easy entry/exit, architecture in the center, and personal work in near-space.
- Depth navigation: full model → working view → lasso/focus area → block → internal detail only when real source data exists. Reverse navigation must always work. Both hands and voice can navigate.
- Performance is part of product design: highest detail in focus, reduced detail in immediate context, simplified peripheral context, and hidden/unrendered irrelevant architecture. V1 optimizes a working slice rather than simultaneously rendering an entire enterprise.
- Voice is a continuous capability, not a separate screen or group. Examples include relationship filtering, downstream context, presentation emphasis, opening My Space, returning to live, requesting presentation, risk analysis, alternative comparison, private notes, and sharing selected findings. Exact commands remain to be formalized.

## Mandatory acceptance criteria for every Group 2–7 interaction

Check these during each group's formal design, not only at final review. If an interaction fails a criterion, or compliance is uncertain, flag the specific conflict and ask the user to resolve it before implementing that interaction.

1. **Hands-first:** The full primary interaction can be completed with hands. Voice supplements interaction rather than becoming a required substitute.
2. **Airplane-seat test:** Every core interaction works seated/stationary within roughly a two-foot radius, without standing, walking, distant reaching, or turning around. No essential content behind the user or roomscale dependency. Keep controls in a comfortable forward/side arc. Bring far objects to the user through focus, distance grab, recentering, or optional voice. Bring My Space near the user; rotate/recenter the workspace instead of requiring body rotation. Seated is the baseline; standing and roomscale are optional extensions, never requirements for a complete core experience.
3. **Entry/exit test:** Fast cold start and project/meeting entry, minimal setup, immediate usable architecture, and restoration of the last useful state. Pause preserves focus, view, and private work; resume restores the user's prior state. Provide clear Back, Full Model, Return to Live, and Leave Meeting actions where applicable, with no hidden state loss. Exact load-time targets and live-session resume behavior remain to be formalized with the user.
4. **Bus-stop test:** A user can complete one meaningful, satisfying unit of work in about ten minutes or less at their chosen depth. This is not a fixed ten-minute script or session limit. Examples: focus one architecture area, inspect a dependency path, prepare one presentation focus, raise one useful meeting question, save one private note, or compare one alternative.

## Presenter handoff

Meeting ownership and shared-stage presenter control are separate. A participant may prepare privately, request presentation, receive control, and later return control. Restore the prior presenter's exact previous presentation state. This primarily affects Groups 4 and 5; it does not change canonical truth.

## My Space

Persistent private personal spatial zone, accessible while viewing the model, presenting, attending meetings, focusing inside a lasso, and exploring block detail. It does not replace the central architecture stage.

## Unfinished design and next sequence

Deeply define Group 6's lifecycle:

Private thought → question/finding → raise into meeting → discussion → alternative/trade-off → decision → action → project persistence.

Define how multiple participants contribute without filling the architecture with floating cards.

Formal design sequence: Group 2 → 3 → 4 → 5 → deeply design 6 → 7. Preserve the existing groups while settling screens, states, gestures, and transitions. After that, design the Group 2–7 backend together, then implement backend before frontend in user-directed increments. No implementation is authorized by saving this note.
