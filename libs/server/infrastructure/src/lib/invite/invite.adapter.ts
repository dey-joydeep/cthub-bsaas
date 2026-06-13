import { BadRequestException, ConflictException, GoneException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@cthub-bsaas/server-data-access';
import {
  InvitePort,
  InviteValidationResult,
  RegistrationCompleteInput,
  RegistrationCompleteResult,
} from '@cthub-bsaas/server-contracts-auth';
import { COMMON_MESSAGE_KEYS } from '@cthub-bsaas/shared';
import * as bcrypt from 'bcryptjs';
import { createHash } from 'crypto';

function sha256(input: string): string {
  return createHash('sha256').update(input, 'utf8').digest('hex');
}

type TransactionClient = Prisma.TransactionClient;
const inviteSalonInclude = {
  salon: {
    select: {
      tenantId: true,
    },
  },
} satisfies Prisma.RegistrationLinkInclude;
const invitedUserIdentitySelect = {
  id: true,
  salonTenantId: true,
} satisfies Prisma.UserSelect;
const invitedUserResultSelect = {
  id: true,
  salonTenantId: true,
  isMFAEnrollRequired: true,
} satisfies Prisma.UserSelect;

type OwnerInviteRecord = Prisma.RegistrationLinkGetPayload<{ include: typeof inviteSalonInclude }>;
type StaffInviteRecord = Prisma.StaffInviteGetPayload<{ include: typeof inviteSalonInclude }>;
type InvitedUserIdentity = Prisma.UserGetPayload<{ select: typeof invitedUserIdentitySelect }>;
type InvitedUserResult = Prisma.UserGetPayload<{ select: typeof invitedUserResultSelect }>;

@Injectable()
export class InvitePrismaAdapter implements InvitePort {
  constructor(private readonly prisma: PrismaService) {}

  private invitedUserData(passwordHash: string) {
    return {
      passwordHash,
      isVerified: true,
      emailVerifiedAt: new Date(),
      registrationStatus: 'COMPLETED' as const,
    };
  }

  private async ensureOwnerToken(token: string): Promise<OwnerInviteRecord> {
    const tokenHash = sha256(token);
    const rec = await this.prisma.registrationLink.findFirst({
      where: { tokenHash, usedAt: null },
      include: inviteSalonInclude,
    });
    if (!rec) throw new BadRequestException('error.validation');
    if (rec.expiresAt <= new Date()) throw new GoneException();
    return rec;
  }

  private async ensureStaffToken(token: string): Promise<StaffInviteRecord> {
    const tokenHash = sha256(token);
    const rec = await this.prisma.staffInvite.findFirst({
      where: { tokenHash, usedAt: null },
      include: inviteSalonInclude,
    });
    if (!rec) throw new BadRequestException('error.validation');
    if (rec.expiresAt <= new Date()) throw new GoneException();
    return rec;
  }

  async validateOwner(token: string): Promise<InviteValidationResult> {
    const rec = await this.ensureOwnerToken(token);
    return { email: rec.email, salonId: rec.salonId };
  }

  async completeOwner(input: RegistrationCompleteInput): Promise<RegistrationCompleteResult> {
    return this.prisma.$transaction(
      async (tx: TransactionClient) => {
        const rec = await this.ensureOwnerTokenInTransaction(tx, input.token);
        const passwordHash = await bcrypt.hash(input.password, 10);
        const user = await this.upsertInvitedUser(tx, rec.email, rec.salon.tenantId, passwordHash);
        const role = await tx.role.findUnique({ where: { name: 'OWNER' } });
        if (role) {
          await tx.userRole.upsert({
            where: { userId_roleId: { userId: user.id, roleId: role.id } },
            update: {},
            create: { userId: user.id, roleId: role.id },
          });
        }
        await tx.registrationLink.update({ where: { id: rec.id }, data: { usedAt: new Date() } });
        return { userId: user.id, requireMfa: user.isMFAEnrollRequired };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  async validateStaff(token: string): Promise<InviteValidationResult> {
    const rec = await this.ensureStaffToken(token);
    return { email: rec.email, salonId: rec.salonId, role: rec.role };
  }

  async completeStaff(input: RegistrationCompleteInput): Promise<RegistrationCompleteResult> {
    return this.prisma.$transaction(
      async (tx: TransactionClient) => {
        const rec = await this.ensureStaffTokenInTransaction(tx, input.token);
        const passwordHash = await bcrypt.hash(input.password, 10);
        const user = await this.upsertInvitedUser(tx, rec.email, rec.salon.tenantId, passwordHash);
        const role = await tx.role.findUnique({ where: { name: 'STAFF' } });
        if (role) {
          await tx.userRole.upsert({
            where: { userId_roleId: { userId: user.id, roleId: role.id } },
            update: {},
            create: { userId: user.id, roleId: role.id },
          });
        }
        await tx.staffInvite.update({ where: { id: rec.id }, data: { usedAt: new Date() } });
        return { userId: user.id, requireMfa: user.isMFAEnrollRequired };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  private async ensureOwnerTokenInTransaction(tx: Pick<TransactionClient, 'registrationLink'>, token: string): Promise<OwnerInviteRecord> {
    const tokenHash = sha256(token);
    const rec = await tx.registrationLink.findFirst({
      where: { tokenHash, usedAt: null },
      include: inviteSalonInclude,
    });
    if (!rec) throw new BadRequestException('error.validation');
    if (rec.expiresAt <= new Date()) throw new GoneException();
    return rec;
  }

  private async ensureStaffTokenInTransaction(tx: Pick<TransactionClient, 'staffInvite'>, token: string): Promise<StaffInviteRecord> {
    const tokenHash = sha256(token);
    const rec = await tx.staffInvite.findFirst({
      where: { tokenHash, usedAt: null },
      include: inviteSalonInclude,
    });
    if (!rec) throw new BadRequestException('error.validation');
    if (rec.expiresAt <= new Date()) throw new GoneException();
    return rec;
  }

  private async upsertInvitedUser(
    tx: Pick<TransactionClient, 'user'>,
    email: string,
    invitedTenantId: string,
    passwordHash: string,
  ): Promise<InvitedUserResult> {
    const existingUser: InvitedUserIdentity | null = await tx.user.findUnique({
      where: { email },
      select: invitedUserIdentitySelect,
    });

    if (existingUser?.salonTenantId && existingUser.salonTenantId !== invitedTenantId) {
      throw new ConflictException(COMMON_MESSAGE_KEYS.ERROR.CONFLICT);
    }

    if (existingUser) {
      if (existingUser.salonTenantId === invitedTenantId) {
        return tx.user.update({
          where: { id: existingUser.id },
          data: {
            ...this.invitedUserData(passwordHash),
            salonTenantId: invitedTenantId,
          },
          select: invitedUserResultSelect,
        });
      }

      const updateResult = await tx.user.updateMany({
        where: {
          id: existingUser.id,
          salonTenantId: null,
        },
        data: {
          ...this.invitedUserData(passwordHash),
          salonTenantId: invitedTenantId,
        },
      });

      if (updateResult.count === 1) {
        return tx.user.findUniqueOrThrow({
          where: { id: existingUser.id },
          select: invitedUserResultSelect,
        });
      }

      const currentUser: Pick<InvitedUserIdentity, 'salonTenantId'> | null = await tx.user.findUnique({
        where: { id: existingUser.id },
        select: {
          salonTenantId: true,
        },
      });

      if (currentUser?.salonTenantId && currentUser.salonTenantId !== invitedTenantId) {
        throw new ConflictException(COMMON_MESSAGE_KEYS.ERROR.CONFLICT);
      }

      return tx.user.update({
        where: { id: existingUser.id },
        data: {
          ...this.invitedUserData(passwordHash),
          salonTenantId: invitedTenantId,
        },
        select: invitedUserResultSelect,
      });
    }

    try {
      return await tx.user.create({
        data: {
          email,
          ...this.invitedUserData(passwordHash),
          isActive: true,
          salonTenantId: invitedTenantId,
        },
        select: invitedUserResultSelect,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return this.upsertInvitedUser(tx, email, invitedTenantId, passwordHash);
      }

      throw error;
    }
  }
}
