import { createHmac } from 'node:crypto';
import { AppError } from '../errors/app-error.js';

/** Canonical, JSON-only semantic input. Request body never leaves this function's memory. */
function canonical(value: unknown, depth: number): string {
  if (depth > 32) throw new AppError('VALIDATION_ERROR', 'Semantic request is too deeply nested.');
  if (value === null) return 'null';
  if (typeof value === 'string' || typeof value === 'boolean') return JSON.stringify(value);
  if (typeof value === 'number' && Number.isFinite(value)) return JSON.stringify(value);
  if (Array.isArray(value)) {
    // Sparse arrays would otherwise collide with different JSON input.
    if (Object.keys(value).length !== value.length)
      throw new AppError('VALIDATION_ERROR', 'Semantic arrays must be dense.');
    return '[' + value.map((entry) => canonical(entry, depth + 1)).join(',') + ']';
  }
  if (
    typeof value === 'object' &&
    value !== null &&
    Object.getPrototypeOf(value) === Object.prototype
  ) {
    return (
      '{' +
      Object.keys(value)
        .sort()
        .map(
          (key) =>
            JSON.stringify(key) +
            ':' +
            canonical((value as Record<string, unknown>)[key], depth + 1),
        )
        .join(',') +
      '}'
    );
  }
  throw new AppError('VALIDATION_ERROR', 'Semantic request must contain JSON values only.');
}
export class SemanticFingerprint {
  private readonly key: Buffer;
  constructor(key: Uint8Array) {
    if (key.byteLength < 32)
      throw new Error('A stable private fingerprint key of at least 32 bytes is required.');
    this.key = Buffer.from(key);
  }
  fingerprint(input: unknown): string {
    const serialized = canonical(input, 0);
    if (Buffer.byteLength(serialized) > 262144)
      throw new AppError('VALIDATION_ERROR', 'Semantic request is too large.');
    // Keyed digest prevents offline guessing of low-entropy private semantic inputs from database receipts.
    return createHmac('sha256', this.key).update(serialized).digest('hex');
  }
}
