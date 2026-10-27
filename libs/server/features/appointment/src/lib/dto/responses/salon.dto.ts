import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SalonDto {
  @ApiProperty({
    description: 'Salon ID',
    format: 'uuid',
    example: '423e4567-e89b-12d3-a456-426614174000',
    required: true,
  })
  id!: string;

  @ApiProperty({
    description: 'Salon name',
    example: 'Elegant Cuts',
    required: true,
  })
  name!: string;

  @ApiPropertyOptional({
    description: 'Salon address',
    example: '123 Beauty St, City',
    nullable: true,
    required: false,
  })
  address: string | null = null;
}

export default SalonDto;
