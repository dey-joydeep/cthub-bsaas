import { ApiProperty } from '@nestjs/swagger';
import { SalonStaffRequestType } from '@prisma/client';
import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateSalonStaffRequestDto {
  @ApiProperty({
    description: 'ID of the staff member making the request',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsNotEmpty()
  staffId!: string;

  @ApiProperty({
    description: 'Type of the request',
    enum: SalonStaffRequestType,
    example: 'leave',
  })
  @IsEnum(SalonStaffRequestType)
  @IsNotEmpty()
  requestType!: SalonStaffRequestType;

  @ApiProperty({
    description: 'Start date of the leave (for leave requests)',
    required: false,
    type: Date,
  })
  @IsDateString()
  @IsOptional()
  leaveFrom?: Date;

  @ApiProperty({
    description: 'End date of the leave (for leave requests)',
    required: false,
    type: Date,
  })
  @IsDateString()
  @IsOptional()
  leaveTo?: Date;

  @ApiProperty({
    description: 'Reason for the request',
    required: false,
    example: 'Medical appointment',
  })
  @IsString()
  @IsOptional()
  reason?: string;
}
