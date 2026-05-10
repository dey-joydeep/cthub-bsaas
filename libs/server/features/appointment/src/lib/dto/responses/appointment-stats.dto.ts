import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AppointmentStatus } from '@shared/enums/appointment-status.enum';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNotEmptyObject,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

/**
 * DTO for status count statistics
 * @class StatusCountDto
 * @description Represents the count and percentage of appointments for a specific status
 */

class StatusCountDto {
  @ApiProperty({
    description: 'Appointment status',
    enum: AppointmentStatus,
    enumName: 'AppointmentStatus',
    example: AppointmentStatus.CONFIRMED,
    required: true,
  })
  @IsEnum(AppointmentStatus, {
    message: `Status must be one of: ${Object.values(AppointmentStatus).join(', ')}`,
  })
  @IsNotEmpty({ message: 'Status is required' })
  status!: AppointmentStatus;

  @ApiProperty({
    description: 'Number of appointments with this status',
    example: 10,
    minimum: 0,
    required: true,
  })
  @IsNumber({}, { message: 'Count must be a number' })
  @IsNotEmpty({ message: 'Count is required' })
  @Min(0, { message: 'Count cannot be negative' })
  count!: number;

  @ApiProperty({
    description: 'Percentage of total appointments',
    example: 25.5,
    minimum: 0,
    maximum: 100,
    required: true,
  })
  @IsNumber({}, { message: 'Percentage must be a number' })
  @IsNotEmpty({ message: 'Percentage is required' })
  @Min(0, { message: 'Percentage cannot be negative' })
  @Max(100, { message: 'Percentage cannot exceed 100' })
  percentage!: number;
}

/**
 * DTO for time slot statistics
 * @class TimeSlotDto
 * @description Represents the count of appointments for a specific time slot
 */
class TimeSlotDto {
  @ApiProperty({
    description: 'Time slot identifier (e.g., hour of day, day of week)',
    example: '10:00 AM',
    maxLength: 50,
    required: true,
  })
  @IsString({ message: 'Slot must be a string' })
  @IsNotEmpty({ message: 'Slot is required' })
  @MaxLength(50, { message: 'Slot cannot be longer than 50 characters' })
  slot!: string;

  @ApiProperty({
    description: 'Number of appointments in this time slot',
    example: 5,
    minimum: 0,
    required: true,
  })
  @IsNumber({}, { message: 'Count must be a number' })
  @IsNotEmpty({ message: 'Count is required' })
  @Min(0, { message: 'Count cannot be negative' })
  count!: number;
}

/**
 * DTO for revenue metrics
 * @class RevenueMetricsDto
 * @description Contains revenue-related statistics and metrics
 */
class RevenueMetricsDto {
  @ApiProperty({
    description: 'Total revenue from all appointments',
    example: 12500.75,
    minimum: 0,
    required: true,
  })
  @IsNumber({}, { message: 'Total revenue must be a number' })
  @IsNotEmpty({ message: 'Total revenue is required' })
  @Min(0, { message: 'Total revenue cannot be negative' })
  totalRevenue!: number;

  @ApiProperty({
    description: 'Average revenue per appointment',
    example: 85.25,
    minimum: 0,
    required: true,
  })
  @IsNumber({}, { message: 'Average revenue must be a number' })
  @IsNotEmpty({ message: 'Average revenue is required' })
  @Min(0, { message: 'Average revenue cannot be negative' })
  averageRevenue!: number;

