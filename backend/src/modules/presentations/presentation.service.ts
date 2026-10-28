import { randomUUID } from 'node:crypto';
import { and, eq, isNull } from 'drizzle-orm';
import type { Database } from '../../shared/database/client.js';
import type { Principal } from '../../shared/auth/principal.js';
import { requireRegisteredPrincipal } from '../../shared/auth/principal.js';
import { ProjectAccess } from '../../shared/auth/authorization.js';
import { AppError } from '../../shared/errors/app-error.js';
import type { IdempotentOperations } from '../../shared/operations/idempotent-operation.js';
import { CommandTransactions } from '../../shared/database/command-transaction.js';
import { GuestAccess } from '../../shared/auth/guest-access.js';
import { PrincipalResolver } from '../../shared/auth/principal-resolver.js';
import { requireChangeStamp } from '../../shared/concurrency/change-stamp.js';
import { users } from '../../shared/database/schema.js';
import { ArchitectureRepository } from '../architecture/architecture.repository.js';
import {
  presentations,
  presentationScreens,
  screenDefinitions,
  presentationGrants,
  presentationInvitations,
} from './presentation.schema.js';
import { presentationAccess, missing } from './presentation.access.js';
import { PresentationRepository } from './presentation.repository.js';
import { validateDefinition } from './presentation.validation.js';
import type {
  Draft,
  createInput,
  setupCommand,
  inviteInput,
  invitationCommand,
} from './presentation.input.js';
import type { z } from 'zod';
export class PresentationService {
  constructor(
    private db: Database,
    private writes: IdempotentOperations,
  ) {}
  async create(principal: Principal, input: z.infer<typeof createInput>) {
    const committed = await this.writes.run({
      principal,
      operation: {
        id: input.operationId,
        commandKind: 'presentation.create',
        scope: { kind: 'project', id: input.projectId },
      },
      semanticRequest: input,
      authorize: async ({ tx }, result) => {
        await new ProjectAccess(tx).owner(principal, input.projectId);
        if (result) await presentationAccess(tx, principal, result.reference.id, 'OWNER');
      },
      execute: async ({ tx }) => {
        const owner = requireRegisteredPrincipal(principal),
          repo = new ArchitectureRepository(tx),
          arch = await repo.get(input.projectId, true);
        if (!arch || arch.state !== 'CONFIRMED')
          throw new AppError('INVALID_LIFECYCLE', 'Confirmed architecture is required.');
        const family = await repo.load(arch.id);
        const [p] = await tx
          .insert(presentations)
          .values({
            projectId: input.projectId,
            architectureId: arch.id,
            ownerId: owner.userId,
            name: input.name,
            purpose: input.purpose,
            state: 'READY',
          })
          .returning();
        const draft: Draft = {
          name: 'Main Architecture',
          type: 'MAIN_ARCHITECTURE',
          scope: {
            format: 1,
            kind: 'WHOLE_ARCHITECTURE',
            architectureId: arch.id,
            architectureGraphRef: family.rootGraphId,
            architectureStamp: arch.changeStamp,
          },
          scenarioGoal: 'Confirmed architecture overview',
          notes: '',
          understanding: { summary: 'Show the confirmed architecture.', points: [] },
          understandingAccepted: true,
          nodeOverrides: [],
          connectionOverrides: [],
        };
        const [s] = await tx
          .insert(presentationScreens)
          .values({
            presentationId: p!.id,
            kind: 'MAIN_ARCHITECTURE',
            draft,
            state: 'CONFIRMED',
            sortOrder: 0,
          })
          .returning();
        const definition = await validateDefinition(tx, p!, draft, [], []);
        const [d] = await tx
          .insert(screenDefinitions)
          .values({ presentationId: p!.id, screenId: s!.id, draftStamp: 0, definition })
          .returning();
        await tx
          .update(presentationScreens)
          .set({ lastDefinitionId: d!.id })
          .where(eq(presentationScreens.id, s!.id));
        await tx
          .update(presentations)
          .set({ selectedScreenId: s!.id })
          .where(eq(presentations.id, p!.id));
        return {
          reference: { kind: 'presentation', id: p!.id },
          status: 'CREATED',
          changeStamp: 0,
        };
      },
    });
    return {
      ...committed.result.result.reference,
      changeStamp: committed.result.result.changeStamp,
      replayed: committed.result.replayed,
    };
  }
  async setup(principal: Principal, id: string, input: z.infer<typeof setupCommand>) {
    const committed = await this.writes.run({
      principal,
      ...(principal.actor.kind === 'SCOPED_GUEST'
        ? { invitedScope: { kind: 'PRESENTATION' as const, id } }
        : {}),
      operation: {
        id: input.operationId,
        commandKind: 'presentation.setup',
        scope: { kind: 'presentation', id },
      },
      semanticRequest: input,
      authorize: async ({ tx }) => {
        await presentationAccess(tx, principal, id, input.action === 'SELECT' ? 'READ' : 'OWNER');
      },
      execute: async ({ tx }) => {
        const { presentation: p } = await presentationAccess(
          tx,
          principal,
          id,
          input.action === 'SELECT' ? 'READ' : 'OWNER',
        );
        requireChangeStamp(p.changeStamp, input.expectedStamp);
        const repo = new PresentationRepository(tx),
          screens = await repo.screens(id);
        if (input.action === 'SETUP')
          await tx
            .update(presentations)
            .set({ name: input.name, purpose: input.purpose })
            .where(eq(presentations.id, id));
        if (input.action === 'SELECT') {
          // Selection is a saved builder checkpoint governed by edit authority, never viewer shared navigation.
          await presentationAccess(tx, principal, id, 'EDIT');
          if (!screens.some((s) => s.id === input.screenId)) throw missing();
          await tx
            .update(presentations)
            .set({ selectedScreenId: input.screenId })
            .where(eq(presentations.id, id));
        }
        if (input.action === 'ORDER') {
          if (
            input.screenIds.length !== screens.length ||
            new Set(input.screenIds).size !== screens.length ||
            screens.some((s) => !input.screenIds.includes(s.id)) ||
            screens.find((s) => s.kind === 'MAIN_ARCHITECTURE')!.id !== input.screenIds[0]
          )
            throw new AppError(
              'VALIDATION_ERROR',
              'Order must contain each current screen, base first.',
            );
          for (const [index, screenId] of input.screenIds.entries())
            await tx
              .update(presentationScreens)
              .set({ sortOrder: index })
              .where(eq(presentationScreens.id, screenId));
        }
        if (input.action === 'REVOKE') {
          const [g] = await tx
            .update(presentationGrants)
            .set({ revokedAt: new Date() })
            .where(
              and(
                eq(presentationGrants.id, input.grantId),
                eq(presentationGrants.presentationId, id),
                isNull(presentationGrants.revokedAt),
              ),
            )
            .returning();
          if (!g) throw missing();
        }
        await repo.advance(id, p.changeStamp);
        return {
          reference: { kind: 'presentation', id },
          status: 'UPDATED',
          changeStamp: p.changeStamp + 1,
        };
      },
    });
    return {
      id,
      changeStamp: committed.result.result.changeStamp,
      replayed: committed.result.replayed,
    };
  }
  async invite(principal: Principal, id: string, input: z.infer<typeof inviteInput>) {
    const committed = await this.writes.run({
      principal,
      operation: {
        id: input.operationId,
        commandKind: 'presentation.invite',
        scope: { kind: 'presentation', id },
      },
      semanticRequest: input,
      authorize: async ({ tx }) => {
        await presentationAccess(tx, principal, id, 'OWNER');
      },
      execute: async ({ tx }) => {
        const { presentation: p } = await presentationAccess(tx, principal, id, 'OWNER');
        requireChangeStamp(p.changeStamp, input.expectedStamp);
        const invitations = await tx
          .select()
          .from(presentationInvitations)
          .where(eq(presentationInvitations.presentationId, id));
        if (invitations.length >= 100)
          throw new AppError('DOMAIN_CONFLICT', 'Invitation limit reached.');
        if (
          invitations.some(
            (i) => i.email === input.email && i.state === 'PENDING' && i.expiresAt > new Date(),
          )
        )
          throw new AppError('DOMAIN_CONFLICT', 'A pending invitation already exists.');
        const [row] = await tx
          .insert(presentationInvitations)
          .values({
            presentationId: id,
            email: input.email,
            role: input.role,
            state: 'PENDING',
            expiresAt: new Date(Date.now() + input.expiresInDays * 86400000),
          })
          .returning();
        await new PresentationRepository(tx).advance(id, p.changeStamp);
        return {
          reference: { kind: 'presentation_invitation', id: row!.id },
          status: 'PENDING',
          changeStamp: p.changeStamp + 1,
        };
      },
    });
    return {
      id: committed.result.result.reference.id,
      state: committed.result.result.status,
      changeStamp: committed.result.result.changeStamp,
      replayed: committed.result.replayed,
    };
  }
  async respond(
    principal: Principal,
    id: string,
    invitationId: string,
    input: z.infer<typeof invitationCommand>,
  ) {
    const committed = await this.writes.run({
      principal,
      operation: {
        id: input.operationId,
        commandKind: 'presentation.invitation.respond',
        scope: { kind: 'presentation', id },
      },
      semanticRequest: { invitationId, input },
      authorize: async ({ tx }) => {
        const actor = requireRegisteredPrincipal(principal);
        const [invite] = await tx
          .select()
          .from(presentationInvitations)
          .where(
            and(
              eq(presentationInvitations.id, invitationId),
              eq(presentationInvitations.presentationId, id),
            ),
          );
        if (!invite) throw missing();
        if (input.action === 'CANCEL') await presentationAccess(tx, principal, id, 'OWNER');
        else {
          const [u] = await tx
            .select({ email: users.normalizedEmail })
            .from(users)
            .where(eq(users.id, actor.userId));
          if (u?.email !== invite.email) throw missing();
        }
      },
      execute: async ({ tx }) => {
        // Parent before invitation lock, consistent with owner cancellation/grant revocation.
        const [p] = await tx
          .select()
          .from(presentations)
          .where(eq(presentations.id, id))
          .for('update');
        if (!p) throw missing();
        const [invite] = await tx
          .select()
          .from(presentationInvitations)
          .where(eq(presentationInvitations.id, invitationId))
          .for('update');
        if (!invite || invite.state !== 'PENDING')
          throw new AppError('INVALID_LIFECYCLE', 'Invitation is not pending.');
        let state: 'ACCEPTED' | 'DECLINED' | 'CANCELLED' | 'EXPIRED' =
          input.action === 'ACCEPT'
            ? 'ACCEPTED'
            : input.action === 'DECLINE'
              ? 'DECLINED'
              : 'CANCELLED';
        if (invite.expiresAt <= new Date()) state = 'EXPIRED';
        let grantId: string | null = null;
        const actor = requireRegisteredPrincipal(principal);
        if (state === 'ACCEPTED') {
          const existing = await tx
            .select()
            .from(presentationGrants)
            .where(
              and(
                eq(presentationGrants.presentationId, id),
                eq(presentationGrants.userId, actor.userId),
                isNull(presentationGrants.revokedAt),
              ),
            );
          if (existing.length)
            throw new AppError('DOMAIN_CONFLICT', 'An active presentation grant already exists.');
          const [g] = await tx
            .insert(presentationGrants)
            .values({ presentationId: id, userId: actor.userId, role: invite.role })
            .returning();
          grantId = g!.id;
        }
        await tx
          .update(presentationInvitations)
          .set({ state, grantId, acceptedUserId: state === 'ACCEPTED' ? actor.userId : null })
          .where(eq(presentationInvitations.id, invitationId));
        await new PresentationRepository(tx).advance(id, p.changeStamp);
        return {
          reference: { kind: 'presentation_invitation', id: invitationId },
          status: state,
          changeStamp: p.changeStamp + 1,
        };
      },
    });
    return {
      id: invitationId,
      state: committed.result.result.status,
      replayed: committed.result.replayed,
    };
  }
  /** Trusted server admission only. No unauthenticated guest claim/email delivery endpoint. */
  async provisionGuest(
    principal: Principal,
    id: string,
    role: 'VIEWER' | 'COLLABORATOR',
    expiresAt: Date,
  ) {
    const result = await new CommandTransactions(this.db).run(async ({ tx }) => {
      const { presentation: p } = await presentationAccess(tx, principal, id, 'OWNER');
      if (!Number.isFinite(expiresAt.getTime()) || expiresAt.getTime() > Date.now() + 30 * 86400000)
        throw new AppError('VALIDATION_ERROR', 'Guest admission is bounded to thirty days.');
      const grants = await tx
        .select({ id: presentationGrants.id })
        .from(presentationGrants)
        .where(
          and(eq(presentationGrants.presentationId, id), isNull(presentationGrants.revokedAt)),
        );
      if (grants.length >= 256) throw new AppError('DOMAIN_CONFLICT', 'Grant limit reached.');
      const issued = await new GuestAccess(tx).provision({ kind: 'PRESENTATION', id }, expiresAt);
      const [g] = await tx
        .insert(presentationGrants)
        .values({ presentationId: id, guestId: issued.access.id, role })
        .returning();
      await new PresentationRepository(tx).advance(id, p.changeStamp);
      await new PrincipalResolver(tx).requireActive(principal);
      return { grantId: g!.id, actor: issued.actor, token: issued.token };
    });
    return result.result;
  }
}
