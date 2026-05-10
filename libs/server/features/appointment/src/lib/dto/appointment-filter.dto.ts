import { IsOptional, IsEnum, IsNumber, IsDateString, IsUUID, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AppointmentStatus } from '@cthub-bsaas/shared';

/**
 * DTO for filtering appointments
 */
export class AppointmentsFilterDto {
  @ApiPropertyOptional({
    type: String,
    format: 'date-time',
    description: 'Start date for filtering appointments',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    type: String,
    format: 'date-time',
    description: 'End date for filtering appointments',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    enum: AppointmentStatus,
    enumName: 'AppointmentStatus',
    description: 'Filter by appointment status',
  })
  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;

  @ApiPropertyOptional({
    type: String,
    format: 'uuid',
    description: 'Filter by salon ID',
  })
  @IsOptional()
  @IsUUID()
  salonId?: string;

  @ApiPropertyOptional({
    type: String,
    format: 'uuid',
    description: 'Filter by staff member ID',
  })
  @IsOptional()
  @IsUUID()
  staffId?: string;

  @ApiPropertyOptional({
    type: String,
    format: 'uuid',
    description: 'Filter by customer ID',
  })
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @ApiPropertyOptional({
    type: String,
    format: 'uuid',
    description: 'Filter by service ID',
  })
  @IsOptional()
  @IsUUID()
  serviceId?: string;

  @ApiPropertyOptional({
    type: Number,
    minimum: 1,
    maximum: 100,
    default: 10,
    description: 'Maximum number of results to return',
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Transform(({ value }) => parseInt(value, 10), { toClassOnly: true })
  limit: number = 10;

  @ApiPropertyOptional({
    type: Number,
    minimum: 0,
    default: 0,
    description: 'Number of results to skip',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => parseInt(value, 10), { toClassOnly: true })
  offset: number = 0;

  /**
   * Convert filter to Prisma where clause
   */
  toPrismaFilter() {
    const where: any = {};

    if (this.startDate) {
      where.startTime = {
        gte: new Date(this.startDate),
      };
    }

    if (this.endDate) {
      where.endTime = {
        lte: new Date(this.endDate),
      };
    }

    if (this.status) {
      where.status = this.status;
    }

    if (this.salonId) {
      where.salonId = this.salonId;
    }

    if (this.staffId) {
      where.staffId = this.staffId;
    }

    if (this.customerId) {
      where.customerId = this.customerId;
    }

    if (this.serviceId) {
      where.serviceId = this.serviceId;
    }

    return where;
  }
}

/**
 * Type guard to check if a value is a valid AppointmentStatus
 * @param status The value to check
 * @returns boolean indicating if the value is a valid AppointmentStatus
 */
export function isAppointmentStatus(status: string): status is AppointmentStatus {
  return Object.values(AppointmentStatus).includes(status as AppointmentStatus);
}
