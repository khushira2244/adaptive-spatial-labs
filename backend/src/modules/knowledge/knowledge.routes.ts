import type { FastifyInstance, FastifyRequest, preHandlerHookHandler } from 'fastify';
import type { Database } from '../../shared/database/client.js';
import type { AuthService } from '../auth/auth.service.js';
import { PrincipalResolver } from '../../shared/auth/principal-resolver.js';
import { data } from '../../shared/validation/common.js';
import { KnowledgeService } from './knowledge.service.js';
import { SnapshotService } from './snapshot.service.js';
import {
  createKnowledgeInput,
  updateKnowledgeInput,
  createSnapshotInput,
  resourceParams,
  privateQuery,
} from './knowledge.input.js';
export function knowledgeRoutes(
  app: FastifyInstance,
  db: Database,
  auth: AuthService,
  guard: preHandlerHookHandler,
  knowledge: KnowledgeService,
  snapshots: SnapshotService,
) {
  const principal = (req: FastifyRequest) =>
    new PrincipalResolver(db).registered(auth, req.headers.authorization!.slice(7));
  app.post('/api/v1/knowledge', { preHandler: guard }, async (req) =>
    data(await knowledge.create(await principal(req), createKnowledgeInput.parse(req.body))),
  );
  app.get('/api/v1/knowledge', { preHandler: guard }, async (req) =>
    data(await knowledge.list(await principal(req), privateQuery.parse(req.query))),
  );
  app.get('/api/v1/knowledge/:id', { preHandler: guard }, async (req) =>
    data(await knowledge.read(await principal(req), resourceParams.parse(req.params).id)),
  );
  app.put('/api/v1/knowledge/:id', { preHandler: guard }, async (req) =>
    data(
      await knowledge.update(
        await principal(req),
        resourceParams.parse(req.params).id,
        updateKnowledgeInput.parse(req.body),
      ),
    ),
  );
  app.post('/api/v1/snapshots', { preHandler: guard }, async (req) =>
    data(await snapshots.create(await principal(req), createSnapshotInput.parse(req.body))),
  );
  app.get('/api/v1/snapshots', { preHandler: guard }, async (req) =>
    data(await snapshots.list(await principal(req), privateQuery.parse(req.query))),
  );
  app.get('/api/v1/snapshots/:id', { preHandler: guard }, async (req) =>
    data(await snapshots.read(await principal(req), resourceParams.parse(req.params).id)),
  );
  app.get('/api/v1/my-space', { preHandler: guard }, async (req) => {
    const actor = await principal(req),
      query = privateQuery.parse(req.query);
    return data(
      await db.transaction(async (tx) => {
        const items = await knowledge.listIn(tx, actor, query),
          captures = await snapshots.listIn(tx, actor, query);
        return {
          items: items.items,
          snapshots: captures.snapshots,
          count: items.count + captures.count,
          limit: query.limit,
          offset: query.offset,
        };
      }),
    );
  });
}
