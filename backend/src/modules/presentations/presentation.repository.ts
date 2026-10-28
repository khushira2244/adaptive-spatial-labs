import { requireChangedRow, advanceChangeStamp } from '../../shared/concurrency/change-stamp.js';
import { and, eq, isNull, asc } from 'drizzle-orm';
import type { Executor } from '../../shared/database/client.js';
import {
  presentations,
  presentationScreens,
  scenarioOverlays,
  screenKnowledge,
} from './presentation.schema.js';
export class PresentationRepository {
  constructor(private db: Executor) {}
  async screen(presentationId: string, id: string) {
    const [row] = await this.db
      .select()
      .from(presentationScreens)
      .where(
        and(
          eq(presentationScreens.id, id),
          eq(presentationScreens.presentationId, presentationId),
          isNull(presentationScreens.deletedAt),
        ),
      )
      .for('update');
    return row;
  }
  screens(id: string) {
    return this.db
      .select()
      .from(presentationScreens)
      .where(and(eq(presentationScreens.presentationId, id), isNull(presentationScreens.deletedAt)))
      .orderBy(asc(presentationScreens.sortOrder), asc(presentationScreens.id));
  }
  overlays(id: string) {
    return this.db.select().from(scenarioOverlays).where(eq(scenarioOverlays.screenId, id));
  }
  inclusions(id: string) {
    return this.db.select().from(screenKnowledge).where(eq(screenKnowledge.screenId, id));
  }
  async advance(id: string, stamp: number) {
    const screens = await this.screens(id);
    const [updated] = await this.db
      .update(presentations)
      .set({
        changeStamp: advanceChangeStamp(stamp, stamp),
        updatedAt: new Date(),
        state: screens.every((s) => s.state === 'CONFIRMED') ? 'READY' : 'PREPARING',
      })
      .where(and(eq(presentations.id, id), eq(presentations.changeStamp, stamp)))
      .returning();
    requireChangedRow(updated);
  }
}
