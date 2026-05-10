import { IsNotEmpty, MinLength } from 'class-validator';

/**
 * @public
 * ResetPasswordDto carries the token and new password for resetting credentials.
 */
export class ResetPasswordDto {
  /** Password reset token in the form `<id>.<secret>` */
  @IsNotEmpty()
  token!: string;

  /** New password (minimum 8 chars; additional rules enforced server-side) */
  @IsNotEmpty()
  @MinLength(8)
  newPassword!: string;
}

