import { ApiPropertyOptional } from '@nestjs/swagger';
import { SalonStaffRequestStatus, SalonStaffRequestType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class SalonStaffRequestQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by staff member ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsOptional()
  staffId?: string;

  @ApiPropertyOptional({
    description: 'Filter by request type',
    enum: SalonStaffRequestType,
  })
  @IsEnum(SalonStaffRequestType)
  @IsOptional()
  requestType?: SalonStaffRequestType;

  @ApiPropertyOptional({
    description: 'Filter by request status',
    enum: SalonStaffRequestStatus,
  })
  @IsEnum(SalonStaffRequestStatus)
  @IsOptional()
  status?: SalonStaffRequestStatus;

  @ApiPropertyOptional({
    description: 'Filter by start date (requests created after this date)',
    type: Date,
  })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Filter by end date (requests created before this date)',
    type: Date,
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Page number for pagination (1-based)',
    type: Number,
    default: 1,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    type: Number,
    default: 10,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Sort field',
    enum: ['createdAt', 'updatedAt', 'leaveFrom', 'leaveTo'],
    default: 'createdAt',
  })
  @IsString()
  @IsOptional()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['asc', 'desc'],
    default: 'desc',
  })
  @IsString()
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'desc';
}
