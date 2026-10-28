import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import type { Database } from '../../shared/database/client.js';
import type { AuthService } from '../auth/auth.service.js';
import { PrincipalResolver } from '../../shared/auth/principal-resolver.js';
import { AppError } from '../../shared/errors/app-error.js';
import { uuidIdentitySchema } from '../../shared/validation/uuid-identity.js';
import { data } from '../../shared/validation/common.js';
import type { AIService } from './ai.service.js';
import {
  askInput,
  discussionInput,
  scenarioInput,
  visualInput,
  frozenInput,
} from './schemas/ai.input.js';
export function aiRoutes(
  app: FastifyInstance,
  db: Database,
  auth: AuthService,
  service: AIService,
  testing = false,
) {
  const resolve = async (req: FastifyRequest) => {
    const h = req.headers.authorization;
    if (!h?.startsWith('Bearer '))
      throw new AppError('AUTH_UNAUTHORIZED', 'Bearer authentication required.');
    return new PrincipalResolver(db).registered(auth, h.slice(7));
  };
  const run = async (
    req: FastifyRequest,
    reply: FastifyReply,
    work: (signal: AbortSignal) => Promise<unknown>,
  ) => {
    const controller = new AbortController(),
      abort = () => controller.abort();
    const close = () => {
      if (!reply.raw.writableEnded) abort();
    };
    req.raw.once('aborted', abort);
    reply.raw.once('close', close);
    try {
      return data(await work(controller.signal));
    } finally {
      req.raw.removeListener('aborted', abort);
      reply.raw.removeListener('close', close);
    }
  };
  const options = {
    bodyLimit: 16384,
    config: { rateLimit: { max: testing ? 10000 : 12, timeWindow: '1 minute' } },
  };
  app.post('/api/v1/ai/context/ask', options, async (req, reply) => {
    const input = askInput.parse(req.body),
      p = await resolve(req);
    return run(req, reply, (s) => service.ask(p, input, s));
  });
  app.post('/api/v1/ai/discussion-points', options, async (req, reply) => {
    const input = discussionInput.parse(req.body),
      p = await resolve(req);
    return run(req, reply, (s) => service.discussion(p, input, s));
  });
  app.post('/api/v1/ai/scenario/understand', options, async (req, reply) => {
    const input = scenarioInput.parse(req.body),
      p = await resolve(req);
    return run(req, reply, (s) => service.scenario(p, input, s));
  });
  app.post('/api/v1/ai/visual-command/translate', options, async (req, reply) => {
    const input = visualInput.parse(req.body),
      p = await resolve(req);
    return run(req, reply, (s) => service.visual(p, input, s));
  });
  app.post('/api/v1/ai/meetings/:meetingId/summary', options, async (req, reply) => {
    const input = frozenInput.parse(req.body),
      p = await resolve(req),
      id = uuidIdentitySchema.parse((req.params as { meetingId: unknown }).meetingId);
    return run(req, reply, (s) => service.summary(p, id, input.reasoning, s));
  });
  app.post('/api/v1/ai/reviews/:reviewId/classify', options, async (req, reply) => {
    const input = frozenInput.parse(req.body),
      p = await resolve(req),
      id = uuidIdentitySchema.parse((req.params as { reviewId: unknown }).reviewId);
    return run(req, reply, (s) => service.classify(p, id, input.reasoning, s));
  });
}
