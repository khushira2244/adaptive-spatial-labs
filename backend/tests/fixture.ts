import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { sql } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import { connectDatabase } from '../src/shared/database/client.js';
import { LocalStorageProvider } from '../src/shared/storage/local-storage-provider.js';
import { readConfig } from '../src/shared/config/config.js';
import { buildApp } from '../src/app/app.js';
import { organizationMembers } from '../src/shared/database/schema.js';

export async function fixture() {
  const url = process.env.TEST_DATABASE_URL;
  if (!url || !new URL(url).pathname.endsWith('_test'))
    throw new Error(
      'TEST_DATABASE_URL must point to a dedicated database ending in _test. Tests reset its Group 1 tables.',
    );
  const { db, pool } = connectDatabase(url);
  await migrate(db, { migrationsFolder: './migrations' });
  await db.execute(
    sql`TRUNCATE refresh_sessions, user_preferences, project_sources, staged_uploads, project_layers, project_structures, project_editors, projects, organization_members, organizations, users`,
  );
  const storagePath = await mkdtemp(join(tmpdir(), 'asl-group1-'));
  const storage = new LocalStorageProvider(storagePath);
  const config = readConfig({
    NODE_ENV: 'test',
    DATABASE_URL: url,
    ACCESS_TOKEN_SECRET: randomBytes(32).toString('hex'),
    REFRESH_TOKEN_SECRET: randomBytes(32).toString('hex'),
    LOCAL_STORAGE_PATH: storagePath,
  });
  const app = await buildApp({ db, config, storage });
  return {
    app,
    db,
    pool,
    storage,
    config,
    close: async () => {
      await app.close();
      await pool.end();
      await rm(storagePath, { recursive: true, force: true });
    },
  };
}
export type Fixture = Awaited<ReturnType<typeof fixture>>;
export type Actor = {
  id: string;
  orgId: string;
  accessToken: string;
  refreshToken: string;
  headers: { authorization: string };
};
export async function signup(app: FastifyInstance, label: string): Promise<Actor> {
  const res = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/signup',
    payload: {
      fullName: label,
      workEmail: `${label}@example.com`,
      password: 'Correct-password-123',
      designation: 'BACKEND_ENGINEER',
      organizationName: `${label} organization`,
    },
  });
  if (res.statusCode !== 201) throw new Error(`Signup fixture failed: ${res.body}`);
  const d = res.json().data;
  return {
    id: d.user.id,
    orgId: d.organization.id,
    accessToken: d.tokens.accessToken,
    refreshToken: d.tokens.refreshToken,
    headers: { authorization: `Bearer ${d.tokens.accessToken}` },
  };
}
export async function actors(f: Fixture) {
  const owner = await signup(f.app, 'owner');
  const editor = await signup(f.app, 'editor');
  const outsider = await signup(f.app, 'outsider');
  // Existing organization membership is deliberately provisioned as a fixture, not via an unimplemented invitation API.
  await f.db
    .insert(organizationMembers)
    .values({ organizationId: owner.orgId, userId: editor.id, membershipRole: 'MEMBER' });
  return { owner, editor, outsider };
}
export function projectPayload(owner: Actor) {
  return {
    name: 'Payments Platform',
    description: 'Core payments',
    organizationId: owner.orgId,
    projectType: 'PRODUCT_SYSTEM',
    visibility: 'RESTRICTED',
    structure: {
      templateKey: 'PRODUCT_SYSTEM',
      layers: [
        { name: 'Product', sortOrder: 1, source: 'TEMPLATE' },
        { name: 'Service', sortOrder: 2, source: 'TEMPLATE' },
      ],
    },
    editorUserIds: [],
    sources: [],
  };
}
export async function createProject(f: Fixture, owner: Actor, extra: Record<string, unknown> = {}) {
  const res = await f.app.inject({
    method: 'POST',
    url: '/api/v1/projects',
    headers: owner.headers,
    payload: { ...projectPayload(owner), ...extra },
  });
  if (res.statusCode !== 201) throw new Error(`Create fixture failed: ${res.body}`);
  return res.json().data as { id: string; ownerUserId: string; organizationId: string };
}
export function multipartFile(bytes = 'sample architecture document') {
  const boundary = 'asl-test-boundary';
  return {
    headers: { 'content-type': `multipart/form-data; boundary=${boundary}` },
    payload: Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="architecture.txt"\r\nContent-Type: text/plain\r\n\r\n${bytes}\r\n--${boundary}--\r\n`,
    ),
  };
}
