import { IsNotEmpty, IsString, Length } from 'class-validator';

/**
 * DTO for completing login with a TOTP challenge.
 */
export class SignInTotpDto {
  /** Temporary token issued after primary credential check */
  @IsString()
  @IsNotEmpty()
  tempToken!: string;

  /** 6-digit TOTP code */
  @IsString()
  @Length(6, 6)
  totpCode!: string;
}
