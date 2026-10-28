import { aiRoutes } from '../modules/ai/ai.routes.js';
import { AIService } from '../modules/ai/ai.service.js';
import { AIContextResolver } from '../modules/ai/capabilities/context-resolver.js';
import { AIExecutor } from '../modules/ai/orchestration/ai.executor.js';
import { readAIConfig } from '../modules/ai/ai.config.js';
import { VertexGeminiProvider } from '../modules/ai/providers/vertex-gemini.provider.js';
import type { AIProvider } from '../modules/ai/providers/ai-provider.js';
import { outcomeRoutes } from '../modules/outcomes/outcome.routes.js';
import { meetingKnowledgePolicy } from '../modules/meetings/meeting.context.js';
import websocket from '@fastify/websocket';
import { meetingRoutes } from '../modules/meetings/meeting.routes.js';
import { presentationRoutes } from '../modules/presentations/presentation.routes.js';
import { PresentationService } from '../modules/presentations/presentation.service.js';
import { ScreenService } from '../modules/presentations/screen.service.js';
import { PresentationQuery } from '../modules/presentations/presentation.query.js';
import { knowledgeRoutes } from '../modules/knowledge/knowledge.routes.js';
import { KnowledgeService } from '../modules/knowledge/knowledge.service.js';
import { SnapshotService } from '../modules/knowledge/snapshot.service.js';
import { CommandTransactions } from '../shared/database/command-transaction.js';
import { domainWrites } from './domain-writes.js';
import { step2Routes } from './step2.routes.js';
import { ProvenanceService } from '../modules/project-sources/provenance.service.js';
import { ArchitectureService } from '../modules/architecture/architecture.service.js';
import Fastify, { LogController } from 'fastify';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import type { Config } from '../shared/config/config.js';
import type { Database } from '../shared/database/client.js';
import type { StorageProvider } from '../shared/storage/storage-provider.js';
import { installErrorHandler } from '../shared/errors/app-error.js';
import { TokenService } from '../shared/auth/token-service.js';
import { requireAuthenticatedUser } from '../shared/auth/authentication.js';
import { AuthRepository } from '../modules/auth/auth.repository.js';
import { AuthService } from '../modules/auth/auth.service.js';
import { authRoutes } from '../modules/auth/auth.routes.js';
import { UserRepository } from '../modules/users/user.repository.js';
import { UserService } from '../modules/users/user.service.js';
import { userRoutes } from '../modules/users/user.routes.js';
import { OrganizationRepository } from '../modules/organizations/organization.repository.js';
import { OrganizationService } from '../modules/organizations/organization.service.js';
import { organizationRoutes } from '../modules/organizations/organization.routes.js';
import { PreferenceRepository } from '../modules/preferences/preference.repository.js';
import { PreferenceService } from '../modules/preferences/preference.service.js';
import { preferenceRoutes } from '../modules/preferences/preference.routes.js';
import { ProjectRepository } from '../modules/projects/project.repository.js';
import { ProjectService } from '../modules/projects/project.service.js';
import { ProjectCreationService } from '../modules/projects/project-creation.service.js';
import { ProjectAuthorization } from '../modules/projects/project.authorization.js';
import { projectRoutes } from '../modules/projects/project.routes.js';
import { EditorRepository } from '../modules/project-editors/editor.repository.js';
import { EditorService } from '../modules/project-editors/editor.service.js';
import { editorRoutes } from '../modules/project-editors/editor.routes.js';
import { LayerRepository } from '../modules/project-layers/layer.repository.js';
import { LayerService } from '../modules/project-layers/layer.service.js';
import { layerRoutes } from '../modules/project-layers/layer.routes.js';
import { StructureRepository } from '../modules/project-structure/structure.repository.js';
import { StructureService } from '../modules/project-structure/structure.service.js';
import { structureRoutes } from '../modules/project-structure/structure.routes.js';
import { SourceRepository } from '../modules/project-sources/source.repository.js';
import { SourceService } from '../modules/project-sources/source.service.js';
import { UploadService } from '../modules/project-sources/upload.service.js';
import { sourceRoutes } from '../modules/project-sources/source.routes.js';

