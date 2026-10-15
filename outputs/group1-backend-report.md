# Adaptive Spatial Labs — Group 1 Backend Handoff

Implemented the Group 1 backend in `C:\Users\Khushboo\Documents\Codex\2026-10-06\ju\backend`. The V1 client is Unity/C# on Meta Quest. This increment exposes REST/JSON APIs and builds no frontend.

## 1. Final backend tree

Generated dependencies, build output, credentials, and storage bytes are omitted from this source tree.

```text
backend/
  .env.example
  .gitignore
  .prettierrc.json
  README.md
  package.json
  package-lock.json
  tsconfig.json
  drizzle.config.ts
  vitest.config.ts
  migrations/
    0000_busy_beyonder.sql
    meta/
      0000_snapshot.json
      _journal.json
  scripts/
    local-config.ts
    migrate.ts
    smoke.ts
    test-local.ps1
  src/
    app/
      app.ts
      server.ts
    modules/
      auth/
        auth.routes.ts
        auth.service.ts
        auth.repository.ts
        auth.schema.ts
        auth.types.ts
      users/
        user.routes.ts
        user.service.ts
        user.repository.ts
        user.schema.ts
      organizations/
        organization.routes.ts
        organization.service.ts
        organization.repository.ts
        organization.schema.ts
      projects/
        project.routes.ts
        project.service.ts
        project-creation.service.ts
        project.repository.ts
        project.schema.ts
        project.authorization.ts
        project.types.ts
      project-editors/
        editor.routes.ts
        editor.service.ts
        editor.repository.ts
        editor.schema.ts
      project-structure/
        structure.routes.ts
        structure.service.ts
        structure.repository.ts
        structure.schema.ts
        templates/templates.ts
      project-layers/
        layer.routes.ts
        layer.service.ts
        layer.repository.ts
        layer.schema.ts
      project-sources/
        source.routes.ts
        source.service.ts
        source.repository.ts
        source.schema.ts
        source.types.ts
        source.attach.ts
        upload.service.ts
      preferences/
        preference.routes.ts
        preference.service.ts
        preference.repository.ts
        preference.schema.ts
    shared/
      auth/
        authentication.ts
        token-service.ts
      config/config.ts
      database/
        client.ts
        schema.ts
      errors/app-error.ts
      storage/
        storage-provider.ts
        local-storage-provider.ts
      validation/common.ts
  tests/
    setup.ts
    fixture.ts
    auth-user.integration.test.ts
    projects.integration.test.ts
    structure-sources.integration.test.ts
    transaction.integration.test.ts
    config.unit.test.ts
```

## 2. Module boundaries

| Module | Responsibility |
| --- | --- |
| Auth | Signup, Argon2id password verification, refresh-session creation/rotation/revocation. Signup creates a minimal organization through its repository in the same transaction. |
| Users | Safe account DTO and professional profile changes. Designation is not a permission. |
| Organizations | Organization creation, caller membership, authorized member search. |
| Projects | Listing, reading, owner settings/archive, centralized permissions. A separate creation service orchestrates the wizard transaction. |
| Project editors | Owner-controlled editor membership; editors must be existing organization members. |
| Project structure | Selected template; optional explicit layer replacement. Templates suggest layer definitions only. |
| Project layers | Custom layers, rename, deletion, deterministic ordering. |
| Project sources | Pending references, source metadata, private upload staging/attachment/download/delete. No parsing or recognition. |
| Preferences | Typed JSONB preference document, defaults, transactional partial updates. |
| Shared infrastructure | Database connection/schema, token primitives/authentication, config validation, errors, storage, and response/validation primitives. |

Controllers only parse inputs and call services. Database queries live in repositories. Mutation services use transaction-bound repositories and authorization helpers. There are no circular domain dependencies, future-system stubs, or global product-state blob. Logging is configured in the application composition root; it did not need a separate abstraction.

## 3. Database schema summary

