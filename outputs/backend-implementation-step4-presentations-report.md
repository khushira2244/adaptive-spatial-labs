# Backend Implementation Step 4 — Presentation Preparation + Builder

Date: 2026-10-26 (Asia/Calcutta). **COMPLETE — verified and stopped after Presentations.** Steps 1–3 remain CLOSED.

## Outcome / scope

Implemented the deterministic Group 4 Presentation root: permanent confirmed-Architecture binding, protected Main Architecture base, authored screen drafts, explicit human scenario-understanding acceptance, bounded screen-local visual/overlay state, deliberate safe Knowledge inclusion, registered invitation lifecycle, scoped access and immutable screen confirmation.

One confirmed Architecture -> many Presentations -> one Main Architecture + authored screens -> manual scenario understanding -> local visual definition/discussion preparation -> owner-confirmed current meeting-eligible definitions.

No model provider, prompts/voice interpretation, Meeting, SharedMeetingItem, Outcomes, WebSocket or Unity work. Existing backend stack, architecture, Source and Knowledge truth ownership preserved.

## Exact files added

Exactly 14 files. Paths below are repository-relative:

- [backend/src/modules/presentations/presentation.access.ts](../backend/src/modules/presentations/presentation.access.ts)
- [backend/src/modules/presentations/presentation.input.ts](../backend/src/modules/presentations/presentation.input.ts)
- [backend/src/modules/presentations/presentation.query.ts](../backend/src/modules/presentations/presentation.query.ts)
- [backend/src/modules/presentations/presentation.repository.ts](../backend/src/modules/presentations/presentation.repository.ts)
- [backend/src/modules/presentations/presentation.routes.ts](../backend/src/modules/presentations/presentation.routes.ts)
- [backend/src/modules/presentations/presentation.schema.ts](../backend/src/modules/presentations/presentation.schema.ts)
- [backend/src/modules/presentations/presentation.service.ts](../backend/src/modules/presentations/presentation.service.ts)
- [backend/src/modules/presentations/presentation.validation.ts](../backend/src/modules/presentations/presentation.validation.ts)
- [backend/src/modules/presentations/screen.service.ts](../backend/src/modules/presentations/screen.service.ts)
- [backend/src/modules/knowledge/knowledge.scope.ts](../backend/src/modules/knowledge/knowledge.scope.ts)
- [backend/migrations/0005_unknown_storm.sql](../backend/migrations/0005_unknown_storm.sql)
- [backend/migrations/meta/0005_snapshot.json](../backend/migrations/meta/0005_snapshot.json)
- [backend/tests/presentation.integration.test.ts](../backend/tests/presentation.integration.test.ts)
- [outputs/backend-implementation-step4-presentations-report.md](../outputs/backend-implementation-step4-presentations-report.md)

## Exact files modified

Exactly 8 existing files:

- [backend/src/app/app.ts](../backend/src/app/app.ts)
- [backend/src/shared/database/schema.ts](../backend/src/shared/database/schema.ts)
- [backend/src/modules/knowledge/knowledge.context.ts](../backend/src/modules/knowledge/knowledge.context.ts)
- [backend/migrations/meta/_journal.json](../backend/migrations/meta/_journal.json)
- [backend/tests/fixture.ts](../backend/tests/fixture.ts)
- [backend/README.md](../backend/README.md)
- [hackathon.md](../hackathon.md)
- [outputs/backend-implementation-progress.md](../outputs/backend-implementation-progress.md)

The one prior-domain integration is a pure extraction of semantic target/selection validation into knowledge.scope.ts. Knowledge's existing authorization, stale-state handling and external contracts are unchanged, verified by the complete prior suite. app.ts composes the new module; shared schema exports its tables; fixture reset/journal include migration 0005. Existing historical reports, design files, images and earlier dirty/untracked implementation predated this increment and are not counted as Step 4 changes. No dependencies, env files, old migration SQL, original test assertions or Unity files changed. Build generated ignored dist output.

## Migration / tables

**backend/migrations/0005_unknown_storm.sql**; generated **backend/migrations/meta/0005_snapshot.json**; extended existing journal. Seven new tables, **34 application tables total**.

