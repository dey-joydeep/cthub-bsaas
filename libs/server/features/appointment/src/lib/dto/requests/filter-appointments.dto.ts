import { ApiPropertyOptional } from '@nestjs/swagger';
import { AppointmentStatus } from '@cthub-bsaas/shared';
import { Transform, Type } from 'class-transformer';
import { IsDateString, IsEnum, IsIn, IsNumber, IsOptional, IsString, IsUUID, Max, MaxLength, Min, ValidateIf } from 'class-validator';

// Define allowed sort fields as a constant for reuse and type safety
const ALLOWED_SORT_FIELDS = ['createdAt', 'startTime', 'endTime', 'status'] as const;
type SortField = (typeof ALLOWED_SORT_FIELDS)[number];

// Define sort order type
type SortOrder = 'asc' | 'desc';

/**
 * DTO for filtering and paginating appointments
 * @class FilterAppointmentsDto
 * @description Contains all filter, sort, and pagination options for querying appointments
 */
export class FilterAppointmentsDto {
  @ApiPropertyOptional({
    description: 'Filter appointments that start on or after this date (ISO 8601 format)',
    example: '2023-01-01T00:00:00.000Z',
    required: false,
  })
  @IsDateString({}, { message: 'Start date must be a valid ISO 8601 date string' })
  @IsOptional()
  @ValidateIf((o) => o.endDate !== undefined, {
    message: 'End date must also be provided when using start date filter',
  })
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Filter appointments that end on or before this date (ISO 8601 format)',
    example: '2023-12-31T23:59:59.999Z',
    required: false,
  })
  @IsDateString({}, { message: 'End date must be a valid ISO 8601 date string' })
  @IsOptional()
  @ValidateIf((o) => o.startDate !== undefined, {
    message: 'Start date must also be provided when using end date filter',
  })
  endDate?: string;

  @ApiPropertyOptional({
    enum: AppointmentStatus,
    enumName: 'AppointmentStatus',
    description: 'Filter appointments by status',
    example: AppointmentStatus.CONFIRMED,
    required: false,
  })
  @IsEnum(AppointmentStatus, {
    message: `Status must be one of: ${Object.values(AppointmentStatus).join(', ')}`,
  })
  @IsOptional()
  status?: AppointmentStatus;

  @ApiPropertyOptional({
    description: 'Filter appointments by customer ID',
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsUUID(4, { message: 'Customer ID must be a valid UUID v4' })
  @IsOptional()
  customerId?: string;

  @ApiPropertyOptional({
    description: 'Filter appointments by staff member ID',
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174001',
    required: false,
  })
  @IsUUID(4, { message: 'Staff ID must be a valid UUID v4' })
  @IsOptional()
  staffId?: string;

  @ApiPropertyOptional({
    description: 'Filter appointments by service ID',
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174002',
    required: false,
  })
  @IsUUID(4, { message: 'Service ID must be a valid UUID v4' })
  @IsOptional()
  serviceId?: string;

  @ApiPropertyOptional({
    description: 'Filter appointments by salon ID',
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174003',
    required: false,
  })
  @IsUUID(4, { message: 'Salon ID must be a valid UUID v4' })
  @IsOptional()
  salonId?: string;

  @ApiPropertyOptional({
    description: 'Filter appointments by tenant ID',
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174004',
    required: false,
  })
  @IsUUID(4, { message: 'Tenant ID must be a valid UUID v4' })
  @IsOptional()
  tenantId?: string;

  @ApiPropertyOptional({
    description: 'Search appointments by customer name, email, or notes (case-insensitive)',
    example: 'john',
    required: false,
    maxLength: 100,
  })
  @IsString({ message: 'Search term must be a string' })
  @MaxLength(100, { message: 'Search term cannot be longer than 100 characters' })
  @IsOptional()
  @Transform(({ value }) => value?.trim())
  search?: string;

  @ApiPropertyOptional({
    description: 'Page number for pagination (1-based)',
    default: 1,
    minimum: 1,
    example: 1,
    required: false,
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'Page must be a number' })
  @Min(1, { message: 'Page must be at least 1' })
  @IsOptional()
  page: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    default: 10,
    minimum: 1,
    maximum: 100,
    example: 10,
    required: false,
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'Limit must be a number' })
  @Min(1, { message: 'Limit must be at least 1' })
  @Max(100, { message: 'Limit cannot exceed 100' })
  @IsOptional()
  limit: number = 10;

  @ApiPropertyOptional({
    description: 'Field to sort appointments by',
    enum: ALLOWED_SORT_FIELDS,
    default: 'startTime',
    example: 'startTime',
    required: false,
  })
  @IsString({ message: 'Sort field must be a string' })
  @IsIn(ALLOWED_SORT_FIELDS, {
    message: `Sort field must be one of: ${ALLOWED_SORT_FIELDS.join(', ')}`,
  })
  @IsOptional()
  sortBy: SortField = 'startTime';

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['asc', 'desc'],
    default: 'asc',
    example: 'asc',
    required: false,
  })
  @IsString({ message: 'Sort order must be a string' })
  @IsIn(['asc', 'desc'], {
    message: 'Sort order must be either "asc" or "desc"',
  })
  @IsOptional()
  @Transform(({ value }) => (value || 'asc').toLowerCase() as SortOrder)
  sortOrder: SortOrder = 'asc';

  /**
   * Calculates the number of items to skip for pagination
   * @returns {number} The number of items to skip
   */
  get skip(): number {
    return (this.page - 1) * this.limit;
  }

  /**
   * Creates a filter object for database queries
   * @returns {Record<string, any>} A filter object for database queries
   */
  toFilter(): Record<string, any> {
    const filter: Record<string, any> = {};

    // Add date range filter if provided
    if (this.startDate && this.endDate) {
      filter.startTime = {
        gte: new Date(this.startDate),
        lte: new Date(this.endDate),
      };
    }

    // Add status filter if provided
    if (this.status) {
      filter.status = this.status;
    }

    // Add ID filters if provided
    if (this.customerId) filter.customerId = this.customerId;
    if (this.staffId) filter.staffId = this.staffId;
    if (this.serviceId) filter.serviceId = this.serviceId;
    if (this.salonId) filter.salonId = this.salonId;
    if (this.tenantId) filter.tenantId = this.tenantId;

    // Add search filter if provided
    if (this.search) {
      filter.OR = [
        { customer: { name: { contains: this.search, mode: 'insensitive' } } },
        { customer: { email: { contains: this.search, mode: 'insensitive' } } },
        { notes: { contains: this.search, mode: 'insensitive' } },
      ];
    }

    return filter;
  }

  /**
   * Creates a sort object for database queries
   * @returns {Record<string, 'asc' | 'desc'>} A sort object for database queries
   */
  toSort(): Record<string, 'asc' | 'desc'> {
    return { [this.sortBy]: this.sortOrder };
  }
}
