import request from 'supertest';
import { setupAuthIntegrationHarness, AuthIntegrationHarness } from './utils/auth-integration.harness';


import 'reflect-metadata';

describe('Passkeys (Integration)', () => {
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

  it('lists and deletes passkeys', async () => {
    const user = await harness.registerUser();

    // manually insert a credential to simulate registered passkey
    await harness.prisma.credentialPasskey.create({
      data: {
        userId: user.id,
        credentialId: `cred-${Date.now()}`,
        publicKey: Buffer.from('00', 'hex'),
        counter: 0,
        transports: 'internal,hybrid',
      },
    });

    const loginRes = await request(harness.app.getHttpServer())
      .post('/auth/login')
      .send({ email: user.email, password: 'password' })
      .expect(200);
    const cookies = harness.expectCookies(harness.toCookiesArray(loginRes.headers['set-cookie']), { requireAuth: true });

    const listRes = await harness
      .withAuth(request(harness.app.getHttpServer()).get('/auth/webauthn/devices'), cookies)
      .expect(200);
    expect(Array.isArray(listRes.body.data)).toBe(true);
    const records = listRes.body.data as Array<{ credentialId: string; transports?: string[] }>;
    expect(records.length).toBeGreaterThan(0);
    const id = records[0].credentialId;

    await harness
      .withAuth(request(harness.app.getHttpServer()).delete(`/auth/webauthn/devices/${id}`), cookies)
      .expect(200);

    const listAfter = await harness
      .withAuth(request(harness.app.getHttpServer()).get('/auth/webauthn/devices'), cookies)
      .expect(200);
    const after = listAfter.body.data as Array<{ credentialId: string }>;
    expect(after.find((r) => r.credentialId === id)).toBeUndefined();
  });

  it('blocks deleting last method when user has no password or socials', async () => {
    const user = await harness.registerUser();
    const credId = `cred-${Date.now()}-x`;
    await harness.prisma.credentialPasskey.create({
      data: { userId: user.id, credentialId: credId, publicKey: Buffer.from('00', 'hex'), counter: 0 },
    });

    // Login first, then remove other auth methods to simulate last-method constraint
    const loginRes = await request(harness.app.getHttpServer())
      .post('/auth/login')
      .send({ email: user.email, password: 'password' })
      .expect(200);
    const cookies = harness.expectCookies(harness.toCookiesArray(loginRes.headers['set-cookie']), { requireAuth: true });

    // Drop password and socials after session is issued
    await harness.prisma.user.update({ where: { id: user.id }, data: { passwordHash: '' } });
    await harness.prisma.socialAccount.deleteMany({ where: { userId: user.id } });

    await harness
      .withAuth(request(harness.app.getHttpServer()).delete(`/auth/webauthn/devices/${credId}`), cookies)
      .expect(401);
  });

  it('returns 401 when deleting a non-existent credential (not found)', async () => {
    const user = await harness.registerUser();
    const loginRes = await request(harness.app.getHttpServer())
      .post('/auth/login')
      .send({ email: user.email, password: 'password' })
      .expect(200);
    const cookies = harness.expectCookies(harness.toCookiesArray(loginRes.headers['set-cookie']), { requireAuth: true });

    await harness
      .withAuth(request(harness.app.getHttpServer()).delete(`/auth/webauthn/devices/does-not-exist`), cookies)
      .expect(401);
  });
});
