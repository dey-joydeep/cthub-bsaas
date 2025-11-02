import request from 'supertest';
import { setupAuthIntegrationHarness, AuthIntegrationHarness } from '../utils/auth-integration.harness';

/**
 * HTTP-level edge coverage to exercise controller decorators/guards and branch instrumentation.
 */
describe('Controllers HTTP edge coverage (integration)', () => {
  let harness: AuthIntegrationHarness;

  beforeEach(async () => {
    harness = await setupAuthIntegrationHarness();
  });

  afterEach(async () => {
    await harness.close();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    harness = undefined as any;
  });

  it('GET /auth/oauth/google/start responds with 302 redirect', async () => {
    const server = harness.app.getHttpServer();
    const res = await request(server).get('/auth/oauth/google/start');
    expect([301, 302]).toContain(res.status);
    expect(String(res.headers['location'] ?? '')).toContain('http');
  });

  it('GET /auth/oauth/google/callback without code returns 400', async () => {
    const server = harness.app.getHttpServer();
    const res = await request(server).get('/auth/oauth/google/callback');
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });

  it('POST /auth/webauthn/login/start without email or user returns 400', async () => {
    const server = harness.app.getHttpServer();
    const res = await request(server)
      .post('/auth/webauthn/login/start')
      .set('Content-Type', 'application/json')
      .send({});
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });
});

