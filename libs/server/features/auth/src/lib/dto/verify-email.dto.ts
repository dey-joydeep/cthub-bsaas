import { IsNotEmpty, IsString } from 'class-validator';

/**
 * @public
 * VerifyEmailDto carries the token used to confirm email verification.
 */
export class VerifyEmailDto {
  /** Email verification token */
  @IsString()
  @IsNotEmpty()
  token!: string;
}

