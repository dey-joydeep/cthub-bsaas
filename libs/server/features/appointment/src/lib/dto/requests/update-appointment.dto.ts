import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString, IsUUID, MaxLength, ValidateIf } from 'class-validator';
import { AppointmentStatus } from '@cthub-bsaas/shared';
import { Type } from 'class-transformer';

/**
 * DTO for updating an existing appointment
 * @class UpdateAppointmentDto
 * @description Contains all updatable fields for an appointment
 */
export class UpdateAppointmentDto {
  @ApiPropertyOptional({
    description: 'ID of the staff member to assign to the appointment',
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
    nullable: true,
    required: false,
  })
  @IsUUID(4, { message: 'Staff ID must be a valid UUID v4' })
  @IsOptional()
  staffId?: string | null;

  @ApiPropertyOptional({
    enum: AppointmentStatus,
    enumName: 'AppointmentStatus',
    description: 'New status of the appointment',
    example: AppointmentStatus.CONFIRMED,
    required: false,
  })
  @IsEnum(AppointmentStatus, {
    message: `Status must be one of: ${Object.values(AppointmentStatus).join(', ')}`,
  })
  @IsOptional()
  status?: AppointmentStatus;

  @ApiPropertyOptional({
    description: 'New scheduled start time of the appointment in ISO 8601 format',
    example: '2023-12-01T10:30:00Z',
    required: false,
  })
  @IsDateString({}, { message: 'Start time must be a valid ISO 8601 date string' })
  @IsOptional()
  @ValidateIf((o) => o.endTime !== undefined, {
    message: 'End time must also be provided when updating start time',
  })
  startTime?: string;

  @ApiPropertyOptional({
    description: 'New scheduled end time of the appointment in ISO 8601 format',
    example: '2023-12-01T11:30:00Z',
    required: false,
  })
  @IsDateString({}, { message: 'End time must be a valid ISO 8601 date string' })
  @IsOptional()
  @ValidateIf((o) => o.startTime !== undefined, {
    message: 'Start time must also be provided when updating end time',
  })
  endTime?: string;

  @ApiPropertyOptional({
    description: 'Additional notes or updates about the appointment',
    example: 'Customer requested to reschedule',
    maxLength: 1000,
    required: false,
  })
  @IsString({ message: 'Notes must be a string' })
  @MaxLength(1000, { message: 'Notes cannot be longer than 1000 characters' })
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Version number for optimistic concurrency control',
    type: 'integer',
    example: 1,
    required: false,
  })
  @Type(() => Number)
  @IsOptional()
  version?: number;
}
