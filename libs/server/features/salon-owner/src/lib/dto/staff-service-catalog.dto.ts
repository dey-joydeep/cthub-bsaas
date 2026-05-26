import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export const staffRoleValues = ['OWNER', 'MANAGER', 'RECEPTIONIST', 'STYLIST', 'CASHIER', 'INVENTORY_MANAGER'] as const;
export const salonOwnerStatusValues = ['ACTIVE', 'INACTIVE'] as const;

export class StaffInputDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID(undefined, { each: true })
  branchIds!: string[];

  @IsString()
  @Length(2, 120)
  displayName!: string;

  @IsString()
  @MaxLength(30)
  phone!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsIn(salonOwnerStatusValues)
  status!: (typeof salonOwnerStatusValues)[number];
}

export class StaffRolesInputDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsIn(staffRoleValues, { each: true })
  roles!: string[];
}

export class StaffSkillsInputDto {
  @IsArray()
  @IsUUID(undefined, { each: true })
  serviceIds!: string[];
}

export class StaffShiftIntervalDto {
  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  start!: string;

  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  end!: string;
}

export class StaffShiftDayDto {
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek!: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StaffShiftIntervalDto)
  intervals!: StaffShiftIntervalDto[];
}

export class StaffShiftInputDto {
  @IsUUID()
  branchId!: string;

  @IsString()
  timezone!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StaffShiftDayDto)
  days!: StaffShiftDayDto[];
}

export class StaffLeaveBlockInputDto {
  @IsUUID()
  branchId!: string;

  @IsISO8601()
  startsAt!: string;

  @IsISO8601()
  endsAt!: string;

  @IsString()
  @MaxLength(160)
  reason!: string;
}

export class ServiceCategoryInputDto {
  @IsString()
  @Length(2, 120)
  name!: string;

  @IsInt()
  @Min(0)
  sortOrder!: number;
}

export class ServiceInputDto {
  @IsUUID()
  categoryId!: string;

  @IsString()
  @Length(2, 120)
  name!: string;

  @IsInt()
  @Min(5)
  @Max(720)
  durationMinutes!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  bufferMinutes?: number;

  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/)
  basePrice!: string;

  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/)
  taxRatePercent!: string;

  @IsIn(salonOwnerStatusValues)
  status!: (typeof salonOwnerStatusValues)[number];
}

export class ServiceStatusInputDto {
  @IsIn(salonOwnerStatusValues)
  status!: (typeof salonOwnerStatusValues)[number];
}

export class StaffEligibilityInputDto {
  @IsArray()
  @IsUUID(undefined, { each: true })
  staffIds!: string[];
}
