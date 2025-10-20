import { RATE_LIMITER } from './rate-limiter';

describe('RATE_LIMITER InjectionToken', () => {
  it('is a Symbol and carries a descriptive label', () => {
    expect(typeof RATE_LIMITER).toBe('symbol');
    expect(String(RATE_LIMITER)).toContain('RATE_LIMITER');
  });
});