| Table | Ownership / purpose |
| --- | --- |
| presentations | Permanent Project/confirmed family/owner binding, setup, preparation state, parent stamp, selected builder screen and timestamps. |
| presentation_access_grants | Explicit User or Scoped Guest VIEWER/COLLABORATOR grant and current revocation state. |
| presentation_invitations | Durable recipient email/role/expiry and PENDING/terminal acceptance intent; accepted account/grant reference. |
| presentation_screens | One protected base plus authored current draft, stamp/status, last confirmed definition pointer, order and logical deletion. |
| presentation_screen_definitions | Explicit immutable confirmed draft/visual/overlay/inclusion representation. |
| scenario_overlay_connections | Distinct screen-local hypothetical edge identity and bounded presentation definition. |
| presentation_screen_knowledge_references | Presentation-owned current explicit inclusion with private provenance kept internal and safe captured representation. |

Visual overrides and scenario understanding are owned JSONB values under the screen/definition. No canonical nodes/connections, architecture version series, universal interaction history or Meeting tables were added.

Constraints/guards: permanent presentation binding to same-project confirmed Architecture; one base partial unique index plus deferred exactly-one-base consistency; base ownership/deletion/type protection; composite screen/definition/pointer ownership foreign keys; immutable confirmed definitions; immutable current inclusion representations (remove/include explicitly to replace); actor-exclusive scoped grants. Authored screens soft-delete so historical definitions remain. Composite referenced unique indexes are ordered before their foreign keys in the migration, consistent with PostgreSQL requirements. Custom trigger/FK/constraint SQL must be preserved; Drizzle snapshots do not describe trigger bodies.

## Presentation / builder lifecycle

Creation requires actual stored Project owner and confirmed Architecture. Multiple Presentations can reference the same immutable family. Project/Architecture/owner binding cannot be rebound. Creation transaction inserts Presentation, protected whole-architecture Main screen and its initial confirmed base definition exactly once, with the create receipt. This base uses already accepted canonical truth and is automatically eligible; it is not an AI-authored scenario.

Owner controls name/purpose, invitations/access, ordering and screen confirmation. The Main screen remains first and cannot be edited/deleted/repurposed through authored-screen commands. Current builder selection can be saved by owner/collaborator; viewers navigate locally without persisting a shared checkpoint. No live presenter/shared-state/navigation system exists.

PREPARING means some current screen is DRAFT; READY means all current screens are confirmed. This is deterministic preparation status, not Meeting readiness, admission or AI assessment. Selection resets to Main if the selected authored screen is deleted.

## Screens / scope / scenario understanding

Types: MAIN_ARCHITECTURE, ARCHITECTURE_OVERVIEW, DISCUSSION, SUCCESS, FAILURE, RECOVERY, CUSTOM. Authored screens hold name, scenario goal, notes, primary scope and bounded understanding summary/points. Screen type is chosen on creation; later metadata edits update name/goal/notes/understanding.

Primary scope is exactly WHOLE_ARCHITECTURE or LASSO_GROUP, reusing Step 3 schema and shared pure validator. Scope pins exact confirmed Architecture/Graph/family stamp. Lasso keeps selected/internal/boundary/external endpoint identities and validates all roles/direction by canonical references. No cropping/deleting topology, raw gestures, automatic connected expansion or arbitrary graph access.

Manual understanding is accepted through ACCEPT_UNDERSTANDING. New screens start unaccepted and non-meeting-eligible. Acceptance is separate from screen CONFIRM; no provider is called. Metadata/understanding or scope change invalidates acceptance. Scope change also clears incompatible current overrides/overlays. Visual-only edits retain accepted understanding.

## Visual / overlay state

Node vocabulary: NORMAL/SUCCESS/WARNING/FAILURE/DISABLED; NORMAL/HIGHLIGHT/DIM emphasis; scale 0.5–2; BACK/NORMAL/FORWARD depth; opacity 0.2–1; DEFAULT/SUCCESS/WARNING/FAILURE/ACCENT color; NONE/CHECK/WARNING/CROSS marker; visibility, short label/callout and simple pulse.

Connection vocabulary: NORMAL/ACTIVE/BLOCKED/BROKEN; SOLID/DASHED; same bounded emphasis/marker/color/visibility; STATIC/FLOW; short label. RESET_VISUALS removes current node/edge overrides. These are backend product contracts, not renderer/API/device verification.

Overrides resolve only nodes/edges in the anchored canonical graph. Scenario overlays have distinct table/IDs and valid canonical source/destination nodes in that graph, short label and the same bounded connection visual. They are never ArchitectureConnection writes. Scope changes remove incompatible overlays; deleting an authored screen hides current state while pinned historical overlay definitions remain intact.

