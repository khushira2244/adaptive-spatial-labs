import { AuthService } from '../src/modules/auth/auth.service.js';
import { AuthRepository } from '../src/modules/auth/auth.repository.js';
import { TokenService } from '../src/shared/auth/token-service.js';
import { PrincipalResolver } from '../src/shared/auth/principal-resolver.js';
import type { Fixture, Actor } from './fixture.js';

export function authenticatedPrincipal(f: Fixture, actor: Actor) {
  return new PrincipalResolver(f.db).registered(authService(f), actor.accessToken);
}
export function authService(f: Fixture) {
  return new AuthService(f.db, new AuthRepository(f.db), new TokenService(f.config));
}
