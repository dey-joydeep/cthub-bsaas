import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min, Max, IsLatitude, IsLongitude, IsPositive, ValidateIf, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Data Transfer Object for querying salons with filtering and pagination
 * @class SalonQueryDto
 * @description Contains all the query parameters for filtering and paginating salons
 */
export class SalonQueryDto {
  @ApiPropertyOptional({
    description: 'The page number for pagination',
    type: 'integer',
    minimum: 1,
    default: 1,
    example: 1,
  })
  @IsInt({ message: 'Page must be an integer' })
  @Min(1, { message: 'Page must be at least 1' })
  @Type(() => Number)
  @IsOptional()
  page: number = 1;

  @ApiPropertyOptional({
    description: 'The number of items per page',
    type: 'integer',
    minimum: 1,
    maximum: 100,
    default: 10,
    example: 10,
  })
  @IsInt({ message: 'Limit must be an integer' })
  @Min(1, { message: 'Limit must be at least 1' })
  @Max(100, { message: 'Limit cannot exceed 100' })
  @Type(() => Number)
  @IsOptional()
  limit: number = 10;

  @ApiPropertyOptional({
    description: 'Search term for salon name or address',
    maxLength: 100,
    required: false,
    example: 'beauty',
  })
  @IsString({ message: 'Search term must be a string' })
  @MaxLength(100, { message: 'Search term cannot be longer than 100 characters' })
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by city',
    maxLength: 100,
    required: false,
    example: 'New York',
  })
  @IsString({ message: 'City must be a string' })
  @MaxLength(100, { message: 'City cannot be longer than 100 characters' })
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({
    description: 'Filter by zip code',
    maxLength: 20,
    required: false,
    example: '10001',
  })
  @IsString({ message: 'Zip code must be a string' })
  @MaxLength(20, { message: 'Zip code cannot be longer than 20 characters' })
  @IsOptional()
  zipCode?: string;

  @ApiPropertyOptional({
    description: 'User latitude for distance calculation',
    type: 'number',
    format: 'float',
    minimum: -90,
    maximum: 90,
    required: false,
    example: 40.7128,
  })
  @IsNumber({}, { message: 'Latitude must be a number' })
  @IsLatitude({ message: 'Invalid latitude value' })
  @Min(-90, { message: 'Latitude must be between -90 and 90' })
  @Max(90, { message: 'Latitude must be between -90 and 90' })
  @Type(() => Number)
  @IsOptional()
  latitude?: number;

  @ApiPropertyOptional({
    description: 'User longitude for distance calculation',
    type: 'number',
    format: 'float',
    minimum: -180,
    maximum: 180,
    required: false,
    example: -74.006,
  })
  @IsNumber({}, { message: 'Longitude must be a number' })
  @IsLongitude({ message: 'Invalid longitude value' })
  @Min(-180, { message: 'Longitude must be between -180 and 180' })
  @Max(180, { message: 'Longitude must be between -180 and 180' })
  @Type(() => Number)
  @IsOptional()
  longitude?: number;

  @ApiPropertyOptional({
    description: 'Maximum distance in kilometers (requires latitude and longitude)',
    type: 'number',
    format: 'float',
    minimum: 0.1,
    maximum: 1000,
    required: false,
    example: 5,
  })
  @IsNumber({}, { message: 'Max distance must be a number' })
  @IsPositive({ message: 'Max distance must be a positive number' })
  @Min(0.1, { message: 'Max distance must be at least 0.1 km' })
  @Max(1000, { message: 'Max distance cannot exceed 1000 km' })
  @Type(() => Number)
  @IsOptional()
  @ValidateIf((o) => (o.latitude !== undefined && o.longitude !== undefined) || o.maxDistanceKm !== undefined, {
    message: 'Latitude and longitude are required when using maxDistanceKm',
  })
  maxDistanceKm?: number;
}
