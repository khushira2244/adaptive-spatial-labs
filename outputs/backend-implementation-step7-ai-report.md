# Backend Implementation Step 7 — AI Capability Layer + Gemini Provider

Date: 2026-10-28 (Asia/Calcutta). **COMPLETE — verified; stopped after Step 7.** Steps 1–6 remain CLOSED.

## Scope and ownership

Dedicated AI application module in the existing Node22/strict TypeScript/Fastify/PostgreSQL16/Drizzle/Zod modular monolith. Domain resolves authorized context -> AI proposes -> strict schema -> semantic/domain validation -> preview -> explicit human action through existing owning-domain commands. No Architecture, Knowledge, Presentation, Meeting or Outcomes module imports the Gemini SDK. No owning-domain service was rewritten.

All six capabilities return PROPOSAL + humanConfirmationRequired:true with exact semantic basis/stamps and safe provider metadata. No AI response writes canonical state, Knowledge, screen draft/acceptance, MeetingReview, Decision, Action or publication. No new apply/accept endpoints. Clients must deliberately use the existing deterministic domain contracts, permissions, operation IDs, stamps and confirmation commands; an AI response is never authority.

## Exact added files

- `backend/src/modules/ai/ai.config.ts`
- `backend/src/modules/ai/ai.error.ts`
- `backend/src/modules/ai/providers/ai-provider.ts`
- `backend/src/modules/ai/providers/vertex-gemini.provider.ts`
- `backend/src/modules/ai/schemas/ai.input.ts`
- `backend/src/modules/ai/schemas/ai.output.ts`
- `backend/src/modules/ai/capabilities/context-package.ts`
- `backend/src/modules/ai/capabilities/architecture-context.ts`
- `backend/src/modules/ai/capabilities/presentation-context.ts`
- `backend/src/modules/ai/capabilities/meeting-context.ts`
- `backend/src/modules/ai/capabilities/context-resolver.ts`
- `backend/src/modules/ai/orchestration/ai.executor.ts`
- `backend/src/modules/ai/capabilities/ai.semantic.ts`
- `backend/src/modules/ai/capabilities/visual-preview.ts`
- `backend/src/modules/ai/ai.service.ts`
- `backend/src/modules/ai/ai.routes.ts`
- `backend/src/modules/ai/prompts/ask.v1.ts`
- `backend/src/modules/ai/prompts/discussion.v1.ts`
- `backend/src/modules/ai/prompts/scenario.v1.ts`
- `backend/src/modules/ai/prompts/visual.v1.ts`
- `backend/src/modules/ai/prompts/summary.v1.ts`
- `backend/src/modules/ai/prompts/classify.v1.ts`
- `backend/src/modules/ai/prompts/index.ts`
- `backend/scripts/ai-smoke.ts`
- `backend/tests/ai.fixture.ts`
- `backend/tests/ai-provider.unit.test.ts`
- `backend/tests/ai-capabilities.integration.test.ts`
- `outputs/backend-implementation-step7-ai-report.md`

## Exact modified files

- `backend/package.json`
- `backend/package-lock.json`
- `backend/src/shared/errors/app-error.ts`
- `backend/src/app/app.ts`
- `backend/tests/fixture.ts`
- `backend/.env.example`
- `backend/README.md`
- `hackathon.md`
- `outputs/backend-implementation-progress.md`

Local-only setup: appended missing non-secret Google project/location/model settings supplied/verified for this task to ignored backend/.env. No ADC JSON was read, copied or parsed by application code; no ADC credential file or credential value was modified or logged. This ignored configuration is excluded from the tracked-file manifest. Existing unrelated dirty/untracked work is preserved. No commit/push or production deployment.

## Provider abstraction and official integration

AIProvider exposes generateStructured and generateText with a bounded ProviderRequest, AbortSignal and optional reasoning selection. ProviderResponse contains raw text for validation plus whitelisted provider/model/requestId/token counts/latency. No principals, keys, headers, ADC JSON or raw SDK error body are returned.

Official @google/genai **2.31.0**, exactly pinned in package.json/lock. Node **22.14.0**. VertexGeminiProvider initializes GoogleGenAI lazily with vertexai:true, project and location from validated optional AI config; standard SDK Application Default Credentials resolves authentication. Application code never opens ADC files, sets credential paths or embeds keys. Current SDK also documents enterprise as the preferred alias, but still supports the explicitly requested vertexai option; installed types were checked.

Use JSON MIME + responseJsonSchema, temperature0, maxOutputTokens8192, HTTP timeout and AbortSignal. Automatic continuation is disabled; no tools, function calling, web retrieval, autonomous agents or recursive loops. Primary disables thinking with thinkingBudget0, verified on live primary; explicit reasoning leaves model-default reasoning within the same output/deadline limits.

