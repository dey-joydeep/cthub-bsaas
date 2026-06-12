import { BadRequestException, ConflictException, GoneException, Injectable } from '@nestjs/common';
import { PrismaService } from '@cthub-bsaas/server-data-access';
import { InvitePort, InviteValidationResult, RegistrationCompleteInput, RegistrationCompleteResult } from '@cthub-bsaas/server-contracts-auth';
import { COMMON_MESSAGE_KEYS } from '@cthub-bsaas/shared';
import * as bcrypt from 'bcryptjs';
import { createHash } from 'crypto';

function sha256(input: string): string {
  return createHash('sha256').update(input, 'utf8').digest('hex');
}

@Injectable()
export class InvitePrismaAdapter implements InvitePort {
  constructor(private readonly prisma: PrismaService) {}

  private async ensureOwnerToken(token: string) {
    const tokenHash = sha256(token);
    const rec = await this.prisma.registrationLink.findFirst({
      where: { tokenHash, usedAt: null },
      include: {
        salon: {
          select: {
            tenantId: true,
          },
        },
      },
    });
    if (!rec) throw new BadRequestException('error.validation');
    if (rec.expiresAt <= new Date()) throw new GoneException();
    return rec;
  }

  private async ensureStaffToken(token: string) {
    const tokenHash = sha256(token);
    const rec = await this.prisma.staffInvite.findFirst({
      where: { tokenHash, usedAt: null },
      include: {
        salon: {
          select: {
            tenantId: true,
          },
        },
      },
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
    const rec = await this.ensureOwnerToken(input.token);
    const passwordHash = await bcrypt.hash(input.password, 10);
    const salonTenantId = await this.resolveSalonTenantAssignment(rec.email, rec.salon.tenantId);
    const user = await this.prisma.user.upsert({
      where: { email: rec.email },
      update: {
        passwordHash,
        isVerified: true,
        emailVerifiedAt: new Date(),
        registrationStatus: 'COMPLETED',
        salonTenantId,
      },
      create: {
        email: rec.email,
        passwordHash,
        isVerified: true,
        emailVerifiedAt: new Date(),
        registrationStatus: 'COMPLETED',
        isActive: true,
        salonTenantId,
      },
    });
    // Assign OWNER role if not present
    const role = await this.prisma.role.findUnique({ where: { name: 'OWNER' } });
    if (role) {
      await this.prisma.userRole.upsert({
        where: { userId_roleId: { userId: user.id, roleId: role.id } },
        update: {},
        create: { userId: user.id, roleId: role.id },
      });
    }
    await this.prisma.registrationLink.update({ where: { id: rec.id }, data: { usedAt: new Date() } });
    return { userId: user.id, requireMfa: user.isMFAEnrollRequired };
  }

  async validateStaff(token: string): Promise<InviteValidationResult> {
    const rec = await this.ensureStaffToken(token);
    return { email: rec.email, salonId: rec.salonId, role: rec.role };
  }

  async completeStaff(input: RegistrationCompleteInput): Promise<RegistrationCompleteResult> {
    const rec = await this.ensureStaffToken(input.token);
    const passwordHash = await bcrypt.hash(input.password, 10);
    const salonTenantId = await this.resolveSalonTenantAssignment(rec.email, rec.salon.tenantId);
    const user = await this.prisma.user.upsert({
      where: { email: rec.email },
      update: {
        passwordHash,
        isVerified: true,
        emailVerifiedAt: new Date(),
        registrationStatus: 'COMPLETED',
        salonTenantId,
      },
      create: {
        email: rec.email,
        passwordHash,
        isVerified: true,
        emailVerifiedAt: new Date(),
        registrationStatus: 'COMPLETED',
        isActive: true,
        salonTenantId,
      },
    });
    // Assign STAFF role
    const role = await this.prisma.role.findUnique({ where: { name: 'STAFF' } });
    if (role) {
      await this.prisma.userRole.upsert({
        where: { userId_roleId: { userId: user.id, roleId: role.id } },
        update: {},
        create: { userId: user.id, roleId: role.id },
      });
    }
    await this.prisma.staffInvite.update({ where: { id: rec.id }, data: { usedAt: new Date() } });
    return { userId: user.id, requireMfa: user.isMFAEnrollRequired };
  }

  private async resolveSalonTenantAssignment(email: string, invitedTenantId: string): Promise<string> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
      select: {
        salonTenantId: true,
      },
    });

    if (existingUser?.salonTenantId && existingUser.salonTenantId !== invitedTenantId) {
      throw new ConflictException(COMMON_MESSAGE_KEYS.ERROR.CONFLICT);
    }

    return existingUser?.salonTenantId ?? invitedTenantId;
  }
}
