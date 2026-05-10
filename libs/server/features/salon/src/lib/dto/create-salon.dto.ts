import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsUUID, MinLength, MaxLength, Min, Max, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * Data Transfer Object for creating a new salon
 * @class CreateSalonDto
 * @description Contains all the properties needed to create a new salon
 */
export class CreateSalonDto {
  @ApiProperty({
    example: 'Beauty Haven',
    description: 'The name of the salon',
    minLength: 2,
    maxLength: 100,
    required: true,
  })
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name is required' })
  @MinLength(2, { message: 'Name must be at least 2 characters long' })
  @MaxLength(100, { message: 'Name cannot be longer than 100 characters' })
  name: string;

  @ApiProperty({
    example: '123 Beauty Street',
    description: 'The full address of the salon',
    minLength: 5,
    maxLength: 255,
    required: true,
  })
  @IsString({ message: 'Address must be a string' })
  @IsNotEmpty({ message: 'Address is required' })
  @MinLength(5, { message: 'Address must be at least 5 characters long' })
  @MaxLength(255, { message: 'Address cannot be longer than 255 characters' })
  address: string;

  @ApiProperty({
    example: '10001',
    description: 'The postal/zip code of the salon',
    minLength: 3,
    maxLength: 20,
    required: true,
  })
  @IsString({ message: 'Zip code must be a string' })
  @IsNotEmpty({ message: 'Zip code is required' })
  @MinLength(3, { message: 'Zip code must be at least 3 characters long' })
  @MaxLength(20, { message: 'Zip code cannot be longer than 20 characters' })
  zipCode: string;

  @ApiProperty({
    example: 'New York',
    description: 'The city where the salon is located',
    minLength: 2,
    maxLength: 100,
    required: true,
  })
  @IsString({ message: 'City must be a string' })
  @IsNotEmpty({ message: 'City is required' })
  @MinLength(2, { message: 'City must be at least 2 characters long' })
  @MaxLength(100, { message: 'City cannot be longer than 100 characters' })
  city: string;

  @ApiProperty({
    example: 40.7128,
    description: 'The latitude coordinate of the salon location',
    minimum: -90,
    maximum: 90,
    required: true,
  })
  @IsNumber({}, { message: 'Latitude must be a number' })
  @IsNotEmpty({ message: 'Latitude is required' })
  @Min(-90, { message: 'Latitude must be between -90 and 90' })
  @Max(90, { message: 'Latitude must be between -90 and 90' })
  @Transform(({ value }) => parseFloat(value))
  latitude: number;

  @ApiProperty({
    example: -74.006,
    description: 'The longitude coordinate of the salon location',
    minimum: -180,
    maximum: 180,
    required: true,
  })
  @IsNumber({}, { message: 'Longitude must be a number' })
  @IsNotEmpty({ message: 'Longitude is required' })
  @Min(-180, { message: 'Longitude must be between -180 and 180' })
  @Max(180, { message: 'Longitude must be between -180 and 180' })
  @Transform(({ value }) => parseFloat(value))
  longitude: number;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'The ID of the salon owner (user)',
    format: 'uuid',
    required: true,
  })
  @IsUUID(4, { message: 'Owner ID must be a valid UUID' })
  @IsNotEmpty({ message: 'Owner ID is required' })
  ownerId: string;

  @ApiPropertyOptional({
    example: 'A beautiful salon in the heart of the city',
    description: 'A brief description of the salon',
    maxLength: 500,
    required: false,
  })
  @IsString({ message: 'Description must be a string' })
  @MaxLength(500, { message: 'Description cannot be longer than 500 characters' })
  @IsOptional()
  description?: string;
}