## Access / invitations / guests

Owner is distinct from grants. VIEWER reads the granted Presentation projection only. COLLABORATOR creates/edits authored drafts, acceptance, visual/overlay state and authorized own-content inclusions, but cannot confirm screens, invite, manage owner setup or gain Architecture authority. Grants create no User, organization membership, Project membership/editor assignment or Meeting authority.

Builder read resolves canonical display under the actual Presentation grant. Its projection omits source-provenance arrays and credential/private-origin metadata. Presentation invitation emails and grant-management metadata are owner-only. This scoped display is not permission to call general Project/Sources/Architecture/private Knowledge APIs.

Registered invitation intent: PENDING -> ACCEPTED / DECLINED / CANCELLED / EXPIRED. Recipient acceptance/decline checks authenticated account's stored normalized email. Owner cancels. Expiry is computed on read and persisted when an expired invitation is responded to. Accepted transition creates one grant plus receipt atomically. Replay returns the existing result without another grant. Duplicate active grants conflict. This uses existing registered-account identity; no new claim of external email verification is introduced.

Email sending/delivery is deferred: owner records an invitation ID/intent; no email provider/network notification is invoked. Guest email-link redemption is also deferred until a secure delivery/claim flow exists. No fake User or automatic unauthenticated invitation claim.

A trusted server-only owner-authorized admission method provisions an existing-foundation Presentation-scoped guest credential and grant atomically after checking the real parent. Token is returned once to the trusted caller, never persisted in an operation receipt or exposed through builder routes. It is not a public HTTP mint endpoint; repeat trusted issuance is a new credential intention. Guest access is intersection of exact Presentation scope + current credential + current grant. Expiry/revocation and cross-Presentation isolation enforced; fresh checks occur after waits and before result projection/commit. Step 3 private Knowledge/Snapshot guest routes remain closed.

Bounds: 64 current screens, 128 overlays and 32 inclusions per screen, 100 stored invitations, registered invitation expiry 1–30 days, trusted guest admission at most thirty days with a 256 active-grant admission check. The registered invitation cap and guest admission cap are separate; there is no claim of a universal 256-actor policy. List limit 1–100 / offset 0–10000; counts are authorized returned-page counts.

## Knowledge integration / deliberate inclusion

An inclusion action is explicit, not a My Space import. INCLUDE_KNOWLEDGE requires private author access, compatible project (or standalone own note), expected item stamp and includeBody=true. It captures category/title/body/safe author attribution only. It excludes private attachment sets, origin body access, unrelated notebook content/history and future private edits.

INCLUDE_SNAPSHOT requires private creator access and matching canonical family, including when the Snapshot is unfiled. Safe representation pins scope/payload/creator; no image/video access is invented. INCLUDE_SOURCE requires existing project/source access and captures an exact SourceReference ID, not full document content. References never broaden direct source/private-origin authorization.

Current inclusion is Presentation-owned and immutable as a representation. Explicit remove/include replaces it. Confirmed definitions capture those safe intended representations again at their freeze boundary. Later private edits cannot alter current inclusion or a historical definition. Another reader cannot retrieve private originals from included IDs; private origin IDs/stamps are omitted from public projections.

Confirmation validates strictly bounded captured schemas and exact included Snapshot/source references in this family/project. It does not read through to the private latest body or demand owner access to another author's original after that author deliberately included an authorized representation. Guest private-original inclusion remains unavailable under unchanged Step 3 policy.

## Confirmation / concurrency / retention

All commands reuse verified Principal, Step 1 IdempotentOperations and durable safe receipts. Mutation execution locks parent and target screen, validates expected stamps and uses conditional screen/Presentation updates. Scenario changes, current overlays/inclusions and draft eligibility commit atomically. Best-effort screen events publish IDs/stamps only after commit.

Owner CONFIRM: current draft stamp -> scenario accepted -> scope/family/stamp -> bounded override/overlay target validation -> safe included-representation validation -> immutable definition -> current confirmed pointer/eligibility -> receipt -> commit.

Same-intention retry returns the original definition ID. New confirmation of an unchanged already confirmed screen is rejected. A meaningful subsequent edit starts a new DRAFT, leaving lastConfirmedDefinitionId intact but making current screen ineligible for a NEW Meeting. Explicit reconfirmation creates another immutable ID. No per-edit/autosave definition history is created. Historical explicit definitions are retained for future referenced consumers; no unapproved retention/erasure service is implemented.

