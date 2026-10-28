# Adaptive Spatial Labs — Backend

Unity/Meta Quest client-agnostic REST backend. Node.js 22, Fastify, PostgreSQL, Drizzle, Zod, Argon2id, and Vitest. Group 1 APIs, the Step 1 write foundation, Step 2 deterministic Sources + Architecture, Step 3 private Knowledge + Context, Step 4 Presentation preparation/builder, Step 5 live Meetings/publication/WebSocket, and Step 6 deterministic MeetingReview/outcomes/atomic Save to Project are implemented. Step 7 adds six validated AI proposal capabilities through the official Gemini/Vertex SDK and ADC. All existing deterministic/human confirmation flows remain authoritative. No Unity integration or AssemblyAI pipeline is included.

Current implemented capabilities and verification: [Backend implementation progress](../outputs/backend-implementation-progress.md), [Step 2 report](../outputs/backend-implementation-step2-sources-architecture-report.md), [Step 3 report](../outputs/backend-implementation-step3-knowledge-context-report.md), [Step 4 report](../outputs/backend-implementation-step4-presentations-report.md), [Step 5 report](../outputs/backend-implementation-step5-meetings-report.md), [Step 6 report](../outputs/backend-implementation-step6-outcomes-report.md), [Step 7 report](../outputs/backend-implementation-step7-ai-report.md), and [implementation changelog](../hackathon.md).

The original Group 1 folder tree, module boundaries, API contract, schema, migrations, token flow, permission rules, setup commands, and test results are documented in `../outputs/group1-backend-report.md`.

```powershell
cd C:\Users\Khushboo\Documents\Codex\2026-10-06\ju\backend
npm ci
# Isolated local PostgreSQL 16 runner: starts DB, migrates, tests, builds, HTTP checks, stops DB.
.\scripts\test-local.ps1
# Start the local DB and development API together; Ctrl+C stops the run.
.\scripts\test-local.ps1 -Mode dev
```

The local runner binds its PostgreSQL cluster to `127.0.0.1:55432`. It uses local trust authentication for development only. Existing `.env` files are never overwritten. For an existing PostgreSQL installation/service, configure `.env` from `.env.example` and use `npm run db:migrate`, `npm run dev`, and `npm test` with a dedicated test database ending in `_test`.

## Optional AI

Configure AI_ENABLED, GOOGLE_CLOUD_PROJECT/LOCATION and GEMINI_MODEL_PRIMARY/REASONING from .env.example; restart a running backend after changing settings. @google/genai resolves ADC; never paste ADC JSON into application code or commit credentials. Missing AI configuration returns typed unavailability and leaves manual workflows usable.

Primary gemini-3.5-flash was tiny-smoke verified; optional reasoning gemini-3.1-pro-preview was listed only. Opt-in live call: npx --no-install tsx scripts/ai-smoke.ts --live. Normal tests inject fake/null providers and never call paid APIs. OpenAI fallback is deferred. No generic chatbot or automatic domain apply/save endpoint exists.

## Backend V1 complete

Steps 1–8 are complete. Final backend verification: 417 passed, zero failed/skipped in 27 files on both a fresh empty migrated database and the regular dedicated test database; all 53 original Group 1 tests unchanged. All 11 migrations retained; 49 application tables; 91 business routes plus 38 automatic HEAD handlers. Strict typecheck/build, compiled HTTP smoke, explicit app close/pool cleanup and tiny ADC Gemini smoke pass.

Final audit, exact change manifest and limits: [Step 8 hardening report](../outputs/backend-implementation-step8-hardening-report.md). Full method/path/auth/purpose inventory: [Backend V1 routes](../outputs/backend-v1-route-inventory.md). Runtime npm audit is clean; four moderate advisories remain in the development-only Drizzle/esbuild chain. Realtime is single-process; provider ingestion/email redemption/production deployment/Unity/AssemblyAI remain separate. AI never auto-commits. Implementation stopped after Step 8.