  @ApiPropertyOptional({
    description: 'Percentage change from previous period',
    example: 12.5,
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Growth rate must be a number' })
  growthRate?: number;

  @ApiProperty({
    description: 'Revenue by payment method',
    type: 'object',
    additionalProperties: { type: 'number' },
    example: { CREDIT_CARD: 7500.5, CASH: 5000.25 },
    required: true,
  })
  @IsObject({ message: 'Revenue by payment method must be an object' })
  @IsNotEmptyObject({}, { message: 'Revenue by payment method cannot be empty' })
  byPaymentMethod!: Record<string, number>;
}

/**
 * DTO for service metrics
 * @class ServiceMetricsDto
 * @description Contains statistics for a specific service
 */
class ServiceMetricsDto {
  @ApiProperty({
    description: 'Service ID',
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: true,
  })
  @IsUUID(4, { message: 'Service ID must be a valid UUID v4' })
  @IsNotEmpty({ message: 'Service ID is required' })
  serviceId!: string;

  @ApiProperty({
    description: 'Service name',
    example: 'Haircut and Styling',
    maxLength: 200,
    required: true,
  })
  @IsString({ message: 'Service name must be a string' })
  @IsNotEmpty({ message: 'Service name is required' })
  @MaxLength(200, { message: 'Service name cannot be longer than 200 characters' })
  serviceName!: string;

  @ApiProperty({
    description: 'Number of appointments for this service',
    example: 25,
    minimum: 0,
    required: true,
  })
  @IsNumber({}, { message: 'Appointment count must be a number' })
  @IsNotEmpty({ message: 'Appointment count is required' })
  @Min(0, { message: 'Appointment count cannot be negative' })
  appointmentCount!: number;

  @ApiProperty({
    description: 'Total revenue from this service',
    example: 1875.5,
    required: true,
  })
  totalRevenue!: number;

  @ApiProperty({
    description: 'Percentage of total appointments',
    example: 35.7,
    required: true,
  })
  percentage!: number;
}

/**
 * DTO for appointment statistics and metrics
 * @class AppointmentStatsDto
 * @description Contains comprehensive appointment statistics and metrics
 */
export class AppointmentStatsDto {
  @ApiProperty({
    description: 'Total number of appointments',
    example: 150,
    minimum: 0,
    required: true,
  })
  @IsNumber({}, { message: 'Total appointments must be a number' })
  @IsNotEmpty({ message: 'Total appointments is required' })
  @Min(0, { message: 'Total appointments cannot be negative' })
  totalAppointments!: number;

  @ApiProperty({
    description: 'Appointment counts by status',
    type: [StatusCountDto],
    required: true,
  })
  @IsArray({ message: 'Status distribution must be an array' })
  @ValidateNested({ each: true })
  @Type(() => StatusCountDto)
  @IsNotEmpty({ message: 'Status distribution is required' })
  statusDistribution!: StatusCountDto[];

  @ApiProperty({
    description: 'Appointment distribution by time slots',
    type: [TimeSlotDto],
    required: true,
  })
  @IsArray({ message: 'Time distribution must be an array' })
  @ValidateNested({ each: true })
  @Type(() => TimeSlotDto)
  @IsNotEmpty({ message: 'Time distribution is required' })
  timeDistribution!: TimeSlotDto[];

  @ApiProperty({
    description: 'Revenue metrics and statistics',
    required: true,
  })
  @ValidateNested()
  @Type(() => RevenueMetricsDto)
  @IsNotEmptyObject({}, { message: 'Revenue metrics are required' })
  revenue!: RevenueMetricsDto;

  @ApiProperty({
    description: 'Top performing services',
    type: [ServiceMetricsDto],
    required: true,
  })
  @IsArray({ message: 'Top services must be an array' })
  @ValidateNested({ each: true })
  @Type(() => ServiceMetricsDto)
  @IsNotEmpty({ message: 'Top services are required' })
  topServices!: ServiceMetricsDto[];

  @ApiProperty({
    description: 'Date range start for the statistics',
    example: '2023-01-01T00:00:00Z',
    required: true,
  })
  @IsDateString({}, { message: 'Start date must be a valid ISO 8601 date string' })
  @IsNotEmpty({ message: 'Start date is required' })
  startDate!: string;

  @ApiProperty({
    description: 'Date range end for the statistics',
    example: '2023-12-31T23:59:59Z',
    required: true,
  })
  @IsDateString({}, { message: 'End date must be a valid ISO 8601 date string' })
  @IsNotEmpty({ message: 'End date is required' })
  endDate!: string;
}
