import { ArrayMinSize, IsArray, IsBoolean, IsInt, IsISO8601, IsOptional, IsString, IsUUID, Max, MaxLength, Min, MinLength } from 'class-validator';

export class CustomerBookingContextQueryDto {
  @IsOptional()
  @IsUUID()
  businessId?: string;

  @IsOptional()
  @IsUUID()
  branchId?: string;

  @IsOptional()
  @IsUUID()
  serviceId?: string;
}

export class CustomerBookingInputDto {
  @IsUUID()
  businessId!: string;

  @IsUUID()
  branchId!: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsUUID(undefined, { each: true })
  serviceIds!: string[];

  @IsISO8601()
  startAt!: string;

  @IsOptional()
  @IsUUID()
  staffId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

export class CustomerRescheduleInputDto {
  @IsISO8601()
  startAt!: string;

  @IsOptional()
  @IsUUID()
  staffId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  reason?: string;
}

export class CustomerCancelInputDto {
  @IsString()
  @MinLength(1)
  @MaxLength(240)
  reason!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

export class CustomerFavoriteInputDto {
  @IsBoolean()
  favorite!: boolean;
}

export class CustomerReviewInputDto {
  @IsUUID()
  appointmentId!: string;

  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  comment?: string;

  @IsOptional()
  staffRatings?: unknown[];

  @IsOptional()
  mediaIds?: unknown[];
}
