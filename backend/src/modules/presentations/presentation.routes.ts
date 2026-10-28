import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { Database } from '../../shared/database/client.js';
import type { AuthService } from '../auth/auth.service.js';
import { PrincipalResolver } from '../../shared/auth/principal-resolver.js';
import { AppError } from '../../shared/errors/app-error.js';
import { data } from '../../shared/validation/common.js';
import { uuidIdentitySchema } from '../../shared/validation/uuid-identity.js';
import { PresentationService } from './presentation.service.js';
import { PresentationQuery } from './presentation.query.js';
import { ScreenService } from './screen.service.js';
import {
  createInput,
  setupCommand,
  inviteInput,
  invitationCommand,
  addScreenInput,
  screenCommand,
  params,
  screenParams,
  invitationParams,
  listQuery,
} from './presentation.input.js';
export function presentationRoutes(
  app: FastifyInstance,
  db: Database,
  auth: AuthService,
  service: PresentationService,
  screens: ScreenService,
  query: PresentationQuery,
) {
  const principal = async (req: FastifyRequest, id?: string) => {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer '))
      throw new AppError('AUTH_UNAUTHORIZED', 'Bearer authentication required.');
    const token = header.slice(7),
      resolver = new PrincipalResolver(db);
    if (id && /^[a-f0-9]{64}$/.test(token))
      return resolver.guest(token, { kind: 'PRESENTATION', id });
    return resolver.registered(auth, token);
  };
  const base = '/api/v1/presentations';
  app.post(base, async (req) =>
    data(await service.create(await principal(req), createInput.parse(req.body))),
  );
  app.get(base, async (req) => {
    const q = listQuery.parse(req.query);
    return data(await query.list(await principal(req), q.projectId, q.limit, q.offset));
  });
  app.get(base + '/:presentationId', async (req) => {
    const p = params.parse(req.params);
    return data(await query.read(await principal(req, p.presentationId), p.presentationId));
  });
  app.post(base + '/:presentationId/commands', async (req) => {
    const p = params.parse(req.params);
    return data(
      await service.setup(
        await principal(req, p.presentationId),
        p.presentationId,
        setupCommand.parse(req.body),
      ),
    );
  });
  app.post(base + '/:presentationId/screens', async (req) => {
    const p = params.parse(req.params);
    return data(
      await screens.add(
        await principal(req, p.presentationId),
        p.presentationId,
        addScreenInput.parse(req.body),
      ),
    );
  });
  app.post(base + '/:presentationId/screens/:screenId/commands', async (req) => {
    const p = screenParams.parse(req.params);
    return data(
      await screens.command(
        await principal(req, p.presentationId),
        p.presentationId,
        p.screenId,
        screenCommand.parse(req.body),
      ),
    );
  });
  app.get(base + '/:presentationId/definitions/:definitionId', async (req) => {
    const raw = req.params as { presentationId: unknown; definitionId: unknown };
    const id = uuidIdentitySchema.parse(raw.presentationId);
    return data(
      await query.read(await principal(req, id), id, uuidIdentitySchema.parse(raw.definitionId)),
    );
  });
  app.post(base + '/:presentationId/invitations', async (req) => {
    const p = params.parse(req.params);
    return data(
      await service.invite(
        await principal(req, p.presentationId),
        p.presentationId,
        inviteInput.parse(req.body),
      ),
    );
  });
  app.post(base + '/:presentationId/invitations/:invitationId/respond', async (req) => {
    const p = invitationParams.parse(req.params);
    return data(
      await service.respond(
        await principal(req),
        p.presentationId,
        p.invitationId,
        invitationCommand.parse(req.body),
      ),
    );
  });
}
