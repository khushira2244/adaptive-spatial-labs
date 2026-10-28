import { z } from 'zod';

export const domainEventSchema = z
  .object({
    id: z.uuid(),
    kind: z.string().regex(/^[a-z][a-z0-9_.-]{0,95}$/),
    aggregate: z
      .object({ kind: z.string().regex(/^[a-z][a-z0-9_.-]{0,63}$/), id: z.uuid() })
      .strict(),
    changeStamp: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER).optional(),
  })
  .strict();
export type DomainEvent = Readonly<z.infer<typeof domainEventSchema>>;
export type PostCommitFailure = Readonly<{ effect: string; error: unknown }>;
type Listener = { name: string; handle: (event: DomainEvent) => void | Promise<void> };

/** Best-effort, process-local delivery only. Authoritative state must already be committed. */
export class DomainEvents {
  private readonly listeners = new Map<string, Listener[]>();

  subscribe(kind: string, name: string, handle: Listener['handle']): () => void {
    const listener = { name, handle };
    const entries = this.listeners.get(kind) ?? [];
    entries.push(listener);
    this.listeners.set(kind, entries);
    return () =>
      this.listeners.set(
        kind,
        (this.listeners.get(kind) ?? []).filter((x) => x !== listener),
      );
  }

  async dispatch(input: DomainEvent): Promise<PostCommitFailure[]> {
    const parsed = domainEventSchema.parse(input);
    const event = Object.freeze({ ...parsed, aggregate: Object.freeze(parsed.aggregate) });
    const failures: PostCommitFailure[] = [];
    for (const listener of [...(this.listeners.get(event.kind) ?? [])]) {
      try {
        await listener.handle(event);
      } catch (error: unknown) {
        failures.push({ effect: listener.name, error });
      }
    }
    return failures;
  }
}
