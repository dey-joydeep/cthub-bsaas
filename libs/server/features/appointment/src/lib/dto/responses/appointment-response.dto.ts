import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AppointmentStatus } from '@shared/enums/appointment-status.enum';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

/**
 * Base response DTO for appointment data
 * @class AppointmentResponseDto
 * @description Contains all the properties that should be included when returning appointment data to the client
 */
export class AppointmentResponseDto {
  @ApiProperty({
    description: 'Unique identifier for the appointment',
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: true,
  })
  @IsUUID(4, { message: 'ID must be a valid UUID v4' })
  id!: string;

  @ApiProperty({
    description: 'Title of the appointment',
    example: 'Haircut and Styling',
    required: true,
    maxLength: 200,
  })
  @IsString({ message: 'Title must be a string' })
  @IsNotEmpty({ message: 'Title is required' })
  @MaxLength(200, { message: 'Title cannot be longer than 200 characters' })
  title!: string;

  @ApiPropertyOptional({
    description: 'Description of the appointment',
    example: 'Regular haircut with styling and blow dry',
    maxLength: 1000,
    nullable: true,
    required: false,
  })
  @IsString({ message: 'Description must be a string' })
  @MaxLength(1000, { message: 'Description cannot be longer than 1000 characters' })
  @IsOptional()
  description?: string | null;

  @ApiProperty({
    description: 'ISO 8601 timestamp when the appointment starts',
    example: '2023-12-01T10:00:00.000Z',
    required: true,
  })
  @IsDateString({}, { message: 'Start time must be a valid ISO 8601 date string' })
  @IsNotEmpty({ message: 'Start time is required' })
  startTime!: string;

  @ApiProperty({
    description: 'ISO 8601 timestamp when the appointment ends',
    example: '2023-12-01T11:00:00.000Z',
    required: true,
  })
  @IsDateString({}, { message: 'End time must be a valid ISO 8601 date string' })
  @IsNotEmpty({ message: 'End time is required' })
  endTime!: string;

  @ApiProperty({
    enum: AppointmentStatus,
    enumName: 'AppointmentStatus',
    description: 'Current status of the appointment',
    example: AppointmentStatus.CONFIRMED,
    required: true,
  })
  @IsEnum(AppointmentStatus, {
    message: `Status must be one of: ${Object.values(AppointmentStatus).join(', ')}`,
  })
  @IsNotEmpty({ message: 'Status is required' })
  status!: AppointmentStatus;

  @ApiProperty({
    description: 'Duration of the appointment in minutes',
    example: 60,
    minimum: 1,
    maximum: 1440, // 24 hours
    required: true,
  })
  @IsNumber({}, { message: 'Duration must be a number' })
  @Min(1, { message: 'Duration must be at least 1 minute' })
  @Max(1440, { message: 'Duration cannot exceed 24 hours (1440 minutes)' })
  @IsNotEmpty({ message: 'Duration is required' })
  duration!: number;

  @ApiProperty({
    description: 'Price of the appointment',
    example: 75.5,
    minimum: 0,
    required: true,
  })
  @IsNumber({}, { message: 'Price must be a number' })
  @Min(0, { message: 'Price cannot be negative' })
  @IsNotEmpty({ message: 'Price is required' })
  price!: number;

  @ApiProperty({
    description: 'Customer ID for the appointment',
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174005',
    required: true,
  })
  @IsUUID(4, { message: 'Customer ID must be a valid UUID v4' })
  @IsNotEmpty({ message: 'Customer ID is required' })
  customerId!: string;

  @ApiProperty({
    description: 'Staff member ID for the appointment',
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174006',
    required: true,
  })
  @IsUUID(4, { message: 'Staff ID must be a valid UUID v4' })
  @IsNotEmpty({ message: 'Staff ID is required' })
  staffId!: string;

  @ApiProperty({
    description: 'Service ID for the appointment',
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174007',
    required: true,
  })
  @IsUUID(4, { message: 'Service ID must be a valid UUID v4' })
  @IsNotEmpty({ message: 'Service ID is required' })
  serviceId!: string;

  @ApiProperty({
    description: 'Salon ID where the appointment takes place',
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174008',
    required: true,
  })
  @IsUUID(4, { message: 'Salon ID must be a valid UUID v4' })
  @IsNotEmpty({ message: 'Salon ID is required' })
  salonId!: string;

  @ApiProperty({
    description: 'Tenant ID for multi-tenancy',
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174009',
    required: true,
  })
  @IsUUID(4, { message: 'Tenant ID must be a valid UUID v4' })
  @IsNotEmpty({ message: 'Tenant ID is required' })
  tenantId!: string;

  @ApiProperty({
    description: 'ISO 8601 timestamp when the appointment was created',
    example: '2023-11-20T15:30:00.000Z',
    required: true,
  })
  @IsDateString({}, { message: 'Created at must be a valid ISO 8601 date string' })
  @IsNotEmpty({ message: 'Created at timestamp is required' })
  createdAt!: string;

  @ApiProperty({
    description: 'ISO 8601 timestamp when the appointment was last updated',
    example: '2023-11-25T09:15:00.000Z',
    required: true,
  })
  @IsDateString({}, { message: 'Updated at must be a valid ISO 8601 date string' })
  @IsNotEmpty({ message: 'Updated at timestamp is required' })
  updatedAt!: string;

  @ApiPropertyOptional({
    description: 'Additional notes or special requests for the appointment',
    example: 'Please use only organic products',
    maxLength: 1000,
    required: false,
    nullable: true,
  })
  @IsString({ message: 'Notes must be a string' })
  @MaxLength(1000, { message: 'Notes cannot be longer than 1000 characters' })
  @IsOptional()
  notes?: string | null;

  @ApiPropertyOptional({
    description: 'Whether the customer was notified about the appointment',
    example: true,
    default: false,
    required: false,
  })
  @IsBoolean({ message: 'Notified flag must be a boolean' })
  @IsOptional()
  customerNotified?: boolean = false;

  @ApiPropertyOptional({
    description: 'Whether the staff member was notified about the appointment',
    example: true,
    default: false,
    required: false,
  })
  @IsBoolean({ message: 'Staff notified flag must be a boolean' })
  @IsOptional()
  staffNotified?: boolean = false;

  @ApiPropertyOptional({
    description: 'Metadata or additional information about the appointment',
    example: { reminderSent: true, paymentMethod: 'credit_card' },
    required: false,
    nullable: true,
  })
  @IsObject({ message: 'Metadata must be an object' })
  @IsOptional()
  metadata?: Record<string, any> | null;
}
