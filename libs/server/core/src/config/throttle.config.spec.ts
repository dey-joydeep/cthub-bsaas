import throttleConfig from './throttle.config';

describe('ThrottleConfig', () => {
  it('should return default values if env vars are not set', () => {
    const config = throttleConfig();
    expect(config.ttl).toBe(60);
    expect(config.limit).toBe(100);
  });

  it('should return values from environment variables', () => {
    process.env.THROTTLE_TTL = '120';
    process.env.THROTTLE_LIMIT = '200';
    const config = throttleConfig();
    expect(config.ttl).toBe(120);
    expect(config.limit).toBe(200);
  });
});
