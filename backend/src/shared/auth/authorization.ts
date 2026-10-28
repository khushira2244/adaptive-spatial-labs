import { sameUuidIdentity } from '../validation/uuid-identity.js';
import { ProjectAuthorization } from '../../modules/projects/project.authorization.js';
import type { Executor } from '../database/client.js';
import { AppError } from '../errors/app-error.js';
import { PrincipalResolver } from './principal-resolver.js';
import { requireRegisteredPrincipal, type Principal } from './principal.js';

export function requireAllowed(allowed: boolean): void {
  if (allowed !== true) throw new AppError('DOMAIN_FORBIDDEN', 'Access denied.');
}
export function requireScope(
  actual: { kind: string; id: string },
  expected: { kind: string; id: string },
): void {
  if (actual.kind !== expected.kind || !sameUuidIdentity(actual.id, expected.id))
    throw new AppError('DOMAIN_NOT_FOUND', 'Resource not found.');
}
export function requireVisible<T>(value: T | null | undefined, allowed: boolean): T {
  if (value == null || allowed !== true)
    throw new AppError('DOMAIN_NOT_FOUND', 'Resource not found.');
  return value;
}
export function requireLifecycle(allowed: boolean): void {
  if (allowed !== true)
    throw new AppError('INVALID_LIFECYCLE', 'This action is unavailable in the current state.');
}

/** New domain adapter delegates to the existing Group 1 policy; routes retain their current errors. */
export class ProjectAccess {
  constructor(private readonly db: Executor) {}
  private async registered(principal: Principal) {
    const actor = requireRegisteredPrincipal(principal);
    await new PrincipalResolver(this.db).requireActive(principal);
    return actor.userId;
  }
  private async conceal<T>(action: () => Promise<T>): Promise<T> {
    try {
      return await action();
    } catch (error: unknown) {
      if (
        error instanceof AppError &&
        (error.code === 'PROJECT_NOT_FOUND' || error.code === 'PROJECT_FORBIDDEN')
      )
        throw new AppError('DOMAIN_NOT_FOUND', 'Resource not found.');
      throw error;
    }
  }
  async read(principal: Principal, projectId: string) {
    const userId = await this.registered(principal);
    return this.conceal(() =>
      new ProjectAuthorization(this.db, true).requireProjectAccess(projectId, userId),
    );
  }
  async owner(principal: Principal, projectId: string, allowArchived = false) {
    const userId = await this.registered(principal);
    return this.conceal(() =>
      new ProjectAuthorization(this.db, true).requireProjectOwner(projectId, userId, allowArchived),
    );
  }
  async editorOrOwner(principal: Principal, projectId: string) {
    const userId = await this.registered(principal);
    return this.conceal(() =>
      new ProjectAuthorization(this.db, true).requireProjectEditorOrOwner(projectId, userId),
    );
  }
}
