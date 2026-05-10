import { IsEmail, IsNotEmpty } from 'class-validator';

/**
 * @public
 * ForgotPasswordDto carries the email for password reset initiation.
 */
export class ForgotPasswordDto {
  /** Email address of the account to reset */
  @IsEmail()
  @IsNotEmpty()
  email!: string;
}