SDK errors become fixed safe AI error codes; auth/permission unavailable and timeouts are distinguished where SDK supplies a status/name. Raw provider messages are never forwarded. Metadata is reconstructed from known fields and schema validated.

## Configuration and verified models

| Setting | Behavior |
| --- | --- |
| AI_ENABLED | Optional, default true; example explicitly false. Missing project or invalid AI config yields typed unavailability without failing application startup. |
| GOOGLE_CLOUD_PROJECT | Deployment/local project; no hardcoded application project. |
| GOOGLE_CLOUD_LOCATION | Default global. |
| GOOGLE_GENAI_USE_ENTERPRISE | Documented Google environment flag in example/local setup. Explicit vertexai:true selects backend; this flag is not an authentication secret. |
| GEMINI_MODEL_PRIMARY | Default gemini-3.5-flash, returned by authenticated model listing and verified by actual tiny generation. |
| GEMINI_MODEL_REASONING | Default gemini-3.1-pro-preview, returned by authenticated model listing; reasoning selection is explicit per request. Not generation-smoked in this increment. |
| AI_TIMEOUT_MS | Default20000, range100–60000. |
| OpenAI fallback | Deferred: no safe local OpenAI key visible; no OpenAI dependency or adapter added. |

Current model IDs were checked through the official SDK against the configured Vertex environment, not guessed from model memory. Older 2.5 models were not chosen as defaults. No automatic escalation, model selection or fallback because an output disagrees with validation.

## Six capabilities / routes

All are authenticated registered-user product routes, with current domain authorization before provider work and again before response disclosure. A guest can own safe captured attribution in input but guest bearer access to AI routes is not introduced.

| Capability | POST route | Input and proposal |
| --- | --- | --- |
| AskContextAI | /api/v1/ai/context/ask | Explicit Architecture/Presentation/Meeting target + question -> bounded answer, exact supporting references, assumptions, uncertainties, follow-ups. |
| SuggestDiscussionPoints | /api/v1/ai/discussion-points | Explicit authorized context -> up to8 questions/importance/category/refs/uncertainty. No KnowledgeItem save. |
| UnderstandScenario | /api/v1/ai/scenario/understand | Editable authored screen + type/goal/notes -> interpreted scenario, affected PRIMARY components, expected behavior/interpretation, assumptions and ambiguity. Does not ACCEPT_UNDERSTANDING or CONFIRM. |
| TranslateVisualCommand | /api/v1/ai/visual-command/translate | Editable authored screen + instruction -> approved Step4 operations plus simulated validated preview. No mutation. Main remains protected. |
| SummarizeMeeting | /api/v1/ai/meetings/:meetingId/summary | Owner-only exact ended capture -> concise structured summary/themes/open topics/potential Decisions/Actions/source keys. No transcript or verbal inference. |
| ClassifyMeetingOutcomes | /api/v1/ai/reviews/:reviewId/classify | Owner-only unsaved review plus frozen safe source -> classification/rationale/optional unaccepted candidate suggestions. Never writes classifications or outcomes. |

No generic /ai/chat route, source-fetch tool, AI acceptance route, transcript/voice or Unity-specific API. The reasoning boolean defaults false; no background or automatic requests.

## Context packaging and privacy

Four deterministic builders:
- ArchitectureAIContext: existing confirmed architectureContext/ProjectAccess/stamp validation; exact selected graph, safe labels/type/description/technology/relationships. Explicit own Knowledge IDs only through existing private ownership policy; foreign/private IDs reject before a provider call. Same-project SourceReference metadata only through existing policy, with revision and strict locator fields. Raw Source bodies are not loaded because no authorized parsed-body capability exists yet.
- PresentationAIContext: existing PresentationQuery and EDIT policy for authoring; protected Main rejects authoring. Selected screen's draft/scope/overrides/overlays and explicit safe inclusions only. No grants, invitations or private provenance sent.
- MeetingAIContext: admitted current safe Meeting projection for Ask; ended Ask resolves exact frozen input. Summary uses ownerMeeting + exact frozenSource, never current publication pointers/private origins. Prepared definitions/inclusions and End-pinned publication representations stay exact.
- OutcomeReviewContext: exact frozen source plus current retained owner-reviewed title/summary/classification/evidence. Saved reviews reject new classification work. No ignored/private-origin content or draft outcome database rows are dumped into prompts.

