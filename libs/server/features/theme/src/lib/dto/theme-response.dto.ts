import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsBoolean, IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';
import { ThemeStylesDto } from './create-theme.dto';

/**
 * Theme Response DTO
 *
 * @remarks
 * This DTO represents the response when retrieving a theme.
 * It includes all theme properties and is used for API responses.
 *
 * @public
 */
export class ThemeResponseDto {
  @ApiProperty({
    description: 'Unique identifier of the theme',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @Expose()
  id: string;

  @ApiProperty({
    description: 'Name of the theme',
    example: 'Corporate Blue',
  })
  @IsString()
  @Expose()
  name: string;

  @ApiPropertyOptional({
    description: 'Description of the theme',
    example: 'A professional blue theme for corporate websites',
  })
  @IsString()
  @IsOptional()
  @Expose()
  description?: string;

  @ApiProperty({
    description: 'Theme styles configuration',
    type: ThemeStylesDto,
  })
  @Type(() => ThemeStylesDto)
  @Expose()
  styles: ThemeStylesDto;

  @ApiProperty({
    description: 'Whether the theme is active',
    example: true,
    default: true,
  })
  @IsBoolean()
  @Expose()
  isActive: boolean = true;

  @ApiProperty({
    description: 'Whether this is the default theme',
    example: false,
    default: false,
  })
  @IsBoolean()
  @Expose()
  isDefault: boolean = false;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2023-01-01T00:00:00.000Z',
  })
  @IsDateString()
  @Expose()
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2023-01-02T00:00:00.000Z',
  })
  @IsDateString()
  @Expose()
  updatedAt: Date;
}
