# Backend V1 — Route Inventory

Verified against route composition and runtime registration in final Step 8: **91 business routes + 38 automatic HEAD handlers = 129 registered method/path entries**. Exact set reconciliation passed. All paths below are complete. GET routes also receive Fastify’s automatic HEAD handler; HEAD has the same authentication and does not introduce an additional business capability. `/ws` is an authenticated HTTP GET upgrade, not a public transport.

Identity is resolved from verified bearer credentials, never from client actor/role fields. A Guest is accepted only on its explicitly scoped Presentation/Meeting routes. Shared command endpoints enforce action-specific authority, expected stamps, parent IDs and lifecycle inside their domain service. Concealed domains return 404 for hidden resources; original Group 1 forbidden/404 policy remains intact. Internal guest provisioning/admission helpers, operation receipts, DB debugging and provider adapters have no HTTP routes.

## Identity

| Method | Path | Actor/auth expectation | Purpose |
| --- | --- | --- | --- |
| GET | `/api/v1/health` | Public | Liveness; no credentials or database details |
| POST | `/api/v1/auth/signup` | Public, bounded signup body | Create User/organization and session |
| POST | `/api/v1/auth/login` | Public, verified credentials | Create session |
| POST | `/api/v1/auth/refresh` | Valid refresh credential | Rotate refresh/session tokens |
| POST | `/api/v1/auth/logout` | Refresh credential | Revoke matching refresh session |
| GET | `/api/v1/me` | Registered bearer | Read own profile |
| PATCH | `/api/v1/me` | Registered bearer | Edit own profile |
| GET | `/api/v1/me/preferences` | Registered bearer | Read own preferences |
| PATCH | `/api/v1/me/preferences` | Registered bearer | Edit own preferences |
| GET | `/api/v1/organizations` | Registered bearer | List own memberships |
| POST | `/api/v1/organizations` | Registered bearer | Create organization and own membership |
| GET | `/api/v1/organizations/:organizationId/members` | Registered bearer + organization membership | Bounded member search |

## Projects

| Method | Path | Actor/auth expectation | Purpose |
| --- | --- | --- | --- |
| GET | `/api/v1/projects` | Registered bearer | List accessible Projects |
| POST | `/api/v1/projects` | Registered bearer + organization membership; owner derived server-side | Create Project and configured Group 1 structure |
| GET | `/api/v1/projects/:projectId` | Registered bearer + Project read | Read Project |
| PATCH | `/api/v1/projects/:projectId` | Registered bearer + actual Project owner | Edit/archive/restore Project under existing lifecycle policy |
| GET | `/api/v1/project-templates` | Registered bearer | List static templates |
| GET | `/api/v1/projects/:projectId/editors` | Registered bearer + Project read | List Project editors |
| POST | `/api/v1/projects/:projectId/editors` | Registered bearer + actual Project owner | Add organization member as editor |
| DELETE | `/api/v1/projects/:projectId/editors/:userId` | Registered bearer + actual Project owner | Remove editor |
| GET | `/api/v1/projects/:projectId/layers` | Registered bearer + Project read | Read layers |
| POST | `/api/v1/projects/:projectId/layers` | Registered bearer + active Project owner/editor | Add layer |
| PATCH | `/api/v1/projects/:projectId/layers/:layerId` | Registered bearer + active Project owner/editor | Edit/reorder same-Project layer |
| DELETE | `/api/v1/projects/:projectId/layers/:layerId` | Registered bearer + active Project owner/editor | Remove layer |
| GET | `/api/v1/projects/:projectId/structure` | Registered bearer + Project read | Read structure |
| PUT | `/api/v1/projects/:projectId/structure` | Registered bearer + active Project owner/editor | Set template/structure and optional layers |

## Sources

| Method | Path | Actor/auth expectation | Purpose |
| --- | --- | --- | --- |
| POST | `/api/v1/uploads` | Registered bearer | Stage bounded file owned by caller |
| DELETE | `/api/v1/uploads/:uploadId` | Registered bearer + upload owner | Remove own staged upload |
| GET | `/api/v1/projects/:projectId/sources` | Registered bearer + Project read | List safe source metadata |
| POST | `/api/v1/projects/:projectId/sources` | Registered bearer + active Project owner/editor | Attach supported Source metadata/staged upload |
| DELETE | `/api/v1/projects/:projectId/sources/:sourceId` | Registered bearer + active Project owner/editor | Remove same-Project unused Source; retain provenance |
| GET | `/api/v1/projects/:projectId/sources/:sourceId/content` | Registered bearer + Project read | Explicit authorized file download; no generic raw-body projection |
| GET | `/api/v1/projects/:projectId/sources/:sourceId/references` | Registered bearer + Project read | Read exact reference identities |
| GET | `/api/v1/projects/:projectId/sources/:sourceId/runs` | Registered bearer + Project read | Read ingestion attempts |
| POST | `/api/v1/projects/:projectId/sources/:sourceId/references` | Registered bearer + active Project owner/editor | Record immutable typed provenance |
| POST | `/api/v1/projects/:projectId/sources/:sourceId/runs` | Registered bearer + active Project owner/editor | Create explicit ingestion attempt |
| POST | `/api/v1/projects/:projectId/sources/:sourceId/runs/:runId/commands` | Registered bearer + active Project owner/editor | Transition same-Source attempt under expected stamp |

