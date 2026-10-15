import type { FastifyInstance, preHandlerHookHandler } from 'fastify';
import { userId } from '../../shared/auth/authentication.js';
import { data, projectParams } from '../../shared/validation/common.js';
import type { LayerService } from './layer.service.js';
import { layerInput, layerPatch, layerParams } from './layer.schema.js';
export function layerRoutes(
  app: FastifyInstance,
  service: LayerService,
  auth: preHandlerHookHandler,
) {
  app.get('/api/v1/projects/:projectId/layers', { preHandler: auth }, async (req) =>
    data(await service.list(projectParams.parse(req.params).projectId, userId(req))),
  );
  app.post('/api/v1/projects/:projectId/layers', { preHandler: auth }, async (req, reply) =>
    reply
      .code(201)
      .send(
        data(
          await service.add(
            projectParams.parse(req.params).projectId,
            userId(req),
            layerInput.parse(req.body),
          ),
        ),
      ),
  );
  app.patch('/api/v1/projects/:projectId/layers/:layerId', { preHandler: auth }, async (req) => {
    const p = layerParams.parse(req.params);
    return data(
      await service.update(p.projectId, p.layerId, userId(req), layerPatch.parse(req.body)),
    );
  });
  app.delete('/api/v1/projects/:projectId/layers/:layerId', { preHandler: auth }, async (req) => {
    const p = layerParams.parse(req.params);
    return data(await service.remove(p.projectId, p.layerId, userId(req)));
  });
}
