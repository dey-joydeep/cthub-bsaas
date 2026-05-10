import {
  IsNumber,
  IsOptional,
  IsString,
  Min,
  Max,
  IsInt,
  IsPositive,
  IsNumberString,
  IsArray,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Data Transfer Object for searching salons with various filters
 * @class SearchSalonsDto
 * @description Contains all the search parameters for querying salons
 */
export class SearchSalonsDto {
  @ApiPropertyOptional({
    description: 'Search term for salon name',
    maxLength: 100,
    example: 'beauty',
    required: false,
  })
  @IsString({ message: 'Name must be a string' })
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    description: 'Search term for salon address',
    maxLength: 255,
    example: '123 Main St',
    required: false,
  })
  @IsString({ message: 'Address must be a string' })
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({
    description: 'Filter by zip code',
    maxLength: 20,
    example: '10001',
    required: false,
  })
  @IsString({ message: 'Zip code must be a string' })
  @IsOptional()
  zipCode?: string;

  @ApiPropertyOptional({
    description: 'Filter by city',
    maxLength: 100,
    example: 'New York',
    required: false,
  })
  @IsString({ message: 'City must be a string' })
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({
    description: 'Filter by service name or ID',
    maxLength: 100,
    example: 'Haircut',
    required: false,
  })
  @IsString({ message: 'Service must be a string' })
  @IsOptional()
  service?: string;

  @ApiPropertyOptional({
    description: 'Filter by service category',
    maxLength: 100,
    example: 'Hair',
    required: false,
  })
  @IsString({ message: 'Category must be a string' })
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({
    description: 'Filter by service IDs',
    type: [String],
    example: ['550e8400-e29b-41d4-a716-446655440000'],
    required: false,
  })
  @IsArray({ message: 'Service IDs must be an array' })
  @IsString({ each: true, message: 'Each service ID must be a string' })
  @ArrayMinSize(1, { message: 'At least one service ID is required' })
  @ArrayMaxSize(10, { message: 'Cannot search for more than 10 services at once' })
  @IsOptional()
  serviceIds?: string[];

  @ApiPropertyOptional({
    description: 'Minimum average rating (0-5)',
    type: 'number',
    format: 'float',
    minimum: 0,
    maximum: 5,
    example: 4.0,
    required: false,
  })
  @IsNumber({}, { message: 'Minimum rating must be a number' })
  @Min(0, { message: 'Minimum rating cannot be less than 0' })
  @Max(5, { message: 'Minimum rating cannot be greater than 5' })
  @Type(() => Number)
  @IsOptional()
  minRating?: number;

  @ApiPropertyOptional({
    description: 'Maximum average rating (0-5)',
    type: 'number',
    format: 'float',
    minimum: 0,
    maximum: 5,
    example: 5.0,
    required: false,
  })
  @IsNumber({}, { message: 'Maximum rating must be a number' })
  @Min(0, { message: 'Maximum rating cannot be less than 0' })
  @Max(5, { message: 'Maximum rating cannot be greater than 5' })
  @Type(() => Number)
  @IsOptional()
  maxRating?: number;

  @ApiPropertyOptional({
    description: 'Filter by minimum price',
    type: 'number',
    format: 'float',
    minimum: 0,
    example: 20.0,
    required: false,
  })
  @IsNumber({}, { message: 'Minimum price must be a number' })
  @Min(0, { message: 'Minimum price cannot be negative' })
  @Type(() => Number)
  @IsOptional()
  minPrice?: number;

  @ApiPropertyOptional({
    description: 'Filter by maximum price',
    type: 'number',
    format: 'float',
    minimum: 0,
    example: 100.0,
    required: false,
  })
  @IsNumber({}, { message: 'Maximum price must be a number' })
  @Min(0, { message: 'Maximum price cannot be negative' })
  @Type(() => Number)
  @IsOptional()
  maxPrice?: number;

  @ApiPropertyOptional({
    description: 'Page number for pagination',
    type: 'integer',
    minimum: 1,
    default: 1,
    example: 1,
    required: false,
  })
  @IsInt({ message: 'Page must be an integer' })
  @Min(1, { message: 'Page must be at least 1' })
  @Type(() => Number)
  @IsOptional()
  page: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    type: 'integer',
    minimum: 1,
    maximum: 100,
    default: 10,
    example: 10,
    required: false,
  })
  @IsInt({ message: 'Limit must be an integer' })
  @Min(1, { message: 'Limit must be at least 1' })
  @Max(100, { message: 'Limit cannot exceed 100' })
  @Type(() => Number)
  @IsOptional()
  limit: number = 10;

  @ApiPropertyOptional({
    description: 'Sort field (e.g., name, rating, price)',
    enum: ['name', 'rating', 'price', 'distance'],
    example: 'rating',
    required: false,
  })
  @IsString({ message: 'Sort field must be a string' })
  @IsOptional()
  sortBy?: string;

  @ApiPropertyOptional({
    description: 'Sort direction',
    enum: ['asc', 'desc'],
    example: 'desc',
    required: false,
  })
  @IsString({ message: 'Sort order must be a string' })
  @IsOptional()
  sortOrder?: 'asc' | 'desc';
}
