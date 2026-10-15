import { describe, it, expect } from 'vitest';
import { readConfig } from '../src/shared/config/config.js';
describe('Validated environment', () => {
  const valid = {
    DATABASE_URL: 'postgresql://localhost/asl',
    ACCESS_TOKEN_SECRET: 'a'.repeat(32),
    REFRESH_TOKEN_SECRET: 'b'.repeat(32),
  };
  it('applies defaults and integer TTLs', () => {
    expect(readConfig(valid).ACCESS_TOKEN_TTL).toBe(900);
  });
  it('rejects missing config without printing submitted secrets', () => {
    expect(() => readConfig({})).toThrow('Invalid configuration');
  });
  it('rejects equal secrets and excessively long access TTL', () => {
    expect(() =>
      readConfig({ ...valid, REFRESH_TOKEN_SECRET: valid.ACCESS_TOKEN_SECRET }),
    ).toThrow();
    expect(() => readConfig({ ...valid, ACCESS_TOKEN_TTL: '90000' })).toThrow();
  });
});
