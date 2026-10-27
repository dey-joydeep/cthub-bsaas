import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { PortfolioService } from '../services/portfolio.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePortfolioDto } from '../dto/requests/create-portfolio.dto';
import { UpdatePortfolioDto } from '../dto/requests/update-portfolio.dto';

describe('PortfolioService', () => {
  let service: PortfolioService;

  // Mock data
  const mockPortfolioData = {
    description: 'Test portfolio',
    imagePaths: ['uploads/portfolios/image1.jpg', 'uploads/portfolios/image2.jpg'],
    images: [{ imagePath: 'uploads/portfolios/image1.jpg' }, { imagePath: 'uploads/portfolios/image2.jpg' }],
    userId: 'test-user',
    tenantId: 'test-tenant',
    salonId: 'test-salon',
  };

  const mockPortfolioResponse = {
    id: 'test-portfolio',
    tenantId: 'test-tenant',
    salonId: 'test-salon',
    userId: 'test-user',
    description: 'Test portfolio',
    images: [
      { id: 'img1', portfolioId: 'test-portfolio', imagePath: 'uploads/portfolios/image1.jpg', createdAt: new Date() },
      { id: 'img2', portfolioId: 'test-portfolio', imagePath: 'uploads/portfolios/image2.jpg', createdAt: new Date() },
    ],
    imagePaths: ['uploads/portfolios/image1.jpg', 'uploads/portfolios/image2.jpg'],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Mock Prisma service
  const mockPrismaService = {
    portfolio: {
      create: jest.fn().mockResolvedValue(mockPortfolioResponse),
      findUnique: jest.fn().mockResolvedValue(mockPortfolioResponse),
      findMany: jest.fn().mockResolvedValue([mockPortfolioResponse]),
      update: jest.fn().mockResolvedValue(mockPortfolioResponse),
      delete: jest.fn().mockResolvedValue(mockPortfolioResponse),
    },
    $transaction: jest.fn().mockImplementation(async (callback) => {
      return callback(mockPrismaService);
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PortfolioService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<PortfolioService>(PortfolioService);
    // Get the PrismaService instance but don't store it since it's not used in tests
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createPortfolio', () => {
    it('should create a portfolio with valid data', async () => {
      const createDto: CreatePortfolioDto = {
        ...mockPortfolioData,
      };

      mockPrismaService.portfolio.create.mockResolvedValueOnce(mockPortfolioResponse);

      const result = await service.createPortfolio(createDto);

      expect(result).toBeDefined();
      expect(result.description).toBe(createDto.description);
      expect(result.images).toHaveLength(2);
      expect(mockPrismaService.portfolio.create).toHaveBeenCalledWith({
        data: {
          ...createDto,
          images: {
            create: createDto.imagePaths.map((path) => ({ imagePath: path })),
          },
        },
        include: {
          images: true,
        },
      });
    });

    it('should throw error when creating portfolio with missing images', async () => {
      const createDto: CreatePortfolioDto = {
        description: 'Test portfolio',
        imagePaths: [],
        images: [],
        userId: 'test-user',
        tenantId: 'test-tenant',
        salonId: 'test-salon',
      };

      await expect(service.createPortfolio(createDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw error when creating portfolio with empty description', async () => {
      const createDto: CreatePortfolioDto = {
        description: '',
        imagePaths: ['uploads/portfolios/image1.jpg'],
        images: [{ imagePath: 'uploads/portfolios/image1.jpg' }],
        userId: 'test-user',
        tenantId: 'test-tenant',
        salonId: 'test-salon',
      };

      await expect(service.createPortfolio(createDto)).rejects.toThrow(BadRequestException);
    });
  });

  it('should throw error when creating portfolio with whitespace description', async () => {
    const createDto: CreatePortfolioDto = {
      tenantId: 't1',
      salonId: 's1',
      userId: 'u1',
      imagePaths: ['http://test/image.jpg'],
      images: [{ imagePath: 'http://test/image.jpg' }],
      description: '   ',
    };

    await expect(service.createPortfolio(createDto)).rejects.toThrow('Description required');
  });

  it('should throw error when updating portfolio with empty description', async () => {
    const updateDto: UpdatePortfolioDto = {
      description: '  ',
    };

    await expect(service.updatePortfolio('test-id', updateDto)).rejects.toThrow('Description required');
  });

  afterAll(async () => {
    // teardown logic if needed
  });
});
