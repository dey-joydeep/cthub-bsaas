import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { PortfolioImageDto } from '../portfolio-image.dto';

export class PortfolioResponseDto {
  @ApiProperty({
    description: 'The unique identifier of the portfolio',
    example: '123e4567-e89b-12d3-a456-426614174000',
    readOnly: true,
  })
  id: string = '';

  @ApiProperty({
    description: 'The ID of the user who owns the portfolio',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: true,
  })
  userId: string = '';

  @ApiPropertyOptional({
    description: 'The ID of the tenant associated with the portfolio',
    example: '123e4567-e89b-12d3-a456-426614174000',
    nullable: true,
  })
  tenantId?: string | null;

  @ApiPropertyOptional({
    description: 'The ID of the salon associated with the portfolio',
    example: '123e4567-e89b-12d3-a456-426614174000',
    nullable: true,
  })
  salonId?: string | null;

  @ApiProperty({
    description: 'The description of the portfolio',
    example: 'A collection of my best work',
    required: false,
  })
  description?: string;

  @ApiProperty({
    description: 'Array of portfolio images',
    type: [PortfolioImageDto],
  })
  @Type(() => PortfolioImageDto)
  images: PortfolioImageDto[] = [];

  @ApiProperty({
    description: 'The date when the portfolio was created',
    example: '2023-01-01T00:00:00.000Z',
  })
  createdAt: Date | string = new Date().toISOString();

  @ApiProperty({
    description: 'The date when the portfolio was last updated',
    example: '2023-01-01T00:00:00.000Z',
  })
  updatedAt: Date | string = new Date().toISOString();

  constructor(partial: Partial<PortfolioResponseDto>) {
    Object.assign(this, partial);
  }
}
