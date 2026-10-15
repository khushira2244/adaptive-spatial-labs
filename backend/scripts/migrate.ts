import 'dotenv/config';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { connectDatabase } from '../src/shared/database/client.js';
const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is required');
const { db, pool } = connectDatabase(url);
try {
  await migrate(db, { migrationsFolder: './migrations' });
  console.log('Migrations applied.');
} finally {
  await pool.end();
}
