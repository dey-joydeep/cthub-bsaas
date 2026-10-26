import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { ReviewStatus } from '../enums/review-status.enum';

export class BaseReviewDto {
  @ApiProperty({
    description: 'The ID of the appointment service being reviewed',
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  appointmentServiceId?: string;

  @ApiProperty({
    description: 'The ID of the customer who is leaving the review',
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsUUID()
  @IsNotEmpty()
  customerId!: string;

  @ApiProperty({
    description: 'The ID of the tenant (business) being reviewed',
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174002',
  })
  @IsUUID()
  @IsNotEmpty()
  tenantId!: string;

  @ApiProperty({
    description: 'The ID of the salon service being reviewed',
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174003',
  })
  @IsUUID()
  @IsNotEmpty()
  salonServiceId!: string;

  @ApiProperty({
    description: 'The ID of the staff member who provided the service',
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174004',
    required: false,
    nullable: true,
  })
  @IsUUID()
  @IsOptional()
  staffId?: string | null;

  @ApiProperty({
    description: 'The rating given (1-5)',
    minimum: 1,
    maximum: 5,
    example: 5,
  })
  @IsInt()
  @Min(1)
  @Max(5)
  @IsNotEmpty()
  rating!: number;

  @ApiProperty({
    description: 'Optional comment for the review',
    required: false,
    example: 'Great service!',
    nullable: true,
  })
  @IsString()
  @IsOptional()
  comment?: string | null;

  @ApiProperty({
    description: 'Optional response to the review from staff/owner',
    required: false,
    example: 'Thank you for your feedback!',
    nullable: true,
  })
  @IsString()
  @IsOptional()
  response?: string | null;

  @ApiProperty({
    description: 'Whether the review is approved by admin',
    required: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isApproved?: boolean;

  @ApiProperty({
    description: 'Whether the review is featured',
    required: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean;

  @ApiProperty({
    description: 'Status of the review',
    enum: ReviewStatus,
    default: ReviewStatus.PENDING,
    required: false,
  })
  @IsString()
  @IsOptional()
  status?: ReviewStatus;
}
