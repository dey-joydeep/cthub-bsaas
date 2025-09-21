import { setupAuthIntegrationHarness, AuthIntegrationHarness } from '../utils/auth-integration.harness';
import { AuthService } from '../../../src/lib/services/auth.service';
import { PrismaService } from '@cthub-bsaas/server-data-access';
import { ThrottlerStorageService } from '@nestjs/throttler';

describe('FK-safe session revoke (edge-case)', () => {
  let harness: AuthIntegrationHarness;
  let svc: AuthService;
  let prisma: PrismaService;

  beforeAll(async () => {
    harness = await setupAuthIntegrationHarness();
    svc = harness.app.get(AuthService);
    prisma = harness.app.get(PrismaService);
  });

  afterEach(async () => {
    await harness.cleanupUsers();
    harness.resetEmails();
    try {
      const storage = harness.app.get(ThrottlerStorageService);
      await Promise.resolve(storage.reset());
    } catch {
      // Guard not registered; ignore.
    }
  });

  afterAll(async () => {
    await harness.close();
  });

  it('deletes dependent refresh tokens before session deletion', async () => {
    const user = await prisma.user.create({
      data: { email: `fk_${Date.now()}@example.com`, passwordHash: 'x' },
    });
    harness.trackUser(user.id);
    const session = await prisma.session.create({ data: { userId: user.id } });
    await prisma.refreshToken.create({
      data: { jti: `j_${Date.now()}`, userId: user.id, sessionId: session.id },
    });

    await expect(svc.revokeSession(user.id, session.id)).resolves.toEqual({ success: true });

    const sess = await prisma.session.findUnique({ where: { id: session.id } });
    const rts = await prisma.refreshToken.findMany({ where: { sessionId: session.id } });
    expect(sess).toBeNull();
    expect(rts.length).toBe(0);
  });
});
