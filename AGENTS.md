# Adaptive Spatial Labs workspace instructions

Current increment: Group 1 frontend Task 1 only, as specified in `outputs/group1-frontend-task1-spec.txt`. Build Unity/C# Meta Quest foundations, reusable UI components, shells, all 15 placeholder routes, API/DTO/session/state foundations, and tests. Reference images in `outputs/Screens_group1` are the visual source of truth. Do not implement full business flows, Task 2, React/web, or Group 2/later systems. Preserve the existing Group 1 backend and derive C# contracts from its real schemas/routes. The backend stack remains Node.js 22, strict TypeScript, Fastify, PostgreSQL, Drizzle, Zod, Argon2id, and Vitest; its specification is `outputs/group1-backend-spec.txt`.

The user explicitly approved the installed Unity 6000.5.6f1 Update editor for this foundation in place of the unavailable installed LTS. Project folder: `unity`. Read `outputs/group1-frontend-task1-report.md` for verification status. Do not claim Unity Editor/native UI/device verification from the standalone core tests. Scene/prefab generation and Editor verification remain pending while Unity licensing/compiler IPC is blocked in the sandbox.

Follow the architecture rules in `outputs/architecture-rules.md` for all implementation work. Use `outputs/screens.md` and `outputs/group-screens.md` as the screen and product-domain references.

Build slowly, in the user-directed increments. Saving plans does not authorize starting implementation.

For product/design discussions across Groups 1–7, read `outputs/product-design-discussion-notes.md` first and keep it updated as the user settles decisions. It consolidates product thinking, cross-cutting acceptance criteria, per-group testing intentions, and open questions; it does not authorize implementation.

For future Group 2–7 design, follow `outputs/group2-7-product-refinements.md`. Every interaction must pass hands-first, seated airplane-seat (roughly two-foot radius), clear entry/pause/resume/exit without hidden state loss, and meaningful-work-in-about-ten-minutes acceptance criteria. Standing/roomscale are optional. If a proposed interaction conflicts with these criteria or its compliance is uncertain, identify the conflict and ask the user before implementing that interaction. Check each group during formal design, not only at the end.

Implement a modular monolith organized by product domain. Keep frontend features, backend domains, and Unity systems separate but composable. Pages and screens compose reusable components; business logic belongs in domain modules. Avoid giant files, circular dependencies, duplicated UI patterns, and global state containing unrelated domains.

Preserve separate ownership of project, view, meeting/session, and private personal state. Dependencies point from higher-level features to lower-level modules. Reuse concrete components when needed without premature universal abstractions. If a file starts owning more than one product concern, split it before continuing.

Keep this modularity instruction at the top of daily implementation prompts.
