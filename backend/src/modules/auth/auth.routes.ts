import type { FastifyInstance } from 'fastify';
import { data } from '../../shared/validation/common.js';
import type { AuthService } from './auth.service.js';
import { signupSchema, loginSchema, refreshSchema } from './auth.schema.js';
export function authRoutes(app: FastifyInstance, service: AuthService) {
  const limited = { config: { rateLimit: { max: 20, timeWindow: '1 minute' } } };
  app.post('/api/v1/auth/signup', limited, async (req, reply) =>
    reply.code(201).send(data(await service.signup(signupSchema.parse(req.body)))),
  );
  app.post('/api/v1/auth/login', limited, async (req) =>
    data(await service.login(loginSchema.parse(req.body))),
  );
  app.post('/api/v1/auth/refresh', limited, async (req) =>
    data(await service.refresh(refreshSchema.parse(req.body).refreshToken)),
  );
  app.post('/api/v1/auth/logout', async (req) =>
    data(await service.logout(refreshSchema.parse(req.body).refreshToken)),
  );
}
