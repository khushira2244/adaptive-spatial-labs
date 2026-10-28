import { config } from 'dotenv';
import { randomBytes } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { connectDatabase } from '../src/shared/database/client.js';
import { readConfig } from '../src/shared/config/config.js';
import { LocalStorageProvider } from '../src/shared/storage/local-storage-provider.js';
import { buildApp } from '../src/app/app.js';
config({ path: '.env.test', quiet: true });
const url = process.env.TEST_DATABASE_URL;
if (!url || !new URL(url).pathname.endsWith('_test'))
  throw new Error('A dedicated database ending in _test is required.');
const { db, pool } = connectDatabase(url);
const app = await buildApp({
  db,
  config: readConfig({
    NODE_ENV: 'test',
    DATABASE_URL: url,
    ACCESS_TOKEN_SECRET: randomBytes(32).toString('hex'),
    REFRESH_TOKEN_SECRET: randomBytes(32).toString('hex'),
  }),
  storage: new LocalStorageProvider('../work/audit-storage'),
  logging: false,
  aiProvider: null,
});
try {
  const raw = app.printRoutes({ commonPrefix: false });
  const routeParents: string[] = [];
  const routes: { method: string; path: string }[] = [];
  for (const line of raw.split('\n')) {
    const match = /^([│ ]*)(?:├──|└──) (.+?) \(([^)]+)\)$/.exec(line);
    if (!match) continue;
    const depth = match[1]!.length / 4;
    const path = (depth ? routeParents[depth - 1]! : '') + match[2]!;
    routeParents[depth] = path;
    for (const method of match[3]!.split(',')) routes.push({ method: method.trim(), path });
  }
  if (
    app.websocketServer.options.maxPayload !== 65536 ||
    app.websocketServer.options.perMessageDeflate !== false
  )
    throw new Error('WebSocket bounds configuration mismatch');
  const tables = (
    await pool.query(
      "select table_name from information_schema.tables where table_schema='public' and table_type='BASE TABLE' order by table_name",
    )
  ).rows.map((r: { table_name: string }) => r.table_name);
  const folder = resolve('../work');
  await mkdir(folder, { recursive: true });
  await writeFile(
    resolve(folder, 'backend-v1-inventory.json'),
    JSON.stringify({ routes, tables, raw }, null, 2),
  );
  console.log(
    JSON.stringify({
      routes: routes.length,
      tables: tables.length,
      inventory: 'work/backend-v1-inventory.json',
    }),
  );
  const address = await app.listen({ host: '127.0.0.1', port: 0 });
  const health = await fetch(address + '/api/v1/health');
  if (health.status !== 200) throw new Error('HTTP health smoke failed');
  console.log('Real HTTP startup/health verified; closing app and pool.');
} finally {
  await app.close();
  await pool.end();
}
