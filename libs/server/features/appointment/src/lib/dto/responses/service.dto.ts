import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, IsNotEmpty, IsNumber, Min, Max, IsPositive } from 'class-validator';

/**
 * Data Transfer Object (DTO) for service information.
 * Represents a service that can be booked at a salon.
 */
export class ServiceDto {
  /**
   * Unique identifier for the service
   * @example '323e4567-e89b-12d3-a456-426614174000'
   */
  @ApiProperty({
    description: 'Unique identifier for the service',
    format: 'uuid',
    example: '323e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID(4, { message: 'ID must be a valid UUID v4' })
  @IsNotEmpty({ message: 'ID is required' })
  readonly id!: string;

  /**
   * Name of the service
   * @example 'Haircut and Styling'
   */
  @ApiProperty({
    description: 'Name of the service',
    example: 'Haircut and Styling',
    maxLength: 100,
  })
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name is required' })
  readonly name!: string;

  /**
   * Duration of the service in minutes
   * @example 60
   */
  @ApiProperty({
    description: 'Duration of the service in minutes',
    example: 60,
    minimum: 1,
    maximum: 1440, // 24 hours
  })
  @IsNumber({}, { message: 'Duration must be a number' })
  @IsPositive({ message: 'Duration must be a positive number' })
  @Min(1, { message: 'Duration must be at least 1 minute' })
  @Max(1440, { message: 'Duration cannot exceed 1440 minutes (24 hours)' })
  readonly duration!: number;

  /**
   * Price of the service in the local currency
   * @example 75.50
   */
  @ApiProperty({
    description: 'Price of the service in the local currency',
    example: 75.5,
    minimum: 0,
    maximum: 100000, // $100,000
  })
  @IsNumber({}, { message: 'Price must be a number' })
  @Min(0, { message: 'Price cannot be negative' })
  @Max(100000, { message: 'Price cannot exceed 100,000' })
  readonly price!: number;

  /**
   * Optional description of the service
   * @example 'A complete haircut and styling service including wash and blow dry'
   */
  @ApiProperty({
    description: 'Optional description of the service',
    example: 'A complete haircut and styling service including wash and blow dry',
    required: false,
    nullable: true,
  })
  @IsString({ message: 'Description must be a string' })
  readonly description?: string | null;
}

export default ServiceDto;
