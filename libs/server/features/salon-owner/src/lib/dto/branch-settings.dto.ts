import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsInt,
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

export class AddressDto {
  @IsString()
  @MaxLength(160)
  line1!: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  line2?: string;

  @IsString()
  @MaxLength(80)
  city!: string;

  @IsString()
  @MaxLength(80)
  state!: string;

  @IsString()
  @MaxLength(20)
  postalCode!: string;

  @IsString()
  @Length(2, 2)
  country!: string;
}

export class BranchProfileInputDto {
  @IsUUID()
  businessId!: string;

  @IsString()
  @Length(2, 120)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsString()
  timezone!: string;

  @IsString()
  @Length(3, 3)
  currency!: string;

  @ValidateNested()
  @Type(() => AddressDto)
  address!: AddressDto;
}

export class TimeIntervalDto {
  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  start!: string;

  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  end!: string;
}

export class WeeklyHoursDayDto {
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek!: number;

  @IsBoolean()
  open!: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimeIntervalDto)
  intervals!: TimeIntervalDto[];
}

export class WeeklyHoursInputDto {
  @IsString()
  timezone!: string;

  @IsArray()
  @ArrayMinSize(7)
  @ArrayMaxSize(7)
  @ValidateNested({ each: true })
  @Type(() => WeeklyHoursDayDto)
  days!: WeeklyHoursDayDto[];
}

export class BranchHolidayInputDto {
  @IsBoolean()
  closed!: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  reason?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimeIntervalDto)
  intervals?: TimeIntervalDto[];
}

export class BranchPolicyInputDto {
  @IsInt()
  @Min(0)
  bookingLeadMinutes!: number;

  @IsInt()
  @Min(0)
  cancellationCutoffMinutes!: number;

  @IsInt()
  @Min(0)
  noShowGraceMinutes!: number;
}
