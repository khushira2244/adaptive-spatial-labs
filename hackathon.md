# Adaptive Spatial Labs — Implementation Changelog

This file records verified implementation, not planned product behavior. No existing hackathon.md or HACKATHON.md was found in this repository or its inspected workspace parents, so this canonical lowercase file was created. Detailed product design remains under outputs/.

## 2026-10-24 — Step 1: Backend write foundation

Implemented the shared command transaction boundary, PostgreSQL-backed idempotent operation/result receipts, keyed semantic request fingerprinting, optimistic concurrency/change stamps, ActorRef/Principal, registered User versus Scoped Guest distinction, scoped guest access persistence, delegated Group 1 project authorization, typed domain errors and lightweight post-commit internal events.

Migration: backend/migrations/0001_v1_write_foundation.sql; tables: operation_results and scoped_guest_access. Initial verified result: **96 tests passed**, including all 53 original Group 1 tests. Strict typecheck and build passed. This was foundation only.

## 2026-10-25 — Step 1 audit and fixes: CLOSED

Read-only audit verdict: **GO WITH SMALL FIXES FIRST**. Findings: F01 UUID casing/normalization; F02 credential expiry/revalidation across blocking replay. UUID identities now normalize consistently, and replay disclosure freshly rechecks credential validity after waits. Eleven regression tests added. Final Step 1 baseline: **107 passed, 0 failed**; all 53 original Group 1 tests retained; typecheck/build passed.

**Step 1 CLOSED.** Evidence: outputs/backend-implementation-step1-audit.md and outputs/backend-implementation-step1-fixes-report.md.

## 2026-10-25 — Step 2: Sources + Architecture — COMPLETE

Extended existing project-sources rather than creating another Source or upload system. Added immutable exact SourceReference identities, typed locators, explicit stamped ingestion attempts, retained terminal results, separate retry attempts, and input/output provenance. Existing staged upload/file APIs remain in use. A Source with retained provenance/attempts now rejects hard removal with a domain conflict.

Implemented Architecture, ArchitectureGraph, semantic nodes/connections, source-backed inner graph trees and bounded correction state. Deterministic import accepts structured proposals; validation enforces graph ownership, project provenance, same-graph endpoints, tree reachability, single parent/child and no cycles. ArchitectureGraph is not a user-visible version history.

Corrections support rename/type/X-Y move/add-delete nodes and connections, documented inner-link reparenting, eight Undo and eight Redo snapshots, checkpoint, and Done-to-review. Deleting a node removes incident edges, but a documented inner parent must be reparented first. Z stays zero; presentation visual state is excluded.

Owner-only review/correction/confirmation reuses stored Group 1 policy. Editors retain Source rights, with no Architecture write authority. Confirmed reads use project read scope. Step 1 command transactions, durable idempotency, stamps, principals and post-commit local events are reused. Owner confirmation validates and freezes the exact root and all descendants atomically, closes recovery and stores the receipt. Database guards reject partial freeze and confirmed edits.

Migration: backend/migrations/0002_eager_havok.sql, with generated snapshot and journal update. Eleven new tables/associations; no duplicate Source, StagedUpload or credentials table. Full list and exact file manifest: outputs/backend-implementation-step2-sources-architecture-report.md.

Verification: **47 tests added; 154 passed, 0 failed, 0 skipped in 13 files**. All 107 prior tests and all 53 original Group 1 tests pass. Strict typecheck/build pass. PostgreSQL integration includes concurrent stale writers, immutable histories and injected child-freeze rollback.

Limits: no Miro/docs/OpenAPI parsing, OAuth/provider clients, background polling or automatic ingestion runner. Reference revisions/locators are supplied by authorized callers; external content is not independently verified by a provider in this increment. One architecture family per project; max 32 graphs, 256 total nodes, 512 total edges; input fingerprints impose a 256 KiB semantic request limit. No Knowledge, Presentation, Meeting, Outcomes, AI, WebSocket or Unity work.

Next recommended backend module: Knowledge / Context. **Not started.**

## 2026-10-26 — Step 3: Knowledge + Context — COMPLETE

