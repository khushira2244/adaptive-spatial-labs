import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/shared/database/schema.ts',
  out: './migrations',
});
