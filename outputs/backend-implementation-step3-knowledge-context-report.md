# Backend Implementation Step 3 — Knowledge + Context

Date: 2026-10-26 (Asia/Calcutta). **Implementation complete; final verification recorded below.** Steps 1 and 2 remain CLOSED.

## Scope

Deterministic actor-private Knowledge, owned semantic context attachments, immutable Snapshot and logical My Space query. Existing modular-monolith conventions, PostgreSQL, strict TypeScript, Fastify, Drizzle and Zod retained. Architecture/Sources remain separate owners and are never mutated by Knowledge.

## Exact files added

Exactly 16 files, repository-relative:

- [backend/src/modules/knowledge/knowledge.access.ts](../backend/src/modules/knowledge/knowledge.access.ts)
- [backend/src/modules/knowledge/knowledge.context.ts](../backend/src/modules/knowledge/knowledge.context.ts)
- [backend/src/modules/knowledge/knowledge.input.ts](../backend/src/modules/knowledge/knowledge.input.ts)
- [backend/src/modules/knowledge/knowledge.ownership.ts](../backend/src/modules/knowledge/knowledge.ownership.ts)
- [backend/src/modules/knowledge/knowledge.repository.ts](../backend/src/modules/knowledge/knowledge.repository.ts)
- [backend/src/modules/knowledge/knowledge.routes.ts](../backend/src/modules/knowledge/knowledge.routes.ts)
- [backend/src/modules/knowledge/knowledge.schema.ts](../backend/src/modules/knowledge/knowledge.schema.ts)
- [backend/src/modules/knowledge/knowledge.service.ts](../backend/src/modules/knowledge/knowledge.service.ts)
- [backend/src/modules/knowledge/snapshot.service.ts](../backend/src/modules/knowledge/snapshot.service.ts)
- [backend/migrations/0003_sleepy_nitro.sql](../backend/migrations/0003_sleepy_nitro.sql)
- [backend/migrations/meta/0003_snapshot.json](../backend/migrations/meta/0003_snapshot.json)
- [backend/migrations/0004_glamorous_pet_avengers.sql](../backend/migrations/0004_glamorous_pet_avengers.sql)
- [backend/migrations/meta/0004_snapshot.json](../backend/migrations/meta/0004_snapshot.json)
- [backend/tests/knowledge-context.integration.test.ts](../backend/tests/knowledge-context.integration.test.ts)
- [backend/tests/knowledge-guest.integration.test.ts](../backend/tests/knowledge-guest.integration.test.ts)
- [outputs/backend-implementation-step3-knowledge-context-report.md](../outputs/backend-implementation-step3-knowledge-context-report.md)

## Exact files modified

Exactly 7 existing files, repository-relative:

- [backend/src/app/app.ts](../backend/src/app/app.ts)
- [backend/src/shared/database/schema.ts](../backend/src/shared/database/schema.ts)
- [backend/migrations/meta/_journal.json](../backend/migrations/meta/_journal.json)
- [backend/tests/fixture.ts](../backend/tests/fixture.ts)
- [backend/README.md](../backend/README.md)
- [hackathon.md](../hackathon.md)
- [outputs/backend-implementation-progress.md](../outputs/backend-implementation-progress.md)

app.ts composes services/routes; schema.ts exports Knowledge tables; fixture.ts includes them in the dedicated test reset; journal registers migrations; README, changelog and living progress document describe actual implementation. Earlier dirty/untracked foundation/source/architecture/design/image files predated this increment and were preserved. No package/env/config, old test assertions, Unity or prior domain implementation files were changed by Step 3. Build generated ignored dist output.

## Database / migrations

- **backend/migrations/0003_sleepy_nitro.sql**: three new tables and owned context/Snapshot guards.
- **backend/migrations/meta/0003_snapshot.json**: generated table snapshot.
- **backend/migrations/0004_glamorous_pet_avengers.sql**: nullable Snapshot project filing and updated confirmed-anchor insert guard; no additional table.
- **backend/migrations/meta/0004_snapshot.json**: generated follow-up snapshot.
- Existing **backend/migrations/meta/_journal.json** extended. Earlier 0000–0002 SQL preserved.

Migration 0003 was already exercised on the local test DB before final optional-project contract checking. The follow-up 0004 preserves that migration history while completing optional project filing; the original applied migration was not rewritten.

| Table | Purpose |
| --- | --- |
| knowledge_items | Stable author ActorRef, optional project, PRIVATE visibility, manual category/title/body, ACTIVE/ARCHIVED state, stamp and timestamps. |
| knowledge_contexts | Item-owned current/ended bindings; relational graph/family, semantic target, source/capture anchors and immutable owned descriptor. |
| snapshots | Private creator ActorRef, optional project filing, exact confirmed Architecture/Graph anchor, immutable semantic scope/payload and creation timestamp. |

