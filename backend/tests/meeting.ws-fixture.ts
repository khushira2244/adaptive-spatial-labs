import type { WebSocket } from 'ws';
export type Frame = {
  type: string;
  event?: string;
  sequence?: number;
  code?: string;
  data?: unknown;
  result?: unknown;
};
export class Inbox {
  private frames: Frame[] = [];
  private waiters: {
    test: (f: Frame) => boolean;
    resolve: (f: Frame) => void;
    reject: (e: Error) => void;
    timer: ReturnType<typeof setTimeout>;
  }[] = [];
  constructor(readonly socket: WebSocket) {
    socket.on('message', (raw) => {
      const frame = JSON.parse(raw.toString()) as Frame,
        index = this.waiters.findIndex((w) => w.test(frame));
      if (index >= 0) {
        const [w] = this.waiters.splice(index, 1);
        clearTimeout(w!.timer);
        w!.resolve(frame);
      } else {
        this.frames.push(frame);
        if (this.frames.length > 100) this.frames.shift();
      }
    });
  }
  next(test: (f: Frame) => boolean, timeout = 4000) {
    const index = this.frames.findIndex(test);
    if (index >= 0) return Promise.resolve(this.frames.splice(index, 1)[0]!);
    return new Promise<Frame>((resolve, reject) => {
      const waiter = {
        test,
        resolve,
        reject,
        timer: setTimeout(() => {
          this.waiters = this.waiters.filter((w) => w !== waiter);
          reject(new Error('Timed out waiting for bounded Meeting frame.'));
        }, timeout),
      };
      this.waiters.push(waiter);
    });
  }
  send(value: unknown) {
    this.socket.send(JSON.stringify(value));
  }
  dispose() {
    for (const w of this.waiters) {
      clearTimeout(w.timer);
      w.reject(new Error('Inbox disposed.'));
    }
    this.waiters = [];
    this.socket.terminate();
  }
}