| Table | Ownership and constraints |
| --- | --- |
| users | UUID; unique normalized email; Argon2id hash; designation; nullable department/profile image; timestamps. |
| organizations | UUID, name, timestamps. Names are not identity or admission credentials. |
| organization_members | Composite organization/user primary key; OWNER/MEMBER; FKs and user lookup index. |
| projects | UUID; organization and owner FKs; name, description, project type, visibility, ACTIVE/ARCHIVED; organization/owner indexes. |
| project_editors | Composite project/user primary key; added-by FK; timestamp; user index. |
| project_structures | UUID; unique project FK; template key; timestamps. |
| project_layers | UUID; project FK; nullable description; nonnegative explicit order; TEMPLATE/USER_CREATED; project/order index. |
| project_sources | UUID; project/author FKs; source type/status; nullable opaque storage key/reference; typed nullable JSONB metadata; unique storage key; project index. |
| user_preferences | User primary key/FK; JSONB preferences; timestamps. |
| refresh_sessions | UUID; user FK; unique HMAC token digest; expiry/revocation; timestamps; user index. |
| staged_uploads | UUID; owner user FK; unique storage key; file name/content type/size; expiry; timestamps; expiry index. Extra table supports private wizard uploads. |

Eight PostgreSQL enum types hold stable designation, membership role, project type, visibility, project status, layer origin, source type, and source status strings. Ownership/reference FKs deliberately use RESTRICT instead of cascades. Projects are archived through the API; they are not hard-deleted.

## 4. Migrations

`migrations/0000_busy_beyonder.sql` creates all 11 tables, eight enum types, FKs, primary/unique constraints, checks, and indexes. Drizzle's generated snapshot and journal are included. Migrations were applied successfully against both development and test PostgreSQL databases. Reapplying the migration command is safe because Drizzle tracks applied migrations.

## 5. API endpoint table

All paths below start with `/api/v1`. Protected endpoints require `Authorization: Bearer <accessToken>`.

| Method | Path | Access / purpose |
| --- | --- | --- |
| POST | /auth/signup | Public; creates account and a new organization; returns user, organization, tokens; 201. |
| POST | /auth/login | Public; returns user and tokens. |
| POST | /auth/refresh | Possession of current refresh token; returns rotated token DTO. |
| POST | /auth/logout | Possession of current refresh token; revokes its session. |
| GET | /me | Current user profile. |
| PATCH | /me | Current user; fullName, designation, teamDepartment, profileImage. |
| GET | /me/preferences | Current user preferences. |
| PATCH | /me/preferences | Current user; patch top-level preferences. |
| GET | /organizations | Only organizations where caller has membership. |
| POST | /organizations | Authenticated; creates organization with caller as its owner; 201. |
| GET | /organizations/:organizationId/members | Organization member; eligible-member search. |
| GET | /projects | Accessible/discoverable project summaries; Home list. |
| POST | /projects | Organization member; complete wizard command; transaction; 201. |
| GET | /projects/:projectId | Owner/editor, or organization member for ORGANIZATION_OPEN. |
| PATCH | /projects/:projectId | Owner; name/description/type/visibility/status. Archive with status ARCHIVED. |
| GET | /projects/:projectId/editors | Project read access. |
| POST | /projects/:projectId/editors | Active project's owner; existing eligible userId; 201. |
| DELETE | /projects/:projectId/editors/:userId | Active project's owner. |
| GET | /projects/:projectId/structure | Project read access. |
| PUT | /projects/:projectId/structure | Active owner/editor; templateKey and optional layer list. |
| GET | /project-templates | Authenticated; six initial layer presets. |
| GET | /projects/:projectId/layers | Project read access; ordered list. |
| POST | /projects/:projectId/layers | Active owner/editor; custom layer; 201. |
| PATCH | /projects/:projectId/layers/:layerId | Active owner/editor; rename/description/reposition. |
| DELETE | /projects/:projectId/layers/:layerId | Active owner/editor; remove/reindex. |
| GET | /projects/:projectId/sources | Project read access; safe source DTOs. |
| POST | /projects/:projectId/sources | Active owner/editor; pending reference or staged upload attachment; 201. |
| DELETE | /projects/:projectId/sources/:sourceId | Active owner/editor; remove metadata and local bytes. |
| GET | /projects/:projectId/sources/:sourceId/content | Project read access; binary download exception to JSON. |
| POST | /uploads | Authenticated; one multipart file; private staging; 201. |
| DELETE | /uploads/:uploadId | Upload owner; discard unused staged upload. |
| GET | /health | Public; process liveness. |