Implemented actor-private KnowledgeItem (NOTE, QUESTION, DISCUSSION_POINT), typed owned KnowledgeContext bindings, immutable semantic Snapshot and logical My Space queries. Project association and project-owner/editor status never grant another author's private content access. Knowledge references Architecture/Sources without mutating either.

Migration backend/migrations/0003_sleepy_nitro.sql adds knowledge_items, knowledge_contexts and snapshots (27 application tables total). Ownership supports registered User or stable Scoped Guest identity; actual guest content entry is deferred until real Presentation/Meeting parent/admission scope can be proven. No MySpace table, shared meeting item, duplicated notebook or universal interaction-context table.

Contexts validate exact Architecture/Graph/stamp, node/edge/inner link and bounded lasso semantic sets. Captured bindings can be ended/replaced. Historical candidate node references do not block correction; stale context is explicit. Snapshots require confirmed architecture and store semantic references plus format/title/caption, never copied canonical objects or continuous recordings. Private image/artifact capture awaits compatible storage authorization.

Create item/capture reuses durable idempotency; edits use conditional stamps and atomic context replacement. Evidence is separately authorized; private Snapshot references are creator-only. Lists/counts expose eligible actor-private returned rows. No sharing/publication implemented.

Verification: **53 tests added; 207 passed, 0 failed, 0 skipped in 15 files**. All 154 earlier tests and 53 original Group 1 tests pass. Strict typecheck/build pass. PostgreSQL tests cover privacy, access loss, semantic lasso validation, immutable captures, stale concurrent edits, guest attribution/expiry/revocation and closed guest routes.

Limits: global private notes and optionally unfiled Snapshots supported; captures always require accessible confirmed architecture. Migration 0004_glamorous_pet_avengers.sql makes project filing optional without relaxing anchor authorization. Stale candidate bindings must be refreshed/removed before resubmitting them in an edit. Queries provide bounded pages and eligible-page counts, not global search totals. No private artifact upload or future context placeholder.

Evidence: outputs/backend-implementation-progress.md and outputs/backend-implementation-step3-knowledge-context-report.md. Steps 1 and 2 remain CLOSED; historical entries above describe their completion states. **Step 3 COMPLETE.** Next recommended module: Presentation preparation/builder; not started. Presentation, Meeting, SharedMeetingItem, My Space publication, Outcomes, AI, WebSocket and Unity were not implemented.


## 2026-10-26 — Step 4: Presentation Preparation + Builder — COMPLETE

Implemented Presentation bound permanently to one Project/confirmed Architecture, exactly one protected Main Architecture base, six authored screen types, whole/lasso semantic scope, bounded manual scenario understanding with explicit acceptance, local node/connection visual overrides, screen-only scenario overlays, safe Knowledge/Snapshot/evidence inclusion and owner confirmation.

Creation bootstraps the already confirmed Main Architecture base. Authored drafts are non-meeting-eligible until owner confirmation creates an immutable definition. Later edits retain that historical definition but invalidate current eligibility; reconfirmation creates another explicit definition ID. No canonical graph copies or per-edit history. Confirmation validates captured representations and all scope/target/visual constraints atomically with its idempotent receipt.

Presentation grants: VIEWER/COLLABORATOR for registered or scoped guest actors; owner remains distinct. Registered email-matched invitation intents support accept/decline/cancel/expiry. No fake User, Project/organization membership, Project editor or Meeting authority is created. Trusted server guest admission is real-Presentation-scoped with current grant + credential checks, including revalidation after waits. No public guest mint/email redemption or email provider/delivery is implemented.

Explicit Knowledge inclusion captures the chosen author-owned representation, not future private edits or attachment history. Viewers cannot dereference private originals through included IDs. Snapshot and SourceReference inclusion reuses existing authorization and exact references. The only earlier-domain integration is extracting the pure semantic-scope validator; Knowledge authorization/behavior is unchanged.

Migration: backend/migrations/0005_unknown_storm.sql plus generated snapshot/journal. Seven tables: presentations, presentation_access_grants, presentation_invitations, presentation_screens, presentation_screen_definitions, scenario_overlay_connections, presentation_screen_knowledge_references. Total 34 application tables.

