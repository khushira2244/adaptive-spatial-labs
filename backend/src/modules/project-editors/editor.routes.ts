import type { FastifyInstance, preHandlerHookHandler } from 'fastify';
import { userId } from '../../shared/auth/authentication.js';
import { data, projectParams } from '../../shared/validation/common.js';
import type { EditorService } from './editor.service.js';
import { editorParams, editorInput } from './editor.schema.js';
export function editorRoutes(
  app: FastifyInstance,
  service: EditorService,
  auth: preHandlerHookHandler,
) {
  app.get('/api/v1/projects/:projectId/editors', { preHandler: auth }, async (req) =>
    data(await service.list(projectParams.parse(req.params).projectId, userId(req))),
  );
  app.post('/api/v1/projects/:projectId/editors', { preHandler: auth }, async (req, reply) =>
    reply
      .code(201)
      .send(
        data(
          await service.add(
            projectParams.parse(req.params).projectId,
            userId(req),
            editorInput.parse(req.body).userId,
          ),
        ),
      ),
  );
  app.delete('/api/v1/projects/:projectId/editors/:userId', { preHandler: auth }, async (req) => {
    const p = editorParams.parse(req.params);
    return data(await service.remove(p.projectId, userId(req), p.userId));
  });
}
