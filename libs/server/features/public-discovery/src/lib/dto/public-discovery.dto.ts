import { IsInt, IsNumber, IsOptional, IsString, IsUUID, Matches, Max, MaxLength, Min, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

export class PublicHomeQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  area?: string;
}

export class PublicSalonSearchQueryDto extends PublicHomeQueryDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  q?: string;

  @IsOptional()
  @IsUUID()
  serviceId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(5)
  ratingMin?: number;

  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}

export class PublicAvailabilityQueryDto {
  @IsOptional()
  @IsString({ each: true })
  serviceIds?: string | string[];

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date?: string;
}
