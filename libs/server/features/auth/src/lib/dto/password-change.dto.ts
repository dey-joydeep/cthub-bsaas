import { IsString, MinLength } from 'class-validator';

/**
 * DTO for password change requests.
 * Requires current password and a new password (min length 8).
 */
export class PasswordChangeDto {
  /** Current account password */
  @IsString()
  @MinLength(1)
  currentPassword!: string;

  /** New desired password (min length 8) */
  @IsString()
  @MinLength(8)
  newPassword!: string;
}
