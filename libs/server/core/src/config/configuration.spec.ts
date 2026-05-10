import { configuration } from './configuration';

describe('Configuration Factory', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules(); // Most important - it clears the cache
    process.env = { ...OLD_ENV }; // Make a copy
  });

  afterAll(() => {
    process.env = OLD_ENV; // Restore old environment
  });

  it('should return default values when no env is set', () => {
    delete process.env.NODE_ENV;
    delete process.env.PORT;
    delete process.env.DATABASE_URL;
    delete process.env.JWT_SECRET;
    delete process.env.API_BODY_LIMIT_JSON;
    delete process.env.API_BODY_LIMIT_URLENCODED;
    delete process.env.CORS_ORIGINS;
    delete process.env.UPLOAD_DIR;
    delete process.env.RATE_LIMIT_WINDOW_MS;
    delete process.env.RATE_LIMIT_MAX;
    delete process.env.EMAIL_HOST;
    delete process.env.EMAIL_PORT;
    delete process.env.EMAIL_SECURE;
    delete process.env.EMAIL_USER;
    delete process.env.EMAIL_PASS;
    delete process.env.EMAIL_FROM;
    delete process.env.ENCRYPTION_KEY;
    delete process.env.ENCRYPTION_TEST_KEY;
    delete process.env.LOG_DIR;
    delete process.env.LOG_APP_FILE;
    delete process.env.LOG_APP_LEVEL;
    delete process.env.LOG_LEVEL;
    delete process.env.LOG_ACCESS_FILE;
    delete process.env.LOG_ACCESS_LEVEL;

    const config = configuration();

    expect(config.app.port).toBe(3000);
    expect(config.app.nodeEnv).toBe('development');
    expect(config.app.isDevelopment).toBe(true);
    expect(config.app.isProduction).toBe(false);
    expect(config.app.isTest).toBe(false);
    expect(config.app.bodyLimitJson).toBe('10mb');
    expect(config.app.bodyLimitUrlEncoded).toBe('10mb');
    expect(config.database.url).toBe('');
    expect(config.auth.jwtAccessSecret).toBe('test-access-secret');
    expect(config.cors.origins).toEqual([]);
    expect(config.file.uploadDir).toBe('uploads');
    expect(config.rateLimit.windowMs).toBe(900000);
    expect(config.rateLimit.max).toBe(100);
    expect(config.email.host).toBe('smtp.example.com');
    expect(config.email.port).toBe(587);
    expect(config.email.secure).toBe(false);
    expect(config.email.user).toBe('');
    expect(config.email.password).toBe('');
    expect(config.email.from).toBe('');
    expect(config.encryption.key).toBe('');
    expect(config.log.dir).toBe('logs');
    expect(config.log.app.file).toBe('app.log');
    expect(config.log.app.level).toBe('info');
    expect(config.log.access.file).toBe('access.log');
    expect(config.log.access.level).toBe('info');
  });

  it('should correctly identify production and test environments', () => {
    process.env.NODE_ENV = 'production';
    let config = configuration();
    expect(config.app.isProduction).toBe(true);
    expect(config.app.isDevelopment).toBe(false);

    process.env.NODE_ENV = 'test';
    config = configuration();
    expect(config.app.isTest).toBe(true);
    expect(config.app.isDevelopment).toBe(false);
  });

  it('should use fallback JWT_SECRET for all JWT secrets', () => {
    process.env.JWT_SECRET = 'fallback';
    const config = configuration();
    expect(config.auth.jwtAccessSecret).toBe('fallback');
    expect(config.auth.jwtRefreshSecret).toBe('fallback');
    expect(config.auth.jwtEmailChangeSecret).toBe('fallback');
    expect(config.auth.jwtVerifyEmailSecret).toBe('fallback');
  });

  it('should handle comma-separated CORS origins', () => {
    process.env.CORS_ORIGINS = 'http://a.com, http://b.com';
    const config = configuration();
    expect(config.cors.origins).toEqual(['http://a.com', 'http://b.com']);
  });
});