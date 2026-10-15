# Adaptive Spatial Labs — Architecture Rules

## Day 1 principle

Implement Adaptive Spatial Labs as a modular monolith. No giant page components, no giant backend modules, and no feature logic scattered across unrelated areas. Build each product group from reusable domain modules and reusable UI/spatial components.

## Backend domain ownership

Organize by domain modules rather than one global controller or a large project service:

```text
backend/
  modules/
    auth/
    organizations/
    projects/
    sources/
    model/
      object-types/
      objects/
      layers/
      relationships/
      evidence/
    views/
      view-config/
      visual-features/
      suggestions/
    presentations/
    meetings/
    discussions/
    proposals/
    actions/
    readiness/
    integrations/
  shared/
    database/
    auth/
    events/
    errors/
    realtime/
    ai/
```

Each module owns its controller, service, repository, schemas/validators, types, and tests. Shared infrastructure stays separate from product logic. Project creation, views, meetings, AI, tickets, and readiness must not accumulate in one `project.service.ts`.

## Frontend composition

```text
frontend/
  features/
    auth/
    home/
    project-creation/
    project-model/
    views/
    presentations/
    meetings/
    discussions/
    readiness/
  components/
    navigation/
    panels/
    forms/
    dialogs/
    status/
    spatial-controls/
  design-system/
    tokens/
    typography/
    icons/
    states/
```

Pages and MR states compose components. Business logic belongs outside page components. Share headers, buttons, spacing, navigation, and interaction patterns across screens.

Example composition:

```text
NewProjectPage
  ProjectCreationShell
  StepProgress
  ProjectBasicsStep
  StructureStep
  InputsStep
  EditorsStep
  ReviewStep
```

## Quest / Unity systems

```text
Quest/
  Core/
  ProjectModel/
  SpatialGraph/
  Layers/
  Views/
  Interaction/
  Presentation/
  Meeting/
  MySpace/
  Discussion/
  Realtime/
```

Use focused systems such as `SpatialGraphRenderer`, `FocusController`, `LayerController`, `ViewController`, `MeetingSessionController`, and `PrivateWorkspaceController`. Each has one responsibility. Avoid a giant `WorkspaceManager.cs`.

## Dependency direction

A feature may depend on lower-level modules. Lower-level modules must remain independent of higher-level features. Avoid circular dependencies.

- Meeting can use View; View must work without Meeting.
- Presentation can reference View; View must work without Presentation.
- A meeting screen can compose `ViewRenderer`, `DiscussionPanel`, `ParticipantBar`, and `MySpacePanel`; `ViewRenderer` must not contain meeting logic.

## State ownership

Keep separate stores/services and clear owners for:

- Project state: persistent project model and configuration.
- View state: spatial and visual configuration.
- Meeting/session state: shared live-session behavior.
- Personal state: private workspace, marks, questions, and preparation.

Do not put unrelated domains into one global `appState`. Private personal content becomes shared only through the explicit sharing flow defined in the grouped screen plan.

## Reuse without over-generalization

Create concrete reusable components when multiple screens need them, such as `ArchitectureObjectCard`. Do not create speculative abstractions such as `UniversalEntityRenderer<T,U,V,...>`.

## Operational rule

If a file starts becoming responsible for more than one product concern, split it before continuing. Apply these rules to all seven product groups, and keep the modularity instruction at the top of daily Codex implementation prompts.

## Implementation sequence

Follow `group-screens.md`: Groups 1 + 2, then Group 3, then Groups 4 + 5, then Groups 6 + 7. Complete the relevant frontend, backend, states, permissions, and verification for each agreed increment. Proceed at the user's pace.
