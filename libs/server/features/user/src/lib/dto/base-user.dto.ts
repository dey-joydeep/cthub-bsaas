import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, MinLength, IsEnum, IsNotEmpty } from 'class-validator';
import { AppUserRole } from '@cthub-bsaas/shared';

export class BaseUserDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'User email',
    required: true,
    pattern: '^[^\s@]+@[^\s@]+\.[^\s@]+$',
    maxLength: 255,
    type: String,
  })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiPropertyOptional({
    example: 'John Doe',
    description: 'User full name',
    required: false,
    maxLength: 100,
    type: String,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    example: '+1234567890',
    description: 'User phone number',
    required: false,
    maxLength: 20,
    type: String,
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({
    enum: AppUserRole,
    description: 'User role',
    required: true,
    example: AppUserRole.CUSTOMER,
  })
  @IsEnum(AppUserRole)
  @IsNotEmpty()
  role!: AppUserRole;

  @ApiPropertyOptional({
    description: 'Tenant ID (for multi-tenant applications)',
    required: false,
    type: String,
  })
  @IsString()
  @IsOptional()
  tenantId?: string | null;
}