Verification: **39 tests added; 246 passed, 0 failed, 0 skipped in 16 files**. All 207 prior tests and all 53 original Group 1 tests pass. Strict typecheck and build pass. Tests cover local-state isolation, immutable definitions, stale writes, explicit Knowledge publication, role/scope privacy, guest expiry during lock waits, invitation terminal states and failed/corrupt confirmation rollback.

Limits: manual deterministic authoring only; no AI/voice interpretation; guest email delivery/redemption deferred; Step 3 guest private content remains closed; authored screens soft-delete; only explicit confirmation definitions are retained; one bounded saved builder selection rather than live/shared navigation. Main base is protected. Visual numeric/enumerated bounds are product contracts, not verified device behavior.

Evidence: outputs/backend-implementation-progress.md and outputs/backend-implementation-step4-presentations-report.md. **Step 4 COMPLETE; stop.** Next recommended module: Meetings, only by a later user-directed increment. No Meetings, SharedMeetingItem, Outcomes, AI, WebSocket or Unity implementation.


## 2026-10-26 — Step 5: Live Meetings + My Space Publication + Realtime — COMPLETE

Implemented DRAFT/SCHEDULED -> LIVE -> ENDED Meeting lifecycle, stable actor participants, durable registered invitations/trusted Meeting-scoped guest admission, immutable actual-Start Presentation snapshot and owner-only atomic End capture. Draft screens are excluded; Start From must be current confirmed. Later Builder edits do not change Meeting preparation. No canonical graph copy.

Presenter authority is server-controlled: owner initially, one pending transfer, target accept/decline, owner Take Back, epoch/generation-guarded disconnect fallback and single-instance startup recovery. Temporary presenters receive navigation/focus authority only. Private semantic checkpoints and Return to Live stay actor-only; no raw tracking.

Meeting-scoped Knowledge access is injected by server composition, allowing admitted registered users/guests private notes/Snapshots without Project membership. Existing actor-private ownership remains. SHARE/UPDATE/WITHDRAW create intentional SharedMeetingItem revisions, not private-origin read-through or My Space mirroring. End pins exact eligible current revision IDs and intentional shared state, excluding all unshared private material.

Official Fastify WebSocket transport: @fastify/websocket 11.3.4, ws 8.22.0, @types/ws 8.18.2. Authenticated admitted connection, every-command authority/stamp validation, post-commit per-recipient reauthorized state events, heartbeat/backpressure/rate bounds, reconnect resync and End closure. No hands/gaze/poses/voice streams or private checkpoint broadcasts.

Migrations 0006_numerous_white_queen.sql, 0007_meeting_consistency.sql and 0008_meeting_publication_guard.sql add 10 tables/guards (44 application tables total); two follow-ups correct SQL guard ambiguities exposed by integration tests without rewriting applied history. KnowledgeItem/Snapshot receive optional Meeting scope. No MySpace, Review, Decision, ActionItem or AI table.

Verification: **43 tests added; 289 passed, 0 failed, 0 skipped in 19 files**. All 246 baseline tests retained; one Step 3 future-table absence assertion was updated because shared_meeting_items is now explicitly requested. All 53 original Group 1 tests pass unchanged. Strict typecheck/build pass. Tests include real WebSocket upgrades/messages, guest/private scope isolation, concurrent publication vs End, duplicate freezes, injected rollback, reconnect and restart/disconnect authority generation.

Limits: single backend process for realtime/presence; no distributed broker/durable event replay; full authorized state resync with sequence, not delta history. Email delivery/guest email redemption deferred, trusted guest provisioning only. Structured collaboration only, no voice/media service or continuous recording. No Group 6 review/decision/action acceptance or AI/provider/Unity work.

Evidence: outputs/backend-implementation-progress.md and outputs/backend-implementation-step5-meetings-report.md. **Step 5 COMPLETE; stop.** Next recommended backend module: Group 6 MeetingReview / Outcomes, only after a new instruction.


## 2026-10-26 — Step 6: Meeting Review + Outcomes — COMPLETE

Implemented owner-only deterministic review over exact FrozenMeetingCapture -> human-reviewed assessments and Decision/Action drafts -> explicit READY_TO_SAVE -> confirmed Save to Project. One stable Review per ended Meeting, autosaved bounded edits, parent bundle stamps, deliberate retention/reorder/evidence and N:M typed outcome links. No automatic classification, decision inference or task creation.

