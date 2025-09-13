
import { PrismaClient } from '@prisma/client';

describe('Partner Registration DB Schema', () => {
  let prisma: PrismaClient;

  beforeAll(() => {
    prisma = new PrismaClient();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('User Model Additions', () => {
    it('should have the isVerified column', async () => {
      const user = await prisma.user.findFirst({ select: { isVerified: true } });
      expect(user).toBeDefined();
    });

    it('should have the emailVerifiedAt column', async () => {
      const user = await prisma.user.findFirst({ select: { emailVerifiedAt: true } });
      expect(user).toBeDefined();
    });

    it('should have the isMFAEnrollRequired column', async () => {
      const user = await prisma.user.findFirst({ select: { isMFAEnrollRequired: true } });
      expect(user).toBeDefined();
    });

    it('should have the registrationStatus column', async () => {
      const user = await prisma.user.findFirst({ select: { registrationStatus: true } });
      expect(user).toBeDefined();
    });
  });

  describe('New Tables', () => {
    it('should have the RegistrationLink table', async () => {
      const count = await prisma.registrationLink.count();
      expect(count).toBeGreaterThanOrEqual(0);
    });

    it('should have the StaffInvite table', async () => {
      const count = await prisma.staffInvite.count();
      expect(count).toBeGreaterThanOrEqual(0);
    });

    it('should have the RegistrationSession table', async () => {
        const count = await prisma.registrationSession.count();
        expect(count).toBeGreaterThanOrEqual(0);
    });
  });
});
