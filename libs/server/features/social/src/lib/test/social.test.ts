import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { SocialService } from '../services/social.service';
import { PrismaService } from '../../../core/database/prisma/prisma.service';
import { Prisma, Social as PrismaSocial } from '@prisma/client';

// Create a mock type for PrismaClient with Jest mock functions
type MockPrismaClient = {
  social: {
    findMany: jest.Mock<Promise<PrismaSocial[]>, [Prisma.SocialFindManyArgs]>;
    findUnique: jest.Mock<Promise<PrismaSocial | null>, [Prisma.SocialFindUniqueArgs]>;
    create: jest.Mock<Promise<PrismaSocial>, [Prisma.SocialCreateArgs]>;
    update: jest.Mock<Promise<PrismaSocial>, [Prisma.SocialUpdateArgs]>;
    delete: jest.Mock<Promise<PrismaSocial>, [Prisma.SocialDeleteArgs]>;
  };
};

describe('SocialService', () => {
  let service: SocialService;
  let prisma: MockPrismaClient;

  const mockSocial = {
    id: '1',
    userId: 'u1',
    platform: 'twitter',
    handle: '@handle',
    url: 'https://twitter.com/handle',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockPrisma: MockPrismaClient = {
      social: {
        findMany: jest.fn().mockImplementation(() => Promise.resolve([mockSocial])),
        findUnique: jest.fn().mockImplementation(() => Promise.resolve(mockSocial)),
        create: jest.fn().mockImplementation((args) => Promise.resolve({ ...args.data, ...mockSocial })),
        update: jest.fn().mockImplementation(({ where, data }) => Promise.resolve({ ...mockSocial, ...data, id: where.id })),
        delete: jest.fn().mockImplementation(({ where: _where }) => Promise.resolve(mockSocial)),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SocialService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<SocialService>(SocialService);
    prisma = module.get(PrismaService) as unknown as MockPrismaClient;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getSocials', () => {
    it('should return an array of social links', async () => {
      const result = await service.getSocials();
      expect(prisma.social.findMany).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('id', mockSocial.id);
    });
  });

  describe('getSocialById', () => {
    it('should return a social link by id', async () => {
      const result = await service.getSocialById({ id: '1' });
      expect(prisma.social.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
      });
      expect(result).toHaveProperty('id', mockSocial.id);
    });

    it('should throw NotFoundException when social link not found', async () => {
      (prisma.social.findUnique as jest.Mock).mockResolvedValueOnce(null);
      await expect(service.getSocialById({ id: '999' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('createSocial', () => {
    it('should create a social link', async () => {
      const createData = {
        userId: 'u1',
        platform: 'twitter',
        handle: '@handle',
        url: 'https://twitter.com/handle',
      };

      const result = await service.createSocial(createData);

      expect(prisma.social.create).toHaveBeenCalledWith({
        data: createData,
      });
      expect(result).toHaveProperty('id', mockSocial.id);
      expect(result.platform).toBe(mockSocial.platform);
      expect(result.handle).toBe(mockSocial.handle);
    });
  });

  describe('updateSocial', () => {
    it('should update a social link', async () => {
      const updateData = {
        platform: 'updated-platform',
        handle: '@newhandle',
      };

      const result = await service.updateSocial({
        id: '1',
        data: updateData,
      });

      expect(prisma.social.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: updateData,
      });
      expect(result).toHaveProperty('id', mockSocial.id);
    });

    it('should throw NotFoundException when updating non-existent social link', async () => {
      (prisma.social.update as jest.Mock).mockRejectedValueOnce({ code: 'P2025' });
      await expect(service.updateSocial({ id: '999', data: { platform: 'test' } })).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteSocial', () => {
    it('should delete a social link', async () => {
      await service.deleteSocial({ id: '1' });
      expect(prisma.social.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });

    it('should throw NotFoundException when deleting non-existent social link', async () => {
      (prisma.social.delete as jest.Mock).mockRejectedValueOnce({ code: 'P2025' });
      await expect(service.deleteSocial({ id: '999' })).rejects.toThrow(NotFoundException);
    });
  });
});
