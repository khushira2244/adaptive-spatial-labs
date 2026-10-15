import type { FastifyInstance, preHandlerHookHandler } from 'fastify';
import { userId } from '../../shared/auth/authentication.js';
import { data, projectParams } from '../../shared/validation/common.js';
import { createProjectSchema, projectPatch, projectQuery } from './project.schema.js';
import type { ProjectService } from './project.service.js';
import type { ProjectCreationService } from './project-creation.service.js';
export function projectRoutes(
  app: FastifyInstance,
  service: ProjectService,
  creation: ProjectCreationService,
  auth: preHandlerHookHandler,
) {
  app.get('/api/v1/projects', { preHandler: auth }, async (req) =>
    data(await service.list(userId(req), projectQuery.parse(req.query))),
  );
  app.post('/api/v1/projects', { preHandler: auth }, async (req, reply) =>
    reply
      .code(201)
      .send(data(await creation.create(userId(req), createProjectSchema.parse(req.body)))),
  );
  app.get('/api/v1/projects/:projectId', { preHandler: auth }, async (req) =>
    data(await service.get(projectParams.parse(req.params).projectId, userId(req))),
  );
  app.patch('/api/v1/projects/:projectId', { preHandler: auth }, async (req) =>
    data(
      await service.update(
        projectParams.parse(req.params).projectId,
        userId(req),
        projectPatch.parse(req.body),
      ),
    ),
  );
}
