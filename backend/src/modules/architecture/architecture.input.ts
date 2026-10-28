import { z } from 'zod';
import { uuidIdentitySchema as uuid } from '../../shared/validation/uuid-identity.js';
import { changeStampSchema } from '../../shared/concurrency/change-stamp.js';

export const nodeTypes = [
  'SERVICE',
  'API',
  'DATABASE',
  'CACHE',
  'QUEUE_EVENT',
  'GATEWAY',
  'FRONTEND_CLIENT',
  'EXTERNAL_SYSTEM',
  'GENERIC',
] as const;
const refs = z.array(uuid).max(32).default([]);
const label = z.string().trim().min(1).max(200);
export const positionSchema = z
  .object({
    x: z.number().finite().min(-1000000).max(1000000),
    y: z.number().finite().min(-1000000).max(1000000),
    z: z.literal(0).default(0),
  })
  .strict();
export const nodeSchema = z
  .object({
    id: uuid,
    name: label,
    type: z.enum(nodeTypes),
    position: positionSchema,
    description: z.string().max(1000).default(''),
    technology: z.string().max(120).default(''),
    sourceReferenceIds: refs,
  })
  .strict();
export const connectionSchema = z
  .object({
    id: uuid,
    sourceNodeId: uuid,
    destinationNodeId: uuid,
    relationship: z
      .enum(['DEPENDS_ON', 'REQUEST', 'EVENT', 'DATA_FLOW', 'OTHER'])
      .default('DEPENDS_ON'),
    label: z.string().max(120).default(''),
    sourceReferenceIds: refs,
  })
  .strict();
export const graphSchema = z
  .object({
    id: uuid,
    kind: z.enum(['ROOT', 'INNER']),
    name: label,
    sourceReferenceIds: refs,
    nodes: z.array(nodeSchema).min(1).max(256),
    connections: z.array(connectionSchema).max(512),
  })
  .strict();
export const innerLinkSchema = z
  .object({ id: uuid, parentNodeId: uuid, childGraphId: uuid })
  .strict();
export const familySchema = z
  .object({
    rootGraphId: uuid,
    graphs: z.array(graphSchema).min(1).max(32),
    innerLinks: z.array(innerLinkSchema).max(31),
  })
  .strict();
export type GraphFamily = z.infer<typeof familySchema>;
export type GraphNode = z.infer<typeof nodeSchema>;
export type GraphConnection = z.infer<typeof connectionSchema>;
export type InnerLink = z.infer<typeof innerLinkSchema>;
export type Checkpoint = { graphId: string; selectedNodeId?: string };
export type CorrectionState = {
  phase: 'REVIEW' | 'CORRECTION' | 'CLOSED';
  undo: GraphFamily[];
  redo: GraphFamily[];
  checkpoint?: Checkpoint;
};
export const architectureParams = z.object({ projectId: uuid }).strict();
export const innerGraphParams = architectureParams.extend({ graphId: uuid });
export const initializeInput = z.object({ operationId: uuid, proposal: familySchema }).strict();
const command = { operationId: uuid, expectedStamp: changeStampSchema };
export const correctionInput = z.discriminatedUnion('action', [
  z.object({ ...command, action: z.literal('RENAME_NODE'), nodeId: uuid, name: label }).strict(),
  z
    .object({
      ...command,
      action: z.literal('CHANGE_NODE_TYPE'),
      nodeId: uuid,
      type: z.enum(nodeTypes),
    })
    .strict(),
  z
    .object({ ...command, action: z.literal('MOVE_NODE'), nodeId: uuid, position: positionSchema })
    .strict(),
  z.object({ ...command, action: z.literal('ADD_NODE'), graphId: uuid, node: nodeSchema }).strict(),
  z.object({ ...command, action: z.literal('DELETE_NODE'), nodeId: uuid }).strict(),
  z
    .object({
      ...command,
      action: z.literal('ADD_CONNECTION'),
      graphId: uuid,
      connection: connectionSchema,
    })
    .strict(),
  z.object({ ...command, action: z.literal('DELETE_CONNECTION'), connectionId: uuid }).strict(),
  z
    .object({
      ...command,
      action: z.literal('REPARENT_INNER'),
      childGraphId: uuid,
      parentNodeId: uuid,
      previousParentNodeId: uuid,
    })
    .strict(),
  z.object({ ...command, action: z.literal('UNDO') }).strict(),
  z.object({ ...command, action: z.literal('REDO') }).strict(),
  z
    .object({
      ...command,
      action: z.literal('CHECKPOINT'),
      checkpoint: z.object({ graphId: uuid, selectedNodeId: uuid.optional() }).strict(),
    })
    .strict(),
  z.object({ ...command, action: z.literal('DONE') }).strict(),
]);
export const confirmInput = z.object(command).strict();
export type InitializeInput = z.infer<typeof initializeInput>;
export type CorrectionInput = z.infer<typeof correctionInput>;
export type ConfirmInput = z.infer<typeof confirmInput>;
