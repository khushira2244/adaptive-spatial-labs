import type { Database } from '../../../shared/database/client.js';
import type { Principal } from '../../../shared/auth/principal.js';
import type { KnowledgeService } from '../../knowledge/knowledge.service.js';
import type { ContextInput } from '../schemas/ai.input.js';
import { ArchitectureAIContext } from './architecture-context.js';
import { PresentationAIContext } from './presentation-context.js';
import { MeetingAIContext } from './meeting-context.js';
export class AIContextResolver {
  readonly architecture: ArchitectureAIContext;
  readonly presentation: PresentationAIContext;
  readonly meeting: MeetingAIContext;
  constructor(db: Database, knowledge: KnowledgeService) {
    this.architecture = new ArchitectureAIContext(db, knowledge);
    this.presentation = new PresentationAIContext(db);
    this.meeting = new MeetingAIContext(db);
  }
  async resolve(principal: Principal, input: ContextInput) {
    switch (input.kind) {
      case 'ARCHITECTURE':
        return this.architecture.resolve(principal, input);
      case 'PRESENTATION':
        return (await this.presentation.resolve(principal, input.presentationId, input.screenId))
          .package;
      case 'MEETING':
        return this.meeting.current(principal, input.meetingId);
    }
  }
}
