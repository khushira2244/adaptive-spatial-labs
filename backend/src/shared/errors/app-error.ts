import type { FastifyInstance } from 'fastify';
import { ZodError } from 'zod';
export const errorStatuses = {
  AI_UNAVAILABLE: 503,
  AI_PROVIDER_ERROR: 502,
  AI_TIMEOUT: 504,
  AI_CANCELLED: 409,
  AI_OUTPUT_INVALID: 502,
  AI_CONTEXT_TOO_LARGE: 413,
  DOMAIN_UNAUTHORIZED: 401,
  DOMAIN_FORBIDDEN: 403,
  DOMAIN_NOT_FOUND: 404,
  DOMAIN_CONFLICT: 409,
  STALE_CHANGE_STAMP: 409,
  INVALID_LIFECYCLE: 409,
  IDEMPOTENCY_MISMATCH: 409,
  NESTED_COMMAND_TRANSACTION: 409,
  AUTH_EMAIL_ALREADY_EXISTS: 409,
  AUTH_INVALID_CREDENTIALS: 401,
  AUTH_UNAUTHORIZED: 401,
  AUTH_SESSION_EXPIRED: 401,
  USER_NOT_FOUND: 404,
  ORGANIZATION_NOT_FOUND: 404,
  ORGANIZATION_FORBIDDEN: 403,
  PROJECT_NOT_FOUND: 404,
  PROJECT_FORBIDDEN: 403,
  PROJECT_INVALID_STATE: 409,
  EDITOR_ALREADY_EXISTS: 409,
  EDITOR_NOT_FOUND: 404,
  LAYER_NOT_FOUND: 404,
  SOURCE_NOT_FOUND: 404,
  SOURCE_UPLOAD_FAILED: 400,
  VALIDATION_ERROR: 400,
  INTERNAL_ERROR: 500,
} as const;
export type ErrorCode = keyof typeof errorStatuses;
export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
  ) {
    super(message);
  }
}
export function installErrorHandler(app: FastifyInstance) {
  app.setErrorHandler((error, request, reply) => {
    const httpStatus =
      error && typeof error === 'object' && 'statusCode' in error ? error.statusCode : undefined;
    let code: ErrorCode = 'INTERNAL_ERROR';
    let message = 'An internal error occurred.';
    let status = 500;
    if (error instanceof AppError) {
      code = error.code;
      message = error.message;
      status = errorStatuses[code];
    } else if (
      error instanceof ZodError ||
      httpStatus === 400 ||
      httpStatus === 413 ||
      httpStatus === 415
    ) {
      code = 'VALIDATION_ERROR';
      message = 'Request validation failed.';
      status = httpStatus === 413 ? 413 : 400;
    } else if (httpStatus === 429) {
      code = 'VALIDATION_ERROR';
      message = 'Too many requests. Try again later.';
      status = 429;
    }
    request.log.warn(
      { requestId: request.id, route: request.routeOptions.url, status, errorCode: code },
      'Request failed',
    );
    return reply.code(status).send({ error: { code, message, details: null } });
  });
  app.setNotFoundHandler((_request, reply) =>
    reply
      .code(404)
      .send({ error: { code: 'NOT_FOUND', message: 'Route not found.', details: null } }),
  );
}
