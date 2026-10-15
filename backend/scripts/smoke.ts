import { config } from 'dotenv';
import { spawn } from 'node:child_process';
import { randomBytes, randomUUID } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import assert from 'node:assert/strict';
config({ path: '.env.test', quiet: true });
const databaseUrl = process.env.TEST_DATABASE_URL;
if (!databaseUrl || !new URL(databaseUrl).pathname.endsWith('_test'))
  throw new Error('Dedicated TEST_DATABASE_URL ending in _test is required');
const storagePath = await mkdtemp(join(tmpdir(), 'asl-smoke-'));
const port = 55433;
const server = spawn(process.execPath, ['dist/src/app/server.js'], {
  env: {
    ...process.env,
    NODE_ENV: 'test',
    DATABASE_URL: databaseUrl,
    PORT: String(port),
    HOST: '127.0.0.1',
    LOCAL_STORAGE_PATH: storagePath,
    ACCESS_TOKEN_SECRET: randomBytes(32).toString('hex'),
    REFRESH_TOKEN_SECRET: randomBytes(32).toString('hex'),
  },
  stdio: ['ignore', 'ignore', 'pipe'],
  windowsHide: true,
});
let startupFailed = false;
server.on('exit', () => {
  startupFailed = true;
});
server.stderr.on('data', () => {
  /* Never forward unknown process output containing configuration. */
});
async function request(path: string, body?: unknown, accessToken?: string) {
  const response = await fetch(`http://127.0.0.1:${port}/api/v1${path}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers: {
      'content-type': 'application/json',
      ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  assert(response.ok, `${path} failed with ${response.status}`);
  return response.json();
}
try {
  let ready = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    if (startupFailed) throw new Error('Compiled backend did not start');
    try {
      const response = await request('/health');
      ready = response.data.status === 'ok';
    } catch {
      /* Wait briefly for startup. */
    }
    if (ready) break;
    await delay(100);
  }
  assert(ready, 'Compiled backend startup timed out');
  const created = await request('/auth/signup', {
    fullName: 'HTTP smoke account',
    workEmail: `smoke-${randomUUID()}@example.com`,
    password: 'Smoke-password-123',
    designation: 'OTHER',
    organizationName: 'HTTP smoke organization',
  });
  const tokens = created.data.tokens;
  const profile = await request('/me', undefined, tokens.accessToken);
  assert.equal(profile.data.id, created.data.user.id);
  const project = await request(
    '/projects',
    {
      name: 'HTTP smoke project',
      organizationId: created.data.organization.id,
      projectType: 'CUSTOM',
      visibility: 'RESTRICTED',
      structure: { templateKey: 'CUSTOM', layers: [{ name: 'Custom', sortOrder: 0 }] },
    },
    tokens.accessToken,
  );
  const listed = await request('/projects', undefined, tokens.accessToken);
  assert(listed.data.some((p: { id: string }) => p.id === project.data.id));
  await request('/auth/logout', { refreshToken: tokens.refreshToken });
  console.log(
    'Compiled server HTTP smoke passed: health, signup, bearer /me, atomic project create, Home list, logout.',
  );
} finally {
  server.kill('SIGTERM');
  await Promise.race([
    new Promise<void>((resolve) => {
      if (server.exitCode !== null) resolve();
      else server.once('exit', () => resolve());
    }),
    delay(5000),
  ]);
  await rm(storagePath, { recursive: true, force: true });
}
