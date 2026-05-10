import { ApiProperty } from '@nestjs/swagger';
import { SalonStaffRequestType, SalonStaffRequestStatus } from '@prisma/client';

export class SalonStaffRequestResponseDto {
  @ApiProperty({
    description: 'Unique identifier of the request',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id!: string;

  @ApiProperty({
    description: 'ID of the staff member who made the request',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  staffId!: string;

  @ApiProperty({
    description: 'Type of the request',
    enum: SalonStaffRequestType,
    example: SalonStaffRequestType.leave,
  })
  requestType!: SalonStaffRequestType;

  @ApiProperty({
    description: 'Start date of the leave (for leave requests)',
    type: Date,
    required: false,
  })
  leaveFrom?: Date;

  @ApiProperty({
    description: 'End date of the leave (for leave requests)',
    type: Date,
    required: false,
  })
  leaveTo?: Date;

  @ApiProperty({
    description: 'Reason for the request',
    required: false,
    example: 'Medical appointment',
  })
  reason?: string;

  @ApiProperty({
    description: 'Current status of the request',
    enum: SalonStaffRequestStatus,
    example: SalonStaffRequestStatus.pending,
  })
  status!: SalonStaffRequestStatus;

  @ApiProperty({
    description: 'Reason for rejection (if request was rejected)',
    required: false,
    example: 'Insufficient notice period',
  })
  rejectionReason?: string;

  @ApiProperty({
    description: 'Date when the request was created',
    type: Date,
    example: '2023-01-01T00:00:00.000Z',
  })
  createdAt!: Date;

  @ApiProperty({
    description: 'Date when the request was last updated',
    type: Date,
    example: '2023-01-01T00:00:00.000Z',
  })
  updatedAt!: Date;
}
