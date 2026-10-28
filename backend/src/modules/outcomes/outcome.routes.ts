import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { Database } from '../../shared/database/client.js';
import type { AuthService } from '../auth/auth.service.js';
import type { IdempotentOperations } from '../../shared/operations/idempotent-operation.js';
import { PrincipalResolver } from '../../shared/auth/principal-resolver.js';
import { AppError } from '../../shared/errors/app-error.js';
import { uuidIdentitySchema } from '../../shared/validation/uuid-identity.js';
import { data } from '../../shared/validation/common.js';
import { createReview, reviewCommand, page } from './outcome.input.js';
import { OutcomeService } from './outcome.service.js';
import { OutcomeQuery } from './outcome.query.js';
export function outcomeRoutes(
  app: FastifyInstance,
  db: Database,
  auth: AuthService,
  writes: IdempotentOperations,
) {
  const service = new OutcomeService(db, writes),
    query = new OutcomeQuery(db);
  const resolve = async (req: FastifyRequest) => {
    const h = req.headers.authorization;
    if (!h?.startsWith('Bearer '))
      throw new AppError('AUTH_UNAUTHORIZED', 'Bearer authentication required.');
    return new PrincipalResolver(db).registered(auth, h.slice(7));
  };
  const id = (req: FastifyRequest, key: string) =>
    uuidIdentitySchema.parse((req.params as Record<string, unknown>)[key]);
  app.post('/api/v1/meetings/:meetingId/review', async (req) =>
    data(
      await service.create(await resolve(req), id(req, 'meetingId'), createReview.parse(req.body)),
    ),
  );
  app.get('/api/v1/meetings/:meetingId/review', async (req) => {
    const p = page.parse(req.query);
    return data(await query.byMeeting(await resolve(req), id(req, 'meetingId'), p.limit, p.offset));
  });
  app.get('/api/v1/reviews/:reviewId', async (req) => {
    const p = page.parse(req.query);
    return data(await query.read(await resolve(req), id(req, 'reviewId'), p.limit, p.offset));
  });
  app.post('/api/v1/reviews/:reviewId/commands', async (req) =>
    data(
      await service.command(await resolve(req), id(req, 'reviewId'), reviewCommand.parse(req.body)),
    ),
  );
  for (const kind of ['decisions', 'actions', 'assessments'] as const)
    app.get('/api/v1/projects/:projectId/' + kind, async (req) => {
      const p = page.parse(req.query);
      return data(
        await query.project(await resolve(req), id(req, 'projectId'), kind, p.limit, p.offset),
      );
    });
  app.get('/api/v1/projects/:projectId/outcome-activity', async (req) =>
    data(await query.activity(await resolve(req), id(req, 'projectId'))),
  );
}
