import { Test } from '@nestjs/testing';
import { InvitePrismaAdapter } from './invite.adapter';
import { PrismaService } from '@cthub-bsaas/server-data-access';
import { BadRequestException, ConflictException, GoneException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

jest.mock('bcryptjs');

function ownerInviteRecord() {
  return {
    id: 'owner-rec-1',
    email: 'owner@example.com',
    salonId: 'salon-1',
    expiresAt: new Date(Date.now() + 10000),
    salon: { tenantId: 'tenant-1' },
  };
}

function staffInviteRecord() {
  return {
    id: 'staff-rec-1',
    email: 'staff@example.com',
    salonId: 'salon-1',
    role: 'STAFF',
    expiresAt: new Date(Date.now() + 10000),
    salon: { tenantId: 'tenant-1' },
  };
}

describe('InvitePrismaAdapter', () => {
  let adapter: InvitePrismaAdapter;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        InvitePrismaAdapter,
        {
          provide: PrismaService,
          useValue: {
            registrationLink: {
              findFirst: jest.fn(),
              update: jest.fn(),
            },
            staffInvite: {
              findFirst: jest.fn(),
              update: jest.fn(),
            },
            user: {
              findUnique: jest.fn(),
              findUniqueOrThrow: jest.fn(),
              createMany: jest.fn(),
              update: jest.fn(),
              updateMany: jest.fn(),
            },
            role: {
              findUnique: jest.fn(),
            },
            userRole: {
              upsert: jest.fn(),
            },
            $transaction: jest.fn(),
          },
        },
      ],
    }).compile();

    adapter = module.get<InvitePrismaAdapter>(InvitePrismaAdapter);
    prisma = module.get<PrismaService>(PrismaService);
    (prisma.$transaction as jest.Mock).mockImplementation((callback: (tx: PrismaService) => unknown) => callback(prisma));
  });

  it('should be defined', () => {
    expect(adapter).toBeDefined();
  });

  describe('validateOwner', () => {
    it('should return email and salonId if token is valid', async () => {
      const token = 'valid-token';
      const rec = {
        email: 'test@example.com',
        salonId: 'salon-id',
        expiresAt: new Date(Date.now() + 10000),
        salon: { tenantId: 'tenant-1' },
      };
      (prisma.registrationLink.findFirst as jest.Mock).mockResolvedValue(rec);

      const result = await adapter.validateOwner(token);

      expect(result).toEqual({ email: rec.email, salonId: rec.salonId });
    });

    it('should throw BadRequestException if token is not found', async () => {
      const token = 'invalid-token';
      (prisma.registrationLink.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(adapter.validateOwner(token)).rejects.toThrow(BadRequestException);
    });

    it('should throw GoneException if token is expired', async () => {
      const token = 'expired-token';
      const rec = {
        email: 'test@example.com',
        salonId: 'salon-id',
        expiresAt: new Date(Date.now() - 10000),
        salon: { tenantId: 'tenant-1' },
      };
      (prisma.registrationLink.findFirst as jest.Mock).mockResolvedValue(rec);

      await expect(adapter.validateOwner(token)).rejects.toThrow(GoneException);
    });
  });

  describe('completeOwner', () => {
    it('should complete owner registration', async () => {
      const input = { token: 'valid-token', password: 'password' };
      const rec = ownerInviteRecord();
      const user = { id: 'user-id', isMFAEnrollRequired: false };
      const role = { id: 'role-id', name: 'OWNER' };

      (prisma.registrationLink.findFirst as jest.Mock).mockResolvedValue(rec);
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 'user-id', salonTenantId: 'tenant-1' });
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      (prisma.user.createMany as jest.Mock).mockResolvedValue({ count: 1 });
      (prisma.user.update as jest.Mock).mockResolvedValue(user);
      (prisma.role.findUnique as jest.Mock).mockResolvedValue(role);

      const result = await adapter.completeOwner(input);
      const [ownerCreateArgs] = (prisma.user.createMany as jest.Mock).mock.calls[0] as [
        {
          data: Array<{ salonTenantId: string }>;
        },
      ];

      expect(ownerCreateArgs.data[0].salonTenantId).toBe('tenant-1');
      expect(prisma.userRole.upsert).toHaveBeenCalled();
      expect(prisma.registrationLink.update).toHaveBeenCalled();
      expect(result).toEqual({ userId: user.id, requireMfa: user.isMFAEnrollRequired });
    });

    it('should complete owner registration if role is not found', async () => {
      const input = { token: 'valid-token', password: 'password' };
      const rec = ownerInviteRecord();
      const user = { id: 'user-id', isMFAEnrollRequired: false };

      (prisma.registrationLink.findFirst as jest.Mock).mockResolvedValue(rec);
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 'user-id', salonTenantId: 'tenant-1' });
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      (prisma.user.createMany as jest.Mock).mockResolvedValue({ count: 1 });
      (prisma.user.update as jest.Mock).mockResolvedValue(user);
      (prisma.role.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await adapter.completeOwner(input);

      expect(prisma.user.createMany).toHaveBeenCalled();
      expect(prisma.userRole.upsert).not.toHaveBeenCalled();
      expect(prisma.registrationLink.update).toHaveBeenCalled();
      expect(result).toEqual({ userId: user.id, requireMfa: user.isMFAEnrollRequired });
    });

    it('rejects owner invite completion when the existing user belongs to another tenant', async () => {
      const input = { token: 'valid-token', password: 'password' };
      const rec = ownerInviteRecord();

      (prisma.registrationLink.findFirst as jest.Mock).mockResolvedValue(rec);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ salonTenantId: 'tenant-2' });
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');

      await expect(adapter.completeOwner(input)).rejects.toThrow(ConflictException);
      expect(prisma.user.update).not.toHaveBeenCalled();
      expect(prisma.user.createMany).not.toHaveBeenCalled();
    });

    it('retries owner completion when the serializable transaction aborts', async () => {
      const input = { token: 'valid-token', password: 'password' };
      const rec = ownerInviteRecord();
      const user = { id: 'user-id', isMFAEnrollRequired: false };
      const p2034 = new Prisma.PrismaClientKnownRequestError('retry', { code: 'P2034', clientVersion: 'test' });
      let attempts = 0;

      (prisma.registrationLink.findFirst as jest.Mock).mockResolvedValue(rec);
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 'user-id', salonTenantId: 'tenant-1' });
      (prisma.user.createMany as jest.Mock).mockResolvedValue({ count: 1 });
      (prisma.user.update as jest.Mock).mockResolvedValue(user);
      (prisma.role.findUnique as jest.Mock).mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      (prisma.$transaction as jest.Mock).mockImplementation((callback: (tx: PrismaService) => unknown) => {
        attempts += 1;
        if (attempts === 1) {
          throw p2034;
        }
        return callback(prisma);
      });

      await expect(adapter.completeOwner(input)).resolves.toEqual({ userId: 'user-id', requireMfa: false });
      expect(prisma.$transaction).toHaveBeenCalledTimes(2);
    });
  });

  describe('validateStaff', () => {
    it('should return email, salonId and role if token is valid', async () => {
      const token = 'valid-token';
      const rec = {
        email: 'test@example.com',
        salonId: 'salon-id',
        role: 'STAFF',
        expiresAt: new Date(Date.now() + 10000),
        salon: { tenantId: 'tenant-1' },
      };
      (prisma.staffInvite.findFirst as jest.Mock).mockResolvedValue(rec);

      const result = await adapter.validateStaff(token);

      expect(result).toEqual({ email: rec.email, salonId: rec.salonId, role: rec.role });
    });

    it('should throw BadRequestException if token is not found', async () => {
      const token = 'invalid-token';
      (prisma.staffInvite.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(adapter.validateStaff(token)).rejects.toThrow(BadRequestException);
    });

    it('should throw GoneException if token is expired', async () => {
      const token = 'expired-token';
      const rec = {
        email: 'test@example.com',
        salonId: 'salon-id',
        role: 'STAFF',
        expiresAt: new Date(Date.now() - 10000),
        salon: { tenantId: 'tenant-1' },
      };
      (prisma.staffInvite.findFirst as jest.Mock).mockResolvedValue(rec);

      await expect(adapter.validateStaff(token)).rejects.toThrow(GoneException);
    });
  });

  describe('completeStaff', () => {
    it('should complete staff registration', async () => {
      const input = { token: 'valid-token', password: 'password' };
      const rec = staffInviteRecord();
      const user = { id: 'user-id', isMFAEnrollRequired: false };
      const role = { id: 'role-id', name: 'STAFF' };

      (prisma.staffInvite.findFirst as jest.Mock).mockResolvedValue(rec);
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 'user-id', salonTenantId: 'tenant-1' });
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      (prisma.user.createMany as jest.Mock).mockResolvedValue({ count: 1 });
      (prisma.user.update as jest.Mock).mockResolvedValue(user);
      (prisma.role.findUnique as jest.Mock).mockResolvedValue(role);

      const result = await adapter.completeStaff(input);
      const [staffCreateArgs] = (prisma.user.createMany as jest.Mock).mock.calls[0] as [
        {
          data: Array<{ salonTenantId: string }>;
        },
      ];

      expect(staffCreateArgs.data[0].salonTenantId).toBe('tenant-1');
      expect(prisma.userRole.upsert).toHaveBeenCalled();
      expect(prisma.staffInvite.update).toHaveBeenCalled();
      expect(result).toEqual({ userId: user.id, requireMfa: user.isMFAEnrollRequired });
    });

    it('should complete staff registration if role is not found', async () => {
      const input = { token: 'valid-token', password: 'password' };
      const rec = staffInviteRecord();
      const user = { id: 'user-id', isMFAEnrollRequired: false };

      (prisma.staffInvite.findFirst as jest.Mock).mockResolvedValue(rec);
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 'user-id', salonTenantId: 'tenant-1' });
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      (prisma.user.createMany as jest.Mock).mockResolvedValue({ count: 1 });
      (prisma.user.update as jest.Mock).mockResolvedValue(user);
      (prisma.role.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await adapter.completeStaff(input);

      expect(prisma.user.createMany).toHaveBeenCalled();
      expect(prisma.userRole.upsert).not.toHaveBeenCalled();
      expect(prisma.staffInvite.update).toHaveBeenCalled();
      expect(result).toEqual({ userId: user.id, requireMfa: user.isMFAEnrollRequired });
    });

    it('rejects staff invite completion when the existing user belongs to another tenant', async () => {
      const input = { token: 'valid-token', password: 'password' };
      const rec = staffInviteRecord();

      (prisma.staffInvite.findFirst as jest.Mock).mockResolvedValue(rec);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ salonTenantId: 'tenant-2' });
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');

      await expect(adapter.completeStaff(input)).rejects.toThrow(ConflictException);
      expect(prisma.user.update).not.toHaveBeenCalled();
      expect(prisma.user.createMany).not.toHaveBeenCalled();
    });

    it('updates an existing unscoped user inside the transaction instead of creating a new one', async () => {
      const input = { token: 'valid-token', password: 'password' };
      const rec = staffInviteRecord();
      const user = { id: 'user-id', isMFAEnrollRequired: false };

      (prisma.staffInvite.findFirst as jest.Mock).mockResolvedValue(rec);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'user-id', salonTenantId: null });
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      (prisma.user.updateMany as jest.Mock).mockResolvedValue({ count: 1 });
      (prisma.user.findUniqueOrThrow as jest.Mock).mockResolvedValue(user);
      (prisma.role.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(adapter.completeStaff(input)).resolves.toEqual({ userId: 'user-id', requireMfa: false });
      expect(prisma.user.createMany).not.toHaveBeenCalled();
      const [updateCallArgs] = (prisma.user.updateMany as jest.Mock).mock.calls as [
        [
          {
            where: { id: string; salonTenantId: null };
            data: { salonTenantId: string };
          },
        ],
      ];
      const [updateCall] = updateCallArgs;
      expect(updateCall.where).toEqual({ id: 'user-id', salonTenantId: null });
      expect(updateCall.data.salonTenantId).toBe('tenant-1');
      expect(prisma.user.findUniqueOrThrow).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-id' },
        }),
      );
    });

    it('rejects a concurrent tenant assignment when another invite claims the unscoped user first', async () => {
      const input = { token: 'valid-token', password: 'password' };
      const rec = staffInviteRecord();

      (prisma.staffInvite.findFirst as jest.Mock).mockResolvedValue(rec);
      (prisma.user.findUnique as jest.Mock)
        .mockResolvedValueOnce({ id: 'user-id', salonTenantId: null })
        .mockResolvedValueOnce({ salonTenantId: 'tenant-2' });
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      (prisma.user.updateMany as jest.Mock).mockResolvedValue({ count: 0 });

      await expect(adapter.completeStaff(input)).rejects.toThrow(ConflictException);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('claims a concurrently created unscoped user after createMany skips duplicates', async () => {
      const input = { token: 'valid-token', password: 'password' };
      const rec = staffInviteRecord();
      const user = { id: 'user-id', isMFAEnrollRequired: false };

      (prisma.staffInvite.findFirst as jest.Mock).mockResolvedValue(rec);
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 'user-id', salonTenantId: null });
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      (prisma.user.createMany as jest.Mock).mockResolvedValue({ count: 0 });
      (prisma.user.updateMany as jest.Mock).mockResolvedValue({ count: 1 });
      (prisma.user.findUniqueOrThrow as jest.Mock).mockResolvedValue(user);
      (prisma.role.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(adapter.completeStaff(input)).resolves.toEqual({ userId: 'user-id', requireMfa: false });
      expect(prisma.user.createMany).toHaveBeenCalledTimes(1);
      expect(prisma.user.updateMany).toHaveBeenCalledTimes(1);
    });

    it('retries staff completion when the serializable transaction aborts', async () => {
      const input = { token: 'valid-token', password: 'password' };
      const rec = staffInviteRecord();
      const user = { id: 'user-id', isMFAEnrollRequired: false };
      const p2034 = new Prisma.PrismaClientKnownRequestError('retry', { code: 'P2034', clientVersion: 'test' });
      let attempts = 0;

      (prisma.staffInvite.findFirst as jest.Mock).mockResolvedValue(rec);
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 'user-id', salonTenantId: 'tenant-1' });
      (prisma.user.createMany as jest.Mock).mockResolvedValue({ count: 1 });
      (prisma.user.update as jest.Mock).mockResolvedValue(user);
      (prisma.role.findUnique as jest.Mock).mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      (prisma.$transaction as jest.Mock).mockImplementation((callback: (tx: PrismaService) => unknown) => {
        attempts += 1;
        if (attempts === 1) {
          throw p2034;
        }
        return callback(prisma);
      });

      await expect(adapter.completeStaff(input)).resolves.toEqual({ userId: 'user-id', requireMfa: false });
      expect(prisma.$transaction).toHaveBeenCalledTimes(2);
    });
  });
});