Safe representation allowlist strips author/private identity/provenance fields not needed by AI. Model packages exclude raw Principal, credentials, hashes, fingerprints, operation receipts, unrelated rows, participants' private checkpoints and unshared My Space. Shared Snapshot representations contain only intentionally shared scope/payload, never private origin IDs. SourceReference keys grant no document or private-origin access.

The provider receives only context.payload plus bounded intent. Internal reference sets/basis/fingerprint are not dumped into prompts. Inputs and imported text are explicitly untrusted DATA, never instructions; no model tools exist. Context/source fields remain user content and may contain adversarial instructions, so schema/semantic validation and separate human domain acceptance are the enforcement boundary.

After the provider await, context is re-resolved through the domain and the current credential checked. If access is revoked, no proposal is disclosed; if packaged context/basis changed, STALE_CHANGE_STAMP rejects the preview. The equality fingerprint is ephemeral in memory and never persisted, exposed or logged.

### Lasso semantics

PRIMARY = selected nodes and their internal connections, deterministically derived from the validated anchored graph.
BOUNDARY = crossing relationships and external endpoint identity/name/type only, excluding external descriptions and unrelated neighborhoods.
EXPANDED = one-hop boundary endpoint detail only when expandBoundary:true was explicitly supplied for Architecture context.
Whole/root context never silently includes inner graph content; INNER_ARCHITECTURE must be explicitly selected. Visual operations may target only PRIMARY nodes/internal connections, never BOUNDARY/EXPANDED targets.

## Structured output / semantic validation

Each capability has strict Zod inputs/output, max counts/text sizes and enums; JSON schema is generated for the provider then local Zod remains authoritative. No silent coercion, best-effort JSON repair or automatic acceptance. Raw output -> JSON parse -> strict schema/metadata validation -> exact allowed reference membership -> capability/domain semantic validation -> proposal.

- Reference keys must occur in that exact resolved package. Private own Knowledge uses opaque package-local knowledge:<index> keys; model never receives original Knowledge ID.
- Scenario affected node IDs must be PRIMARY.
- Visual proposal uses exact existing NODE_VISUAL, CONNECTION_VISUAL, ADD_OVERLAY, RESET_VISUALS shapes and approved nodeVisual/edgeVisual enums/ranges. Full visual values represent the deterministic Step4 contract rather than invented renderer properties. Clone screen data in memory, simulate operations, then call existing validateDefinition under domain EDIT authorization. Return draft/overlay preview only. Existing human Apply still uses deterministic screen commands.
- Outcome item IDs must be retained current review items, unique per response. Proposed status uses exact Step6 vocabulary and transition(current,proposed). Invalid vocabulary, direct Raised-to-Decision, arbitrary terminal jumps and mismatched optional candidate kind reject.
- Frozen keys must match exact End capture/start definitions. Later private edits cannot affect summary context.

Human confirmation remains a separate action. AI cannot authorize itself, accept scenario understanding, confirm screen, modify live shared state, save private Knowledge or publish Outcomes.

## Prompts

Six versioned capability prompts: ask.v1, discussion.v1, scenario.v1, visual.v1, summary.v1, classify.v1. Each states role, source boundary, allowed inference, exact reference requirement, assumptions/uncertainty and no mutation. Summary/classification prohibit hidden verbal conclusions; unknown discussion status must not become inferred NOT_DISCUSSED. No giant universal runtime prompt, reusable agent loop or prompt-history store.

## Execution / typed failures / telemetry

AI errors: AI_UNAVAILABLE503, AI_PROVIDER_ERROR502, AI_OUTPUT_INVALID502, AI_TIMEOUT504, AI_CANCELLED409, AI_CONTEXT_TOO_LARGE413. Existing deterministic routes remain independently usable. AI configuration parse is non-fatal; SDK construction/authentication is lazy, no provider request at server startup.

Bounds:
- HTTP input16KiB; question/instruction2000chars; scenario goal1000/notes4000.
- Serialized capability context+intent128KiB, model output32KiB and8192tokens. Oversize fails, never silently trims graph membership.
- Questions/suggestions8; follow-ups5; assumptions/uncertainties8; refs32; affected scenario nodes64; visual operations32; classification suggestions32; nested potential Decision/Action lists8 each. Text fields max400 or2000 as specified in schemas; Step4 visual labels/ranges retained.
- Four concurrent model executions per app instance; production route limit12/minute per IP per route. Test composition uses10000 to avoid unrelated fixture throttling; providers are fake/unavailable.
- One provider call per capability request; SDK automatic retries explicitly attempts1 (no retries). Transient failure returns typed error for deliberate caller retry, avoiding hidden costs or uncontrolled loops.
- Timeout/caller abort uses AbortSignal + Promise.race so provider ignoring cancellation cannot block client indefinitely. Client disconnect aborts pending response. SDK documents client abort does not guarantee remote generation/billing cancellation.
- Safe process-local telemetry: capability/correlation/provider/model/token counts/latency/schema-validation status/error category only. No prompt/answer/source-body/ADC/key/bearer logging. SCHEMA_VALIDATED means schema only, not final semantic success; domain failures still use normal safe request/error logging. Telemetry listener failure is nonfatal.

