# Adaptive Spatial Labs — Group 1 Backend

Unity/Meta Quest client-agnostic REST backend. Node.js 22, Fastify, PostgreSQL, Drizzle, Zod, Argon2id, and Vitest. No frontend or later product domains are implemented.

The full folder tree, module boundaries, API contract, schema, migrations, token flow, permission rules, setup commands, and test results are documented in `../outputs/group1-backend-report.md`.

```powershell
cd C:\Users\Khushboo\Documents\Codex\2026-10-06\ju\backend
npm ci
# Isolated local PostgreSQL 16 runner: starts DB, migrates, tests, builds, HTTP checks, stops DB.
.\scripts\test-local.ps1
# Start the local DB and development API together; Ctrl+C stops the run.
.\scripts\test-local.ps1 -Mode dev
```

The local runner binds its PostgreSQL cluster to `127.0.0.1:55432`. It uses local trust authentication for development only. Existing `.env` files are never overwritten. For an existing PostgreSQL installation/service, configure `.env` from `.env.example` and use `npm run db:migrate`, `npm run dev`, and `npm test` with a dedicated test database ending in `_test`.