## Architecture

| Method | Path | Actor/auth expectation | Purpose |
| --- | --- | --- | --- |
| GET | `/api/v1/projects/:projectId/architecture` | Owner for candidate; Project read for confirmed | Read family |
| GET | `/api/v1/projects/:projectId/architecture/graphs/:graphId` | Owner for candidate; Project read for confirmed | Read same-family graph |
| POST | `/api/v1/projects/:projectId/architecture` | Registered bearer + actual Project owner | Initialize supplied structured candidate |
| POST | `/api/v1/projects/:projectId/architecture/corrections` | Registered bearer + actual Project owner | Bounded deterministic corrections/undo/redo/checkpoint/Done |
| POST | `/api/v1/projects/:projectId/architecture/confirm` | Registered bearer + actual Project owner | Explicit atomic family confirmation |

## Knowledge

| Method | Path | Actor/auth expectation | Purpose |
| --- | --- | --- | --- |
| POST | `/api/v1/knowledge` | Registered bearer + own actor; context/project authorization where referenced | Create own private item/context |
| GET | `/api/v1/knowledge` | Registered bearer + own actor; context/project authorization where referenced | List own private items with bounds |
| GET | `/api/v1/knowledge/:id` | Registered bearer + own actor; context/project authorization where referenced | Read own private item |
| PUT | `/api/v1/knowledge/:id` | Registered bearer + own actor; context/project authorization where referenced | Edit own item under expected stamp |
| POST | `/api/v1/snapshots` | Registered bearer + own actor; context/project authorization where referenced | Capture own immutable confirmed semantic snapshot |
| GET | `/api/v1/snapshots` | Registered bearer + own actor; context/project authorization where referenced | List own snapshots |
| GET | `/api/v1/snapshots/:id` | Registered bearer + own actor; context/project authorization where referenced | Read own snapshot |
| GET | `/api/v1/my-space` | Registered bearer + own actor; context/project authorization where referenced | List own items/snapshots; actor-private count |

## Presentations

| Method | Path | Actor/auth expectation | Purpose |
| --- | --- | --- | --- |
| POST | `/api/v1/presentations` | Registered bearer + actual Project owner + confirmed Architecture | Create Presentation and protected Main definition |
| GET | `/api/v1/presentations` | Registered bearer; only owned/granted scope | Bounded Presentation list |
| GET | `/api/v1/presentations/:presentationId` | Presentation owner or active scoped viewer/collaborator grant (User/Guest) | Read safe builder projection |
| POST | `/api/v1/presentations/:presentationId/commands` | Presentation owner or active scoped viewer/collaborator grant (User/Guest); SELECT read; SETUP/reorder/revoke owner | Update Presentation setup/selection/access commands |
| POST | `/api/v1/presentations/:presentationId/screens` | Presentation owner or active scoped viewer/collaborator grant (User/Guest); owner/collaborator only | Create authored draft screen |
| POST | `/api/v1/presentations/:presentationId/screens/:screenId/commands` | Presentation owner or active scoped viewer/collaborator grant (User/Guest); edit owner/collaborator; CONFIRM owner; private inclusion registered owner of origin | Deterministic scenario/visual/overlay/context/screen commands |
| GET | `/api/v1/presentations/:presentationId/definitions/:definitionId` | Presentation owner or active scoped viewer/collaborator grant (User/Guest) | Read exact immutable same-Presentation definition |
| POST | `/api/v1/presentations/:presentationId/invitations` | Presentation owner (registered) | Create registered invitation |
| POST | `/api/v1/presentations/:presentationId/invitations/:invitationId/respond` | Registered invited recipient for ACCEPT/DECLINE; owner for CANCEL | Respond to exact invitation |

## Meetings

