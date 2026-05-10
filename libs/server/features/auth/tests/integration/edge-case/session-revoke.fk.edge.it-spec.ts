import { Test } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '../../../src/lib/auth.module';
import { OAUTH_PORT } from '@cthub-bsaas/server-contracts-auth';
import { AuthService } from '../../../src/lib/services/auth.service';
import { PrismaService } from '@cthub-bsaas/server-data-access';

describe('FK-safe session revoke (edge-case)', () => {
  let svc: AuthService;
  let prisma: PrismaService;
  let moduleRef: import('@nestjs/testing').TestingModule;

  beforeAll(async () => {
    const builder = Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true }), AuthModule],
    }).overrideProvider(OAUTH_PORT).useValue({
      start: async () => ({ redirectUrl: 'x' }),
      exchangeCode: async () => ({ provider: 'x', providerUserId: 'y' }),
    });
    moduleRef = await builder.compile();
    svc = moduleRef.get(AuthService);
    prisma = moduleRef.get(PrismaService);
    await moduleRef.init();
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  it('deletes dependent refresh tokens before session deletion', async () => {
    // Arrange: create a user, session and a refresh token bound to the session
    const user = await prisma.user.create({
      data: { email: `fk_${Date.now()}@example.com`, passwordHash: 'x' },
    });
    const session = await prisma.session.create({ data: { userId: user.id } });
    await prisma.refreshToken.create({
      data: { jti: `j_${Date.now()}`, userId: user.id, sessionId: session.id },
    });

    // Act: revoke via service (will call repository which clears RTs then session)
    await expect(svc.revokeSession(user.id, session.id)).resolves.toEqual({ success: true });

    // Assert: session and dependent refresh tokens are removed
    const sess = await prisma.session.findUnique({ where: { id: session.id } });
    const rts = await prisma.refreshToken.findMany({ where: { sessionId: session.id } });
    expect(sess).toBeNull();
    expect(rts.length).toBe(0);

    // Cleanup
    await prisma.user.delete({ where: { id: user.id } });
  });
});
