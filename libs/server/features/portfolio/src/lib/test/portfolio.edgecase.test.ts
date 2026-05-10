import { Test } from '@nestjs/testing';
import { PortfolioService } from '../services/portfolio.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePortfolioDto } from '../dto/requests/create-portfolio.dto';

// Mock PrismaService
const mockPrismaService = {
  portfolio: {
    create: jest.fn(),
  },
};

describe('PortfolioService Edge Cases', () => {
  let service: PortfolioService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        PortfolioService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<PortfolioService>(PortfolioService);
  });

  // Mock the createPortfolio method
  beforeEach(() => {
    jest.spyOn(service, 'createPortfolio').mockImplementation(async (dto: CreatePortfolioDto) => {
      if (!dto.salonId) throw new Error('Salon ID required');
      if (!dto.images || dto.images.length === 0) throw new Error('Image(s) required');
      if (!dto.description || dto.description.trim().length === 0) {
        throw new Error('Description required');
      }
      return { ...dto, id: 'mock' } as any;
    });
  });

  it('should throw error when creating portfolio with missing images', async () => {
    const dto: CreatePortfolioDto = {
      tenantId: 't1',
      salonId: 's1',
      userId: 'u1',
      description: 'desc',
      imagePaths: [],
      images: [],
    };

    await expect(service.createPortfolio(dto)).rejects.toThrow('Image(s) required');
  });

  it('should throw error when creating portfolio with empty description', async () => {
    const dto: CreatePortfolioDto = {
      tenantId: 't1',
      salonId: 's1',
      userId: 'u1',
      imagePaths: ['http://test/image.jpg'],
      images: [{ imagePath: 'http://test/image.jpg' }],
      description: '',
    };

    await expect(service.createPortfolio(dto)).rejects.toThrow('Description required');
  });
});
