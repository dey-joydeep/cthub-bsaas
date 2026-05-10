import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, IsBoolean, IsOptional, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * User login data transfer object
 *
 * @remarks
 * This DTO is used for authenticating users in the system.
 * It includes the user's email, password, and an optional remember me flag.
 *
 * @public
 */
export class LoginUserDto {
  @ApiProperty({
    example: 'user@example.com',
    description: "User's email address",
    pattern: '^[^\s@]+@[^\s@]+\.[^\s@]+$',
    maxLength: 255,
    type: String,
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email!: string;

  @ApiProperty({
    example: 'yourSecurePassword123!',
    description: "User's password",
    minLength: 6,
    type: String,
    format: 'password',
  })
  @IsString({ message: 'Password must be a string' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  @IsNotEmpty({ message: 'Password is required' })
  password!: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether to create a persistent session that lasts longer',
    default: false,
    required: false,
  })
  @IsBoolean({ message: 'Remember me must be a boolean value' })
  @Transform(({ value }) => value === 'true' || value === true || value === 1 || value === '1')
  @IsOptional()
  rememberMe?: boolean = false;

  @ApiPropertyOptional({
    description: 'Optional tenant ID for multi-tenant authentication',
    required: false,
    example: 'tenant-123',
  })
  @IsString()
  @IsOptional()
  tenantId?: string;
}
