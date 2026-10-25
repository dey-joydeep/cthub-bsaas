import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { BaseReviewDto } from './base-review.dto';
import { ReviewStatus } from '../enums/review-status.enum';

export class UpdateReviewDto extends PartialType(BaseReviewDto) {
  @ApiProperty({
    description: 'The updated rating (1-5)',
    minimum: 1,
    maximum: 5,
    example: 5,
    required: false,
  })
  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  rating?: number;

  @ApiProperty({
    description: 'The updated comment',
    example: 'Updated review comment',
    required: false,
    nullable: true,
  })
  @IsString()
  @IsOptional()
  comment?: string | null;

  @ApiProperty({
    description: 'The updated response from staff/owner',
    example: 'Thank you for your feedback!',
    required: false,
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
    required: false,
    example: ReviewStatus.APPROVED,
  })
  @IsString()
  @IsOptional()
  status?: ReviewStatus;

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

  // Prevent updating these fields directly
  @IsOptional()
  @IsUUID(undefined, { each: true })
  customerId?: never;

  @IsOptional()
  @IsUUID()
  tenantId?: never;

  @IsOptional()
  @IsUUID()
  salonServiceId?: never;

  @IsOptional()
  @IsUUID()
  appointmentServiceId?: never;
}
