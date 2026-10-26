import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma/prisma.service';
import { CreatePortfolioDto } from '../dto/requests/create-portfolio.dto';
import { UpdatePortfolioDto } from '../dto/requests/update-portfolio.dto';
import { PortfolioResponseDto } from '../dto/responses/portfolio-response.dto';

// Map Prisma model to DTO
const mapToDto = (portfolio: any): PortfolioResponseDto => ({
  id: portfolio.id,
  userId: portfolio.userId,
  tenantId: portfolio.tenantId,
  salonId: portfolio.salonId,
  description: portfolio.description || undefined,
  images: (portfolio.images || []).map((img: any) => ({
    id: img.id,
    portfolioId: img.portfolioId,
    imagePath: img.imagePath,
    createdAt: img.createdAt.toISOString(),
  })),
  createdAt: portfolio.createdAt.toISOString(),
  updatedAt: portfolio.updatedAt.toISOString(),
});

@Injectable()
export class PortfolioService {
  constructor(private readonly prisma: PrismaService) {}
  /**
   * Get a portfolio by ID
   * @param params The parameters including the portfolio ID and optional user ID for ownership validation
   * @returns The portfolio with its images or null if not found
   */
  async getPortfolioById(id: string): Promise<PortfolioResponseDto> {
    const portfolio = await this.prisma.portfolio.findUnique({
      where: { id },
      include: { images: true },
    });

    if (!portfolio) {
      throw new NotFoundException('Portfolio not found');
    }

    return mapToDto(portfolio);
  }

  async getPortfoliosByUserId(userId: string): Promise<PortfolioResponseDto[]> {
    const portfolios = await this.prisma.portfolio.findMany({
      where: { userId },
      include: { images: true },
      orderBy: { createdAt: 'desc' },
    });

    return portfolios.map(mapToDto);
  }

  async getPortfolios(filters: { userId?: string; salonId?: string } = {}): Promise<PortfolioResponseDto[]> {
    const where: any = {};

    if (filters.userId) where.userId = filters.userId;
    if (filters.salonId) where.salonId = filters.salonId;

    const portfolios = await this.prisma.portfolio.findMany({
      where,
      include: { images: true },
      orderBy: { createdAt: 'desc' },
    });

    return portfolios.map(mapToDto);
  }

  async getAllPortfolios(): Promise<PortfolioResponseDto[]> {
    const portfolios = await this.prisma.portfolio.findMany({
      include: { images: true },
      orderBy: { createdAt: 'desc' },
    });

    return portfolios.map(mapToDto);
  }

  /**
   * Create a new portfolio
   * @param params The parameters including the portfolio data and user ID
   * @returns The created portfolio with its images
   */
  async createPortfolio(createPortfolioDto: CreatePortfolioDto): Promise<PortfolioResponseDto> {
    // Validate required fields
    if (!createPortfolioDto.imagePaths || createPortfolioDto.imagePaths.length === 0) {
      throw new BadRequestException('At least one image is required');
    }

    // Ensure required fields are provided
    if (!createPortfolioDto.userId) {
      throw new BadRequestException('User ID is required');
    }

    if (!createPortfolioDto.salonId) {
      throw new BadRequestException('Salon ID is required');
    }

    // Create the portfolio with its images
    const portfolioData: any = {
      userId: createPortfolioDto.userId,
      salonId: createPortfolioDto.salonId,
      description: createPortfolioDto.description || '',
      images: {
        create: createPortfolioDto.imagePaths.map((imagePath) => ({
          imagePath,
        })),
      },
    };

    // Add tenantId if provided
    if (createPortfolioDto.tenantId) {
      portfolioData.tenantId = createPortfolioDto.tenantId;
    }

    const portfolio = await this.prisma.portfolio.create({
      data: portfolioData,
      include: { images: true },
    });

    return mapToDto(portfolio);
  }

  /**
   * Update an existing portfolio
   * @param params The parameters including the portfolio ID, update data, and user ID
   * @returns The updated portfolio with its images
   */
  async updatePortfolio(id: string, updatePortfolioDto: UpdatePortfolioDto): Promise<PortfolioResponseDto> {
    // Get the existing portfolio
    const existingPortfolio = await this.prisma.portfolio.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!existingPortfolio) {
      throw new NotFoundException('Portfolio not found');
    }

    // Handle image additions and removals in a transaction
    const operations: any[] = [];

    // Add image additions if any
    if (updatePortfolioDto.addImagePaths?.length) {
      operations.push(
        this.prisma.portfolioImage.createMany({
          data: updatePortfolioDto.addImagePaths.map((imagePath) => ({
            portfolioId: id,
            imagePath,
          })),
        }),
      );
    }

    // Add image deletions if any
    if (updatePortfolioDto.removeImageIds?.length) {
      operations.push(
        this.prisma.portfolioImage.deleteMany({
          where: {
            id: { in: updatePortfolioDto.removeImageIds },
            portfolioId: id,
          },
        }),
      );
    }

    // If there are operations to perform, execute them in a transaction
    if (operations.length > 0) {
      await this.prisma.$transaction(operations);
    }

    // Create update data from the DTO, excluding undefined values
    const updateData: any = {};

    // Add any provided fields to update
    Object.entries(updatePortfolioDto).forEach(([key, value]) => {
      if (value !== undefined && !['addImagePaths', 'removeImageIds'].includes(key)) {
        updateData[key] = value;
      }
    });

    // If we have update data, perform the update
    if (Object.keys(updateData).length > 0) {
      await this.prisma.portfolio.update({
        where: { id },
        data: updateData,
      });
    }

    // Fetch the updated portfolio with images
    const portfolio = await this.prisma.portfolio.findUnique({
      where: { id },
      include: { images: true },
    });

    if (!portfolio) {
      throw new NotFoundException('Portfolio not found after update');
    }

    return mapToDto(portfolio);
  }

  /**
   * Delete a portfolio
   * @param id The portfolio ID
   * @returns Void
   */
  async deletePortfolio(id: string): Promise<void> {
    // Using deleteMany with the ID to avoid extra query
    const result = await this.prisma.portfolio.deleteMany({
      where: { id },
    });

    if (result.count === 0) {
      throw new NotFoundException('Portfolio not found');
    }
  }
}
