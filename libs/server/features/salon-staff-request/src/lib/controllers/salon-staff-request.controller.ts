import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  ClassSerializerInterceptor,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { Roles, JwtAuthGuard, RolesGuard } from '@cthub-bsaas/server-core';
import { AppUserRole } from '@shared/types/user.types';
import { SalonStaffRequestStatus } from '@prisma/client';
import { CreateSalonStaffRequestDto } from '../dto/create-salon-staff-request.dto';
import { UpdateSalonStaffRequestDto } from '../dto/update-salon-staff-request.dto';
import { SalonStaffRequestQueryDto } from '../dto/salon-staff-request-query.dto';
import { SalonStaffRequestResponseDto } from '../dto/salon-staff-request-response.dto';
import { SalonStaffRequestService } from '../services/salon-staff-request.service';

@ApiTags('salon-staff-requests')
@ApiBearerAuth()
@Controller('salon-staff-requests')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class SalonStaffRequestController {
  constructor(private readonly salonStaffRequestService: SalonStaffRequestService) {}

  @Post()
  @Roles(AppUserRole.OWNER, AppUserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new salon staff request' })
  @ApiResponse({ status: HttpStatus.CREATED, type: SalonStaffRequestResponseDto })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid request data' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Insufficient permissions' })
  async create(@Body() createSalonStaffRequestDto: CreateSalonStaffRequestDto): Promise<SalonStaffRequestResponseDto> {
    return this.salonStaffRequestService.createRequest(createSalonStaffRequestDto);
  }

  @Put(':id')
  @Roles(AppUserRole.OWNER, AppUserRole.ADMIN)
  @ApiOperation({ summary: 'Update a salon staff request' })
  @ApiParam({ name: 'id', description: 'Request ID' })
  @ApiResponse({ status: HttpStatus.OK, type: SalonStaffRequestResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Request not found' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid request data' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Insufficient permissions' })
  async update(
    @Param('id') id: string,
    @Body() updateSalonStaffRequestDto: UpdateSalonStaffRequestDto,
  ): Promise<SalonStaffRequestResponseDto> {
    return this.salonStaffRequestService.updateRequest(id, updateSalonStaffRequestDto);
  }

  @Delete(':id')
  @Roles(AppUserRole.OWNER, AppUserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a salon staff request' })
  @ApiParam({ name: 'id', description: 'Request ID' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Request not found' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Insufficient permissions' })
  async remove(@Param('id') id: string): Promise<void> {
    await this.salonStaffRequestService.deleteRequest(id);
  }

  @Get(':id')
  @Roles(AppUserRole.OWNER, AppUserRole.ADMIN, AppUserRole.STAFF)
  @ApiOperation({ summary: 'Get a salon staff request by ID' })
  @ApiParam({ name: 'id', description: 'Request ID' })
  @ApiResponse({ status: HttpStatus.OK, type: SalonStaffRequestResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Request not found' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Insufficient permissions' })
  async findOne(@Param('id') id: string): Promise<SalonStaffRequestResponseDto> {
    return this.salonStaffRequestService.getRequestById(id);
  }

  @Get()
  @Roles(AppUserRole.OWNER, AppUserRole.ADMIN)
  @ApiOperation({ summary: 'Get all salon staff requests with optional filtering' })
  @ApiResponse({ status: HttpStatus.OK, type: [SalonStaffRequestResponseDto] })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Insufficient permissions' })
  async findAll(@Query() query: SalonStaffRequestQueryDto): Promise<SalonStaffRequestResponseDto[]> {
    return this.salonStaffRequestService.getRequests(query);
  }

  @Get('pending')
  @Roles(AppUserRole.OWNER, AppUserRole.ADMIN)
  @ApiOperation({ summary: 'Get all pending salon staff requests' })
  @ApiResponse({ status: HttpStatus.OK, type: [SalonStaffRequestResponseDto] })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Insufficient permissions' })
  async findPending(): Promise<SalonStaffRequestResponseDto[]> {
    return this.salonStaffRequestService.getRequests({ status: SalonStaffRequestStatus.pending } as SalonStaffRequestQueryDto);
  }
}
