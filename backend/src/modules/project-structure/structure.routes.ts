import type { FastifyInstance, preHandlerHookHandler } from 'fastify';
import { userId } from '../../shared/auth/authentication.js';
import { data, projectParams } from '../../shared/validation/common.js';
import type { StructureService } from './structure.service.js';
import { structureInput } from './structure.schema.js';
import { templates } from './templates/templates.js';
export function structureRoutes(
  app: FastifyInstance,
  service: StructureService,
  auth: preHandlerHookHandler,
) {
  app.get('/api/v1/project-templates', { preHandler: auth }, async () => data(templates));
  app.get('/api/v1/projects/:projectId/structure', { preHandler: auth }, async (req) =>
    data(await service.get(projectParams.parse(req.params).projectId, userId(req))),
  );
  app.put('/api/v1/projects/:projectId/structure', { preHandler: auth }, async (req) =>
    data(
      await service.set(
        projectParams.parse(req.params).projectId,
        userId(req),
        structureInput.parse(req.body),
      ),
    ),
  );
}
