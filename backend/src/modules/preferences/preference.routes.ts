import type { FastifyInstance, preHandlerHookHandler } from 'fastify';
import { userId } from '../../shared/auth/authentication.js';
import { data } from '../../shared/validation/common.js';
import { preferencePatch } from './preference.schema.js';
import type { PreferenceService } from './preference.service.js';
export function preferenceRoutes(
  app: FastifyInstance,
  service: PreferenceService,
  auth: preHandlerHookHandler,
) {
  app.get('/api/v1/me/preferences', { preHandler: auth }, async (req) =>
    data(await service.read(userId(req))),
  );
  app.patch('/api/v1/me/preferences', { preHandler: auth }, async (req) =>
    data(await service.update(userId(req), preferencePatch.parse(req.body))),
  );
}
