import {
  BadRequestException,
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseFloatPipe,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { ReviewService } from '../review/review.service';
import { CreateSalonDto } from '../dto/create-salon.dto';
import { SearchSalonsDto } from '../dto/search-salons.dto';
import { SalonResponseDto } from '../dto/salon-response.dto';
import { UpdateSalonDto } from '../dto/update-salon.dto';
import { SalonService } from '../services/salon.service';

@ApiTags('salons')
@Controller('salons')
@UseGuards(JwtAuthGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class SalonController {
  constructor(
    private readonly salonService: SalonService,
    private readonly reviewService: ReviewService,
  ) {}

  @Get('top')
  @ApiOperation({ summary: 'Get top-rated salons' })
  @ApiResponse({ status: 200, description: 'List of top salons', type: [SalonResponseDto] })
  @ApiQuery({ name: 'lat', required: false, type: Number })
  @ApiQuery({ name: 'lng', required: false, type: Number })
  async getTopSalons(
    @Query('lat', new ParseFloatPipe({ optional: true })) lat?: number,
    @Query('lng', new ParseFloatPipe({ optional: true })) lng?: number,
  ) {
    try {
      return await this.salonService.getTopSalons({
        latitude: lat,
        longitude: lng,
        reviewService: this.reviewService,
      });
    } catch (error) {
      throw new BadRequestException('Error fetching top salons', error.message);
    }
  }

  @Get('search')
  @ApiOperation({ summary: 'Search salons with filters' })
  @ApiResponse({ status: 200, description: 'List of filtered salons', type: [SalonResponseDto] })
  @ApiResponse({ status: 400, description: 'Invalid query parameters' })
  async searchSalons(@Query() searchParams: SearchSalonsDto) {
    try {
      // Convert to the format expected by the service
      const filters = {
        name: searchParams.name,
        address: searchParams.address,
        zip_code: searchParams.zipCode,
        city: searchParams.city,
        service: searchParams.service,
        min_rating: searchParams.minRating,
        max_rating: searchParams.maxRating,
        page: searchParams.page,
        limit: searchParams.limit,
      };

      return await this.salonService.searchSalons(filters);
    } catch (error) {
      throw new BadRequestException('Error searching salons', error.message);
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get salon by ID' })
  @ApiResponse({ status: 200, description: 'The found salon', type: SalonResponseDto })
  @ApiResponse({ status: 404, description: 'Salon not found' })
  async getSalonById(@Param('id') id: string) {
    const salon = await this.salonService.getSalonById({ salonId: id });
    if (!salon) {
      throw new NotFoundException('Salon not found');
    }
    return salon;
  }

  @Post()
  @ApiOperation({ summary: 'Create a new salon' })
  @ApiResponse({ status: 201, description: 'The salon has been successfully created.', type: SalonResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async createSalon(@Body() createSalonDto: CreateSalonDto) {
    try {
      return await this.salonService.createSalon(createSalonDto);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a salon' })
  @ApiResponse({ status: 200, description: 'The salon has been successfully updated.', type: SalonResponseDto })
  @ApiResponse({ status: 404, description: 'Salon not found' })
  async updateSalon(@Param('id') id: string, @Body() updateSalonDto: UpdateSalonDto) {
    try {
      const salon = await this.salonService.updateSalon({
        salonId: id,
        ...updateSalonDto,
      });

      if (!salon) {
        throw new NotFoundException('Salon not found');
      }

      return salon;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a salon' })
  @ApiResponse({ status: 200, description: 'The salon has been successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Salon not found' })
  async deleteSalon(@Param('id') id: string) {
    try {
      const deleted = await this.salonService.deleteSalon({ salonId: id });
      if (!deleted) {
        throw new NotFoundException('Salon not found');
      }
      return { deleted: true };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
