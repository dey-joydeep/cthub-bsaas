import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID } from 'class-validator';

export class PortfolioImageDto {
  @ApiPropertyOptional({
    description: 'The unique identifier of the portfolio image',
    example: '123e4567-e89b-12d3-a456-426614174000',
    readOnly: true,
  })
  @IsUUID()
  @IsOptional()
  id?: string;

  @ApiProperty({
    description: 'The path to the image file',
    example: 'uploads/portfolios/123e4567-e89b-12d3-a456-426614174000/image1.jpg',
    required: true,
  })
  @IsString()
  imagePath: string = '';

  @ApiPropertyOptional({
    description: 'The ID of the portfolio this image belongs to',
    example: '123e4567-e89b-12d3-a456-426614174000',
    readOnly: true,
  })
  @IsUUID()
  @IsOptional()
  portfolioId?: string;

  @ApiPropertyOptional({
    description: 'The date and time when the image was created',
    example: '2023-01-01T00:00:00.000Z',
    readOnly: true,
  })
  @IsString()
  @IsOptional()
  createdAt?: string;
}
