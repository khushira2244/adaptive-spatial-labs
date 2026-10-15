import type { FastifyInstance, preHandlerHookHandler } from 'fastify';
import { userId } from '../../shared/auth/authentication.js';
import { data } from '../../shared/validation/common.js';
import { profileSchema } from './user.schema.js';
import type { UserService } from './user.service.js';
export function userRoutes(
  app: FastifyInstance,
  service: UserService,
  auth: preHandlerHookHandler,
) {
  app.get('/api/v1/me', { preHandler: auth }, async (req) => data(await service.get(userId(req))));
  app.patch('/api/v1/me', { preHandler: auth }, async (req) =>
    data(await service.update(userId(req), profileSchema.parse(req.body))),
  );
}
