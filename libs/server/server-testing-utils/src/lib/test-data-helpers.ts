import { PrismaClient, User } from '@prisma/client';
import { UserRole } from '@cthub-bsaas/shared';
import * as bcrypt from 'bcryptjs';



/**
 * Deletes a test user and all their dependent records.
 * This should be called in an afterAll or afterEach block.
 * @param prisma The PrismaClient instance.
 * @param user The user object to delete.
 */
export async function deleteTestUser(prisma: PrismaClient, user: User) {
  if (!user) return;

  // Find all sessions for the user to get their IDs
  const sessions = await prisma.session.findMany({
    where: { userId: user.id },
    select: { id: true },
  });
  const sessionIds = sessions.map(s => s.id);

  // Delete dependent records first
  if (sessionIds.length > 0) {
    await prisma.refreshToken.deleteMany({ where: { sessionId: { in: sessionIds } } });
  }
  await prisma.session.deleteMany({ where: { userId: user.id } });
  await prisma.userRole.deleteMany({ where: { userId: user.id } });
  await prisma.credentialTOTP.deleteMany({ where: { userId: user.id } });

  // Finally, delete the user
  await prisma.user.delete({ where: { id: user.id } });
}

/**
 * Creates a standard test user with the CUSTOMER role.
 * Assumes the Role table has been populated by createRoles.
 * @param prisma The PrismaClient instance.
 * @returns The created user record.
 */
export async function createCustomerTestUser(
  prisma: PrismaClient,
  email: string,
): Promise<User> {
  const passwordHash = await bcrypt.hash('password', 10);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name: 'Test User',
      isVerified: true,
      emailVerifiedAt: new Date(),
      roles: {
        create: [
          {
            role: {
              connect: {
                name: UserRole.CUSTOMER,
              },
            },
          },
        ],
      },
    },
  });
  return user;
}