import { ApiProperty } from '@nestjs/swagger';
import { AppointmentStatus } from '@cthub-bsaas/shared';
import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsNumber, Min, ValidateNested } from 'class-validator';
import { AppointmentDto } from './appointment.dto';

/**
 * DTO representing an overview of appointments with statistics
 * @class AppointmentsOverviewDto
 * @description Contains aggregated statistics and metrics about appointments
 */
export class AppointmentsOverviewDto {
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
    description: 'Number of booked appointments',
    example: 75,
    minimum: 0,
    required: true,
  })
  @IsNumber({}, { message: 'Booked appointments must be a number' })
  @IsNotEmpty({ message: 'Booked appointments is required' })
  @Min(0, { message: 'Booked appointments cannot be negative' })
  bookedAppointments!: number;

  @ApiProperty({
    description: 'Number of completed appointments',
    example: 60,
    minimum: 0,
    required: true,
  })
  @IsNumber({}, { message: 'Completed appointments must be a number' })
  @IsNotEmpty({ message: 'Completed appointments is required' })
  @Min(0, { message: 'Completed appointments cannot be negative' })
  completedAppointments!: number;

  @ApiProperty({
    description: 'Number of cancelled appointments',
    example: 15,
    minimum: 0,
    required: true,
  })
  @IsNumber({}, { message: 'Cancelled appointments must be a number' })
  @IsNotEmpty({ message: 'Cancelled appointments is required' })
  @Min(0, { message: 'Cancelled appointments cannot be negative' })
  cancelledAppointments!: number;

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
    description: 'Average duration of appointments in minutes',
    example: 60,
    minimum: 0,
    required: true,
  })
  @IsNumber({}, { message: 'Average duration must be a number' })
  @IsNotEmpty({ message: 'Average duration is required' })
  @Min(0, { message: 'Average duration cannot be negative' })
  averageDuration!: number;

  @ApiProperty({
    type: [AppointmentDto],
    description: 'List of upcoming appointments',
    required: true,
  })
  @IsArray({ message: 'Upcoming appointments must be an array' })
  @ValidateNested({ each: true })
  @Type(() => AppointmentDto)
  @IsNotEmpty({ message: 'Upcoming appointments are required' })
  upcomingAppointments!: AppointmentDto[];

  @ApiProperty({
    type: [AppointmentDto],
    description: 'List of recent appointments',
    required: true,
  })
  @IsArray({ message: 'Recent appointments must be an array' })
  @ValidateNested({ each: true })
  @Type(() => AppointmentDto)
  @IsNotEmpty({ message: 'Recent appointments are required' })
  recentAppointments!: AppointmentDto[];

  @Type(() => Object)
  @ApiProperty({
    type: 'object',
    additionalProperties: {
      type: 'number',
      minimum: 0,
      description: 'Count of appointments for this status',
    },
    description: 'Distribution of appointments by status',
    example: Object.entries(AppointmentStatus).reduce(
      (acc, [_, status]) => ({
        ...acc,
        [status]: 0,
      }),
      {},
    ),
  })
  statusDistribution: Record<AppointmentStatus, number> = Object.values(AppointmentStatus).reduce(
    (acc, status) => ({
      ...acc,
      [status]: 0,
    }),
    {} as Record<AppointmentStatus, number>,
  );

  @Type(() => Object)
  @ApiProperty({
    type: 'object',
    additionalProperties: {
      type: 'number',
      minimum: 0,
      description: 'Number of appointments for the date',
    },
    description: 'Number of appointments per day',
    example: {},
  })
  dailyAppointments: Record<string, number> = {};

  /**
   * Create a new instance with default values
   */
  constructor() {
    this.totalAppointments = 0;
    this.bookedAppointments = 0;
    this.completedAppointments = 0;
    this.cancelledAppointments = 0;
    this.totalRevenue = 0;
    this.averageDuration = 0;
    this.upcomingAppointments = [];
    this.recentAppointments = [];
    // Initialize status distribution with all possible statuses set to 0
    const initialStatusDistribution = {} as Record<AppointmentStatus, number>;
    Object.values(AppointmentStatus).forEach((status) => {
      initialStatusDistribution[status] = 0;
    });
    this.statusDistribution = initialStatusDistribution;
    this.dailyAppointments = {};
  }

  /**
   * Create a new instance from raw data
   * @param data The raw data to create from
   * @returns A new AppointmentsOverviewDto instance
   */
  static fromRawData(data: any): AppointmentsOverviewDto {
    const overview = new AppointmentsOverviewDto();

    if (!data) return overview;

    overview.totalAppointments = data.totalAppointments || 0;
    overview.bookedAppointments = data.bookedAppointments || 0;
    overview.completedAppointments = data.completedAppointments || 0;
    overview.cancelledAppointments = data.cancelledAppointments || 0;
    overview.totalRevenue = data.totalRevenue || 0;
    overview.averageDuration = data.averageDuration || 0;

    if (Array.isArray(data.upcomingAppointments)) {
      overview.upcomingAppointments = data.upcomingAppointments.map((appt: any) =>
        appt instanceof AppointmentDto ? appt : AppointmentDto.fromPrisma(appt),
      );
    }

    if (Array.isArray(data.recentAppointments)) {
      overview.recentAppointments = data.recentAppointments.map((appt: any) =>
        appt instanceof AppointmentDto ? appt : AppointmentDto.fromPrisma(appt),
      );
    }

    if (data.statusDistribution && typeof data.statusDistribution === 'object') {
      // Only copy status values that are valid AppointmentStatus keys
      (Object.keys(data.statusDistribution) as Array<keyof typeof data.statusDistribution>).forEach((key) => {
        if (Object.values(AppointmentStatus).includes(key as AppointmentStatus)) {
          overview.statusDistribution[key as AppointmentStatus] = Number(data.statusDistribution[key]) || 0;
        }
      });
    }

    if (data.dailyAppointments) {
      overview.dailyAppointments = { ...data.dailyAppointments };
    }

    return overview;
  }
}
