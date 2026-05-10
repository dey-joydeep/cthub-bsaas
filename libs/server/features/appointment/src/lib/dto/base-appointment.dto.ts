import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import { AppointmentStatus } from '@cthub-bsaas/shared';
import { IsValidAppointmentStatus, IsValidAppointmentTime } from '@cthub-bsaas/core';

/**
 * Base DTO for appointment entities
 * @class BaseAppointmentDto
 * @description Contains common fields for all appointment DTOs
 */
export class BaseAppointmentDto {
  @ApiProperty({
    description: 'Unique identifier of the appointment',
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  id!: string;

  @ApiProperty({
    description: 'ID of the customer who booked the appointment',
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsUUID()
  customerId!: string;

  @ApiProperty({
    description: 'ID of the salon where the appointment is booked',
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174002',
  })
  @IsUUID()
  salonId!: string;

  @ApiPropertyOptional({
    description: 'ID of the staff member assigned to the appointment',
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174003',
    nullable: true,
  })
  @IsUUID()
  @IsOptional()
  staffId?: string | null;

  @ApiProperty({
    enum: AppointmentStatus,
    description: 'Current status of the appointment',
    example: AppointmentStatus.CONFIRMED,
  })
  @IsValidAppointmentStatus()
  @IsEnum(AppointmentStatus)
  status: AppointmentStatus = AppointmentStatus.PENDING;

  @ApiProperty({
    description: 'Scheduled start time of the appointment',
    type: 'string',
    format: 'date-time',
    example: '2023-12-01T10:30:00Z',
  })
  @IsValidAppointmentTime({ message: 'Appointment start time must be in the future' })
  @IsDate()
  @Type(() => Date)
  startTime!: Date;

  @ApiProperty({
    description: 'Scheduled end time of the appointment',
    type: 'string',
    format: 'date-time',
    example: '2023-12-01T11:30:00Z',
  })
  @IsDate()
  @Type(() => Date)
  endTime!: Date;

  @ApiPropertyOptional({
    description: 'Additional notes about the appointment',
    example: 'Customer requested a specific stylist',
    nullable: true,
  })
  @IsString()
  @IsOptional()
  notes?: string | null;

  @ApiProperty({
    description: 'When the appointment was created',
    type: 'string',
    format: 'date-time',
    example: '2023-11-30T15:30:00Z',
  })
  @IsDate()
  @Type(() => Date)
  createdAt: Date = new Date();

  @ApiProperty({
    description: 'When the appointment was last updated',
    type: 'string',
    format: 'date-time',
    example: '2023-11-30T16:45:00Z',
  })
  @IsDate()
  @Type(() => Date)
  updatedAt: Date = new Date();

  @ApiProperty({
    description: 'Title of the appointment',
    example: 'Haircut and Styling',
  })
  @IsString()
  title!: string;

  @ApiProperty({
    description: 'Description of the appointment',
    example: 'Haircut with shampoo and blow dry',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'ID of the service being provided',
    required: false,
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174004',
  })
  @IsOptional()
  @IsUUID()
  serviceId?: string;

  @ApiProperty({
    description: 'Total price of the appointment',
    minimum: 0,
    required: false,
    example: 50.0,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  totalPrice?: number;

  @ApiProperty({
    description: 'Duration of the appointment in minutes',
    minimum: 1,
    required: false,
    example: 60,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  duration?: number;

  @ApiPropertyOptional({
    description: 'Price of the appointment',
    example: 100.5,
  })
  @IsNumber()
  @IsOptional()
  price?: number;
}