Project listing accepts `status=ACTIVE|ARCHIVED`, `limit` (1–100; default 50), and `offset` (default 0). Member search accepts `search`, `limit`, and `offset`. Organization names are not globally unique; signup never joins an existing organization by matching a name.

### Stable responses

JSON uses camelCase, UUID strings, ISO-8601 UTC timestamps, and stable uppercase enum strings. Success is `{ "data": ... }`; lists are `{ "data": [] }`. Deletes return `{ "data": { "removed": true } }`. Logout returns `{ "data": { "loggedOut": true } }`.

Project DTO fields: `id`, `organizationId`, `name`, `description`, `projectType`, `visibility`, `ownerUserId`, `status`, `createdAt`, `updatedAt`.

User DTO fields: `id`, `fullName`, `workEmail`, `designation`, `teamDepartment`, `profileImage`, `createdAt`, `updatedAt`. Nullable department/image are explicit nulls. Password hashes and normalized email never enter the DTO.

Source DTO fields: `id`, `projectId`, `sourceType`, `name`, `status`, `hasFile`, `externalReference`, `metadata`, `addedByUserId`, `createdAt`, `updatedAt`. Metadata has fixed nullable `contentType`, `byteSize`, and `note` fields. Internal storage keys and filesystem paths are excluded.

Errors consistently use:

```json
{
  "error": {
    "code": "PROJECT_FORBIDDEN",
    "message": "You do not have access to this project.",
    "details": null
  }
}
```

Central errors cover all codes requested in the specification. Invalid request bodies/IDs produce 400; authentication 401; authorization 403; missing entities 404; duplicates/invalid project states 409; oversized bodies/files 413; rate limits 429; unexpected failures 500. Error responses never include SQL, stacks, internal paths, secrets, or submitted password data. A route that does not exist returns a 404 `NOT_FOUND` error in the same envelope.

## 6. Authentication and token flow

1. Signup validates the profile, normalizes email by trim/lowercase, hashes the password with Argon2id, and transactionally inserts user, organization membership, and session. Password length is 12–128 characters.
2. Login uses a normalized-email lookup and Argon2 verification. Unknown users still perform a dummy password verification. Incorrect password and unknown account share the same response.
3. Access tokens are signed HS256 JWTs with fixed issuer/audience, user subject, session ID, issuance, and expiry. Default lifetime is 900 seconds.
4. Refresh tokens are opaque `sessionId.randomSecret` credentials. Only their HMAC-SHA256 digests are stored; a distinct refresh secret is required. Default session lifetime is seven days.
5. Refresh atomically replaces the stored digest. One concurrent refresh wins; the previous credential cannot be replayed. Rotation extends the session expiry. The client must replace its stored refresh token with the new value.
6. Logout revokes that session. Protected requests verify both the JWT and active session, so logout also disables its existing access tokens. Other sessions remain active.

Token DTO: `accessToken`, `refreshToken`, `tokenType: "Bearer"`, `accessExpiresAt`, `refreshExpiresAt`. Raw refresh credentials are returned only when issued/rotated because the Unity client needs them. No cookie, browser state, redirects, or localStorage assumptions exist.

