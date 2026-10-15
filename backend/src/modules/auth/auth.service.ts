import argon2 from 'argon2';
import type { z } from 'zod';
import type { Database } from '../../shared/database/client.js';
import { AppError } from '../../shared/errors/app-error.js';
import { TokenService } from '../../shared/auth/token-service.js';
import { OrganizationRepository } from '../organizations/organization.repository.js';
import { userDto } from '../users/user.service.js';
import { AuthRepository } from './auth.repository.js';
import type { signupSchema, loginSchema } from './auth.schema.js';
const hashOptions = {
  type: argon2.argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
} as const;
export class AuthService {
  private dummyHash = argon2.hash('not-a-real-password-for-timing', hashOptions);
  constructor(
    private db: Database,
    private repository: AuthRepository,
    private tokens: TokenService,
  ) {}
  async signup(input: z.infer<typeof signupSchema>) {
    const passwordHash = await argon2.hash(input.password, hashOptions);
    try {
      return await this.db.transaction(async (tx) => {
        const repository = new AuthRepository(tx);
        const user = await repository.createUser(input, passwordHash);
        const organization = await new OrganizationRepository(tx).create(
          input.organizationName,
          user.id,
        );
        const issued = await this.tokens.issue(user.id);
        await repository.createSession(
          user.id,
          issued.tokenHash,
          issued.expiresAt,
          issued.sessionId,
        );
        return { user: userDto(user), organization, tokens: issued.dto };
      });
    } catch (e) {
      const cause =
        (e as { cause?: { code?: string; constraint?: string } }).cause ??
        (e as { code?: string; constraint?: string });
      if (cause.code === '23505' && cause.constraint === 'users_normalized_email_unique')
        throw new AppError('AUTH_EMAIL_ALREADY_EXISTS', 'That email is already registered.');
      throw e;
    }
  }
  async login(input: z.infer<typeof loginSchema>) {
    const user = await this.repository.byEmail(input.workEmail.trim().toLowerCase());
    const valid = await argon2.verify(user?.passwordHash ?? (await this.dummyHash), input.password);
    if (!user || !valid)
      throw new AppError('AUTH_INVALID_CREDENTIALS', 'Email or password is incorrect.');
    const issued = await this.tokens.issue(user.id);
    await this.repository.createSession(
      user.id,
      issued.tokenHash,
      issued.expiresAt,
      issued.sessionId,
    );
    return { user: userDto(user), tokens: issued.dto };
  }
  async refresh(token: string) {
    const id = this.tokens.refreshIdentity(token);
    const session = await this.repository.session(id);
    if (!session || session.revokedAt || session.expiresAt <= new Date())
      throw new AppError('AUTH_SESSION_EXPIRED', 'Refresh session is invalid or expired.');
    const issued = await this.tokens.issue(session.userId, id);
    if (
      !(await this.repository.rotate(
        id,
        this.tokens.hash(token),
        issued.tokenHash,
        issued.expiresAt,
      ))
    )
      throw new AppError('AUTH_SESSION_EXPIRED', 'Refresh session is invalid or expired.');
    return issued.dto;
  }
  async logout(token: string) {
    const id = this.tokens.refreshIdentity(token);
    if (!(await this.repository.revoke(id, this.tokens.hash(token))))
      throw new AppError('AUTH_SESSION_EXPIRED', 'Refresh session is invalid or expired.');
    return { loggedOut: true };
  }
  async authenticate(token: string) {
    const identity = await this.tokens.verify(token);
    const session = await this.repository.session(identity.sessionId);
    if (
      !session ||
      session.userId !== identity.userId ||
      session.revokedAt ||
      session.expiresAt <= new Date()
    )
      throw new AppError('AUTH_UNAUTHORIZED', 'Session is no longer active.');
    return identity;
  }
}
