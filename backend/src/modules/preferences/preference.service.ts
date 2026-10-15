import type { z } from 'zod';
import type { Database } from '../../shared/database/client.js';
import { PreferenceRepository } from './preference.repository.js';
import {
  defaultPreferences,
  preferencesSchema,
  type preferencePatch,
} from './preference.schema.js';
export class PreferenceService {
  constructor(
    private db: Database,
    private repository: PreferenceRepository,
  ) {}
  async read(userId: string) {
    return (await this.repository.read(userId))?.preferences ?? defaultPreferences;
  }
  update(userId: string, patch: z.infer<typeof preferencePatch>) {
    return this.db.transaction(async (tx) => {
      const repo = new PreferenceRepository(tx);
      await repo.initialize(userId, defaultPreferences);
      const existing = await repo.lock(userId);
      const preferences = preferencesSchema.parse({
        ...(existing?.preferences ?? defaultPreferences),
        ...patch,
      });
      await repo.write(userId, preferences);
      return preferences;
    });
  }
}
