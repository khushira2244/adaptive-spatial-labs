import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import { eq } from 'drizzle-orm';
import { SignJWT } from 'jose';
import { refreshSessions, users } from '../src/shared/database/schema.js';
import { fixture, signup, type Fixture, type Actor } from './fixture.js';
describe('Authentication and user contract', () => {
  let f: Fixture;
  let owner: Actor;
  beforeAll(async () => {
    f = await fixture();
    owner = await signup(f.app, 'authowner');
  });
  afterAll(async () => {
    await f.close();
  });
  it('signup persists a user, private Argon2id hash, organization membership, and tokens', async () => {
    const [user] = await f.db.select().from(users).where(eq(users.id, owner.id));
    expect(user?.passwordHash).toMatch(/^\$argon2id\$/);
    const res = await f.app.inject({ url: '/api/v1/organizations', headers: owner.headers });
    expect(res.json().data[0]).toMatchObject({ id: owner.orgId, membershipRole: 'OWNER' });
    const [session] = await f.db
      .select()
      .from(refreshSessions)
      .where(eq(refreshSessions.userId, owner.id));
    expect(session?.tokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(session?.tokenHash).not.toBe(owner.refreshToken);
  });
  it('duplicate normalized email is rejected without leaking SQL', async () => {
    const res = await f.app.inject({
      method: 'POST',
      url: '/api/v1/auth/signup',
      payload: {
        fullName: 'Duplicate',
        workEmail: 'AUTHOWNER@example.com',
        password: 'Correct-password-123',
        designation: 'OTHER',
        organizationName: 'Other',
      },
    });
    expect(res.statusCode).toBe(409);
    expect(res.json()).toEqual({
      error: {
        code: 'AUTH_EMAIL_ALREADY_EXISTS',
        message: 'That email is already registered.',
        details: null,
      },
    });
  });
  it('login normalizes email and succeeds', async () => {
    const res = await f.app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { workEmail: ' AUTHOWNER@example.com ', password: 'Correct-password-123' },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().data.tokens.tokenType).toBe('Bearer');
  });
  it('incorrect password and unknown email use the same error', async () => {
    for (const workEmail of ['authowner@example.com', 'missing@example.com']) {
      const res = await f.app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: { workEmail, password: 'incorrect' },
      });
      expect(res.statusCode).toBe(401);
      expect(res.json().error.code).toBe('AUTH_INVALID_CREDENTIALS');
    }
  });
  it('protected endpoint rejects missing and malformed bearer tokens', async () => {
    for (const headers of [{}, { authorization: 'Bearer invalid' }, { authorization: 'Basic xxx' }])
      expect((await f.app.inject({ url: '/api/v1/me', headers })).statusCode).toBe(401);
  });
  it('expired access tokens are rejected even when correctly signed', async () => {
    const token = await new SignJWT({ sid: owner.refreshToken.split('.')[0] })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(owner.id)
      .setIssuer('adaptive-spatial-labs')
      .setAudience('asl-client')
      .setIssuedAt(0)
      .setExpirationTime(1)
      .sign(new TextEncoder().encode(f.config.ACCESS_TOKEN_SECRET));
    expect(
      (await f.app.inject({ url: '/api/v1/me', headers: { authorization: `Bearer ${token}` } }))
        .statusCode,
    ).toBe(401);
  });
  it('access token returns stable current-user DTO and explicit nullable fields', async () => {
    const res = await f.app.inject({ url: '/api/v1/me', headers: owner.headers });
    const user = res.json().data;
    expect(res.statusCode).toBe(200);
    expect(user.id).toBe(owner.id);
    expect(Object.keys(user).sort()).toEqual(
      [
        'id',
        'fullName',
        'workEmail',
        'designation',
        'teamDepartment',
        'profileImage',
        'createdAt',
        'updatedAt',
      ].sort(),
    );
    expect(user.teamDepartment).toBeNull();
    expect(user.profileImage).toBeNull();
    expect(res.body).not.toContain('passwordHash');
    expect(res.body).not.toContain('normalizedEmail');
    expect(user.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T.*Z$/);
    expect(user.id).toMatch(/^[a-f0-9-]{36}$/);
  });
  it('profile update changes professional identity, not permissions', async () => {
    const res = await f.app.inject({
      method: 'PATCH',
      url: '/api/v1/me',
      headers: owner.headers,
      payload: {
        fullName: 'Updated Name',
        designation: 'SYSTEM_ARCHITECT',
        teamDepartment: 'Platform',
      },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().data).toMatchObject({ fullName: 'Updated Name', teamDepartment: 'Platform' });
  });
  it('profile rejects attempts to change password hashes or user identity', async () => {
    const res = await f.app.inject({
      method: 'PATCH',
      url: '/api/v1/me',
      headers: owner.headers,
      payload: { passwordHash: 'injected' },
    });
    expect(res.statusCode).toBe(400);
  });
  it('preferences have a stable typed default and can be patched', async () => {
    const initial = await f.app.inject({ url: '/api/v1/me/preferences', headers: owner.headers });
    expect(initial.json().data.theme).toBe('SYSTEM');
    const res = await f.app.inject({
      method: 'PATCH',
      url: '/api/v1/me/preferences',
      headers: owner.headers,
      payload: { theme: 'DARK', reduceMotion: true },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().data.notifications).toEqual({ enabled: true, email: true });
    const saved = await f.app.inject({ url: '/api/v1/me/preferences', headers: owner.headers });
    expect(saved.json().data).toMatchObject({ theme: 'DARK', reduceMotion: true });
  });
  it('refresh rotates token, rejects replay, and logout invalidates refresh and access', async () => {
    const login = await f.app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { workEmail: 'authowner@example.com', password: 'Correct-password-123' },
    });
    const old = login.json().data.tokens;
    const refresh = await f.app.inject({
      method: 'POST',
      url: '/api/v1/auth/refresh',
      payload: { refreshToken: old.refreshToken },
    });
    expect(refresh.statusCode).toBe(200);
    const rotated = refresh.json().data;
    expect(rotated.refreshToken).not.toBe(old.refreshToken);
    expect(
      (
        await f.app.inject({
          method: 'POST',
          url: '/api/v1/auth/refresh',
          payload: { refreshToken: old.refreshToken },
        })
      ).statusCode,
    ).toBe(401);
    const logout = await f.app.inject({
      method: 'POST',
      url: '/api/v1/auth/logout',
      payload: { refreshToken: rotated.refreshToken },
    });
    expect(logout.statusCode).toBe(200);
    expect(
      (
        await f.app.inject({
          method: 'POST',
          url: '/api/v1/auth/refresh',
          payload: { refreshToken: rotated.refreshToken },
        })
      ).statusCode,
    ).toBe(401);
    expect(
      (
        await f.app.inject({
          url: '/api/v1/me',
          headers: { authorization: `Bearer ${rotated.accessToken}` },
        })
      ).statusCode,
    ).toBe(401);
    expect((await f.app.inject({ url: '/api/v1/me', headers: owner.headers })).statusCode).toBe(
      200,
    );
  });
  it('refresh rejects expired sessions', async () => {
    const actor = await signup(f.app, 'expired');
    await f.db
      .update(refreshSessions)
      .set({ expiresAt: new Date(0) })
      .where(eq(refreshSessions.userId, actor.id));
    const res = await f.app.inject({
      method: 'POST',
      url: '/api/v1/auth/refresh',
      payload: { refreshToken: actor.refreshToken },
    });
    expect(res.statusCode).toBe(401);
    expect(res.json().error.code).toBe('AUTH_SESSION_EXPIRED');
  });
  it('concurrent refresh has one winner', async () => {
    const actor = await signup(f.app, 'race');
    const res = await Promise.all(
      [1, 2].map(() =>
        f.app.inject({
          method: 'POST',
          url: '/api/v1/auth/refresh',
          payload: { refreshToken: actor.refreshToken },
        }),
      ),
    );
    expect(res.map((r) => r.statusCode).sort()).toEqual([200, 401]);
  });
  it('validation errors are stable and contain no secrets or internals', async () => {
    const res = await f.app.inject({
      method: 'POST',
      url: '/api/v1/auth/signup',
      payload: { password: 'secret' },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json()).toEqual({
      error: { code: 'VALIDATION_ERROR', message: 'Request validation failed.', details: null },
    });
    expect(res.body).not.toContain('secret');
  });
});
