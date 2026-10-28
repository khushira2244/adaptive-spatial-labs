import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { WebSocket } from 'ws';
import type { Principal } from '../../shared/auth/principal.js';
import { AppError } from '../../shared/errors/app-error.js';
import { realtimeCommand } from './meeting.input.js';
import { MeetingQuery } from './meeting.query.js';
import { MeetingControl } from './meeting.control.js';
import { PublicationService } from './publication.service.js';
import { MeetingService } from './meeting.service.js';
import { MeetingPresence } from './meeting.presence.js';
type Client = {
  socket: WebSocket;
  principal: Principal;
  participantId: string;
  epoch: number;
  alive: boolean;
  count: number;
  window: number;
  pending: number;
};
export class MeetingRealtime {
  private rooms = new Map<string, Set<Client>>();
  private generations = new Map<string, number>();
  private epochs = new Map<string, number>();
  private queues = new Map<string, Promise<void>>();
  constructor(
    private query: MeetingQuery,
    private control: MeetingControl,
    private publications: PublicationService,
    private service: MeetingService,
    private presence: MeetingPresence,
  ) {}
  async broadcast(id: string, event: string) {
    const previous = this.queues.get(id) ?? Promise.resolve();
    const task = previous
      .catch(() => {})
      .then(async () => {
        for (const client of [...(this.rooms.get(id) ?? [])]) {
          try {
            const view = await this.query.read(client.principal, id);
            if (view.shared) this.generations.set(id, view.shared.authorityGeneration);
            this.send(client.socket, {
              type: 'STATE',
              event,
              sequence: view.changeStamp,
              data: view,
            });
            if (view.state === 'ENDED') client.socket.close(1000, 'Meeting ended');
          } catch {
            client.socket.close(1008, 'Admission no longer valid');
          }
        }
      });
    this.queues.set(id, task);
    try {
      await task;
    } finally {
      if (this.queues.get(id) === task) this.queues.delete(id);
    }
  }
  private send(socket: WebSocket, value: unknown) {
    if (socket.readyState !== 1) return;
    if (socket.bufferedAmount > 4194304) {
      socket.close(1013, 'Resync required');
      return;
    }
    socket.send(JSON.stringify(value));
  }
  attach(id: string, principal: Principal, socket: WebSocket) {
    const client: Client = {
      socket,
      principal,
      participantId: '',
      epoch: 0,
      alive: true,
      count: 0,
      window: Date.now(),
      pending: 0,
    };
    // Install all handlers synchronously before asynchronous admission/presence work.
    let chain: Promise<void> = Promise.resolve();
    const ready = this.presence
      .connect(principal, id)
      .then(async (info) => {
        client.participantId = info.participantId;
        client.epoch = info.epoch;
        const set = this.rooms.get(id) ?? new Set<Client>();
        set.add(client);
        this.rooms.set(id, set);
        this.epochs.set(id + ':' + client.participantId, info.epoch);
        this.generations.set(id, info.generation);
        const view = await this.query.read(principal, id);
        this.send(socket, {
          type: 'STATE',
          event: 'connected',
          sequence: view.changeStamp,
          data: view,
        });
        if (socket.readyState !== 1) await this.closed(id, client);
      })
      .catch(() => socket.close(1008, 'Meeting admission required'));
    socket.on('pong', () => {
      client.alive = true;
    });
    socket.on('message', (raw, isBinary) => {
      if (isBinary) {
        socket.close(1003, 'JSON commands only');
        return;
      }
      if (Date.now() - client.window > 1000) {
        client.window = Date.now();
        client.count = 0;
      }
      if (++client.count > 20 || ++client.pending > 16) {
        socket.close(1008, 'Command rate exceeded');
        return;
      }
      chain = chain
        .then(async () => {
          await ready;
          try {
            if (!client.participantId || socket.readyState !== 1) return;
            const input = realtimeCommand.parse(JSON.parse(raw.toString()));
            let result: unknown;
            if (input.type === 'SYNC') {
              const state = await this.query.read(principal, id);
              this.send(socket, {
                type: 'STATE',
                event: 'resync',
                sequence: state.changeStamp,
                data: state,
              });
              return;
            }
            if (input.type === 'RETURN_TO_LIVE')
              result = await this.control.private(principal, id, undefined, true);
            if (input.type === 'PUBLICATION')
              result = await this.publications.command(principal, id, input.command);
            if (input.type === 'COMMAND') {
              const command = input.command;
              result =
                command.action === 'START' || command.action === 'END' || command.action === 'SETUP'
                  ? await this.service.lifecycle(principal, id, command)
                  : await this.control.command(principal, id, command);
            }
            this.send(socket, { type: 'ACK', result });
          } catch (error) {
            this.send(socket, {
              type: 'ERROR',
              code: error instanceof AppError ? error.code : 'VALIDATION_ERROR',
              message:
                error instanceof AppError ? error.message : 'Invalid bounded Meeting command.',
            });
          } finally {
            client.pending--;
          }
        })
        .catch(() => {
          client.pending--;
          socket.close(1011, 'Reconnect and resync');
        });
    });
    socket.on('close', () => {
      void ready.then(() => this.closed(id, client)).catch(() => {});
    });
    socket.on('error', () => {
      socket.close();
    });
  }
  private async closed(id: string, client: Client) {
    const set = this.rooms.get(id);
    if (!set?.delete(client)) return;
    if (![...set].some((c) => c.participantId === client.participantId)) {
      const key = id + ':' + client.participantId,
        epoch = this.epochs.get(key) ?? client.epoch;
      this.epochs.delete(key);
      await this.presence.disconnect(
        id,
        client.participantId,
        epoch,
        this.generations.get(id) ?? 0,
      );
    }
    if (!set.size) {
      this.rooms.delete(id);
      this.generations.delete(id);
    }
  }
  installHeartbeat(app: FastifyInstance) {
    const timer = setInterval(() => {
      for (const [id, set] of this.rooms)
        for (const client of [...set]) {
          if (!client.alive) {
            client.socket.terminate();
            continue;
          }
          client.alive = false;
          client.socket.ping();
          void this.query
            .read(client.principal, id)
            .catch(() => client.socket.close(1008, 'Admission expired'));
        }
    }, 15000);
    timer.unref();
    app.addHook('onClose', async () => {
      clearInterval(timer);
      for (const set of this.rooms.values()) for (const c of set) c.socket.terminate();
    });
  }
}
