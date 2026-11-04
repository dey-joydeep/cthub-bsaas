import { randomUUID } from 'node:crypto';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { UserRole, type AuthenticatedUser } from '@cthub-bsaas/shared';
import { PrismaService } from '@cthub-bsaas/server-data-access';
import { SalonOwnerSettingsService } from '../../src/lib/services/salon-owner-settings.service';

describe('Salon owner settings with PostgreSQL', () => {
  const prisma = new PrismaService();
  const service = new SalonOwnerSettingsService(prisma);
  const fixtures: Array<{ tenantId: string; userId: string }> = [];

  async function createOwner(): Promise<AuthenticatedUser> {
    const tenant = await prisma.salonTenant.create({
      data: { name: `Test tenant ${randomUUID()}`, email: `${randomUUID()}@example.test` },
    });
    const user = await prisma.user.create({
      data: {
        email: `${randomUUID()}@example.test`,
        passwordHash: 'test-only',
        salonTenantId: tenant.id,
      },
    });
    fixtures.push({ tenantId: tenant.id, userId: user.id });
    return { id: user.id, email: user.email, roles: [UserRole.OWNER], tenantId: tenant.id };
  }

  beforeAll(async () => {
    await prisma.$connect();
  });

  afterEach(async () => {
    for (const fixture of fixtures.splice(0)) {
      await prisma.auditEvent.deleteMany({ where: { tenantId: fixture.tenantId } });
      await prisma.user.delete({ where: { id: fixture.userId } });
      await prisma.salonTenant.delete({ where: { id: fixture.tenantId } });
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('returns one business for concurrent requests with the same idempotency key', async () => {
    const owner = await createOwner();
    const key = randomUUID();
    const input = { displayName: `Salon ${randomUUID()}`, legalName: 'Test Salon Ltd', status: 'ACTIVE' as const };

    const results = await Promise.allSettled(
      Array.from({ length: 2 }, () => service.createBusiness({ user: owner, idempotencyKey: key }, input)),
    );

    expect(results.every((result) => result.status === 'fulfilled')).toBe(true);
    const ids = results.map((result) => (result.status === 'fulfilled' ? result.value.id : null));
    expect(new Set(ids).size).toBe(1);
    expect(await prisma.salonBusiness.count({ where: { tenantId: owner.tenantId } })).toBe(1);
    expect(
      await prisma.auditEvent.count({
        where: { tenantId: owner.tenantId, action: 'salon_owner.business.create.idempotency', correlationId: key },
      }),
    ).toBe(1);

    await expect(
      service.createBusiness({ user: owner, idempotencyKey: key }, { ...input, legalName: 'Different legal name' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('allows only one payload when concurrent requests reuse an idempotency key', async () => {
    const owner = await createOwner();
    const key = randomUUID();
    let replayReads = 0;
    let releaseReads: () => void = () => undefined;
    let rejectReads: (error: Error) => void = () => undefined;
    const bothRead = new Promise<void>((resolve, reject) => {
      releaseReads = resolve;
      rejectReads = reject;
    });
    const timeout = setTimeout(() => rejectReads(new Error('Both transactions did not reach the replay read')), 8000);
    timeout.unref();

    const barrierPrisma = {
      $transaction: <T>(
        callback: (tx: Prisma.TransactionClient) => Promise<T>,
        options?: { isolationLevel?: Prisma.TransactionIsolationLevel },
      ) =>
        prisma.$transaction(
          (tx) =>
            callback(
              new Proxy(tx, {
                get(target, property) {
                  if (property !== 'auditEvent') return Reflect.get(target, property, target);
                  return new Proxy(target.auditEvent, {
                    get(auditEvent, method) {
                      if (method !== 'findFirst') {
                        const value: unknown = Reflect.get(auditEvent, method, auditEvent);
                        return typeof value === 'function' ? value.bind(auditEvent) : value;
                      }
                      return async (args: Prisma.AuditEventFindFirstArgs) => {
                        const row = await auditEvent.findFirst(args);
                        if (args.where?.action === 'salon_owner.business.create.idempotency' && replayReads < 2) {
                          replayReads += 1;
                          if (replayReads === 2) {
                            clearTimeout(timeout);
                            releaseReads();
                          }
                          await bothRead;
                        }
                        return row;
                      };
                    },
                  });
                },
              }),
            ),
          { ...options, maxWait: 12000, timeout: 20000 },
        ),
      auditEvent: prisma.auditEvent,
      salonBusiness: prisma.salonBusiness,
    } as unknown as PrismaService;
    const contendedService = new SalonOwnerSettingsService(barrierPrisma);
    const results = await Promise.allSettled([
      contendedService.createBusiness(
        { user: owner, idempotencyKey: key },
        { displayName: 'First Salon', legalName: 'First Salon Ltd', status: 'ACTIVE' },
      ),
      contendedService.createBusiness(
        { user: owner, idempotencyKey: key },
        { displayName: 'Second Salon', legalName: 'Second Salon Ltd', status: 'ACTIVE' },
      ),
    ]);
    clearTimeout(timeout);

    expect(replayReads).toBe(2);
    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    const rejected = results.find((result) => result.status === 'rejected');
    expect(rejected?.status === 'rejected' ? rejected.reason : null).toBeInstanceOf(ConflictException);
    expect(await prisma.salonBusiness.count({ where: { tenantId: owner.tenantId } })).toBe(1);
    expect(
      await prisma.auditEvent.count({
        where: { tenantId: owner.tenantId, action: 'salon_owner.business.create.idempotency', correlationId: key },
      }),
    ).toBe(1);
  });

  it('does not expose a different tenant business by ID at the service layer', async () => {
    const owner = await createOwner();
    const otherOwner = await createOwner();
    const business = await service.createBusiness(
      { user: owner, idempotencyKey: randomUUID() },
      { displayName: 'Private Salon', legalName: 'Private Salon Ltd', status: 'ACTIVE' },
    );

    await expect(service.getBusiness({ user: otherOwner }, business.id)).rejects.toBeInstanceOf(NotFoundException);
  });
});
