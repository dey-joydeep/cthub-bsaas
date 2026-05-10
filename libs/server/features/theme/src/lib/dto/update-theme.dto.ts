import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import { IsString, IsOptional, IsBoolean, MinLength, MaxLength, ValidateNested } from 'class-validator';
import { CreateThemeDto, ThemeStylesDto } from './create-theme.dto';

/**
 * Update Theme DTO
 *
 * @remarks
 * This DTO is used for updating an existing theme in the system.
 * All fields are optional, and only provided fields will be updated.
 *
 * @public
 */
export class UpdateThemeDto extends PartialType(CreateThemeDto) {
  @ApiPropertyOptional({
    description: 'Name of the theme',
    minLength: 3,
    maxLength: 50,
    example: 'Corporate Blue',
  })
  @IsString()
  @MinLength(3, { message: 'Name must be at least 3 characters long' })
  @MaxLength(50, { message: 'Name must not exceed 50 characters' })
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    description: 'Description of the theme',
    maxLength: 255,
    example: 'A professional blue theme for corporate websites',
  })
  @IsString()
  @MaxLength(255, { message: 'Description must not exceed 255 characters' })
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Theme styles configuration',
    type: ThemeStylesDto,
  })
  @ValidateNested()
  @Type(() => ThemeStylesDto)
  @IsOptional()
  styles?: ThemeStylesDto;

  @ApiPropertyOptional({
    description: 'Whether the theme is active',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Whether this is the default theme',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}
