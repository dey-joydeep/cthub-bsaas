import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { BasePortfolioDto } from '../base-portfolio.dto';
import { PortfolioImageDto } from '../portfolio-image.dto';

export class CreatePortfolioDto extends BasePortfolioDto {
  @ApiProperty({
    description: 'Array of image paths for the portfolio',
    example: ['uploads/portfolios/image1.jpg', 'uploads/portfolios/image2.jpg'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  imagePaths: string[] = [];

  // Override the images property to make it optional in the request
  @ApiProperty({
    description: 'Array of portfolio images (auto-generated from imagePaths)',
    type: [PortfolioImageDto],
    readOnly: true,
    required: false,
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => PortfolioImageDto)
  override images: PortfolioImageDto[] = [];
}
