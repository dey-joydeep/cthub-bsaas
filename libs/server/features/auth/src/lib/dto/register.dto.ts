import { IsEmail, IsOptional, IsString, Length, MaxLength } from 'class-validator';

/**
 * @public
 * Registration payload for creating a new user account.
 */
export class RegisterDto {
  /**
   * Email address for the new account.
   */
  @IsEmail()
  @MaxLength(255)
  email!: string;

  /**
   * Strong password for the account (min 8 chars).
   */
  @IsString()
  @Length(8, 128)
  password!: string;

  /**
   * Optional display name.
   */
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;
}
