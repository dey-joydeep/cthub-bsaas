import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsDateString, IsUUID, IsOptional, Min, Max } from 'class-validator';
import { Expose, Type } from 'class-transformer';

/**
 * Data Transfer Object for salon response
 * @class SalonResponseDto
 * @description Contains all the properties that are returned when a salon is retrieved
 */
export class SalonResponseDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'The unique identifier of the salon',
    format: 'uuid',
  })
  @IsUUID(4, { message: 'ID must be a valid UUID' })
  @Expose()
  id: string;

  @ApiProperty({
    example: 'Beauty Haven',
    description: 'The name of the salon',
    maxLength: 100,
  })
  @IsString({ message: 'Name must be a string' })
  @Expose()
  name: string;

  @ApiProperty({
    example: '123 Beauty Street',
    description: 'The address of the salon',
    maxLength: 255,
  })
  @IsString({ message: 'Address must be a string' })
  @Expose()
  address: string;

  @ApiProperty({
    example: '10001',
    description: 'The zip code of the salon',
    maxLength: 20,
  })
  @IsString({ message: 'Zip code must be a string' })
  @Expose()
  zipCode: string;

  @ApiProperty({
    example: 'New York',
    description: 'The city where the salon is located',
    maxLength: 100,
  })
  @IsString({ message: 'City must be a string' })
  @Expose()
  city: string;

  @ApiProperty({
    example: 40.7128,
    description: 'The latitude coordinate of the salon location',
    minimum: -90,
    maximum: 90,
  })
  @IsNumber({}, { message: 'Latitude must be a number' })
  @Min(-90, { message: 'Latitude must be between -90 and 90' })
  @Max(90, { message: 'Latitude must be between -90 and 90' })
  @Expose()
  latitude: number;

  @ApiProperty({
    example: -74.006,
    description: 'The longitude coordinate of the salon location',
    minimum: -180,
    maximum: 180,
  })
  @IsNumber({}, { message: 'Longitude must be a number' })
  @Min(-180, { message: 'Longitude must be between -180 and 180' })
  @Max(180, { message: 'Longitude must be between -180 and 180' })
  @Expose()
  longitude: number;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'The ID of the salon owner (user)',
    format: 'uuid',
  })
  @IsUUID(4, { message: 'Owner ID must be a valid UUID' })
  @Expose()
  ownerId: string;

  @ApiPropertyOptional({
    example: 'A beautiful salon in the heart of the city',
    description: 'A brief description of the salon',
    maxLength: 500,
    required: false,
  })
  @IsString({ message: 'Description must be a string' })
  @IsOptional()
  @Expose()
  description?: string;

  @ApiProperty({
    description: 'The date when the salon was created',
    type: 'string',
    format: 'date-time',
  })
  @IsDateString({}, { message: 'Created at must be a valid date string' })
  @Expose()
  createdAt: string;

  @ApiProperty({
    description: 'The date when the salon was last updated',
    type: 'string',
    format: 'date-time',
  })
  @IsDateString({}, { message: 'Updated at must be a valid date string' })
  @Expose()
  updatedAt: string;

  @ApiPropertyOptional({
    description: 'The distance from the search location in kilometers',
    type: 'number',
    format: 'float',
    minimum: 0,
    required: false,
    example: 1.5,
  })
  @IsNumber({}, { message: 'Distance must be a number' })
  @Min(0, { message: 'Distance cannot be negative' })
  @IsOptional()
  @Expose()
  distanceKm?: number;

  @ApiPropertyOptional({
    description: 'The average rating of the salon',
    type: 'number',
    format: 'float',
    minimum: 0,
    maximum: 5,
    required: false,
    example: 4.5,
  })
  @IsNumber({}, { message: 'Average rating must be a number' })
  @Min(0, { message: 'Rating cannot be less than 0' })
  @Max(5, { message: 'Rating cannot be greater than 5' })
  @IsOptional()
  @Expose()
  averageRating?: number;
}
