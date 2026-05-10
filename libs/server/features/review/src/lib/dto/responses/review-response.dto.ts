import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class ReviewCustomerDto {
  @ApiProperty({
    description: 'The unique identifier of the customer',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  id!: string;

  @ApiProperty({
    description: 'The name of the customer',
    example: 'John Doe',
    nullable: true,
  })
  name!: string | null;

  @ApiPropertyOptional({
    description: "URL to the customer's avatar",
    example: 'https://example.com/avatar.jpg',
    nullable: true,
  })
  avatarUrl?: string | null;
}

class ReviewTenantServiceDto {
  @ApiProperty({
    description: 'The unique identifier of the tenant service relationship',
    example: '123e4567-e89b-12d3-a456-426614174006',
  })
  id!: string;

  @ApiProperty({
    description: 'Whether the service is active for this tenant',
    example: true,
  })
  isActive!: boolean;
}

export class ReviewResponseDto {
  @ApiProperty({
    description: 'The unique identifier of the review',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id!: string;

  @ApiProperty({
    description: 'The rating given (1-5)',
    example: 5,
    minimum: 1,
    maximum: 5,
  })
  rating!: number;

  @ApiPropertyOptional({
    description: 'Optional comment for the review',
    example: 'Great service!',
    nullable: true,
  })
  comment?: string | null;

  @ApiPropertyOptional({
    description: 'Optional response to the review',
    example: 'Thank you for your feedback!',
    nullable: true,
  })
  response?: string | null;

  @ApiProperty({
    description: 'The date and time when the review was created',
    example: '2023-01-01T00:00:00.000Z',
  })
  createdAt!: string;

  @ApiProperty({
    description: 'The date and time when the review was last updated',
    example: '2023-01-01T00:00:00.000Z',
  })
  updatedAt!: string;

  @ApiProperty({
    description: 'Customer information',
    type: ReviewCustomerDto,
  })
  customer!: ReviewCustomerDto;

  @ApiPropertyOptional({
    description: 'Tenant service information',
    type: ReviewTenantServiceDto,
  })
  tenantService?: ReviewTenantServiceDto;
}
