import { randomBytes, randomUUID, createHmac } from 'node:crypto';
import { SignJWT, jwtVerify } from 'jose';
import type { Config } from '../config/config.js';
import { AppError } from '../errors/app-error.js';
import type { Identity, TokenDto } from '../../modules/auth/auth.types.js';
export class TokenService {
  constructor(private config: Config) {}
  hash(token: string) {
    return createHmac('sha256', this.config.REFRESH_TOKEN_SECRET).update(token).digest('hex');
  }
  refreshIdentity(token: string) {
    const match =
      /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\.([A-Za-z0-9_-]{43})$/.exec(
        token,
      );
    if (!match?.[1])
      throw new AppError('AUTH_SESSION_EXPIRED', 'Refresh session is invalid or expired.');
    return match[1];
  }
  async issue(
    userId: string,
    sessionId: string = randomUUID(),
  ): Promise<{ dto: TokenDto; sessionId: string; tokenHash: string; expiresAt: Date }> {
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = new Date((now + this.config.REFRESH_TOKEN_TTL) * 1000);
    const refreshToken = `${sessionId}.${randomBytes(32).toString('base64url')}`;
    const accessToken = await new SignJWT({ sid: sessionId })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(userId)
      .setIssuer('adaptive-spatial-labs')
      .setAudience('asl-client')
      .setIssuedAt(now)
      .setExpirationTime(now + this.config.ACCESS_TOKEN_TTL)
      .sign(new TextEncoder().encode(this.config.ACCESS_TOKEN_SECRET));
    return {
      sessionId,
      tokenHash: this.hash(refreshToken),
      expiresAt,
      dto: {
        accessToken,
        refreshToken,
        tokenType: 'Bearer',
        accessExpiresAt: new Date((now + this.config.ACCESS_TOKEN_TTL) * 1000).toISOString(),
        refreshExpiresAt: expiresAt.toISOString(),
      },
    };
  }
  async verify(token: string): Promise<Identity> {
    try {
      const { payload } = await jwtVerify(
        token,
        new TextEncoder().encode(this.config.ACCESS_TOKEN_SECRET),
        { algorithms: ['HS256'], issuer: 'adaptive-spatial-labs', audience: 'asl-client' },
      );
      if (
        typeof payload.sub !== 'string' ||
        typeof payload.sid !== 'string' ||
        !/^[0-9a-f-]{36}$/.test(payload.sub) ||
        !/^[0-9a-f-]{36}$/.test(payload.sid)
      )
        throw new Error('Invalid identity');
      return { userId: payload.sub, sessionId: payload.sid };
    } catch {
      throw new AppError('AUTH_UNAUTHORIZED', 'A valid bearer token is required.');
    }
  }
}
