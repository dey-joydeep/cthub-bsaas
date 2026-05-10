import { IsValidAppointmentStatus, IsValidAppointmentTime } from '@cthub-bsaas/core/validators/appointment.validators';
import { AppointmentStatus } from '@cthub-bsaas/shared';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEmail, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';

/**
 * DTO representing an appointment
 * @class AppointmentDto
 * @description Contains all the details of an appointment
 */

/**
 * DTO representing an appointment
 */
export class AppointmentDto {
  @ApiProperty({
    description: 'Unique identifier for the appointment',
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: true,
  })
  @IsUUID(4, { message: 'ID must be a valid UUID v4' })
  @IsNotEmpty({ message: 'ID is required' })
  id!: string;

  @ApiProperty({
    description: 'Title of the appointment',
    example: 'Haircut and Styling',
    maxLength: 200,
    required: true,
  })
  @IsString({ message: 'Title must be a string' })
  @IsNotEmpty({ message: 'Title is required' })
  @MaxLength(200, { message: 'Title cannot be longer than 200 characters' })
  title!: string;

  @ApiPropertyOptional({
    description: 'Optional description of the appointment',
    example: 'Please arrive 10 minutes early for a consultation',
    maxLength: 1000,
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  @MaxLength(1000, { message: 'Description cannot be longer than 1000 characters' })
  description?: string;

  @ApiProperty({
    description: 'ISO 8601 timestamp when the appointment starts',
    example: '2023-12-25T14:00:00.000Z',
    required: true,
  })
  @IsValidAppointmentTime({ message: 'Appointment start time must be in the future' })
  @IsDateString({}, { message: 'Start time must be a valid ISO 8601 date string' })
  @IsNotEmpty({ message: 'Start time is required' })
  startTime!: string;

  @ApiProperty({
    description: 'ISO 8601 timestamp when the appointment ends',
    example: '2023-12-25T15:00:00.000Z',
    required: true,
  })
  @IsDateString({}, { message: 'End time must be a valid ISO 8601 date string' })
  @IsNotEmpty({ message: 'End time is required' })
  endTime!: string;

  @ApiProperty({
    enum: AppointmentStatus,
    enumName: 'AppointmentStatus',
    example: AppointmentStatus.CONFIRMED,
    description: 'Current status of the appointment',
    required: true,
  })
  @IsValidAppointmentStatus()
  @IsEnum(AppointmentStatus, {
    message: `Status must be one of: ${Object.values(AppointmentStatus).join(', ')}`,
  })
  @IsNotEmpty({ message: 'Status is required' })
  status!: AppointmentStatus;

  @ApiProperty({
    description: 'ID of the customer',
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: true,
  })
  @IsUUID(4, { message: 'Customer ID must be a valid UUID v4' })
  @IsNotEmpty({ message: 'Customer ID is required' })
  customerId!: string;

  @ApiProperty({
    description: 'Name of the customer',
    example: 'John Doe',
    maxLength: 100,
    required: true,
  })
  @IsString({ message: 'Customer name must be a string' })
  @IsNotEmpty({ message: 'Customer name is required' })
  @MaxLength(100, { message: 'Customer name cannot be longer than 100 characters' })
  customerName!: string;

  @ApiProperty({
    description: 'Email of the customer',
    example: 'customer@example.com',
    maxLength: 255,
    required: true,
  })
  @IsEmail({}, { message: 'Customer email must be a valid email address' })
  @IsNotEmpty({ message: 'Customer email is required' })
  @MaxLength(255, { message: 'Customer email cannot be longer than 255 characters' })
  customerEmail!: string;

  @ApiProperty({
    description: 'ID of the staff member assigned to the appointment',
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
    nullable: true,
    required: false,
  })
  @IsOptional()
  @IsUUID(4, { message: 'Staff ID must be a valid UUID v4' })
  staffId!: string | null;

  @ApiProperty({
    description: 'Name of the staff member',
    example: 'Jane Smith',
    maxLength: 100,
    required: true,
  })
  @IsString({ message: 'Staff name must be a string' })
  @IsNotEmpty({ message: 'Staff name is required' })
  @MaxLength(100, { message: 'Staff name cannot be longer than 100 characters' })
  staffName!: string;

  @ApiProperty({
    description: 'ID of the service',
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: true,
  })
  @IsUUID(4, { message: 'Service ID must be a valid UUID v4' })
  @IsNotEmpty({ message: 'Service ID is required' })
  serviceId!: string;

  @ApiProperty({
    description: 'Name of the service',
    example: 'Haircut and Styling',
    maxLength: 200,
    required: true,
  })
  @IsString({ message: 'Service name must be a string' })
  @IsNotEmpty({ message: 'Service name is required' })
  @MaxLength(200, { message: 'Service name cannot be longer than 200 characters' })
  serviceName!: string;

  @ApiProperty({
    description: 'Duration of the appointment in minutes',
    example: 60,
    minimum: 1,
    maximum: 1440, // 24 hours in minutes
    required: true,
  })
  @IsNumber({}, { message: 'Duration must be a number' })
  @IsNotEmpty({ message: 'Duration is required' })
  @Min(1, { message: 'Duration must be at least 1 minute' })
  @Max(1440, { message: 'Duration cannot exceed 24 hours (1440 minutes)' })
  duration!: number;

  @ApiProperty({
    description: 'Price of the appointment',
    example: 50.0,
    minimum: 0,
    required: true,
  })
  @IsNumber({}, { message: 'Price must be a number' })
  @IsNotEmpty({ message: 'Price is required' })
  @Min(0, { message: 'Price cannot be negative' })
  price!: number;

  @ApiProperty({
    description: 'ID of the salon',
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: true,
  })
  @IsUUID(4, { message: 'Salon ID must be a valid UUID v4' })
  @IsNotEmpty({ message: 'Salon ID is required' })
  salonId!: string;

  @ApiProperty({
    description: 'Name of the salon',
    example: 'Beauty & Style Salon',
    maxLength: 200,
    required: true,
  })
  @IsString({ message: 'Salon name must be a string' })
  @IsNotEmpty({ message: 'Salon name is required' })
  @MaxLength(200, { message: 'Salon name cannot be longer than 200 characters' })
  salonName!: string;

  @ApiProperty({
    description: 'ISO 8601 timestamp when the appointment was created',
    example: '2023-12-20T10:00:00.000Z',
    required: true,
  })
  @IsDateString({}, { message: 'Created at must be a valid ISO 8601 date string' })
  @IsNotEmpty({ message: 'Created at timestamp is required' })
  createdAt!: string;

  @ApiProperty({
    description: 'ISO 8601 timestamp when the appointment was last updated',
    example: '2023-12-20T10:00:00.000Z',
    required: true,
  })
  @IsDateString({}, { message: 'Updated at must be a valid ISO 8601 date string' })
  @IsNotEmpty({ message: 'Updated at timestamp is required' })
  updatedAt!: string;

  /**
   * Create a new instance from a Prisma appointment
   * @param appointment The Prisma appointment object
   * @returns A new AppointmentDto instance
   */
  static fromPrisma(appointment: any): AppointmentDto {
    const dto = new AppointmentDto();
    dto.id = appointment.id;
    dto.title = appointment.title;
    dto.description = appointment.description;
    dto.startTime = appointment.startTime.toISOString();
    dto.endTime = appointment.endTime.toISOString();
    dto.status = appointment.status as AppointmentStatus;
    dto.customerId = appointment.customerId;
    dto.customerName = appointment.customer?.name || '';
    dto.customerEmail = appointment.customer?.email || '';
    dto.staffId = appointment.staffId;
    dto.staffName = appointment.staff?.user?.name || '';
    dto.serviceId = appointment.serviceId;
    dto.serviceName = appointment.service?.name || '';
    dto.duration = appointment.duration;
    dto.price = appointment.price;
    dto.salonId = appointment.salonId;
    dto.salonName = appointment.salon?.name || '';
    dto.createdAt = appointment.createdAt.toISOString();
    dto.updatedAt = appointment.updatedAt.toISOString();
    return dto;
  }
}
