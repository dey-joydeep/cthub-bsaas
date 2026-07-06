import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsUUID,
  IsEmail,
  IsOptional,
  IsDateString,
  IsNumber,
  Min,
  Max,
  IsEnum,
  IsNotEmpty,
  ValidateNested,
  IsPhoneNumber,
  IsObject,
  MaxLength,
  IsNotEmptyObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AppointmentStatus } from '@shared/enums/appointment-status.enum';
import { IsValidAppointmentStatus, IsValidAppointmentTime } from '../../../../common/validators/appointment.validators';

/**
 * Customer details DTO for appointment responses
 * @class CustomerDto
 * @description Contains customer information included in appointment details
 */
class CustomerDto {
  @ApiProperty({
    description: 'Customer ID',
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: true,
  })
  @IsUUID(4, { message: 'Customer ID must be a valid UUID v4' })
  @IsNotEmpty({ message: 'Customer ID is required' })
  id!: string;

  @ApiProperty({
    description: 'Customer full name',
    example: 'John Doe',
    maxLength: 100,
    required: true,
  })
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name is required' })
  @MaxLength(100, { message: 'Name cannot be longer than 100 characters' })
  name!: string;

  @ApiProperty({
    description: 'Customer email address',
    example: 'john.doe@example.com',
    required: true,
  })
  @IsEmail({}, { message: 'Email must be a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  @MaxLength(255, { message: 'Email cannot be longer than 255 characters' })
  email!: string;

  @ApiPropertyOptional({
    description: 'Customer phone number in E.164 format',
    example: '+1234567890',
    maxLength: 20,
    nullable: true,
    required: false,
  })
  @IsOptional()
  @IsPhoneNumber(undefined, { message: 'Phone number must be a valid phone number' })
  @MaxLength(20, { message: 'Phone number cannot be longer than 20 characters' })
  phone: string | null = null;
}

/**
 * Staff member details DTO for appointment responses
 * @class StaffDto
 * @description Contains staff member information included in appointment details
 */
class StaffDto {
  @ApiProperty({
    description: 'Staff member ID',
    format: 'uuid',
    example: '223e4567-e89b-12d3-a456-426614174000',
    required: true,
  })
  @IsUUID(4, { message: 'Staff ID must be a valid UUID v4' })
  @IsNotEmpty({ message: 'Staff ID is required' })
  id!: string;

  @ApiProperty({
    description: 'Staff member full name',
    example: 'Jane Smith',
    maxLength: 100,
    required: true,
  })
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name is required' })
  @MaxLength(100, { message: 'Name cannot be longer than 100 characters' })
  name!: string;

  @ApiPropertyOptional({
    description: 'Staff member position or job title',
    example: 'Senior Stylist',
    maxLength: 100,
    nullable: true,
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Position must be a string' })
  @MaxLength(100, { message: 'Position cannot be longer than 100 characters' })
  position: string | null = null;
}

/**
 * Service details DTO for appointment responses
 * @class ServiceDto
 * @description Contains service information included in appointment details
 */
class ServiceDto {
  @ApiProperty({
    description: 'Service ID',
    format: 'uuid',
    example: '323e4567-e89b-12d3-a456-426614174000',
    required: true,
  })
  @IsUUID(4, { message: 'Service ID must be a valid UUID v4' })
  @IsNotEmpty({ message: 'Service ID is required' })
  id!: string;

  @ApiProperty({
    description: 'Name of the service',
    example: 'Haircut and Styling',
    maxLength: 200,
    required: true,
  })
  @IsString({ message: 'Service name must be a string' })
  @IsNotEmpty({ message: 'Service name is required' })
  @MaxLength(200, { message: 'Service name cannot be longer than 200 characters' })
  name!: string;

  @ApiProperty({
    description: 'Duration of the service in minutes',
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
    description: 'Price of the service',
    example: 75.5,
    minimum: 0,
    required: true,
  })
  @IsNumber({}, { message: 'Price must be a number' })
  @Min(0, { message: 'Price cannot be negative' })
  @IsNotEmpty({ message: 'Price is required' })
  price!: number;
}

/**
 * Salon details DTO for appointment responses
 * @class SalonDto
 * @description Contains salon information included in appointment details
 */
class SalonDto {
  @ApiProperty({
    description: 'Salon ID',
    format: 'uuid',
    example: '423e4567-e89b-12d3-a456-426614174000',
    required: true,
  })
  @IsUUID(4, { message: 'Salon ID must be a valid UUID v4' })
  @IsNotEmpty({ message: 'Salon ID is required' })
  id!: string;

  @ApiProperty({
    description: 'Name of the salon',
    example: 'Elegant Cuts',
    maxLength: 200,
    required: true,
  })
  @IsString({ message: 'Salon name must be a string' })
  @IsNotEmpty({ message: 'Salon name is required' })
  @MaxLength(200, { message: 'Salon name cannot be longer than 200 characters' })
  name!: string;

  @ApiPropertyOptional({
    description: 'Physical address of the salon',
    example: '123 Beauty St, City',
    maxLength: 500,
    nullable: true,
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Address must be a string' })
  @MaxLength(500, { message: 'Address cannot be longer than 500 characters' })
  address: string | null = null;
}

/**
 * Detailed appointment response DTO with related entities
 * @class AppointmentDetailsDto
 * @description Contains comprehensive appointment details including related entities like customer, service, etc.
 */
export class AppointmentDetailsDto {
  @ApiProperty({
    description: 'Appointment ID',
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: true,
  })
  @IsUUID(4, { message: 'Appointment ID must be a valid UUID v4' })
  @IsNotEmpty({ message: 'Appointment ID is required' })
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
    description: 'Detailed description of the appointment',
    example: 'Regular haircut with styling and blow dry',
    maxLength: 1000,
    nullable: true,
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  @MaxLength(1000, { message: 'Description cannot be longer than 1000 characters' })
  description: string | null = null;

  @ApiProperty({
    description: 'ISO 8601 timestamp when the appointment starts',
    example: '2023-12-01T10:00:00.000Z',
    required: true,
  })
  @IsValidAppointmentTime({ message: 'Appointment start time must be in the future' })
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
  @IsValidAppointmentStatus()
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

  @ApiPropertyOptional({
    description: 'Additional notes or special requests for the appointment',
    example: 'Customer prefers side part',
    maxLength: 1000,
    nullable: true,
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Notes must be a string' })
  @MaxLength(1000, { message: 'Notes cannot be longer than 1000 characters' })
  notes: string | null = null;

  @ApiProperty({
    description: 'Customer details',
    type: () => CustomerDto,
    required: true,
  })
  @ValidateNested()
  @Type(() => CustomerDto)
  @IsNotEmptyObject({}, { message: 'Customer details are required' })
  customer!: CustomerDto;

  @ApiPropertyOptional({
    description: 'Assigned staff member details',
    type: () => StaffDto,
    nullable: true,
    required: false,
  })
  @ValidateNested()
  @Type(() => StaffDto)
  @IsOptional()
  staff: StaffDto | null = null;

  @ApiProperty({
    description: 'Service details',
    type: () => ServiceDto,
    required: true,
  })
  @ValidateNested()
  @Type(() => ServiceDto)
  @IsNotEmptyObject({}, { message: 'Service details are required' })
  service!: ServiceDto;

  @ApiProperty({
    description: 'Salon details',
    type: () => SalonDto,
    required: true,
  })
  @ValidateNested()
  @Type(() => SalonDto)
  @IsNotEmptyObject({}, { message: 'Salon details are required' })
  salon!: SalonDto;

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
}
