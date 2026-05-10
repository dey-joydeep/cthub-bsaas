import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Query,
  UseGuards,
  Request,
  ParseUUIDPipe,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PortfolioService } from '../services/portfolio.service';
import { CreatePortfolioDto } from '../dto/requests/create-portfolio.dto';
import { UpdatePortfolioDto } from '../dto/requests/update-portfolio.dto';
import { PortfolioResponseDto } from '../dto/responses/portfolio-response.dto';
import { JwtAuthGuard, RolesGuard, Roles } from '@cthub-bsaas/server-core';
import { AppUserRole } from '@shared/types/user.types';

@ApiTags('portfolios')
@ApiBearerAuth()
@Controller('portfolios')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PortfolioController {
  constructor(private readonly portfolioService: PortfolioService) {}

  @Post()
  @Roles(AppUserRole.ADMIN, AppUserRole.OWNER, AppUserRole.STAFF)
  @ApiOperation({ summary: 'Create a new portfolio' })
  @ApiResponse({ status: 201, description: 'The portfolio has been successfully created.', type: PortfolioResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async create(@Request() req: any, @Body() createPortfolioDto: CreatePortfolioDto): Promise<PortfolioResponseDto> {
    // Ensure the user can only create a portfolio for themselves
    if (req.user.role !== AppUserRole.ADMIN && createPortfolioDto.userId !== req.user.userId) {
      throw new ForbiddenException('You can only create portfolios for yourself');
    }

    return this.portfolioService.createPortfolio(createPortfolioDto);
  }

  @Get()
  @Roles(AppUserRole.ADMIN, AppUserRole.OWNER, AppUserRole.STAFF, AppUserRole.CUSTOMER)
  @ApiOperation({ summary: 'Get all portfolios with optional filtering' })
  @ApiQuery({ name: 'userId', required: false, description: 'Filter by user ID' })
  @ApiQuery({ name: 'salonId', required: false, description: 'Filter by salon ID' })
  @ApiResponse({ status: 200, description: 'Return all portfolios.', type: [PortfolioResponseDto] })
  async getAll(@Request() req: any, @Query('userId') userId?: string, @Query('salonId') salonId?: string): Promise<PortfolioResponseDto[]> {
    // Regular users can only see their own portfolios
    if (req.user.role === AppUserRole.CUSTOMER || req.user.role === AppUserRole.STAFF) {
      return this.portfolioService.getPortfoliosByUserId(req.user.userId);
    }

    // Admins and owners can filter by userId and salonId
    if (userId || salonId) {
      return this.portfolioService.getPortfolios({ userId, salonId });
    }

    return this.portfolioService.getAllPortfolios();
  }

  @Get(':id')
  @Roles(AppUserRole.ADMIN, AppUserRole.OWNER, AppUserRole.STAFF, AppUserRole.CUSTOMER)
  @ApiOperation({ summary: 'Get a portfolio by ID' })
  @ApiResponse({ status: 200, description: 'Return a portfolio.', type: PortfolioResponseDto })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Portfolio not found.' })
  async getById(@Request() req: any, @Param('id', ParseUUIDPipe) id: string): Promise<PortfolioResponseDto> {
    const portfolio = await this.portfolioService.getPortfolioById(id);

    // Regular users can only view their own portfolios
    if ((req.user.role === AppUserRole.CUSTOMER || req.user.role === AppUserRole.STAFF) && portfolio.userId !== req.user.userId) {
      throw new ForbiddenException('You can only view your own portfolios');
    }

    if (!portfolio) {
      throw new NotFoundException('Portfolio not found');
    }

    return portfolio;
  }

  @Put(':id')
  @Roles(AppUserRole.ADMIN, AppUserRole.OWNER, AppUserRole.STAFF)
  @ApiOperation({ summary: 'Update a portfolio' })
  @ApiResponse({ status: 200, description: 'The portfolio has been successfully updated.', type: PortfolioResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Portfolio not found.' })
  async update(
    @Request() req: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePortfolioDto: UpdatePortfolioDto,
  ): Promise<PortfolioResponseDto> {
    const portfolio = await this.portfolioService.getPortfolioById(id);

    if (!portfolio) {
      throw new NotFoundException('Portfolio not found');
    }

    // Only admins or the portfolio owner can update
    if (req.user.role !== AppUserRole.ADMIN && req.user.userId !== portfolio.userId) {
      throw new ForbiddenException('You can only update your own portfolios');
    }

    return this.portfolioService.updatePortfolio(id, updatePortfolioDto);
  }
}
