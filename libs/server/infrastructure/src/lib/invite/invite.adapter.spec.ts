import { Test } from '@nestjs/testing';
import { InvitePrismaAdapter } from './invite.adapter';
import { PrismaService } from '@cthub-bsaas/server-data-access';
import { BadRequestException, GoneException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

jest.mock('bcryptjs');

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
              upsert: jest.fn(),
            },
            role: {
              findUnique: jest.fn(),
            },
            userRole: {
              upsert: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    adapter = module.get<InvitePrismaAdapter>(InvitePrismaAdapter);
    prisma = module.get<PrismaService>(PrismaService);
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
      const rec = {
        id: 'rec-id',
        email: 'test@example.com',
        salonId: 'salon-id',
        expiresAt: new Date(Date.now() + 10000),
        salon: { tenantId: 'tenant-1' },
      };
      const user = { id: 'user-id', isMFAEnrollRequired: false };
      const role = { id: 'role-id', name: 'OWNER' };

      (prisma.registrationLink.findFirst as jest.Mock).mockResolvedValue(rec);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      (prisma.user.upsert as jest.Mock).mockResolvedValue(user);
      (prisma.role.findUnique as jest.Mock).mockResolvedValue(role);

      const result = await adapter.completeOwner(input);

      expect(prisma.user.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({ salonTenantId: 'tenant-1' }),
          create: expect.objectContaining({ salonTenantId: 'tenant-1' }),
        }),
      );
      expect(prisma.userRole.upsert).toHaveBeenCalled();
      expect(prisma.registrationLink.update).toHaveBeenCalled();
      expect(result).toEqual({ userId: user.id, requireMfa: user.isMFAEnrollRequired });
    });

    it('should complete owner registration if role is not found', async () => {
      const input = { token: 'valid-token', password: 'password' };
      const rec = {
        id: 'rec-id',
        email: 'test@example.com',
        salonId: 'salon-id',
        expiresAt: new Date(Date.now() + 10000),
        salon: { tenantId: 'tenant-1' },
      };
      const user = { id: 'user-id', isMFAEnrollRequired: false };

      (prisma.registrationLink.findFirst as jest.Mock).mockResolvedValue(rec);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      (prisma.user.upsert as jest.Mock).mockResolvedValue(user);
      (prisma.role.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await adapter.completeOwner(input);

      expect(prisma.user.upsert).toHaveBeenCalled();
      expect(prisma.userRole.upsert).not.toHaveBeenCalled();
      expect(prisma.registrationLink.update).toHaveBeenCalled();
      expect(result).toEqual({ userId: user.id, requireMfa: user.isMFAEnrollRequired });
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
      const rec = {
        id: 'rec-id',
        email: 'test@example.com',
        salonId: 'salon-id',
        expiresAt: new Date(Date.now() + 10000),
        salon: { tenantId: 'tenant-1' },
      };
      const user = { id: 'user-id', isMFAEnrollRequired: false };
      const role = { id: 'role-id', name: 'STAFF' };

      (prisma.staffInvite.findFirst as jest.Mock).mockResolvedValue(rec);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      (prisma.user.upsert as jest.Mock).mockResolvedValue(user);
      (prisma.role.findUnique as jest.Mock).mockResolvedValue(role);

      const result = await adapter.completeStaff(input);

      expect(prisma.user.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({ salonTenantId: 'tenant-1' }),
          create: expect.objectContaining({ salonTenantId: 'tenant-1' }),
        }),
      );
      expect(prisma.userRole.upsert).toHaveBeenCalled();
      expect(prisma.staffInvite.update).toHaveBeenCalled();
      expect(result).toEqual({ userId: user.id, requireMfa: user.isMFAEnrollRequired });
    });

    it('should complete staff registration if role is not found', async () => {
      const input = { token: 'valid-token', password: 'password' };
      const rec = {
        id: 'rec-id',
        email: 'test@example.com',
        salonId: 'salon-id',
        expiresAt: new Date(Date.now() + 10000),
        salon: { tenantId: 'tenant-1' },
      };
      const user = { id: 'user-id', isMFAEnrollRequired: false };

      (prisma.staffInvite.findFirst as jest.Mock).mockResolvedValue(rec);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      (prisma.user.upsert as jest.Mock).mockResolvedValue(user);
      (prisma.role.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await adapter.completeStaff(input);

      expect(prisma.user.upsert).toHaveBeenCalled();
      expect(prisma.userRole.upsert).not.toHaveBeenCalled();
      expect(prisma.staffInvite.update).toHaveBeenCalled();
      expect(result).toEqual({ userId: user.id, requireMfa: user.isMFAEnrollRequired });
    });
  });
});
