# Adaptive Spatial Labs — Global spatial text-input rules

Agreed design direction, 2026-10-20. Applies across Groups 1–7 wherever text entry is used. Documentation only; platform capabilities and headset comfort remain to be verified. These distances are ASL user-specified design targets, not claimed Meta requirements.

## Placement targets

| Element | Target distance from seated user's head | Placement/behavior |
| --- | --- | --- |
| Main form/active text field | 0.8–1.2 m | Comfortable forward viewing zone; active field and entered text stay visible |
| Temporary system keyboard | 0.5–0.8 m | Lower-front, below the active field; no behind-user placement or excessive downward head angle |

These are viewing/placement distances, not required reach distances. Hands-first ray selection/typing must remain available where supported; never require leaning forward or direct touching a surface 0.8 m away. The two-foot physical-action radius remains applicable even when rendered UI is farther away. Comfortable poke can be optional where naturally reachable. Validate layout, scale, separation and readable text together on hardware; no mandatory stretching, standing or wide arm movements.

## Common text-input lifecycle

1. User explicitly selects a text field with hand ray + pinch or comfortable supported direct interaction.
2. Focus the field and open the Meta Quest/Horizon OS system virtual keyboard where supported. Do not build a custom ASL keyboard.
3. Keep the form, active label and entered value visible. Shift/raise/scroll the relevant form content only as necessary; do not obscure essential navigation such as Continue where avoidable.
4. Keyboard Done/Enter ends text entry and closes the keyboard; it does not by itself submit the whole form, confirm architecture, send an invitation, or advance a stage. Preserve the field value.
5. Keyboard dismissal must not silently erase typed text. Restore normal form layout when it closes. Respect established Back/unsaved-work behavior.

Use one temporary system keyboard for the active field; do not duplicate keyboards or permanently reserve an empty keyboard region. Keep focus understandable. Voice is an optional accelerator and cannot be required to complete a primary text-entry flow. Head gaze can provide allowed soft targeting feedback but must never submit or activate an action alone.

## System ownership and verification boundary

The OS/platform may control keyboard pose and available interaction modes. Do not promise exact keyboard placement, auto-adjustment APIs or availability without checking current official Meta/Unity tooling. Adapt ASL-owned form layout around supported keyboard behavior. If the platform cannot meet the intended distances/comfort, report the concrete conflict to the user before implementing a different behavior; do not quietly substitute a custom keyboard.

## Acceptance checks for every applicable screen

- Hands-only field selection, typing, keyboard completion, and form navigation.
- Seated neutral posture, readable forward field and comfortable lower-front keyboard; no distant reaching, excessive downward gaze or hidden controls.
- Name, purpose/custom text, email, notes and other fields follow the same placement/focus principles; appropriate field-specific validation is separate.
- Keyboard closing/reopening, pause/resume and Back preserve meaningful text without implicit submission or hidden loss.
- Test actual system-keyboard occlusion, user fit and available placement controls on the target device before claiming compliance. Desktop mockups and standalone tests do not establish headset comfort.
