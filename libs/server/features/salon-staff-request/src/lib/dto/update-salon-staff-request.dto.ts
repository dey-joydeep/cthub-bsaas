import { ApiProperty, PartialType } from '@nestjs/swagger';
import { SalonStaffRequestStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { CreateSalonStaffRequestDto } from './create-salon-staff-request.dto';

export class UpdateSalonStaffRequestDto extends PartialType(CreateSalonStaffRequestDto) {
  @ApiProperty({
    description: 'Status of the request',
    enum: SalonStaffRequestStatus,
    example: SalonStaffRequestStatus.approved,
    required: false,
  })
  @IsEnum(SalonStaffRequestStatus)
  @IsOptional()
  status?: SalonStaffRequestStatus;

  @ApiProperty({
    description: 'Reason for rejection (if request is rejected)',
    required: false,
    example: 'Insufficient notice period',
  })
  @IsString()
  @IsOptional()
  rejectionReason?: string;
}
