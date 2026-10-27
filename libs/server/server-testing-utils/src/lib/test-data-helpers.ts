import { randomUUID } from 'crypto';
import { PrismaClient, User, RegistrationStatus, Prisma } from '@prisma/client';
import { UserRole } from '@cthub-bsaas/shared';
import * as bcrypt from 'bcryptjs';

/**
 * Ensures the provided auth roles exist in the role table.
 *
 * @param prisma Prisma client used for persistence.
 * @param roles Optional subset of roles to enforce.
 * @returns A promise that resolves when all roles are present.
 */
export async function ensureAuthRoles(prisma: PrismaClient, roles: UserRole[] = Object.values(UserRole)) {
  for (const role of roles) {
    const name = role.toUpperCase();
    await prisma.role.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
}

/**
 * Deletes a test user and all their dependent records.
 *
 * @param prisma The PrismaClient instance.
 * @param user The user object to delete.
 * @returns A promise that resolves when the deletion completes.
 */
export async function deleteTestUser(prisma: PrismaClient, user: User) {
  if (!user) return;

  // Remove records that would otherwise block user deletion via FK constraints.
  await prisma.saasOwner.deleteMany({ where: { userId: user.id } });

  // Find all sessions for the user to get their IDs.
  const sessions = await prisma.session.findMany({
    where: { userId: user.id },
    select: { id: true },
  });
  const sessionIds = sessions.map((s) => s.id);

  if (sessionIds.length > 0) {
    await prisma.refreshToken.deleteMany({ where: { sessionId: { in: sessionIds } } });
  }

  await prisma.refreshToken.deleteMany({ where: { userId: user.id } });
  await prisma.session.deleteMany({ where: { userId: user.id } });
  await prisma.socialAccount.deleteMany({ where: { userId: user.id } });
  await prisma.credentialPasskey.deleteMany({ where: { userId: user.id } });
  await prisma.credentialTOTP.deleteMany({ where: { userId: user.id } });
  await prisma.recoveryCode.deleteMany({ where: { userId: user.id } });
  await prisma.passwordReset.deleteMany({ where: { userId: user.id } });
  await prisma.emailVerification.deleteMany({ where: { email: user.email } });
  await prisma.userRole.deleteMany({ where: { userId: user.id } });
  await prisma.salonTenantStaff.deleteMany({ where: { userId: user.id } });

  await prisma.user.delete({ where: { id: user.id } });
}

/**
 * Configuration options shared by the auth test user factory helpers.
 */
export interface CreateAuthTestUserOptions {
  /** Optional explicit email address; defaults to a random value. */
  readonly email?: string;
  /** Plain-text password to hash for the user; defaults to `password`. */
  readonly password?: string;
  /** Display name to assign; defaults to `Test User`. */
  readonly name?: string;
  /** Flag indicating whether the user email is verified; defaults to true. */
  readonly isVerified?: boolean;
  /** Explicit verification timestamp; defaults to `new Date()` when verified, otherwise null. */
  readonly emailVerifiedAt?: Date | null;
  /** Registration status override; defaults to `RegistrationStatus.COMPLETED`. */
  readonly registrationStatus?: RegistrationStatus;
  /** Additional Prisma update payload applied after creation. */
  readonly overrides?: Prisma.UserUpdateInput;
}

/**
 * Internal factory that creates an auth test user for the specified roles.
 *
 * @param prisma Prisma client used for persistence.
 * @param roles Set of roles to bind to the user.
 * @param options Additional creation customisations.
 * @returns The created and fully updated user record.
 */
export async function createAuthTestUser(prisma: PrismaClient, roles: UserRole[], options: CreateAuthTestUserOptions = {}): Promise<User> {
  const uniqueRoles = Array.from(new Set(roles));
  if (uniqueRoles.length === 0) {
    throw new Error('createAuthTestUser requires at least one role.');
  }

  await ensureAuthRoles(prisma, uniqueRoles);

  const email = options.email ?? `test-${randomUUID()}@example.com`;
  const passwordHash = await bcrypt.hash(options.password ?? 'password', 10);
  const isVerified = options.isVerified ?? true;
  const emailVerifiedAt = typeof options.emailVerifiedAt === 'undefined' ? (isVerified ? new Date() : null) : options.emailVerifiedAt;
  const registrationStatus = options.registrationStatus ?? RegistrationStatus.COMPLETED;

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name: options.name ?? 'Test User',
      isVerified,
      emailVerifiedAt,
      registrationStatus,
      roles: {
        create: uniqueRoles.map((role) => ({
          role: {
            connect: { name: role.toUpperCase() },
          },
        })),
      },
    },
  });

  if (options.overrides && Object.keys(options.overrides).length > 0) {
    await prisma.user.update({
      where: { id: user.id },
      data: options.overrides,
    });
  }

  return prisma.user.findUniqueOrThrow({ where: { id: user.id } });
}

