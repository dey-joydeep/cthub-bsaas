import { Transform, Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
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
  @Matches(/\S/)
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
  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  roleIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  roles?: string[];
}

export class BusinessRoleInputDto {
  @IsString()
  @Matches(/\S/)
  @Length(2, 60)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  permissions!: string[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class BusinessRoleQueryDto {
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  includeInactive?: boolean;
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
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @IsISO8601()
  @Matches(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/)
  startsAt!: string;

  @IsISO8601()
  @Matches(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/)
  endsAt!: string;

  @IsString()
  @MaxLength(160)
  reason!: string;
}

export class StaffLeaveBlockQueryDto {
  @IsOptional()
  @IsISO8601()
  from?: string;

  @IsOptional()
  @IsISO8601()
  to?: string;
}

export class StaffListQueryDto {
  @IsOptional()
  @IsUUID()
  businessId?: string;

  @IsOptional()
  @IsUUID()
  branchId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  q?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number;
}

export class ServiceCategoryInputDto {
  @IsOptional()
  @IsUUID()
  businessId?: string;

  @IsString()
  @Length(2, 120)
  name!: string;

  @IsInt()
  @Min(0)
  sortOrder!: number;
}

export class ServiceInputDto {
  @IsOptional()
  @IsUUID()
  businessId?: string;

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
  @Matches(/^\d{1,8}(\.\d{1,2})?$/)
  basePrice!: string;

  @IsString()
  @Matches(/^\d{1,3}(\.\d{1,2})?$/)
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
