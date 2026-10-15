import type { FastifyRequest } from 'fastify';
import type { Identity } from '../../modules/auth/auth.types.js';
import type { AuthService } from '../../modules/auth/auth.service.js';
import { AppError } from '../errors/app-error.js';
declare module 'fastify' {
  interface FastifyRequest {
    identity: Identity | null;
  }
}
export function requireAuthenticatedUser(service: AuthService) {
  return async (request: FastifyRequest) => {
    const header = request.headers.authorization;
    if (!header?.startsWith('Bearer '))
      throw new AppError('AUTH_UNAUTHORIZED', 'A valid bearer token is required.');
    request.identity = await service.authenticate(header.slice(7));
  };
}
export function userId(request: FastifyRequest) {
  if (!request.identity) throw new AppError('AUTH_UNAUTHORIZED', 'Authentication required.');
  return request.identity.userId;
}
