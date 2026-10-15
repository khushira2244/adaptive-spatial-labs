import { z } from 'zod';
export const preferencesSchema = z
  .object({
    theme: z.enum(['SYSTEM', 'LIGHT', 'DARK']),
    reduceMotion: z.boolean(),
    notifications: z.object({ enabled: z.boolean(), email: z.boolean() }).strict(),
    mrPreferences: z.object({ comfortMode: z.boolean() }).strict(),
    interactionPreferences: z.object({ dominantHand: z.enum(['LEFT', 'RIGHT']) }).strict(),
  })
  .strict();
export const preferencePatch = preferencesSchema.partial().refine((v) => Object.keys(v).length > 0);
export const defaultPreferences: z.infer<typeof preferencesSchema> = {
  theme: 'SYSTEM',
  reduceMotion: false,
  notifications: { enabled: true, email: true },
  mrPreferences: { comfortMode: false },
  interactionPreferences: { dominantHand: 'RIGHT' },
};
