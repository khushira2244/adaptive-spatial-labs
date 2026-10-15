import type { FastifyInstance, preHandlerHookHandler } from 'fastify';
import { userId } from '../../shared/auth/authentication.js';
import { data } from '../../shared/validation/common.js';
import type { OrganizationService } from './organization.service.js';
import { organizationSchema, organizationParams, memberQuery } from './organization.schema.js';
export function organizationRoutes(
  app: FastifyInstance,
  service: OrganizationService,
  auth: preHandlerHookHandler,
) {
  app.get('/api/v1/organizations', { preHandler: auth }, async (req) =>
    data(await service.list(userId(req))),
  );
  app.post('/api/v1/organizations', { preHandler: auth }, async (req, reply) =>
    reply
      .code(201)
      .send(data(await service.create(organizationSchema.parse(req.body).name, userId(req)))),
  );
  app.get('/api/v1/organizations/:organizationId/members', { preHandler: auth }, async (req) => {
    const { organizationId } = organizationParams.parse(req.params);
    const q = memberQuery.parse(req.query);
    return data(await service.members(organizationId, userId(req), q.search, q.limit, q.offset));
  });
}
