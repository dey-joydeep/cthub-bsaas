import { PartialType } from '@nestjs/mapped-types';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AppUserRole } from '@cthub-bsaas/shared';
import { IsArray, IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';
import { BaseUserDto } from './base-user.dto';

/**
 * User update data transfer object
 *
 * @remarks
 * This DTO is used for updating existing users in the system.
 * All fields are optional and only provided fields will be updated.
 *
 * @public
 */
export class UpdateUserDto extends PartialType(BaseUserDto) {
  @ApiPropertyOptional({
    example: 'newpassword123',
    description: 'New password (min 6 characters)',
    minLength: 6,
    type: String,
    required: false,
  })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  @IsOptional()
  password?: string;

  @ApiPropertyOptional({
    description: 'User roles',
    type: [String],
    example: [AppUserRole.CUSTOMER],
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  roles?: string[];

  @ApiPropertyOptional({
    description: 'Whether the user is a SaaS owner',
    default: false,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  saasOwner?: boolean;

  @ApiPropertyOptional({
    description: 'Whether the user is salon staff',
    default: false,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  salonStaff?: boolean;

  @ApiPropertyOptional({
    description: 'Whether the user is a customer',
    default: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  customer?: boolean;

  // Role is handled through the roles array

  @ApiPropertyOptional({
    example: true,
    description: 'Whether the user is active in the system',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({
    example: 'CurrentPass123!',
    description: 'Current password (required when changing password or email)',
    minLength: 8,
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  currentPassword?: string;

  @ApiPropertyOptional({
    example: true,
    description: `Whether the user's email has been verified.\n**Note:** This field is typically managed by the system`,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isVerified?: boolean;
}
