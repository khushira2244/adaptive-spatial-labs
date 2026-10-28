import { z } from 'zod';
import { uuidIdentitySchema as uuid } from '../../shared/validation/uuid-identity.js';
import { changeStampSchema as stamp } from '../../shared/concurrency/change-stamp.js';
import { semanticScopeSchema } from '../knowledge/knowledge.input.js';
const name = z.string().trim().min(1).max(200);
export const createMeeting = z
  .object({
    operationId: uuid,
    projectId: uuid,
    presentationId: uuid,
    title: name,
    startFromScreenId: uuid,
    scheduledAt: z.iso.datetime().nullable().default(null),
  })
  .strict();
const base = { operationId: uuid, expectedStamp: stamp };
export const meetingCommand = z.discriminatedUnion('action', [
  z
    .object({
      ...base,
      action: z.literal('SETUP'),
      title: name,
      startFromScreenId: uuid,
      scheduledAt: z.iso.datetime().nullable(),
    })
    .strict(),
  z.object({ ...base, action: z.literal('START') }).strict(),
  z.object({ ...base, action: z.literal('END') }).strict(),
  z.object({ ...base, action: z.literal('TAKE_BACK') }).strict(),
  z
    .object({ ...base, action: z.literal('NAVIGATE'), authorityGeneration: stamp, screenId: uuid })
    .strict(),
  z
    .object({
      ...base,
      action: z.literal('FOCUS'),
      authorityGeneration: stamp,
      scope: semanticScopeSchema,
    })
    .strict(),
  z
    .object({
      ...base,
      action: z.literal('REQUEST_TRANSFER'),
      authorityGeneration: stamp,
      targetParticipantId: uuid,
    })
    .strict(),
  z.object({ ...base, action: z.literal('ACCEPT_TRANSFER'), requestId: uuid }).strict(),
  z.object({ ...base, action: z.literal('DECLINE_TRANSFER'), requestId: uuid }).strict(),
  z.object({ ...base, action: z.literal('LEAVE') }).strict(),
  z.object({ ...base, action: z.literal('REVOKE'), participantId: uuid }).strict(),
]);
export type MeetingCommand = z.infer<typeof meetingCommand>;
export const inviteMeeting = z
  .object({
    ...base,
    email: z
      .email()
      .max(254)
      .transform((s) => s.toLowerCase()),
    expiresInDays: z.number().int().min(1).max(30),
  })
  .strict();
export const respondMeeting = z
  .object({ operationId: uuid, action: z.enum(['ACCEPT', 'DECLINE', 'CANCEL']) })
  .strict();
export const joinMeeting = z.object({ operationId: uuid }).strict();
export const checkpoint = z
  .object({
    expectedStamp: stamp,
    following: z.boolean(),
    screenId: uuid,
    scope: semanticScopeSchema.optional(),
  })
  .strict();
export const publicationCommand = z.discriminatedUnion('action', [
  z
    .object({
      ...base,
      action: z.literal('SHARE'),
      category: z.enum(['NOTE', 'QUESTION', 'DISCUSSION_POINT', 'ACTION_SUGGESTION', 'SNAPSHOT']),
      origin: z.discriminatedUnion('kind', [
        z.object({ kind: z.literal('KNOWLEDGE'), id: uuid, expectedItemStamp: stamp }).strict(),
        z.object({ kind: z.literal('SNAPSHOT'), id: uuid }).strict(),
      ]),
      scope: semanticScopeSchema,
    })
    .strict(),
  z
    .object({
      ...base,
      action: z.literal('UPDATE'),
      publicationId: uuid,
      expectedPublicationStamp: stamp,
      origin: z.discriminatedUnion('kind', [
        z.object({ kind: z.literal('KNOWLEDGE'), id: uuid, expectedItemStamp: stamp }).strict(),
        z.object({ kind: z.literal('SNAPSHOT'), id: uuid }).strict(),
      ]),
      scope: semanticScopeSchema,
    })
    .strict(),
  z
    .object({
      ...base,
      action: z.literal('WITHDRAW'),
      publicationId: uuid,
      expectedPublicationStamp: stamp,
    })
    .strict(),
]);
export type PublicationCommand = z.infer<typeof publicationCommand>;
export const params = z.object({ meetingId: uuid }).strict();
export const invitationParams = params.extend({ invitationId: uuid });
export const page = z
  .object({
    limit: z.coerce.number().int().min(1).max(100).default(50),
    offset: z.coerce.number().int().min(0).max(10000).default(0),
  })
  .strict();
export const realtimeCommand = z.discriminatedUnion('type', [
  z.object({ type: z.literal('COMMAND'), command: meetingCommand }).strict(),
  z.object({ type: z.literal('PUBLICATION'), command: publicationCommand }).strict(),
  z.object({ type: z.literal('RETURN_TO_LIVE') }).strict(),
  z.object({ type: z.literal('SYNC') }).strict(),
]);