Signup, login, and refresh have a 20-requests-per-minute/IP limit, with a general 300-per-minute/IP limit outside tests. Logs record generated request IDs, route templates, statuses, duration, safe user/project IDs, and error codes. Request bodies and raw URL/query strings are not logged. Sensitive fields are also redacted.

## 7. Permission rules

| Caller | Restricted | Organization discoverable | Organization open |
| --- | --- | --- | --- |
| Project owner | Read/author/manage | Read/author/manage | Read/author/manage |
| Project editor | Read/author | Read/author | Read/author |
| Other organization member | No access/listing | Summary listing only; no project content | Read content only; no authoring |
| Non-member | No access | No access | No access |

Owners/editors must be organization members. Only the project owner can change project settings, visibility, status, or editor membership. Owner/editor authoring covers layers, structure, and source metadata. Archived projects retain data and read access but reject content mutations. The owner may restore an archived project via PATCH. Designation grants no permissions. No presentation, meeting, viewer, or participant role is introduced.

All writes lock the project row within a transaction before authorization/mutation, preventing editor removal or archive from racing with content writes. Child lookups scope by both project ID and child ID. Authorization helpers are shared; HTTP routes do not duplicate permission decisions.

## 8. Wizard transaction

The client keeps the five incomplete wizard steps locally. A single POST `/projects` creates the complete project when Review & Create is confirmed.

```json
{
  "name": "Payments Platform",
  "description": "Core payment platform architecture",
  "organizationId": "<organization UUID>",
  "projectType": "PRODUCT_SYSTEM",
  "visibility": "RESTRICTED",
  "structure": {
    "templateKey": "PRODUCT_SYSTEM",
    "layers": [
      { "name": "Product", "sortOrder": 0, "source": "TEMPLATE" },
      { "name": "Service", "sortOrder": 1, "source": "TEMPLATE" }
    ]
  },
  "editorUserIds": [],
  "sources": []
}
```

Within one PostgreSQL transaction: validate organization membership → create project with authenticated creator as owner → add eligible editors → save structure → create ordered layer definitions → attach source metadata/consume owned staged uploads → commit. A 201 response is sent only after commit. Clients cannot supply ownerUserId/status/storageKey or source processing status.

Failures after editor insertion, after structure/layer insertion, and after an initial staged-source attachment were tested. All project rows/children roll back; consumed staging metadata is restored. Upload bytes were staged before the transaction and remain available after rollback. This is why the celebration screen reflects committed state.

## 9. File storage

`StorageProvider` exposes `put(Buffer)`, `get(key)`, and `delete(key)`. `LocalStorageProvider` uses generated UUID keys, a configured root, exclusive file creation, and guarded key validation to prevent path traversal. File bytes never enter PostgreSQL. Swapping cloud storage requires replacing the provider at app composition, not the source domain.

Wizard upload flow: POST one file to `/uploads` → retain returned upload ID in local wizard state → include that ID in a source definition → CREATE PROJECT. A staged upload is owned by one user, expires after 24 hours, and can be consumed only once. It can also be attached to an existing writable project. Reference-only sources are PENDING; file-backed sources are UPLOADED. Miro references are never marked connected; there is no OAuth/processing stub.

Default upload limit is 10 MiB, configurable up to 50 MiB. Downloads enforce project permissions and return `application/octet-stream` with attachment/nosniff headers. PostgreSQL transactions cannot atomically roll back filesystem deletes; metadata removal commits first. A file-delete failure can leave inaccessible orphan bytes requiring cleanup. Expired staged rows are rejected, but automatic expiry/byte cleanup is not yet scheduled. This is an explicit local-storage operational limitation.

## 10. Environment example