Total **27 application tables**. No my_spaces, notebooks, shared_meeting_items, interaction_contexts, AI or future parent tables.

Owner columns reference User or existing ScopedGuestAccess, with exclusive actor constraints. SQL guards prevent changing item author/project/identity or skipping its next stamp. Hard deletion is unavailable; archive is the item lifecycle operation. Context bindings cannot be repointed or deleted; ending/replacing retains their captured identity. Snapshot body UPDATE/DELETE is rejected, and INSERT verifies exact confirmed family/graph/stamp plus supplied project filing if present.

Historical candidate node/connection/inner-link IDs are validated references rather than restrictive live target foreign keys: deleting/correcting a canonical candidate must not be blocked by a private note. Relational Architecture/Graph anchors, SourceReference and Snapshot references have foreign keys. Snapshot targets are stable because captured canonical architecture is confirmed/immutable. Trigger bodies are custom migration SQL, not represented by Drizzle's table snapshots; preserve them in future migrations.

## Knowledge capabilities

Manual categories: NOTE, QUESTION, DISCUSSION_POINT. Strict Zod rejects AI_FINDING, forged author/visibility, empty/oversized title/body, future categories and unexpected fields.

A registered user can create/read/update their own item, globally or within an accessible project. Stable author attribution derives only from authenticated Principal. Project association is independent of PRIVATE visibility. ACTIVE/ARCHIVED state is authored current state; archive retains content/history.

PUT is a full content/current-attachment replacement with expectedStamp. Clients must submit intended category/title/body/state/attachments. The current input contract defaults omitted state to ACTIVE and omitted attachments to empty. It is not a merge-patch endpoint; no silent body/context merge is performed.

Updates hold project/item owner locks, validate targets, conditionally UPDATE expected stamp, advance stamp, and replace bindings in one CommandTransactions boundary. Invalid context or stale writes roll back body and bindings. New item creation uses durable IdempotentOperations; repeated same intention yields the same ID, changed semantic input conflicts, new intention creates another item. Safe acknowledgements contain ID/stamp/replayed, not raw receipts/fingerprints.

## Context capabilities

Each attachment owns its exact typed descriptor. Multiple current attachments are supported, bounded to 16. Unchanged descriptors retain binding identity; changed bindings are ended and new ones created.

Implemented semantic kinds:

- WHOLE_ARCHITECTURE: exact root/family reference.
- NODE: node belongs to anchored graph.
- CONNECTION: directed semantic connection belongs to anchored graph.
- INNER_ARCHITECTURE: exact documented child, parent-node and inner-link identity.
- LASSO_GROUP: selected nodes, internal edges, boundary edges, outside endpoints and exact anchored graph.

All Architecture scopes include contract format 1, Architecture ID, Graph ID and expected/captured family stamp. Current candidate context is owner-accessible only; confirmed targets follow project-read policy. Cross-family/graph/project targets and stale new captures are rejected. No source objects or canonical graph bodies are copied.

Lasso validation requires selected nodes in the anchored graph, both internal-edge endpoints selected, exactly one boundary-edge endpoint selected, and exact external endpoint membership. Edge IDs preserve direction. Client-selected semantic sets are bounded/unique; no automatic neighbor traversal or graph expansion. No hand/ray/gaze/hover/camera/per-frame geometry/history accepted. Presentation/Meeting context types are not accepted until real parents exist.

A saved candidate binding reports STALE when the family changes. Its original descriptor/stamp stays unchanged, including when a referenced node is deleted. Reattaching/resubmitting stale context through an edit requires intentional refresh/removal. Knowledge never changes canonical Architecture to make an attachment valid.

## Snapshot / My Space

Snapshot is an explicit immutable semantic capture: scope + structured format/title/caption payload. No graph copy, AI interpretation, video, continuous recording or live UI state. Captures require confirmed architecture so historical meaning remains resolvable without creating graph versions. Another intention creates another Snapshot; same intention replays the original ID. No Snapshot edit/delete route.

Project association is **optional**. An unfiled capture still has exact Architecture/Graph scope, whose real project is resolved and currently authorized on create/read/list/replay and evidence use. Supplying projectId must match the anchor. Unfiled is an organization choice, never an access bypass.

No artifact/image URL accepted yet: existing staged uploads are Source-owned; a compatible actor-private Snapshot storage/access contract does not exist. This optional field is deliberately deferred.

My Space is a logical private query over KnowledgeItems + Snapshots, with no aggregate/table or duplicated notebook. Filters: project, graph, category; category applies to items only. limit 1–100 and offset 0–10000. Combined response returns a page of each collection and count of eligible returned rows, not a global/search count. Authorization can shorten a page. No full-text search, global browse, admin notebook or another actor's counts/titles/snippets.

## Privacy and evidence

Every resource query is constrained to current author/creator before projection. Owner/editor/presenter/participant roles never substitute for private ownership. The API cannot select another actor via userId/role/author input. Another actor receives the same concealed not-found response and cannot read/write metadata or attachments.

