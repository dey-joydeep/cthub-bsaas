import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { AppointmentStatus } from '@cthub-bsaas/shared';
import { IsValidAppointmentTime } from '@cthub-bsaas/core/validators';

/**
 * DTO for creating an appointment service item
 */
export class CreateAppointmentServiceDto {
  @ApiProperty({
    description: 'Unique identifier of the service being booked',
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: true,
  })
  @IsUUID(4, { message: 'Service ID must be a valid UUID v4' })
  @IsNotEmpty({ message: 'Service ID is required' })
  serviceId!: string;

  @ApiPropertyOptional({
    description: 'Optional identifier of the staff member assigned to this specific service',
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174001',
    nullable: true,
    required: false,
  })
  @IsUUID(4, { message: 'Staff ID must be a valid UUID v4' })
  @IsOptional()
  staffId?: string | null;
}

/**
 * DTO for creating a new appointment
 * @class CreateAppointmentDto
 * @description Contains all required and optional fields for creating a new appointment
 */
export class CreateAppointmentDto {
  @ApiProperty({
    description: 'Unique identifier of the customer booking the appointment',
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: true,
  })
  @IsUUID(4, { message: 'Customer ID must be a valid UUID v4' })
  @IsNotEmpty({ message: 'Customer ID is required' })
  customerId!: string;

  @ApiProperty({
    description: 'Unique identifier of the salon where the appointment is booked',
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174001',
    required: true,
  })
  @IsUUID(4, { message: 'Salon ID must be a valid UUID v4' })
  @IsNotEmpty({ message: 'Salon ID is required' })
  salonId!: string;

  @ApiProperty({
    type: [CreateAppointmentServiceDto],
    description: 'Array of services to be included in the appointment',
    minItems: 1,
    example: [
      {
        serviceId: '123e4567-e89b-12d3-a456-426614174000',
        staffId: '123e4567-e89b-12d3-a456-426614174001',
      },
    ],
  })
  @IsArray({ message: 'Services must be provided as an array' })
  @ArrayMinSize(1, { message: 'At least one service must be provided' })
  @ValidateNested({ each: true, message: 'Each service must be valid' })
  @Type(() => CreateAppointmentServiceDto)
  services!: CreateAppointmentServiceDto[];

  @ApiProperty({
    description: 'ISO 8601 formatted date and time when the appointment is scheduled to start',
    example: '2023-12-01T10:00:00Z',
    required: true,
  })
  @IsValidAppointmentTime({ message: 'Appointment start time must be in the future' })
  @IsDateString({}, { message: 'Start time must be a valid ISO 8601 date string' })
  @IsNotEmpty({ message: 'Start time is required' })
  startTime!: string;

  @ApiProperty({
    description: 'ISO 8601 formatted date and time when the appointment is scheduled to end',
    example: '2023-12-01T11:00:00Z',
    required: true,
  })
  @IsDateString({}, { message: 'End time must be a valid ISO 8601 date string' })
  @IsNotEmpty({ message: 'End time is required' })
  endTime!: string;

  @ApiPropertyOptional({
    description: 'Initial status of the appointment',
    enum: AppointmentStatus,
    enumName: 'AppointmentStatus',
    default: AppointmentStatus.PENDING,
    example: AppointmentStatus.PENDING,
    required: false,
  })
  @IsEnum(AppointmentStatus, {
    message: `Status must be one of: ${Object.values(AppointmentStatus).join(', ')}`,
  })
  @IsOptional()
  status: AppointmentStatus = AppointmentStatus.PENDING;

  @ApiPropertyOptional({
    description: 'Additional notes or special requests for the appointment',
    example: 'Customer prefers a specific stylist if available',
    maxLength: 1000,
    required: false,
  })
  @IsString({ message: 'Notes must be a string' })
  @MaxLength(1000, { message: 'Notes cannot be longer than 1000 characters' })
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Optional tenant identifier for multi-tenant systems',
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174002',
    required: false,
  })
  @IsUUID(4, { message: 'Tenant ID must be a valid UUID v4' })
  @IsOptional()
  tenantId?: string;
}
