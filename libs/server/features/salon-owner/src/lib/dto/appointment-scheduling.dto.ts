import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsIn, IsInt, IsISO8601, IsOptional, IsString, IsUUID, MaxLength, Min, MinLength, ValidateNested } from 'class-validator';

export const appointmentStatusValues = ['BOOKED', 'CONFIRMED', 'ARRIVED', 'IN_SERVICE', 'COMPLETED', 'CANCELLED', 'NO_SHOW'] as const;

export class AppointmentLineInputDto {
  @IsUUID()
  serviceId!: string;

  @IsUUID()
  staffId!: string;

  @IsISO8601()
  startsAt!: string;
}

export class AppointmentInputDto {
  @IsUUID()
  branchId!: string;

  @IsUUID()
  customerId!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => AppointmentLineInputDto)
  lines!: AppointmentLineInputDto[];

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

export class WalkInAppointmentInputDto extends AppointmentInputDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  estimatedWaitMinutes?: number;
}

export class RescheduleAppointmentInputDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => AppointmentLineInputDto)
  lines!: AppointmentLineInputDto[];

  @IsString()
  @MinLength(1)
  @MaxLength(240)
  reason!: string;
}

export class ReasonInputDto {
  @IsString()
  @MinLength(1)
  @MaxLength(240)
  reason!: string;
}

export class AppointmentStatusInputDto {
  @IsIn(appointmentStatusValues)
  status!: (typeof appointmentStatusValues)[number];
}