Project/Architecture/Source access is separately checked. Losing project access blocks scoped item/capture access and removes them from eligible own lists while durable author identity/content remain. Unfiled Snapshots remain subject to the same actual architecture access and replay checks.

SourceReference evidence uses exact immutable source identities and same accessible project; no document body is copied or returned through attachment. Snapshot evidence requires private creator ownership and matching actual architecture project, even for an unfiled capture. Knowing an ID never grants wider evidence access.

## Scoped Guest boundary

Reusable ownership storage/projection/predicates accept stable guest ActorRef backed by existing ScopedGuestAccess, not a new User or project membership. Existing foundation credential expiry/revocation behavior remains.

**Actual guest Knowledge/Snapshot service and route exposure is deferred.** No Presentation/Meeting parent/admission implementation exists to prove an eligible private content scope. Registered bearer routes reject guest tokens, and privateAccess rejects guest domain entry. Tests use only existing internal guest credential provisioning to verify attribution/expiry/revocation and denial; they create no fake Presentation/Meeting parent and no guest content flow.

## Routes

All routes reuse existing registered bearer authentication; handlers parse Zod and delegate to domain services.

| Method | Route | Capability |
| --- | --- | --- |
| POST | /api/v1/knowledge | Create private item, operationId |
| GET | /api/v1/knowledge | Own eligible item page |
| GET | /api/v1/knowledge/:id | Own item with current binding status |
| PUT | /api/v1/knowledge/:id | Conditional complete content/attachment edit, expectedStamp |
| POST | /api/v1/snapshots | Explicit immutable capture, operationId |
| GET | /api/v1/snapshots | Own eligible capture page |
| GET | /api/v1/snapshots/:id | Own immutable capture |
| GET | /api/v1/my-space | Logical combined eligible private pages/count |

No share, publication, AI, presentation inclusion, meeting or public/admin knowledge route.

## Shared foundation reuse

CommandTransactions; IdempotentOperations and safe durable receipts; keyed semantic fingerprint; canonical UUID validation; change-stamp conditional-write helpers; PrincipalResolver/ActorRef; ProjectAccess delegating Group 1 authorization; typed AppError; best-effort local post-commit events with IDs/stamps only. No competing auth/transaction framework, durable event sourcing, microservice or new dependency.

## Tests and verification

New tests: **53** across two source files.

- knowledge-context.integration.test.ts: **45** — actor-private creation/read/update/global note; owner/editor/outsider isolation and private lists/counts; same/new/changed create intent; seven invalid/forged content inputs; five valid context kinds without canonical mutation; eleven invalid/cross-scope/stale/transient/future-kind cases; five invalid lasso roles/sets; valid internal selection; immutable Snapshot/replay/new intention; creator-only capture reads; candidate capture rejection/stale binding after node deletion; exact evidence and private capture ownership; immutable binding replacement; concurrent stale edits and rollback; access-loss suppression; filtered logical My Space; optional project filing; mismatched filing; revoked access blocks unfiled read/replay.
- knowledge-guest.integration.test.ts: **8** — stable guest attribution/expiry/revocation/no User or membership, closed guest routes, six transient-data schema rejection cases.

The tests use actual isolated PostgreSQL, real existing authenticated project policies and API calls. No mocked architecture authority or fake parent-domain implementation.

| Check | Result |
| --- | --- |
| Baseline before Step 3 | 154 passed |
| Final complete suite | **207 passed, 0 failed, 0 skipped; 15 files** |
| Original Group 1 regression | **53/53 passed** |
| All prior foundation/Sources/Architecture tests | **154/154 retained** |
| Strict typecheck | **PASS** |
| Build | **PASS** |
| Step 3 migrations | Applied only to dedicated local PostgreSQL test DB |

The local test PostgreSQL instance is stopped after each run. No production migration/deployment, provider, Editor/native UI, simulator or device verification is claimed. Existing unrelated dirty files are not included in this increment's manifest.

## Documentation and current limits

Existing hackathon.md extended with Step 3; no capitalization duplicate. Living outputs/backend-implementation-progress.md updated with real tree, domain/privacy/capture semantics, schema, current tests and outstanding domains. Historical Step 1/2 reports remain unchanged.

Limits: guest content entry and parent context types deferred; confirmed-only semantic Snapshot; no private image artifact support; no full-text search; bounded eligible-page counts; no item hard-delete; no Snapshot edit; stale candidate bindings require deliberate refresh/removal before resubmission.

## Next step / stop

Next recommended backend module: **Presentation preparation/builder**, only after a new user-directed increment.

Presentation, Meeting, SharedMeetingItem, My Space publication/sharing, Outcomes, AI/providers/grounding runtime, WebSocket and Unity integration were **not implemented**. Stop after Step 3. Remaining blocker for this bounded increment: none. All final checks passed.