Classifications: RAISED -> DISCUSSED -> ADDRESSED / UNRESOLVED / DEFERRED / DECISION / ACTION; NOT_DISCUSSED also requires explicit assessment. Retained unresolved/deferred/addressed/unknown states freeze as ReviewItem project knowledge. Draft Decisions and Actions retain their IDs at acceptance. Actions support one responsible captured User/ScopedGuest ActorRef, optional due date and same-review primary Decision; no task-management/status/notification workflow.

Save locks/rechecks owner, exact capture and expected draft stamp, validates all candidates/context/links/responsibility, atomically accepts definitions + immutable manifest/summary/assessments + SAVED + durable Step1 receipt. Same intent returns original manifest/IDs; concurrent/new intent conflicts safely. Mid-acceptance or commit failure rolls back acceptance/receipt and keeps ready draft. Best-effort post-commit event failure cannot undo Save. Home reads only derived accepted counts/latest activity; no second truth store.

Privacy: exact End-pinned publication representations and actual-Start prepared definitions only; no current Builder/publication pointers, private originals/checkpoints, raw source bodies, voice/transcript, credentials or origin read permission. Draft/ignored review text owner-only; accepted project reads use current ProjectAccess. Participation, temporary presentation and task assignment grant no owner/project/private rights. Architecture is untouched.

Migrations 0009_meeting_outcomes.sql and 0010_outcome_acceptance_guard.sql plus metadata add five tables: meeting_reviews, meeting_review_items, decisions, action_items, review_outcome_links. Accepted MeetingOutcome manifest is owned JSONB on Review. Total49 application tables. Follow-up migration fixes JSONB precedence found at real COMMIT, preserving applied local history. No production migration.

Verification: **52 added tests; full suite 341 passed, 0 failed, 0 skipped, 21 files. All289 baseline cases and all53 original Group1 tests pass unchanged. Strict typecheck/build PASS.** Tests cover safe frozen sources, classification, guest attribution, concurrent creation/Save/edit, database immutability, injected Decision/Action/COMMIT rollback and derived activity. Dedicated local PostgreSQL stopped cleanly.

Known limits: bounded source envelopes (not streaming), no post-save Action status/reassignment, no new guest Review login/provider/transcript/AI/Unity; best-effort local events, no durable outbox. Step5 single-process realtime limit remains. See outputs/backend-implementation-step6-outcomes-report.md for exact files/contracts/bounds.

**Step6 COMPLETE; stopped. AI remains NOT IMPLEMENTED.** Next requires a separate instruction, e.g. audit contracts and plan the future AI boundary. No Group7 implementation.

## 2026-10-28 — Step 7: AI Capability Layer + Gemini Provider — COMPLETE

Dedicated provider-neutral AI module; official @google/genai2.31.0 pinned, lazy VertexGeminiProvider with vertexai:true + project/location and SDK ADC. No application ADC JSON reader or credential copying. Non-secret local settings added only where missing to ignored backend/.env; .env.example documents optional configuration. No existing business domain imports the provider SDK.

Six proposal-only capabilities: AskContextAI, SuggestDiscussionPoints, UnderstandScenario, TranslateVisualCommand, SummarizeMeeting, ClassifyMeetingOutcomes. Each authenticates/authorizes, resolves exact safe context, calls one bounded provider request, validates strict schema/exact semantic refs, rechecks current context/credentials, and returns human-confirmation-required proposal. Visual operations simulate Step4 contracts through existing validateDefinition; no Apply/ACCEPT_UNDERSTANDING/CONFIRM/save occurs. Step6 classification and candidate acceptance remain human-owned.

Context packaging preserves lasso PRIMARY/internal relationships versus BOUNDARY/external endpoint identity; EXPANDED only explicitly requested. Only deliberately selected own Knowledge and authorized SourceReference metadata are used, never raw Source documents/private origins/credentials/checkpoints. Frozen summaries use exact End-pinned source; review suggestions use frozen context plus current retained owner assessments. Later private edits cannot change frozen sources. Permission revocation or stale context after model wait blocks disclosure.

