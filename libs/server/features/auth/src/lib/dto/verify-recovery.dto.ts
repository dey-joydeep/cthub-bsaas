import { IsNotEmpty, Matches } from 'class-validator';

/**
 * @public
 * VerifyRecoveryDto carries a recovery code to be verified and consumed.
 */
export class VerifyRecoveryDto {
  /** Recovery code (format enforced by generator; allow alphanumerics and dashes) */
  @IsNotEmpty()
  @Matches(/^[A-Za-z0-9-]{6,}$/)
  code!: string;
}

