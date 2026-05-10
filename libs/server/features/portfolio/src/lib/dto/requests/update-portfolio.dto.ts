import { ApiProperty } from '@nestjs/swagger';
import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import { IsArray, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';
import { BasePortfolioDto } from '../base-portfolio.dto';
import { PortfolioImageDto } from '../portfolio-image.dto';

export class UpdatePortfolioDto extends PartialType(BasePortfolioDto) {
  @ApiProperty({
    description: 'Array of image paths to add to the portfolio',
    example: ['uploads/portfolios/new-image1.jpg', 'uploads/portfolios/new-image2.jpg'],
    type: [String],
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  addImagePaths?: string[];

  @ApiProperty({
    description: 'Array of image IDs to remove from the portfolio',
    example: ['123e4567-e89b-12d3-a456-426614174000'],
    type: [String],
    required: false,
  })
  @IsArray()
  @IsUUID(undefined, { each: true })
  @IsOptional()
  removeImageIds?: string[];

  // Override the images property to make it optional in the request
  @ApiProperty({
    description: 'Array of portfolio images (auto-managed by the service)',
    type: [PortfolioImageDto],
    readOnly: true,
    required: false,
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => PortfolioImageDto)
  images?: PortfolioImageDto[];
}
