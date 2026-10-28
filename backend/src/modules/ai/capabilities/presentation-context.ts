import { presentationAccess } from '../../presentations/presentation.access.js';
import { PresentationQuery } from '../../presentations/presentation.query.js';
import { ArchitectureRepository } from '../../architecture/architecture.repository.js';
import type { Database } from '../../../shared/database/client.js';
import type { Principal } from '../../../shared/auth/principal.js';
import { AppError } from '../../../shared/errors/app-error.js';
import { architecturePackage } from './context-package.js';
export class PresentationAIContext {
  constructor(private db: Database) {}
  async resolve(principal: Principal, presentationId: string, screenId: string, edit = false) {
    const builder = await new PresentationQuery(this.db).read(principal, presentationId);
    if (!('screens' in builder)) throw new AppError('DOMAIN_NOT_FOUND', 'Builder not found.');
    if (edit)
      await this.db.transaction(async (tx) => {
        await presentationAccess(tx, principal, presentationId, 'EDIT');
      });
    const screen = builder.screens.find((s) => s.id === screenId);
    if (!screen) throw new AppError('DOMAIN_NOT_FOUND', 'Screen not found.');
    if (edit && screen.kind === 'MAIN_ARCHITECTURE')
      throw new AppError('INVALID_LIFECYCLE', 'Main Architecture is protected.');
    const family = await new ArchitectureRepository(this.db).load(builder.architectureId);
    const p = architecturePackage(family, screen.draft.scope);
    // Explicit fields only: no access grants, invitations, private provenance or full DB rows.
    p.payload.screen = {
      id: screen.id,
      draft: screen.draft,
      overlays: screen.overlays,
      inclusions: screen.inclusions.map((i) => ({
        key: 'inclusion:' + i.id,
        kind: i.kind,
        representation: safeRepresentation(i.representation),
      })),
    };
    p.references.push(...screen.inclusions.map((i) => 'inclusion:' + i.id));
    p.basis = {
      presentationId,
      screenId,
      screenStamp: screen.changeStamp,
      scope: screen.draft.scope,
    };
    return {
      package: p,
      screen,
      family,
      projectId: builder.projectId,
      architectureId: builder.architectureId,
    };
  }
}
export function safeRepresentation(r: Record<string, unknown>) {
  const result: Record<string, unknown> = {};
  for (const key of ['title', 'body', 'category', 'scope', 'payload', 'sourceReferenceId'])
    if (r[key] !== undefined) result[key] = r[key];
  return result;
}