No circuit breaker, durable jobs, cache, outbox, embeddings/vector search, RAG ingestion, cross-process quota or automatic fallback introduced. Optional configured reasoning may cost more; only primary was minimally live-smoked. Global location has no regional data-residency claim.

## Persistence / manual acceptance

**No migrations or database tables. Total remains49 application tables.** No AI history/truth root, default response persistence or private prompt storage. Proposal/preview exists only in request memory/response; unsaved preview recovery is intentionally not a new workflow. User can explicitly transfer reviewed values through existing Step3/4/6 commands, which reauthorize, validate stamps/targets and require human confirmation. No auto-apply handler is introduced.

## Live provider verification

- Official SDK model listing authenticated through ADC successfully from Node.
- Authenticated listing returned primary gemini-3.5-flash and optional reasoning gemini-3.1-pro-preview.
- Tiny structured primary probe succeeded after explicitly disabling default thinking. Initial very small thinking-inclusive budgets returned no complete expected JSON; no task data was sent and no expensive benchmark run.
- Final actual installed adapter smoke, npx --no-install tsx scripts/ai-smoke.ts --live: **PASS**, vertex-gemini / gemini-3.5-flash,56 input tokens,5 output tokens, approximately2372ms.
- Opt-in utility refuses to call the provider without --live. Normal test suite uses fake/null provider and never calls Google.
- SDK2.31.0 installer emitted a transitive node-domexception deprecation warning; installation/typecheck/build succeeded. No package-upgrade scope beyond the official SDK.
- No fallback or reasoning live generation, full capability quality benchmark, billing benchmark, production deployment or Unity/device test claimed.

## Tests / regression

**53 tests added: 26 provider/schema unit tests and 27 capability integration tests. Full suite: 394 passed, 0 failed, 0 skipped in 23 files. All 341 baseline tests and 53/53 original Group 1 tests pass unchanged. Strict TypeScript typecheck PASS; build PASS.** Normal suite uses only fake/null AI providers. Actual installed Gemini adapter smoke separately PASS. Isolated local PostgreSQL stopped cleanly.

New provider tests cover official adapter mapping/explicit reasoning/safe metadata, unavailable/misconfigured provider, redacted errors/truncation, strict JSON/counts/oversize, timeout/cancellation, no hidden retries, telemetry, lasso/bounds and all output schemas. Application tests cover all6 capabilities, exact domain access and own Knowledge/source policy, lasso separation/expansion, no phantom targets or renderer properties, scenario acceptance immutability, overlay/canonical isolation, frozen/private source exclusion, later private edits, classification transition validation, no auto Decisions/Actions, unavailable provider/manual workflows, stale context, revocation during wait and timeout/no mutation.

All341 prior tests and all53 original Group1 assertions remain unchanged. Only fixture composition adds an injectable fake/null AI provider; existing fixtures default null so tests cannot accidentally make paid calls. No existing domain/business test was weakened.

## Known limits / next step / stop

Model-generated factual correctness still needs human review; validated references prove membership, not truth of every natural-language claim. Strong model prompts complement but do not replace deterministic authorization and human acceptance. Raw Source document contents, guest AI access, external retrieval, proposal persistence, native preview UI and multi-command Apply UI are not implemented here.

OpenAI fallback deferred due to absent safe configuration. AssemblyAI is separate. Step5 single-instance realtime constraints remain. No blocker for implemented Step7 scope; optional reasoning generation remains separately unverified.

**STOP after Step7.** Next recommended separately authorized increment: Step8 integration/hardening and end-to-end contract audit. Do not start Step8, Unity, AssemblyAI or production deployment automatically.

## Official references consulted

- [Google Gen AI SDK documentation](https://googleapis.github.io/js-genai/release_docs/index.html)
- [GenerateContentConfig JSON schema / abort / continuation](https://googleapis.github.io/js-genai/release_docs/interfaces/types.GenerateContentConfig.html)
- [Google model lifecycle documentation](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/model-versions)
- Installed @google/genai2.31.0 README/types and authenticated SDK model listing were used to verify actual Node options/model identifiers.
