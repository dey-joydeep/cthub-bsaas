import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsObject, IsBoolean, MinLength, MaxLength, ValidateNested, IsDefined } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Theme styles DTO
 *
 * @remarks
 * This DTO represents the styles configuration for a theme.
 */
export class ThemeStylesDto {
  @ApiProperty({ description: 'Primary color in hex format', example: '#007bff' })
  @IsString()
  primaryColor: string = '#007bff';

  @ApiProperty({ description: 'Secondary color in hex format', example: '#6c757d' })
  @IsString()
  secondaryColor: string = '#6c757d';

  @ApiPropertyOptional({ description: 'Background color in hex format', example: '#ffffff' })
  @IsString()
  @IsOptional()
  backgroundColor?: string;

  @ApiPropertyOptional({ description: 'Text color in hex format', example: '#212529' })
  @IsString()
  @IsOptional()
  textColor?: string;

  @ApiPropertyOptional({ description: 'Font family', example: 'Arial, sans-serif' })
  @IsString()
  @IsOptional()
  fontFamily?: string;
}

/**
 * Create Theme DTO
 *
 * @remarks
 * This DTO is used for creating a new theme in the system.
 *
 * @public
 */
export class CreateThemeDto {
  @ApiProperty({
    description: 'Name of the theme',
    minLength: 3,
    maxLength: 50,
    example: 'Corporate Blue',
  })
  @IsString()
  @MinLength(3, { message: 'Name must be at least 3 characters long' })
  @MaxLength(50, { message: 'Name must not exceed 50 characters' })
  name: string;

  @ApiPropertyOptional({
    description: 'Description of the theme',
    maxLength: 255,
    example: 'A professional blue theme for corporate websites',
  })
  @IsString()
  @MaxLength(255, { message: 'Description must not exceed 255 characters' })
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Theme styles configuration',
    type: ThemeStylesDto,
  })
  @IsDefined()
  @ValidateNested()
  @Type(() => ThemeStylesDto)
  styles: ThemeStylesDto;

  @ApiPropertyOptional({
    description: 'Whether the theme is active',
    default: true,
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive: boolean = true;

  @ApiPropertyOptional({
    description: 'Whether this is the default theme',
    default: false,
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  isDefault: boolean = false;
}