/**
 * Creates a standard test user with the CUSTOMER role.
 *
 * @param prisma The PrismaClient instance.
 * @param email Email address to assign to the user.
 * @param options Optional customisation overrides.
 * @returns The created user record.
 */
export async function createCustomerTestUser(
  prisma: PrismaClient,
  email: string,
  options: Omit<CreateAuthTestUserOptions, 'email'> = {},
): Promise<User> {
  return createAuthTestUser(prisma, [UserRole.CUSTOMER], { ...options, email });
}

/**
 * Creates a SaaS owner (admin) test user wired with the ADMIN role.
 *
 * @param prisma The PrismaClient instance.
 * @param options Optional customisation overrides.
 * @returns The created user record.
 */
export async function createAdminTestUser(prisma: PrismaClient, options: CreateAuthTestUserOptions = {}): Promise<User> {
  const user = await createAuthTestUser(prisma, [UserRole.ADMIN], options);

  await prisma.saasOwner.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      permissions: [],
      managedTenants: [],
    },
  });

  return user;
}

/**
 * Creates a partner owner test user wired with the OWNER role.
 *
 * @param prisma The PrismaClient instance.
 * @param options Optional customisation overrides.
 * @returns The created user record.
 */
export async function createOwnerTestUser(prisma: PrismaClient, options: CreateAuthTestUserOptions = {}): Promise<User> {
  return createAuthTestUser(prisma, [UserRole.OWNER], options);
}

/**
 * Creates a partner staff test user wired with the STAFF role.
 *
 * @param prisma The PrismaClient instance.
 * @param options Optional customisation overrides.
 * @returns The created user record.
 */
export async function createStaffTestUser(prisma: PrismaClient, options: CreateAuthTestUserOptions = {}): Promise<User> {
  return createAuthTestUser(prisma, [UserRole.STAFF], options);
}

/**
 * Deletes a customer test user and dependent records.
 *
 * @param prisma The PrismaClient instance.
 * @param user The user to delete.
 * @returns A promise that resolves when the deletion completes.
 */
export async function deleteCustomerTestUser(prisma: PrismaClient, user: User): Promise<void> {
  await deleteTestUser(prisma, user);
}

/**
 * Deletes an admin test user alongside SaaS owner metadata.
 *
 * @param prisma The PrismaClient instance.
 * @param user The user to delete.
 * @returns A promise that resolves when the deletion completes.
 */
export async function deleteAdminTestUser(prisma: PrismaClient, user: User): Promise<void> {
  await deleteTestUser(prisma, user);
}

/**
 * Deletes a partner owner test user and associated records.
 *
 * @param prisma The PrismaClient instance.
 * @param user The user to delete.
 * @returns A promise that resolves when the deletion completes.
 */
export async function deleteOwnerTestUser(prisma: PrismaClient, user: User): Promise<void> {
  await deleteTestUser(prisma, user);
}

/**
 * Deletes a partner staff test user and associated records.
 *
 * @param prisma The PrismaClient instance.
 * @param user The user to delete.
 * @returns A promise that resolves when the deletion completes.
 */
export async function deleteStaffTestUser(prisma: PrismaClient, user: User): Promise<void> {
  await deleteTestUser(prisma, user);
}
