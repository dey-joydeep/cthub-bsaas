import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsString, IsNumber, IsOptional, IsUUID, MinLength, MaxLength, Min, Max } from 'class-validator';
import { CreateSalonDto } from './create-salon.dto';

/**
 * Data Transfer Object for updating an existing salon
 * @class UpdateSalonDto
 * @extends {PartialType(CreateSalonDto)}
 * @description Contains all the properties that can be updated for a salon.
 * All fields are optional as this is a PATCH operation.
 */
export class UpdateSalonDto extends PartialType(CreateSalonDto) {
  @ApiPropertyOptional({
    example: 'Updated Beauty Haven',
    description: 'The updated name of the salon',
    minLength: 2,
    maxLength: 100,
    required: false,
  })
  @IsString({ message: 'Name must be a string' })
  @MinLength(2, { message: 'Name must be at least 2 characters long' })
  @MaxLength(100, { message: 'Name cannot be longer than 100 characters' })
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    example: '456 New Beauty Street',
    description: 'The updated address of the salon',
    minLength: 5,
    maxLength: 255,
    required: false,
  })
  @IsString({ message: 'Address must be a string' })
  @MinLength(5, { message: 'Address must be at least 5 characters long' })
  @MaxLength(255, { message: 'Address cannot be longer than 255 characters' })
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({
    example: '10002',
    description: 'The updated zip code of the salon',
    minLength: 3,
    maxLength: 20,
    required: false,
  })
  @IsString({ message: 'Zip code must be a string' })
  @MinLength(3, { message: 'Zip code must be at least 3 characters long' })
  @MaxLength(20, { message: 'Zip code cannot be longer than 20 characters' })
  @IsOptional()
  zipCode?: string;

  @ApiPropertyOptional({
    example: 'Brooklyn',
    description: 'The updated city where the salon is located',
    minLength: 2,
    maxLength: 100,
    required: false,
  })
  @IsString({ message: 'City must be a string' })
  @MinLength(2, { message: 'City must be at least 2 characters long' })
  @MaxLength(100, { message: 'City cannot be longer than 100 characters' })
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({
    example: 40.6782,
    description: 'The updated latitude coordinate of the salon location',
    minimum: -90,
    maximum: 90,
    required: false,
  })
  @IsNumber({}, { message: 'Latitude must be a number' })
  @Min(-90, { message: 'Latitude must be between -90 and 90' })
  @Max(90, { message: 'Latitude must be between -90 and 90' })
  @Type(() => Number)
  @IsOptional()
  latitude?: number;

  @ApiPropertyOptional({
    example: -73.9442,
    description: 'The updated longitude coordinate of the salon location',
    minimum: -180,
    maximum: 180,
    required: false,
  })
  @IsNumber({}, { message: 'Longitude must be a number' })
  @Min(-180, { message: 'Longitude must be between -180 and 180' })
  @Max(180, { message: 'Longitude must be between -180 and 180' })
  @Type(() => Number)
  @IsOptional()
  longitude?: number;

  @ApiPropertyOptional({
    example: 'A newly renovated salon with modern facilities',
    description: 'An updated description of the salon',
    maxLength: 500,
    required: false,
  })
  @IsString({ message: 'Description must be a string' })
  @MaxLength(500, { message: 'Description cannot be longer than 500 characters' })
  @IsOptional()
  description?: string;
}
