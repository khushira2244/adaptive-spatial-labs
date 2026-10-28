import { z } from 'zod';
import { AppError } from '../errors/app-error.js';

export const changeStampSchema = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
export type ChangeStamp = z.infer<typeof changeStampSchema>;

/** Use inside the owner's atomic read/conditional-write boundary, never as a preflight alone. */
export function requireChangeStamp(current: ChangeStamp, expected: ChangeStamp): void {
  changeStampSchema.parse(current);
  changeStampSchema.parse(expected);
  if (current !== expected)
    throw new AppError(
      'STALE_CHANGE_STAMP',
      'The item changed. Reload and review before retrying.',
    );
}
export function advanceChangeStamp(current: ChangeStamp, expected: ChangeStamp): ChangeStamp {
  requireChangeStamp(current, expected);
  if (current === Number.MAX_SAFE_INTEGER)
    throw new AppError('DOMAIN_CONFLICT', 'The change stamp cannot advance.');
  return current + 1;
}

/** Require a row returned by an atomic conditional UPDATE ... WHERE expected stamp matches. */
export function requireChangedRow<T>(row: T | undefined): T {
  if (row === undefined)
    throw new AppError(
      'STALE_CHANGE_STAMP',
      'The item changed. Reload and review before retrying.',
    );
  return row;
}
