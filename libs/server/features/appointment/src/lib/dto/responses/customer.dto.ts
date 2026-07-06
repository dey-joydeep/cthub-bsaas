import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CustomerDto {
  @ApiProperty({
    description: 'Customer ID',
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: true,
  })
  id!: string;

  @ApiProperty({
    description: 'Customer full name',
    example: 'John Doe',
    required: true,
  })
  name!: string;

  @ApiProperty({
    description: 'Customer email address',
    example: 'john.doe@example.com',
    required: true,
  })
  email!: string;

  @ApiPropertyOptional({
    description: 'Customer phone number',
    example: '+1234567890',
    nullable: true,
    required: false,
  })
  phone: string | null = null;
}

export default CustomerDto;
