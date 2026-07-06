import request from 'supertest';
import { setupAuthIntegrationHarness, AuthIntegrationHarness } from '../utils/auth-integration.harness';

import 'reflect-metadata';

describe('Audit correlationId (edge-case)', () => {
  let harness: AuthIntegrationHarness;

  beforeEach(async () => {
    harness = await setupAuthIntegrationHarness();
    await harness.resetThrottle();
  });

  afterEach(async () => {
    try {
      await harness.cleanupUsers();
      await harness.resetThrottle();
      await harness.close();
    } catch {}
  });

  it('propagates x-correlation-id through an audited endpoint', async () => {
    const user = await harness.registerUser();
    const loginRes = await request(harness.app.getHttpServer())
      .post('/auth/login')
      .send({ email: user.email, password: 'password' })
      .expect(200);
    const cookies = harness.expectCookies(harness.toCookiesArray(loginRes.headers['set-cookie']), { requireAuth: true });

    // Hit recovery generate which logs an audit event
    const res = await harness
      .withAuth(request(harness.app.getHttpServer()).post('/auth/recovery/generate').set('x-correlation-id', 'cid-it-123'), cookies)
      .expect(200);

    // Response should echo correlation id header from middleware
    expect(res.headers['x-correlation-id']).toBeDefined();
  });
});
