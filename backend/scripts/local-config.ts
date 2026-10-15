import { randomBytes } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
// Only for this isolated local-development cluster. Never overwrite existing credentials.
await writeFile(
  '.env',
  [
    'NODE_ENV=development',
    'HOST=127.0.0.1',
    'PORT=3000',
    'DATABASE_URL=postgresql://asl_local@127.0.0.1:55432/adaptive_spatial_labs',
    `ACCESS_TOKEN_SECRET=${randomBytes(48).toString('hex')}`,
    `REFRESH_TOKEN_SECRET=${randomBytes(48).toString('hex')}`,
    'ACCESS_TOKEN_TTL=900',
    'REFRESH_TOKEN_TTL=604800',
    'LOCAL_STORAGE_PATH=./storage',
    'MAX_UPLOAD_BYTES=10485760',
    '',
  ].join('\n'),
  { flag: 'wx', mode: 0o600 },
);
await writeFile(
  '.env.test',
  'TEST_DATABASE_URL=postgresql://asl_local@127.0.0.1:55432/adaptive_spatial_labs_test\n',
  { flag: 'wx', mode: 0o600 },
);
console.log('Local .env and .env.test created; secrets are not printed.');