Validation or database failure rolls back the entire confirmation. Soft-deleted authored screens cannot be read/edited through current builder commands; their immutable historical definitions remain accessible only under current Presentation access.

## Routes

| Method | Route | Capability |
| --- | --- | --- |
| POST | /api/v1/presentations | Owner create from confirmed architecture; operationId. |
| GET | /api/v1/presentations | Registered actor's authorized bounded list; optional Project filter. |
| GET | /api/v1/presentations/:presentationId | Full scoped builder projection; registered or exact scoped guest. |
| POST | /api/v1/presentations/:presentationId/commands | SETUP, ORDER, SELECT, REVOKE with parent expectedStamp. |
| POST | /api/v1/presentations/:presentationId/screens | Authored screen creation with parent expectedStamp. |
| POST | /api/v1/presentations/:presentationId/screens/:screenId/commands | Scenario, scope, visual, overlay, inclusion, CONFIRM, DELETE with screen expectedStamp. |
| GET | /api/v1/presentations/:presentationId/definitions/:definitionId | Exact immutable definition under current scope authorization. |
| POST | /api/v1/presentations/:presentationId/invitations | Owner durable registered-recipient intent. |
| POST | /api/v1/presentations/:presentationId/invitations/:invitationId/respond | Registered recipient ACCEPT/DECLINE or owner CANCEL. |

JSON input carries no Principal/role grant. Every consequential command has operationId. Read/create acknowledgements expose safe domain IDs/status/stamps, never internal operation records or credentials. No Meeting, public guest mint/redemption, email sending, AI or architecture-mutation route.

## Tests / verification

**39 new PostgreSQL integration tests** in presentation.integration.test.ts:

- confirmed-only owner creation, many Presentations, exact base/replay/permanent binding/no canonical copy;
- owner/collaborator/viewer isolation and no Project/editor/membership authority;
- registered invitation idempotency/recipient/cancel/decline/expiry/revocation;
- actual scoped guest read/edit, cross-scope denial, no User/member creation, private-origin/lifecycle denial, revocation, expiry including a lock-wait case;
- six authored screen types and explicit understanding acceptance separate from confirmation;
- valid and invalid whole/lasso scope; acceptance reset and no canonical mutation;
- local visual application/reset plus five invalid target/range/schema cases;
- screen-local overlay endpoints/deletion/cross-screen IDs and historical capture retention;
- intentional Knowledge/body capture with inaccessible origin and stable representation after later private edit;
- author-only Snapshot/exact evidence inclusion, stale Knowledge and cross-project rejection;
- owner exact definition/replay/new draft/reconfirmation/SQL immutability;
- concurrent stale writers/stale confirmation;
- injected failed insert rolls back screen state, pointer, parent stamp and receipt;
- two malformed persisted overlay/inclusion cases rejected before freeze;
- scoped reorder/selection and authored deletion;
- setup/screen create replay and forged acceptance/base creation rejection.

| Check | Result |
| --- | --- |
| Prior baseline | **207/207 retained** |
| Full suite | **246 passed, 0 failed, 0 skipped; 16 files** |
| Original Group 1 regression | **53/53 passed** |
| Strict npm run typecheck | **PASS** |
| npm run build | **PASS** |
| Step 4 migration on dedicated local PostgreSQL 16 test DB | **PASS** |

The local PostgreSQL test cluster was stopped after runs. No production database migration/deployment, live provider, Unity Editor/native UI, headset or XR Simulator verification is claimed. No secrets/env files were published or committed. No git commit/push was requested for this increment.

## Documentation / limits / next step

Existing hackathon.md and living outputs/backend-implementation-progress.md updated; README links current implementation. Historical reports and locked product-design files were preserved.

Limits: manual deterministic authoring only; email delivery and guest email redemption deferred; trusted server guest admission only; private guest Knowledge unchanged; protected immutable base; no screen-type conversion endpoint; saved builder checkpoint is not private per-actor or live shared navigation; no implicit private inclusion or live original-body dereference; explicit definitions retained without per-edit history; no renderer/device implementation. No new archive/recovery workflow is introduced.

Next recommended module: **Meetings**, consuming granted Presentations and pinned confirmed screen definitions, only after a new user-directed increment.

**Remaining blocker for this bounded Step 4: none.** Meetings, SharedMeetingItem, Outcomes, AI/provider orchestration, WebSocket and Unity were **not implemented**. Stop here.