Six versioned prompts + strict Zod/JSON schemas/approved visual enums. Bounded input/context/output/tokens/deadline/concurrency/rate; AbortSignal/disconnect and typed provider/unavailable/invalid/timeout errors leave all manual domains usable. Automatic continuations/retries/escalation/tools/fallback disabled. Safe metadata-only telemetry; no prompt/response history. No migration/table;49 application tables remain. OpenAI fallback deferred because no safe key visible.

Primary gemini-3.5-flash verified by ADC-authenticated Node listing and actual adapter tiny structured smoke: PASS,56 input tokens,5 output tokens. Optional reasoning gemini-3.1-pro-preview listed, not generation-smoked. Initial tiny budgets were insufficient with default thinking; primary thinkingBudget0 was verified. Normal automated suite never calls paid APIs; smoke is explicit opt-in only.

**53 tests added: 26 provider/schema unit tests and 27 capability integration tests. Full suite: 394 passed, 0 failed, 0 skipped in 23 files. All 341 baseline tests and 53/53 original Group 1 tests pass unchanged. Strict TypeScript typecheck PASS; build PASS.** Normal suite uses only fake/null AI providers. Actual installed Gemini adapter smoke separately PASS. Isolated local PostgreSQL stopped cleanly.

Known limits: referenced IDs do not certify every generated factual claim; human review remains required. No raw-source parsing/RAG, guest AI access, proposal persistence, native preview UI, OpenAI fallback or distributed AI quota/outbox. Existing Step5 single-process realtime constraints remain.

Report: outputs/backend-implementation-step7-ai-report.md. Progress: outputs/backend-implementation-progress.md. **Step7 COMPLETE; stopped.** No Step8 integration/hardening, Unity, AssemblyAI, production deployment or new product features. Next requires a separately authorized increment.

## Backend V1 — COMPLETE

2026-10-28: **BACKEND V1 IMPLEMENTATION COMPLETE**. Steps 1–8 complete: shared deterministic foundation; Sources/Architecture; Knowledge/Context; Presentations; Meetings/realtime/My Space publication; MeetingReview/Outcomes; AI capability/Gemini adapter; final integration/hardening.

Final modules: auth, users, organizations, preferences, projects, project-editors, project-layers, project-structure, project-sources/provenance, architecture, knowledge, presentations, meetings, outcomes, ai; shared verified principals/authorization, config, database/transactions, concurrency, safe events, operation receipts, storage, validation/errors. Modular monolith retained.

Canonical Architecture, actor-private Knowledge, Presentation-local definitions, Meeting live/frozen state and accepted Outcomes remain separate. AI returns bounded validated proposals only; existing human deterministic commands own acceptance/apply/confirm/save. Guests stay exact scoped; participants gain no Project membership; private origins/checkpoints are excluded from shared views. Explicit Share/Update and exact Start/End pins prevent later private edits from rewriting meeting history.

Final integration/security work fixes Source cross-parent existence leak, copied production secret placeholders, closed-socket queued commands and late-hook compiled startup; batches obvious repeated reads and applies narrow Fastify/fast-uri runtime security patches. No new migration or product feature.

Verification: **417 passed / 0 failed / 0 skipped, 27 files**, on both fresh-empty full migration chain (589.47 s) and normal dedicated fixture/reset database (351.62 s). All 394 baseline tests and all **53/53 original Group 1 tests unchanged** pass. All **11 migrations**, **49 application tables**, **91 business routes + 38 HEAD = 129 runtime registrations** verified. Strict TypeScript/build, actual HTTP start/close, compiled HTTP smoke and tiny Gemini ADC check pass. Runtime audit: zero vulnerabilities; four moderate dev-only Drizzle/esbuild advisories documented.

Limits: single-process realtime/local best-effort effects; no broker/HA; email delivery/guest email redemption deferred; Source parsing/provider ingestion limited; no recording/transcript; no AI auto-commit/OpenAI fallback; no production deployment or operational certification. Unity/Quest integration is next only when separately authorized; AssemblyAI remains separate. None started here.

Report: outputs/backend-implementation-step8-hardening-report.md. Routes: outputs/backend-v1-route-inventory.md. Final module tree/status: outputs/backend-implementation-progress.md. **Stopped after Step 8.**