```dotenv
NODE_ENV=development
HOST=127.0.0.1
PORT=3000
DATABASE_URL=postgresql://asl_app:YOUR_PASSWORD@127.0.0.1:5432/adaptive_spatial_labs
ACCESS_TOKEN_SECRET=YOUR_RANDOM_SECRET_AT_LEAST_32_CHARACTERS
REFRESH_TOKEN_SECRET=YOUR_DIFFERENT_RANDOM_SECRET_AT_LEAST_32_CHARACTERS
ACCESS_TOKEN_TTL=900
REFRESH_TOKEN_TTL=604800
LOCAL_STORAGE_PATH=./storage
MAX_UPLOAD_BYTES=10485760
```

TTLs are seconds. Required config is validated by Zod. Invalid config fails startup; secrets are never printed. The default server binds to loopback. When testing from Quest on a trusted local network, intentionally set `HOST=0.0.0.0` and configure network/firewall access; actual Quest connectivity has not been tested. A deployed service needs appropriate TLS and operational configuration.

## 11. Exact setup and run commands

### Use the isolated local cluster already prepared for this chat

Node 22.14.0 and PostgreSQL 16.11 were available on this machine. The database cluster is under `work\postgres\data`, not the system PostgreSQL service. It listens only on loopback port 55432 with local trust authentication. That cluster/config is development-only.

```powershell
cd C:\Users\Khushboo\Documents\Codex\2026-10-06\ju\backend
npm ci

# Initializes the isolated cluster/databases if missing, configures local .env files if absent,
# applies migrations, checks types, runs tests, builds, smoke-checks HTTP, and stops PostgreSQL.
.\scripts\test-local.ps1

# Run database + development API together. Ctrl+C ends the development run.
.\scripts\test-local.ps1 -Mode dev

# Just migrate, build, and check the compiled HTTP server, then stop PostgreSQL.
.\scripts\test-local.ps1 -Mode smoke
```

The script accepts `-PostgresBin` if PostgreSQL is installed elsewhere. `.env` and `.env.test` have been generated locally with random secrets, are ignored, and are not deliverable credentials. The runner never overwrites them. It stops its local database in `finally` and does not touch the user's system service. The smoke account/project are written only to the dedicated test database; regular test runs reset that database.

### Use an existing password-authenticated PostgreSQL service

In PowerShell, add the installed PostgreSQL binaries to this process's PATH:

```powershell
$env:Path = 'C:\Program Files\PostgreSQL\16\bin;' + $env:Path
psql -h 127.0.0.1 -U postgres -d postgres
```

In that interactive psql session (password entry stays interactive):

```sql
CREATE ROLE asl_app LOGIN;
\password asl_app
CREATE DATABASE adaptive_spatial_labs OWNER asl_app;
CREATE ROLE asl_test LOGIN;
\password asl_test
CREATE DATABASE adaptive_spatial_labs_test OWNER asl_test;
\q
```

Configure `backend\.env` using `.env.example`, set the dev connection URL to the asl_app database, and create `backend\.env.test`:

```dotenv
TEST_DATABASE_URL=postgresql://asl_test:YOUR_TEST_PASSWORD@127.0.0.1:5432/adaptive_spatial_labs_test
```

Then:

```powershell
cd C:\Users\Khushboo\Documents\Codex\2026-10-06\ju\backend
npm ci
npm run db:migrate
npm run dev
# In another terminal, with that PostgreSQL service running:
npm run typecheck
npm test
npm run build
npm start
```

Test fixtures apply migrations automatically to their test database. Tests require a database name ending `_test` and reset only the explicitly named Group 1 tables in that database. Do not point TEST_DATABASE_URL at a database containing needed data. To evolve the schema later, use `npm run db:generate`, review the migration, then `npm run db:migrate`.

## 12. Verification results

- Strict TypeScript typecheck passed, including `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`.
- Build passed on Node.js 22.14.0.
- Vitest: **53 tests passed in 5 files**, none failed or skipped in the successful run.
- Integration tests used real PostgreSQL 16.11, generated Drizzle migrations, real Argon2id hashing, Fastify injection, and temporary local file storage. Database behavior was not mocked.
- Compiled-server HTTP smoke passed on loopback: health, signup, bearer `/me`, atomic project creation, Home listing, and logout. The isolated PostgreSQL process was stopped afterward.

