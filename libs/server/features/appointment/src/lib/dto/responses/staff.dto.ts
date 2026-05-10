import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StaffDto {
  @ApiProperty({
    description: 'Staff member ID',
    format: 'uuid',
    example: '223e4567-e89b-12d3-a456-426614174000',
    required: true,
  })
  id!: string;

  @ApiProperty({
    description: 'Staff member full name',
    example: 'Jane Smith',
    required: true,
  })
  name!: string;

  @ApiPropertyOptional({
    description: 'Staff member position',
    example: 'Senior Stylist',
    nullable: true,
    required: false,
  })
  position: string | null = null;
}

export default StaffDto;