export async function buildApp(options: {
  db: Database;
  config: Config;
  storage: StorageProvider;
  logging?: boolean;
  aiProvider?: AIProvider | null;
}) {
  const { db, config, storage } = options;
  const logging = options.logging ?? config.NODE_ENV !== 'test';
  const app = Fastify({
    logger: logging
      ? {
          redact: [
            'req.headers.authorization',
            'req.body.password',
            'req.body.refreshToken',
            'accessToken',
            'refreshToken',
            'password',
            'passwordHash',
          ],
        }
      : false,
    logController: new LogController({ disableRequestLogging: true }),
    bodyLimit: 1048576,
  });
  await app.register(websocket, { options: { maxPayload: 65536, perMessageDeflate: false } });
  installErrorHandler(app);
  app.decorateRequest('identity', null);
  await app.register(multipart, {
    limits: { fileSize: config.MAX_UPLOAD_BYTES, files: 1, fields: 0, parts: 1 },
  });
  await app.register(rateLimit, {
    global: config.NODE_ENV !== 'test',
    max: config.NODE_ENV === 'test' ? 10000 : 300,
    timeWindow: '1 minute',
    enableDraftSpec: true,
  });
  app.addHook('onResponse', async (req, reply) => {
    const rawId = (req.params as { projectId?: unknown } | null)?.projectId;
    const projectId = typeof rawId === 'string' && /^[a-f0-9-]{36}$/.test(rawId) ? rawId : null;
    req.log.info(
      {
        requestId: req.id,
        route: req.routeOptions.url,
        status: reply.statusCode,
        duration: reply.elapsedTime,
        userId: req.identity?.userId ?? null,
        projectId,
      },
      'Request completed',
    );
  });
  const tokens = new TokenService(config);
  const auth = new AuthService(db, new AuthRepository(db), tokens);
  const authenticated = requireAuthenticatedUser(auth);
  const authorization = new ProjectAuthorization(db);
  authRoutes(app, auth);
  userRoutes(app, new UserService(new UserRepository(db)), authenticated);
  organizationRoutes(
    app,
    new OrganizationService(db, new OrganizationRepository(db)),
    authenticated,
  );
  preferenceRoutes(app, new PreferenceService(db, new PreferenceRepository(db)), authenticated);
  projectRoutes(
    app,
    new ProjectService(db, new ProjectRepository(db), authorization),
    new ProjectCreationService(db),
    authenticated,
  );
  editorRoutes(app, new EditorService(db, new EditorRepository(db), authorization), authenticated);
  layerRoutes(app, new LayerService(db, new LayerRepository(db), authorization), authenticated);
  structureRoutes(
    app,
    new StructureService(db, new StructureRepository(db), authorization),
    authenticated,
  );
  sourceRoutes(
    app,
    new SourceService(db, new SourceRepository(db), authorization, storage),
    new UploadService(db, new SourceRepository(db), storage, config.MAX_UPLOAD_BYTES),
    authenticated,
  );
  const writes = domainWrites(db, config);
  step2Routes(
    app,
    db,
    auth,
    authenticated,
    new ProvenanceService(db, writes),
    new ArchitectureService(db, writes),
  );
  knowledgeRoutes(
    app,
    db,
    auth,
    authenticated,
    new KnowledgeService(db, writes, new CommandTransactions(db), meetingKnowledgePolicy),
    new SnapshotService(db, writes, meetingKnowledgePolicy),
  );
  presentationRoutes(
    app,
    db,
    auth,
    new PresentationService(db, writes),
    new ScreenService(
      db,
      writes,
      new KnowledgeService(db, writes, new CommandTransactions(db), meetingKnowledgePolicy),
      new SnapshotService(db, writes, meetingKnowledgePolicy),
    ),
    new PresentationQuery(db),
  );
  meetingRoutes(app, db, config, auth);
  outcomeRoutes(app, db, auth, writes);
  const aiConfig = readAIConfig();
  const aiProvider =
    options.aiProvider !== undefined
      ? options.aiProvider
      : aiConfig?.AI_ENABLED && aiConfig.GOOGLE_CLOUD_PROJECT
        ? new VertexGeminiProvider(aiConfig)
        : null;
  aiRoutes(
    app,
    db,
    auth,
    new AIService(
      db,
      new AIContextResolver(
        db,
        new KnowledgeService(db, writes, new CommandTransactions(db), meetingKnowledgePolicy),
      ),
      new AIExecutor(aiProvider, aiConfig?.AI_TIMEOUT_MS ?? 20000, (event) =>
        app.log.info(event, 'AI capability metadata'),
      ),
    ),
    config.NODE_ENV === 'test',
  );
  app.get('/api/v1/health', async () => ({ data: { status: 'ok' } }));
  await app.ready();
  return app;
}