| Requested coverage | Verification |
| --- | --- |
| Auth 1–8 | Signup; normalized duplicate; login; wrong/unknown credentials; unauthenticated and valid bearer access; refresh rotation/concurrency/replay; expired access/session; logout revocation. |
| User 9–12 | Current-user DTO; profile update; password-hash omission; typed preference defaults and patch persistence. |
| Organization 13–15 | Creation creates owner membership; signup membership; authorized member search and forbidden nonmember lookup. |
| Project 16–22 | Create, authenticated creator ownership, Home list, stable GET, restricted privacy, editor access, owner-only restrictions. |
| Structure 23–28 | Template persistence/presets; explicit/custom layers; rename/reorder/remove; structure/layer replacement. |
| Editors 29–31 | Add, duplicate/owner rejection, removal, lost access, ineligible-member rejection. |
| Sources 32–35 | Source metadata/project association; private source access; upload attachment/download; save/read/delete; traversal and size/empty limits. |
| Transaction 36–37 | Validation rejection; mid-editor failure; after-layer failure; duplicate source after first attach; all table counts unchanged after failure. |
| API contract 38–40 | Consistent error envelope; explicit field sets; UUID/UTC timestamps; safe fixed DTO shapes suitable for C# mapping. No actual Unity deserializer has run. |

Additional checks cover archive/restore, discoverable versus open visibility, child IDs from a different project, client-supplied ownership rejection, private-upload theft, and restrictive FKs.

## 13. Assumptions

1. Signup creates a fresh organization, even if another has the same name. Joining by organization name would grant unauthorized admission. Organization invitations/member administration are not included in this increment; eligible editor users must already have membership provisioned. Tests provision that membership explicitly.
2. ORGANIZATION_DISCOVERABLE means member-visible summary only; ORGANIZATION_OPEN means organization-member read access. Neither implicitly grants editor authority.
3. Only owners update project settings/visibility/status. Editors author layers, structure, and sources. Archived content is read-only and restorable by owner.
4. Initial template structure may be overridden entirely. Omitted layers use template presets; explicit empty layers remain empty. Incoming unique order numbers are normalized to contiguous zero-based order. Repositioning inserts at a requested index and clamps positions beyond the end.
5. PUT structure changes only templateKey unless layers are also supplied; supplying layers explicitly replaces the current Group 1 layer list. Future architecture references will require revisiting replacement semantics in Group 2.
6. Preferences use a typed JSONB document. PATCH merges top-level keys; a provided nested object replaces that object and must contain its defined fields. No speculative MR preference framework is built.
7. Source metadata has a fixed DTO rather than arbitrary public JSON. File bytes use one private staging request before final creation. Reference-only sources may remain pending until later processing exists.
8. This is a local, tested backend foundation, not a deployment to Quest or a production host. No frontend was created, and reference screen images were not implemented.

## 14. Intentional later-group limits

No architecture objects/types/relationships, evidence recognition, product/feature mapping, AI, embeddings, vector storage, spatial layout/views, presentations, audience permissions, meetings, sockets/realtime, My Space backend, questions/trade-offs/decisions/proposals, ticketing, readiness, Miro synchronization, Figma/Jira/GitHub/calendar integrations, Docker, or web/React frontend exist. No placeholder implementations were added for them.

Cloud object storage, organization invitation/admin flows, automatic expired-upload/session cleanup, production deployment, and live Unity/Quest integration remain separate work. The current Group 1 backend stops at identity, project foundation, sources/layers, profile, and preferences.

## Documentation references

Implementation was checked against the [official Fastify testing guide](https://github.com/fastify/fastify/blob/main/docs/Guides/Testing.md) and [official Drizzle PostgreSQL setup](https://orm.drizzle.team/docs/get-started/postgresql-new), then verified against the installed package types and a real PostgreSQL database.
