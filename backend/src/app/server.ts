import { readConfig } from '../shared/config/config.js';
import { connectDatabase } from '../shared/database/client.js';
import { LocalStorageProvider } from '../shared/storage/local-storage-provider.js';
import { buildApp } from './app.js';
const config = readConfig();
const { db, pool } = connectDatabase(config.DATABASE_URL);
try {
  await pool.query('select 1');
  const app = await buildApp({
    db,
    config,
    storage: new LocalStorageProvider(config.LOCAL_STORAGE_PATH),
  });
  const shutdown = async () => {
    try {
      await app.close();
    } finally {
      await pool.end();
    }
  };
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
  await app.listen({ host: config.HOST, port: config.PORT });
} catch {
  await pool.end();
  console.error(
    'Backend startup failed. Check database connectivity, migrations, and configuration.',
  );
  process.exitCode = 1;
}
