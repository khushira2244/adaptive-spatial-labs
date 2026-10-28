import { eq } from 'drizzle-orm';
import { AppError } from '../../../shared/errors/app-error.js';
import type { Database } from '../../../shared/database/client.js';
import type { Principal } from '../../../shared/auth/principal.js';
import { ProjectAccess } from '../../../shared/auth/authorization.js';
import { architectureContext } from '../../knowledge/knowledge.context.js';
import { KnowledgeService } from '../../knowledge/knowledge.service.js';
import { requireProjectReferences } from '../../project-sources/provenance.contract.js';
import { sourceReferences } from '../../project-sources/provenance.schema.js';
import { ArchitectureRepository } from '../../architecture/architecture.repository.js';
import type { ContextInput } from '../schemas/ai.input.js';
import { architecturePackage } from './context-package.js';
export class ArchitectureAIContext {
  constructor(
    private db: Database,
    private knowledge: KnowledgeService,
  ) {}
  async resolve(principal: Principal, input: Extract<ContextInput, { kind: 'ARCHITECTURE' }>) {
    return this.db.transaction(async (tx) => {
      await architectureContext(tx, principal, input.projectId, input.scope, { snapshot: true });
      const family = await new ArchitectureRepository(tx).load(input.scope.architectureId);
      const p = architecturePackage(family, input.scope, input.expandBoundary),
        knowledge: unknown[] = [],
        sources: unknown[] = [];
      for (const [index, id] of input.knowledgeIds.entries()) {
        const item = await this.knowledge.readIn(tx, principal, id);
        if (item.projectId && item.projectId !== input.projectId)
          throw new AppError('DOMAIN_NOT_FOUND', 'Knowledge outside requested Project.');
        const key = 'knowledge:' + index;
        knowledge.push({ key, title: item.title, body: item.body, category: item.category });
        p.references.push(key);
      }
      await new ProjectAccess(tx).read(principal, input.projectId);
      await requireProjectReferences(tx, input.projectId, input.sourceReferenceIds);
      for (const id of input.sourceReferenceIds) {
        const [s] = await tx
          .select({ revision: sourceReferences.revision, locator: sourceReferences.locator })
          .from(sourceReferences)
          .where(eq(sourceReferences.id, id));
        const key = 'source:' + id;
        sources.push({ key, revision: s!.revision, locator: s!.locator });
        p.references.push(key);
      }
      p.payload.knowledge = knowledge;
      p.payload.sources = sources;
      p.basis.projectId = input.projectId;
      return p;
    });
  }
}
