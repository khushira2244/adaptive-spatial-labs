import type { FastifyInstance, preHandlerHookHandler } from 'fastify';
import { userId } from '../../shared/auth/authentication.js';
import { data, projectParams } from '../../shared/validation/common.js';
import { AppError } from '../../shared/errors/app-error.js';
import type { SourceService } from './source.service.js';
import type { UploadService } from './upload.service.js';
import { sourceInput, sourceParams, uploadParams } from './source.schema.js';
export function sourceRoutes(
  app: FastifyInstance,
  service: SourceService,
  uploads: UploadService,
  auth: preHandlerHookHandler,
) {
  app.post('/api/v1/uploads', { preHandler: auth }, async (req, reply) => {
    const file = await req.file();
    if (!file) throw new AppError('SOURCE_UPLOAD_FAILED', 'One file is required.');
    const bytes = await file.toBuffer();
    if (file.file.truncated)
      throw new AppError('SOURCE_UPLOAD_FAILED', 'File exceeds the upload limit.');
    return reply
      .code(201)
      .send(data(await uploads.stage(userId(req), file.filename, file.mimetype, bytes)));
  });
  app.delete('/api/v1/uploads/:uploadId', { preHandler: auth }, async (req) =>
    data(await uploads.remove(uploadParams.parse(req.params).uploadId, userId(req))),
  );
  app.get('/api/v1/projects/:projectId/sources', { preHandler: auth }, async (req) =>
    data(await service.list(projectParams.parse(req.params).projectId, userId(req))),
  );
  app.post('/api/v1/projects/:projectId/sources', { preHandler: auth }, async (req, reply) =>
    reply
      .code(201)
      .send(
        data(
          await service.add(
            projectParams.parse(req.params).projectId,
            userId(req),
            sourceInput.parse(req.body),
          ),
        ),
      ),
  );
  app.delete('/api/v1/projects/:projectId/sources/:sourceId', { preHandler: auth }, async (req) => {
    const p = sourceParams.parse(req.params);
    return data(await service.remove(p.projectId, p.sourceId, userId(req)));
  });
  app.get(
    '/api/v1/projects/:projectId/sources/:sourceId/content',
    { preHandler: auth },
    async (req, reply) => {
      const p = sourceParams.parse(req.params);
      const bytes = await service.download(p.projectId, p.sourceId, userId(req));
      return reply
        .type('application/octet-stream')
        .header('Content-Disposition', 'attachment')
        .header('X-Content-Type-Options', 'nosniff')
        .send(bytes);
    },
  );
}
