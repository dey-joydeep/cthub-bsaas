import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsArray, IsOptional, IsUUID } from 'class-validator';
import { PortfolioImageDto } from './portfolio-image.dto';

export class BasePortfolioDto {
  @ApiProperty({
    description: 'The ID of the portfolio',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  id?: string;

  @ApiProperty({
    description: 'The ID of the user who owns the portfolio',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  userId: string = '';

  @ApiProperty({
    description: 'The ID of the tenant',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  tenantId?: string;

  @ApiProperty({
    description: 'The ID of the salon',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  salonId?: string;

  @ApiProperty({
    description: 'The description of the portfolio',
    example: 'A collection of my best work',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Array of portfolio images',
    type: [PortfolioImageDto],
  })
  @IsArray()
  images: PortfolioImageDto[] = [];
}
