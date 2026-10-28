import { meetingKnowledgePolicy } from './meeting.context.js';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { Database } from '../../shared/database/client.js';
import type { Config } from '../../shared/config/config.js';
import type { AuthService } from '../auth/auth.service.js';
import { PrincipalResolver } from '../../shared/auth/principal-resolver.js';
import { AppError } from '../../shared/errors/app-error.js';
import { uuidIdentitySchema } from '../../shared/validation/uuid-identity.js';
import { data } from '../../shared/validation/common.js';
import { domainWrites } from '../../app/domain-writes.js';
import { CommandTransactions } from '../../shared/database/command-transaction.js';
import { KnowledgeService } from '../knowledge/knowledge.service.js';
import { SnapshotService } from '../knowledge/snapshot.service.js';
import {
  createKnowledgeInput,
  createSnapshotInput,
  updateKnowledgeInput,
  privateQuery,
} from '../knowledge/knowledge.input.js';
import { MeetingService } from './meeting.service.js';
import { MeetingControl } from './meeting.control.js';
import { MeetingAdmission } from './meeting.admission.js';
import { PublicationService } from './publication.service.js';
import { MeetingQuery } from './meeting.query.js';
import { MeetingPresence } from './meeting.presence.js';
import { MeetingRealtime } from './meeting.realtime.js';
import { meetingAccess, requireLive } from './meeting.access.js';
import {
  createMeeting,
  meetingCommand,
  inviteMeeting,
  respondMeeting,
  joinMeeting,
  checkpoint,
  publicationCommand,
  params,
  invitationParams,
  page,
} from './meeting.input.js';
import type { Principal } from '../../shared/auth/principal.js';
export function meetingRoutes(
  app: FastifyInstance,
  db: Database,
  config: Config,
  auth: AuthService,
) {
  const writes = domainWrites(db, config),
    knowledge = new KnowledgeService(
      db,
      writes,
      new CommandTransactions(db),
      meetingKnowledgePolicy,
    ),
    snapshots = new SnapshotService(db, writes, meetingKnowledgePolicy),
    query = new MeetingQuery(db);
  let realtime: MeetingRealtime;
  const notify = (id: string, event: string) => realtime.broadcast(id, event);
  const service = new MeetingService(db, writes, notify),
    control = new MeetingControl(db, writes, notify),
    admission = new MeetingAdmission(db, writes, notify),
    publications = new PublicationService(db, writes, knowledge, snapshots, notify),
    presence = new MeetingPresence(db, notify);
  realtime = new MeetingRealtime(query, control, publications, service, presence);
  realtime.installHeartbeat(app);
  app.addHook('onReady', () => presence.recover());
  const resolve = async (req: FastifyRequest, id?: string) => {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer '))
      throw new AppError('AUTH_UNAUTHORIZED', 'Bearer authentication required.');
    const token = header.slice(7),
      resolver = new PrincipalResolver(db);
    return id && /^[a-f0-9]{64}$/.test(token)
      ? resolver.guest(token, { kind: 'MEETING', id })
      : resolver.registered(auth, token);
  };
  const root = '/api/v1/meetings',
    idOf = (req: FastifyRequest) => params.parse(req.params).meetingId;
  app.post(root, async (req) =>
    data(await service.create(await resolve(req), createMeeting.parse(req.body))),
  );
  app.get(root, async (req) => {
    const q = page.parse(req.query);
    return data(await query.list(await resolve(req), q.limit, q.offset));
  });
  app.get(root + '/:meetingId', async (req) => {
    const id = idOf(req);
    return data(await query.read(await resolve(req, id), id));
  });
  app.post(root + '/:meetingId/commands', async (req) => {
    const id = idOf(req),
      principal = await resolve(req, id),
      input = meetingCommand.parse(req.body);
    return data(
      input.action === 'START' || input.action === 'END' || input.action === 'SETUP'
        ? await service.lifecycle(principal, id, input)
        : await control.command(principal, id, input),
    );
  });
  app.post(root + '/:meetingId/invitations', async (req) => {
    const id = idOf(req);
    return data(await admission.invite(await resolve(req, id), id, inviteMeeting.parse(req.body)));
  });
  app.post(root + '/:meetingId/invitations/:invitationId/respond', async (req) => {
    const p = invitationParams.parse(req.params);
    return data(
      await admission.respond(
        await resolve(req),
        p.meetingId,
        p.invitationId,
        respondMeeting.parse(req.body),
      ),
    );
  });
  app.post(root + '/:meetingId/join', async (req) => {
    const id = idOf(req);
    return data(
      await admission.join(await resolve(req, id), id, joinMeeting.parse(req.body).operationId),
    );
  });
  app.post(root + '/:meetingId/publications', async (req) => {
    const id = idOf(req);
    return data(
      await publications.command(await resolve(req, id), id, publicationCommand.parse(req.body)),
    );
  });
  app.get(root + '/:meetingId/revisions/:revisionId', async (req) => {
    const raw = req.params as { meetingId: unknown; revisionId: unknown },
      id = uuidIdentitySchema.parse(raw.meetingId);
    return data(
      await query.revision(await resolve(req, id), id, uuidIdentitySchema.parse(raw.revisionId)),
    );
  });
  app.get(root + '/:meetingId/private/checkpoint', async (req) => {
    const id = idOf(req);
    return data(await control.private(await resolve(req, id), id));
  });
  app.put(root + '/:meetingId/private/checkpoint', async (req) => {
    const id = idOf(req);
    return data(await control.private(await resolve(req, id), id, checkpoint.parse(req.body)));
  });
  app.post(root + '/:meetingId/return-to-live', async (req) => {
    const id = idOf(req);
    return data(await control.private(await resolve(req, id), id, undefined, true));
  });
  const scopedBody = (value: unknown, id: string) => {
    if (!value || typeof value !== 'object' || Array.isArray(value))
      throw new AppError('VALIDATION_ERROR', 'A private body is required.');
    const input = value as Record<string, unknown>;
    if (input.meetingId !== undefined && input.meetingId !== id)
      throw new AppError('VALIDATION_ERROR', 'Meeting scope mismatch.');
    return { ...input, meetingId: id };
  };
  app.post(root + '/:meetingId/private/items', async (req) => {
    const id = idOf(req);
    return data(
      await knowledge.create(
        await resolve(req, id),
        createKnowledgeInput.parse(scopedBody(req.body, id)),
      ),
    );
  });
  app.post(root + '/:meetingId/private/snapshots', async (req) => {
    const id = idOf(req);
    return data(
      await snapshots.create(
        await resolve(req, id),
        createSnapshotInput.parse(scopedBody(req.body, id)),
      ),
    );
  });
  app.get(root + '/:meetingId/my-space', async (req) => {
    const id = idOf(req),
      principal = await resolve(req, id),
      q = privateQuery.parse({ ...(req.query as object), meetingId: id });
    return data(
      await db.transaction(async (tx) => {
        await meetingAccess(tx, principal, id);
        const k = await knowledge.listIn(tx, principal, q),
          s = await snapshots.listIn(tx, principal, q);
        return { items: k.items, snapshots: s.snapshots, count: k.count + s.count };
      }),
    );
  });
  app.get(root + '/:meetingId/private/items/:itemId', async (req) => {
    const raw = req.params as { meetingId: unknown; itemId: unknown },
      id = uuidIdentitySchema.parse(raw.meetingId),
      principal = await resolve(req, id);
    await db.transaction((tx) => meetingAccess(tx, principal, id));
    const item = await knowledge.read(principal, uuidIdentitySchema.parse(raw.itemId));
    if (item.meetingId !== id) throw new AppError('DOMAIN_NOT_FOUND', 'Private item not found.');
    return data(item);
  });
  app.put(root + '/:meetingId/private/items/:itemId', async (req) => {
    const raw = req.params as { meetingId: unknown; itemId: unknown },
      id = uuidIdentitySchema.parse(raw.meetingId),
      principal = await resolve(req, id),
      itemId = uuidIdentitySchema.parse(raw.itemId);
    const item = await knowledge.read(principal, itemId);
    if (item.meetingId !== id) throw new AppError('DOMAIN_NOT_FOUND', 'Private item not found.');
    return data(await knowledge.update(principal, itemId, updateKnowledgeInput.parse(req.body)));
  });
  const principals = new WeakMap<FastifyRequest, Principal>();
  app.get(
    root + '/:meetingId/ws',
    {
      websocket: true,
      preValidation: async (req) => {
        const id = idOf(req),
          principal = await resolve(req, id),
          view = await query.read(principal, id);
        requireLive(view.state);
        principals.set(req, principal);
      },
    },
    (socket, req) => {
      const principal = principals.get(req);
      if (!principal) {
        socket.close(1008);
        return;
      }
      realtime.attach(idOf(req), principal, socket);
    },
  );
}
