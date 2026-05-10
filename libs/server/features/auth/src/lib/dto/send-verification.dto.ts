import { IsEmail, IsNotEmpty } from 'class-validator';

/**
 * @public
 * SendVerificationDto carries the email used to request a verification code.
 */
export class SendVerificationDto {
  /** Email address to verify */
  @IsEmail()
  @IsNotEmpty()
  email!: string;
}

