import { randomUUID } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import type { Database, Executor } from '../../shared/database/client.js';
import type { Principal } from '../../shared/auth/principal.js';
import { requireRegisteredPrincipal } from '../../shared/auth/principal.js';
import { ProjectAccess } from '../../shared/auth/authorization.js';
import {
  requireChangeStamp,
  requireChangedRow,
  advanceChangeStamp,
} from '../../shared/concurrency/change-stamp.js';
import { AppError } from '../../shared/errors/app-error.js';
import type { IdempotentOperations } from '../../shared/operations/idempotent-operation.js';
import { ArchitectureRepository } from '../architecture/architecture.repository.js';
import { KnowledgeService } from '../knowledge/knowledge.service.js';
import { SnapshotService } from '../knowledge/snapshot.service.js';
import { requireProjectReferences } from '../project-sources/provenance.contract.js';
import {
  presentationScreens,
  screenDefinitions,
  scenarioOverlays,
  screenKnowledge,
  presentations,
} from './presentation.schema.js';
import { PresentationRepository } from './presentation.repository.js';
import { presentationAccess, missing } from './presentation.access.js';
import { validateDefinition } from './presentation.validation.js';
import type { ScreenCommand, Draft, addScreenInput, Inclusion } from './presentation.input.js';
import type { z } from 'zod';
export class ScreenService {
  constructor(
    private db: Database,
    private writes: IdempotentOperations,
    private knowledge: KnowledgeService,
    private snapshots: SnapshotService,
  ) {}
  async add(principal: Principal, id: string, input: z.infer<typeof addScreenInput>) {
    const result = await this.writes.run({
      principal,
      ...(principal.actor.kind === 'SCOPED_GUEST'
        ? { invitedScope: { kind: 'PRESENTATION' as const, id } }
        : {}),
      operation: {
        id: input.operationId,
        commandKind: 'presentation.screen.add',
        scope: { kind: 'presentation', id },
      },
      semanticRequest: input,
      authorize: async ({ tx }, previous) => {
        await presentationAccess(tx, principal, id, previous ? 'READ' : 'EDIT');
        if (previous && !(await new PresentationRepository(tx).screen(id, previous.reference.id)))
          throw missing();
      },
      execute: async ({ tx }) => {
        const { presentation: p } = await presentationAccess(tx, principal, id, 'EDIT');
        requireChangeStamp(p.changeStamp, input.expectedStamp);
        const repo = new PresentationRepository(tx),
          screens = await repo.screens(id);
        if (screens.length >= 64)
          throw new AppError('DOMAIN_CONFLICT', 'Presentation screen limit reached.');
        const draft: Draft = {
          name: input.name,
          type: input.type,
          scope: input.scope,
          scenarioGoal: input.scenarioGoal,
          notes: input.notes,
          understanding: input.understanding,
          understandingAccepted: false,
          nodeOverrides: [],
          connectionOverrides: [],
        };
        await validateDefinition(tx, p, draft, [], []);
        const [s] = await tx
          .insert(presentationScreens)
          .values({
            presentationId: id,
            kind: 'AUTHORED',
            draft,
            state: 'DRAFT',
            sortOrder: screens.length,
          })
          .returning();
        await repo.advance(id, p.changeStamp);
        return {
          reference: { kind: 'presentation_screen', id: s!.id },
          status: 'DRAFT',
          changeStamp: 0,
        };
      },
    });
    return {
      id: result.result.result.reference.id,
      state: result.result.result.status,
      changeStamp: result.result.result.changeStamp,
      replayed: result.result.replayed,
    };
  }
  async include(
    db: Executor,
    principal: Principal,
    p: { projectId: string },
    screenId: string,
    input: Extract<
      ScreenCommand,
      { action: 'INCLUDE_KNOWLEDGE' | 'INCLUDE_SNAPSHOT' | 'INCLUDE_SOURCE' }
    >,
  ) {
    const actor = requireRegisteredPrincipal(principal);
    let kind: Inclusion['kind'],
      originId: string,
      originStamp: number | null = null,
      representation: Record<string, unknown>;
    if (input.action === 'INCLUDE_KNOWLEDGE') {
      const item = await this.knowledge.readIn(db, principal, input.itemId);
      if (item.projectId && item.projectId !== p.projectId)
        throw new AppError('VALIDATION_ERROR', 'Knowledge belongs to another project.');
      requireChangeStamp(item.changeStamp, input.expectedItemStamp);
      kind = 'KNOWLEDGE';
      originId = item.id;
      originStamp = item.changeStamp;
      // Explicit publication excludes private attachments, history, unrelated notes and later edits.
      representation = {
        category: item.category,
        title: item.title,
        body: item.body,
        author: item.author,
      };
    } else if (input.action === 'INCLUDE_SNAPSHOT') {
      const capture = await this.snapshots.readIn(db, principal, input.snapshotId);
      const repo = new ArchitectureRepository(db);
      const arch = await repo.get(p.projectId);
      if (arch?.id !== capture.scope.architectureId)
        throw new AppError('VALIDATION_ERROR', 'Capture belongs to another architecture.');
      kind = 'SNAPSHOT';
      originId = capture.id;
      representation = { scope: capture.scope, payload: capture.payload, creator: capture.creator };
    } else {
      await new ProjectAccess(db).read(principal, p.projectId);
      await requireProjectReferences(db, p.projectId, [input.sourceReferenceId]);
      kind = 'SOURCE_REFERENCE';
      originId = input.sourceReferenceId;
      representation = { sourceReferenceId: originId };
    }
    await db.insert(screenKnowledge).values({
      screenId,
      kind,
      originId,
      originStamp,
      includedByUserId: actor.userId,
      representation,
    });
  }
  async command(principal: Principal, id: string, screenId: string, input: ScreenCommand) {
    const result = await this.writes.run({
      principal,
      ...(principal.actor.kind === 'SCOPED_GUEST'
        ? { invitedScope: { kind: 'PRESENTATION' as const, id } }
        : {}),
      operation: {
        id: input.operationId,
        commandKind: 'presentation.screen.command',
        scope: { kind: 'presentation', id },
      },
      semanticRequest: { screenId, input },
      authorize: async ({ tx }, previous) => {
        await presentationAccess(
          tx,
          principal,
          id,
          input.action === 'CONFIRM' ? 'OWNER' : previous ? 'READ' : 'EDIT',
        );
        const [s] = await tx
          .select()
          .from(presentationScreens)
          .where(
            and(eq(presentationScreens.id, screenId), eq(presentationScreens.presentationId, id)),
          );
        if (!s) throw missing();
      },
      execute: async ({ tx, emit }) => {
        const { presentation: p } = await presentationAccess(
          tx,
          principal,
          id,
          input.action === 'CONFIRM' ? 'OWNER' : 'EDIT',
        );
        const repo = new PresentationRepository(tx),
          screen = await repo.screen(id, screenId);
        if (!screen) throw missing();
        if (screen.kind === 'MAIN_ARCHITECTURE')
          throw new AppError('INVALID_LIFECYCLE', 'Main Architecture is protected.');
        requireChangeStamp(screen.changeStamp, input.expectedStamp);
        const nextStamp = advanceChangeStamp(screen.changeStamp, input.expectedStamp);
        const draft = structuredClone(screen.draft);
        if (input.action === 'EDIT') {
          draft.name = input.name;
          draft.scenarioGoal = input.scenarioGoal;
          draft.notes = input.notes;
          draft.understanding = input.understanding;
          draft.understandingAccepted = false;
        }
        if (input.action === 'SCOPE') {
          draft.scope = input.scope;
          draft.understandingAccepted = false;
          draft.nodeOverrides = [];
          draft.connectionOverrides = [];
          await tx.delete(scenarioOverlays).where(eq(scenarioOverlays.screenId, screenId));
        }
        if (input.action === 'ACCEPT_UNDERSTANDING') draft.understandingAccepted = true;
        if (input.action === 'NODE_VISUAL') {
          if (!draft.understandingAccepted)
            throw new AppError('INVALID_LIFECYCLE', 'Accept scenario understanding first.');
          draft.nodeOverrides = draft.nodeOverrides.filter((o) => o.nodeId !== input.nodeId);
          draft.nodeOverrides.push({ nodeId: input.nodeId, visual: input.visual });
        }
        if (input.action === 'CONNECTION_VISUAL') {
          if (!draft.understandingAccepted)
            throw new AppError('INVALID_LIFECYCLE', 'Accept scenario understanding first.');
          draft.connectionOverrides = draft.connectionOverrides.filter(
            (o) => o.connectionId !== input.connectionId,
          );
          draft.connectionOverrides.push({
            connectionId: input.connectionId,
            visual: input.visual,
          });
        }
        if (input.action === 'RESET_VISUALS') {
          draft.nodeOverrides = [];
          draft.connectionOverrides = [];
        }
        if (input.action === 'ADD_OVERLAY') {
          if (!draft.understandingAccepted)
            throw new AppError('INVALID_LIFECYCLE', 'Accept scenario understanding first.');
          await tx.insert(scenarioOverlays).values({
            screenId,
            payload: {
              sourceNodeId: input.sourceNodeId,
              destinationNodeId: input.destinationNodeId,
              label: input.label,
              visual: input.visual,
            },
          });
        }
        if (input.action === 'DELETE_OVERLAY') {
          const [removed] = await tx
            .delete(scenarioOverlays)
            .where(
              and(
                eq(scenarioOverlays.id, input.overlayId),
                eq(scenarioOverlays.screenId, screenId),
              ),
            )
            .returning();
          if (!removed) throw missing();
        }
        if (
          input.action === 'INCLUDE_KNOWLEDGE' ||
          input.action === 'INCLUDE_SOURCE' ||
          input.action === 'INCLUDE_SNAPSHOT'
        )
          await this.include(tx, principal, p, screenId, input);
        if (input.action === 'REMOVE_INCLUSION') {
          const [removed] = await tx
            .delete(screenKnowledge)
            .where(
              and(
                eq(screenKnowledge.id, input.inclusionId),
                eq(screenKnowledge.screenId, screenId),
              ),
            )
            .returning();
          if (!removed) throw missing();
        }
        const overlays = (await repo.overlays(screenId)).map((o) => ({ id: o.id, ...o.payload }));
        const inclusions = (await repo.inclusions(screenId)).map((i) => ({
          id: i.id,
          kind: i.kind,
          representation: i.representation,
        }));
        const definition = await validateDefinition(tx, p, draft, overlays, inclusions);
        let reference = { kind: 'presentation_screen', id: screenId },
          state: 'DRAFT' | 'CONFIRMED' = 'DRAFT',
          definitionId = screen.lastDefinitionId;
        if (input.action === 'CONFIRM') {
          if (screen.state !== 'DRAFT')
            throw new AppError(
              'INVALID_LIFECYCLE',
              'Screen already confirmed; edit a new draft first.',
            );
          if (!draft.understandingAccepted)
            throw new AppError(
              'INVALID_LIFECYCLE',
              'Scenario understanding has not been accepted.',
            );
          const [d] = await tx
            .insert(screenDefinitions)
            .values({ presentationId: id, screenId, draftStamp: screen.changeStamp, definition })
            .returning();
          definitionId = d!.id;
          reference = { kind: 'screen_definition', id: definitionId };
          state = 'CONFIRMED';
        }
        const [updated] = await tx
          .update(presentationScreens)
          .set({
            draft,
            changeStamp: nextStamp,
            state,
            lastDefinitionId: definitionId,
            ...(input.action === 'DELETE' ? { deletedAt: new Date() } : {}),
          })
          .where(
            and(
              eq(presentationScreens.id, screenId),
              eq(presentationScreens.changeStamp, input.expectedStamp),
            ),
          )
          .returning();
        requireChangedRow(updated);
        if (input.action === 'DELETE' && p.selectedScreenId === screenId) {
          const base = (await repo.screens(id)).find((s) => s.kind === 'MAIN_ARCHITECTURE')!;
          await tx
            .update(presentations)
            .set({ selectedScreenId: base.id })
            .where(eq(presentations.id, id));
        }
        await repo.advance(id, p.changeStamp);
        emit({
          id: randomUUID(),
          kind: 'presentation.screen.changed',
          aggregate: { kind: 'presentation_screen', id: screenId },
          changeStamp: nextStamp,
        });
        return {
          reference,
          status: input.action === 'DELETE' ? 'DELETED' : state,
          changeStamp: nextStamp,
        };
      },
    });
    return {
      id: result.result.result.reference.id,
      state: result.result.result.status,
      changeStamp: result.result.result.changeStamp,
      replayed: result.result.replayed,
    };
  }
}
