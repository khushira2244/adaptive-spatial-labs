import { describe, it, expect } from 'vitest';
import { EventEmitter } from 'node:events';
import { readConfig } from '../src/shared/config/config.js';
import { MeetingRealtime } from '../src/modules/meetings/meeting.realtime.js';
import type { MeetingQuery } from '../src/modules/meetings/meeting.query.js';
import type { MeetingControl } from '../src/modules/meetings/meeting.control.js';
import type { PublicationService } from '../src/modules/meetings/publication.service.js';
import type { MeetingService } from '../src/modules/meetings/meeting.service.js';
import type { MeetingPresence } from '../src/modules/meetings/meeting.presence.js';
import type { WebSocket } from 'ws';
import type { Principal } from '../src/shared/auth/principal.js';
describe('Final configuration and closed-socket guard', () => {
  const base = {
    NODE_ENV: 'production',
    DATABASE_URL: 'postgresql://test@localhost/test',
    ACCESS_TOKEN_SECRET: 'REPLACE_WITH_A_RANDOM_SECRET_AT_LEAST_32_CHARACTERS',
    REFRESH_TOKEN_SECRET: 'REPLACE_WITH_A_DIFFERENT_RANDOM_SECRET_AT_LEAST_32_CHARACTERS',
  };
  it('production rejects copied example secrets without disclosing their values', () => {
    expect(() => readConfig(base)).toThrow('Production token secrets');
    try {
      readConfig(base);
    } catch (e) {
      expect(String(e)).not.toContain(base.ACCESS_TOKEN_SECRET);
    }
  });
  it('valid distinct production secrets remain accepted; development example compatibility retained', () => {
    expect(
      readConfig({
        ...base,
        ACCESS_TOKEN_SECRET: 'a'.repeat(48),
        REFRESH_TOKEN_SECRET: 'b'.repeat(48),
      }).NODE_ENV,
    ).toBe('production');
    expect(readConfig({ ...base, NODE_ENV: 'development' }).NODE_ENV).toBe('development');
  });
  it('closed socket does not execute commands queued before its admission promise resolves', async () => {
    let executed = 0;
    class Socket extends EventEmitter {
      readyState = 1;
      bufferedAmount = 0;
      send() {}
      close() {
        this.readyState = 3;
        this.emit('close');
      }
      terminate() {
        this.close();
      }
    }
    const socket = new Socket();
    const realtime = new MeetingRealtime(
      {
        read: async () => ({ changeStamp: 0, state: 'LIVE', shared: { authorityGeneration: 0 } }),
      } as unknown as MeetingQuery,
      {
        command: async () => {
          executed++;
        },
      } as unknown as MeetingControl,
      {} as PublicationService,
      {} as MeetingService,
      {
        connect: async () => ({ participantId: 'p', epoch: 1, generation: 0 }),
        disconnect: async () => true,
      } as unknown as MeetingPresence,
    );
    realtime.attach('m', {} as Principal, socket as unknown as WebSocket);
    socket.emit('message', Buffer.from(JSON.stringify({ type: 'COMMAND', command: {} })), false);
    socket.close();
    await new Promise((resolve) => setImmediate(resolve));
    expect(executed).toBe(0);
  });
});
