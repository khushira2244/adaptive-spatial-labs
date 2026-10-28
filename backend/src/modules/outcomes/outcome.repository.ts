import { eq, asc } from 'drizzle-orm';
import type { Executor } from '../../shared/database/client.js';
import { reviewItems, decisions, actionItems, reviewOutcomeLinks } from './outcome.schema.js';
export class OutcomeRepository {
  constructor(private db: Executor) {}
  async contents(id: string) {
    const items = await this.db
      .select()
      .from(reviewItems)
      .where(eq(reviewItems.reviewId, id))
      .orderBy(asc(reviewItems.sortOrder), asc(reviewItems.id));
    const ds = await this.db
      .select()
      .from(decisions)
      .where(eq(decisions.reviewId, id))
      .orderBy(decisions.id);
    const actions = await this.db
      .select()
      .from(actionItems)
      .where(eq(actionItems.reviewId, id))
      .orderBy(actionItems.id);
    const links = await this.db
      .select()
      .from(reviewOutcomeLinks)
      .where(eq(reviewOutcomeLinks.reviewId, id))
      .orderBy(reviewOutcomeLinks.id);
    return { items, decisions: ds, actions, links };
  }
}
