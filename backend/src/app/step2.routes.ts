import type { FastifyInstance, FastifyRequest, preHandlerHookHandler } from 'fastify';
import type { Database } from '../shared/database/client.js';
import type { AuthService } from '../modules/auth/auth.service.js';
import { PrincipalResolver } from '../shared/auth/principal-resolver.js';
import { data } from '../shared/validation/common.js';
import { ProvenanceService } from '../modules/project-sources/provenance.service.js';
import { ArchitectureService } from '../modules/architecture/architecture.service.js';
import {
  provenanceParams,
  ingestionParams,
  referenceInput,
  ingestionInput,
  ingestionTransition,
} from '../modules/project-sources/provenance.input.js';
import {
  architectureParams,
  innerGraphParams,
  initializeInput,
  correctionInput,
  confirmInput,
} from '../modules/architecture/architecture.input.js';
export function step2Routes(
  app: FastifyInstance,
  db: Database,
  auth: AuthService,
  guard: preHandlerHookHandler,
  sources: ProvenanceService,
  architecture: ArchitectureService,
) {
  const principal = (req: FastifyRequest) =>
    new PrincipalResolver(db).registered(auth, req.headers.authorization!.slice(7));
  const sourceBase = '/api/v1/projects/:projectId/sources/:sourceId';
  for (const kind of ['references', 'runs'] as const) {
    app.get(sourceBase + '/' + kind, { preHandler: guard }, async (req) => {
      const p = provenanceParams.parse(req.params);
      return data(await sources.list(await principal(req), p.projectId, p.sourceId, kind));
    });
  }
  app.post(sourceBase + '/references', { preHandler: guard }, async (req) => {
    const p = provenanceParams.parse(req.params);
    return data(
      await sources.command(
        await principal(req),
        p.projectId,
        p.sourceId,
        referenceInput.parse(req.body),
      ),
    );
  });
  app.post(sourceBase + '/runs', { preHandler: guard }, async (req) => {
    const p = provenanceParams.parse(req.params);
    return data(
      await sources.command(
        await principal(req),
        p.projectId,
        p.sourceId,
        ingestionInput.parse(req.body),
      ),
    );
  });
  app.post(sourceBase + '/runs/:runId/commands', { preHandler: guard }, async (req) => {
    const p = ingestionParams.parse(req.params);
    return data(
      await sources.command(
        await principal(req),
        p.projectId,
        p.sourceId,
        ingestionTransition.parse(req.body),
        p.runId,
      ),
    );
  });
  const base = '/api/v1/projects/:projectId/architecture';
  app.get(base, { preHandler: guard }, async (req) =>
    data(
      await architecture.read(await principal(req), architectureParams.parse(req.params).projectId),
    ),
  );
  app.get(base + '/graphs/:graphId', { preHandler: guard }, async (req) => {
    const p = innerGraphParams.parse(req.params);
    return data(await architecture.read(await principal(req), p.projectId, p.graphId));
  });
  app.post(base, { preHandler: guard }, async (req) =>
    data(
      await architecture.command(
        await principal(req),
        architectureParams.parse(req.params).projectId,
        'initialize',
        initializeInput.parse(req.body),
      ),
    ),
  );
  app.post(base + '/corrections', { preHandler: guard }, async (req) =>
    data(
      await architecture.command(
        await principal(req),
        architectureParams.parse(req.params).projectId,
        'correct',
        correctionInput.parse(req.body),
      ),
    ),
  );
  app.post(base + '/confirm', { preHandler: guard }, async (req) =>
    data(
      await architecture.command(
        await principal(req),
        architectureParams.parse(req.params).projectId,
        'confirm',
        confirmInput.parse(req.body),
      ),
    ),
  );
}
