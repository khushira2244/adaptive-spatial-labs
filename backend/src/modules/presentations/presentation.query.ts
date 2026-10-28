import { and, eq, isNull, or, inArray } from 'drizzle-orm';
import type { Database } from '../../shared/database/client.js';
import type { Principal } from '../../shared/auth/principal.js';
import { requireRegisteredPrincipal } from '../../shared/auth/principal.js';
import { PrincipalResolver } from '../../shared/auth/principal-resolver.js';
import { AppError } from '../../shared/errors/app-error.js';
import { ArchitectureRepository } from '../architecture/architecture.repository.js';
import {
  presentations,
  presentationGrants,
  presentationInvitations,
  screenDefinitions,
  scenarioOverlays,
  screenKnowledge,
} from './presentation.schema.js';
import { presentationAccess, missing } from './presentation.access.js';
import { PresentationRepository } from './presentation.repository.js';
export class PresentationQuery {
  constructor(private db: Database) {}
  async list(principal: Principal, projectId?: string, limit = 50, offset = 0) {
    const actor = requireRegisteredPrincipal(principal);
    await new PrincipalResolver(this.db).requireActive(principal);
    return this.db.transaction(async (tx) => {
      const ids = await tx
        .select({ id: presentations.id })
        .from(presentations)
        .where(
          and(
            projectId ? eq(presentations.projectId, projectId) : undefined,
            or(
              eq(presentations.ownerId, actor.userId),
              inArray(
                presentations.id,
                tx
                  .select({ id: presentationGrants.presentationId })
                  .from(presentationGrants)
                  .where(
                    and(
                      eq(presentationGrants.userId, actor.userId),
                      isNull(presentationGrants.revokedAt),
                    ),
                  ),
              ),
            ),
          ),
        )
        .orderBy(presentations.id)
        .limit(limit)
        .offset(offset);
      const items = [];
      for (const { id } of ids) {
        try {
          const { presentation: p, role } = await presentationAccess(tx, principal, id);
          items.push({
            id: p.id,
            name: p.name,
            purpose: p.purpose,
            state: p.state,
            role,
            changeStamp: p.changeStamp,
          });
        } catch (e) {
          if (e instanceof AppError && e.code === 'DOMAIN_NOT_FOUND') continue;
          throw e;
        }
      }
      await new PrincipalResolver(tx).requireActive(principal);
      return { items, count: items.length, limit, offset };
    });
  }
  async read(principal: Principal, id: string, definitionId?: string) {
    return this.db.transaction(async (tx) => {
      const { presentation: p, role } = await presentationAccess(tx, principal, id);
      if (definitionId) {
        const [d] = await tx
          .select()
          .from(screenDefinitions)
          .where(
            and(eq(screenDefinitions.id, definitionId), eq(screenDefinitions.presentationId, id)),
          );
        if (!d) throw missing();
        await presentationAccess(tx, principal, id);
        return {
          id: d.id,
          screenId: d.screenId,
          draftStamp: d.draftStamp,
          definition: d.definition,
        };
      }
      const repo = new PresentationRepository(tx),
        screens = await repo.screens(id),
        family = await new ArchitectureRepository(tx).load(p.architectureId);
      // Grant-scoped canonical display omits Source provenance and all private/credential metadata.
      const architecture = {
        rootGraphId: family.rootGraphId,
        graphs: family.graphs.map((g) => ({
          id: g.id,
          kind: g.kind,
          name: g.name,
          nodes: g.nodes.map(({ sourceReferenceIds: _, ...n }) => n),
          connections: g.connections.map(({ sourceReferenceIds: _, ...e }) => e),
        })),
        innerLinks: family.innerLinks,
      };
      const screenIds = screens.map((screen) => screen.id);
      const allOverlays = screenIds.length
        ? await tx
            .select()
            .from(scenarioOverlays)
            .where(inArray(scenarioOverlays.screenId, screenIds))
        : [];
      const allInclusions = screenIds.length
        ? await tx
            .select()
            .from(screenKnowledge)
            .where(inArray(screenKnowledge.screenId, screenIds))
        : [];
      const projected = [];
      for (const screen of screens)
        projected.push({
          id: screen.id,
          kind: screen.kind,
          draft: screen.draft,
          changeStamp: screen.changeStamp,
          state: screen.state,
          meetingEligible: screen.state === 'CONFIRMED' && !!screen.lastDefinitionId,
          lastConfirmedDefinitionId: screen.lastDefinitionId,
          sortOrder: screen.sortOrder,
          overlays: allOverlays
            .filter((o) => o.screenId === screen.id)
            .map((o) => ({ id: o.id, ...o.payload })),
          inclusions: allInclusions
            .filter((i) => i.screenId === screen.id)
            .map((i) => ({
              id: i.id,
              kind: i.kind,
              representation: i.representation,
            })),
        });
      const access =
        role === 'OWNER'
          ? {
              grants: (
                await tx
                  .select()
                  .from(presentationGrants)
                  .where(
                    and(
                      eq(presentationGrants.presentationId, id),
                      isNull(presentationGrants.revokedAt),
                    ),
                  )
              ).map((g) => ({
                id: g.id,
                role: g.role,
                actor: g.userId
                  ? { kind: 'USER', userId: g.userId }
                  : { kind: 'SCOPED_GUEST', guestId: g.guestId },
              })),
              invitations: (
                await tx
                  .select()
                  .from(presentationInvitations)
                  .where(eq(presentationInvitations.presentationId, id))
              ).map((i) => ({
                id: i.id,
                email: i.email,
                role: i.role,
                state: i.state === 'PENDING' && i.expiresAt <= new Date() ? 'EXPIRED' : i.state,
                expiresAt: i.expiresAt,
              })),
            }
          : undefined;
      await presentationAccess(tx, principal, id);
      return {
        id: p.id,
        projectId: p.projectId,
        architectureId: p.architectureId,
        name: p.name,
        purpose: p.purpose,
        state: p.state,
        changeStamp: p.changeStamp,
        selectedScreenId: p.selectedScreenId,
        role,
        architecture,
        screens: projected,
        ...(access ? { access } : {}),
      };
    });
  }
}