| Method | Path | Actor/auth expectation | Purpose |
| --- | --- | --- | --- |
| POST | `/api/v1/meetings` | Registered Presentation owner | Create Meeting setup; no Start freeze yet |
| GET | `/api/v1/meetings` | Registered bearer; owned/admitted Meetings only | Bounded Meeting list |
| GET | `/api/v1/meetings/:meetingId` | Meeting owner or admitted active participant (User/Guest), exact Meeting | Read safe shared/start/ended projection |
| POST | `/api/v1/meetings/:meetingId/commands` | Meeting owner or admitted active participant (User/Guest), exact Meeting; lifecycle owner, navigation presenter, transfer/Take Back authority checked | Apply server-authoritative lifecycle/control command |
| POST | `/api/v1/meetings/:meetingId/invitations` | Registered Meeting owner | Invite registered recipient |
| POST | `/api/v1/meetings/:meetingId/invitations/:invitationId/respond` | Registered exact recipient for ACCEPT/DECLINE; owner for CANCEL | Respond to exact Meeting invitation |
| POST | `/api/v1/meetings/:meetingId/join` | Meeting owner or admitted active participant (User/Guest), exact Meeting | Join exact admission without granting Project access |
| POST | `/api/v1/meetings/:meetingId/publications` | Meeting owner or admitted active participant (User/Guest), exact Meeting; caller owns private origin/publication | Explicit SHARE/UPDATE/WITHDRAW immutable representations |
| GET | `/api/v1/meetings/:meetingId/revisions/:revisionId` | Meeting owner or admitted active participant (User/Guest), exact Meeting; same Meeting and visible/frozen revision policy | Read authorized immutable revision |
| GET | `/api/v1/meetings/:meetingId/private/checkpoint` | Meeting owner or admitted active participant (User/Guest), exact Meeting; own participant | Read private exploration checkpoint |
| PUT | `/api/v1/meetings/:meetingId/private/checkpoint` | Meeting owner or admitted active participant (User/Guest), exact Meeting; own participant | Save private checkpoint |
| POST | `/api/v1/meetings/:meetingId/return-to-live` | Meeting owner or admitted active participant (User/Guest), exact Meeting; own participant | Reset own follow checkpoint to current shared state |
| POST | `/api/v1/meetings/:meetingId/private/items` | Meeting owner or admitted active participant (User/Guest), exact Meeting; own actor | Create Meeting-private Knowledge item |
| POST | `/api/v1/meetings/:meetingId/private/snapshots` | Meeting owner or admitted active participant (User/Guest), exact Meeting; own actor | Create own Meeting-scoped Snapshot |
| GET | `/api/v1/meetings/:meetingId/my-space` | Meeting owner or admitted active participant (User/Guest), exact Meeting; own actor | Read own Meeting-private items/counts |
| GET | `/api/v1/meetings/:meetingId/private/items/:itemId` | Meeting owner or admitted active participant (User/Guest), exact Meeting; own actor and same Meeting | Read own Meeting item |
| PUT | `/api/v1/meetings/:meetingId/private/items/:itemId` | Meeting owner or admitted active participant (User/Guest), exact Meeting; own actor and same Meeting | Update own Meeting item |
| GET | `/api/v1/meetings/:meetingId/ws` | Meeting owner or admitted active participant (User/Guest), exact Meeting + LIVE at upgrade; credentials/admission rechecked | WebSocket upgrade; bounded typed commands/SYNC; same REST authority |

## Outcomes

| Method | Path | Actor/auth expectation | Purpose |
| --- | --- | --- | --- |
| POST | `/api/v1/meetings/:meetingId/review` | Registered Meeting owner + ENDED exact capture | Create/reuse review of frozen source |
| GET | `/api/v1/meetings/:meetingId/review` | Registered owner for draft; saved Project read policy | Read review by Meeting |
| GET | `/api/v1/reviews/:reviewId` | Registered owner for draft; saved Project read policy | Read bounded review/accepted safe projection |
| POST | `/api/v1/reviews/:reviewId/commands` | Registered review/Meeting owner | Human classify/promote/edit/READY/reopen/atomic Save |
| GET | `/api/v1/projects/:projectId/decisions` | Registered bearer + Project read | List accepted Decisions |
| GET | `/api/v1/projects/:projectId/actions` | Registered bearer + Project read | List accepted Actions |
| GET | `/api/v1/projects/:projectId/assessments` | Registered bearer + Project read | List saved assessments |
| GET | `/api/v1/projects/:projectId/outcome-activity` | Registered bearer + Project read | Derived accepted outcome counts/activity |

## AI

| Method | Path | Actor/auth expectation | Purpose |
| --- | --- | --- | --- |
| POST | `/api/v1/ai/context/ask` | Registered actor + authorized bounded context | Answer scoped question with validated references |
| POST | `/api/v1/ai/discussion-points` | Registered actor + authorized bounded context | Propose discussion points |
| POST | `/api/v1/ai/scenario/understand` | Registered Presentation owner/collaborator + screen scope | Propose scenario understanding |
| POST | `/api/v1/ai/visual-command/translate` | Registered Presentation owner/collaborator + screen scope | Propose deterministic visual patch |
| POST | `/api/v1/ai/meetings/:meetingId/summary` | Registered Meeting owner + ENDED exact frozen capture | Propose frozen Meeting summary |
| POST | `/api/v1/ai/reviews/:reviewId/classify` | Registered review owner + frozen review context | Propose classifications, no persisted classification |

