import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsBoolean, IsNumber, IsString, IsIn, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Theme Query DTO
 *
 * @remarks
 * This DTO is used for querying themes with filtering, sorting, and pagination.
 *
 * @public
 */
export class ThemeQueryDto {
  @ApiPropertyOptional({
    description: 'Filter themes by name (case-insensitive contains match)',
    example: 'corporate',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    description: 'Filter themes by active status',
    type: Boolean,
    example: true,
  })
  @IsBoolean()
  @Type(() => Boolean)
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Page number for pagination (1-based)',
    type: Number,
    minimum: 1,
    default: 1,
  })
  @IsNumber()
  @Min(1, { message: 'Page must be at least 1' })
  @Type(() => Number)
  @IsOptional()
  page: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    type: Number,
    minimum: 1,
    maximum: 100,
    default: 10,
  })
  @IsNumber()
  @Min(1, { message: 'Limit must be at least 1' })
  @Max(100, { message: 'Maximum limit is 100' })
  @Type(() => Number)
  @IsOptional()
  limit: number = 10;

  @ApiPropertyOptional({
    description: 'Field to sort by',
    enum: ['name', 'isActive', 'createdAt', 'updatedAt'],
    default: 'createdAt',
  })
  @IsString()
  @IsIn(['name', 'isActive', 'createdAt', 'updatedAt'], {
    message: 'Invalid sort field',
  })
  @IsOptional()
  sortBy: string = 'createdAt';

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['asc', 'desc'],
    default: 'desc',
  })
  @IsString()
  @IsIn(['asc', 'desc'], { message: 'Sort order must be either "asc" or "desc"' })
  @IsOptional()
  sortOrder: 'asc' | 'desc' = 'desc';
}
