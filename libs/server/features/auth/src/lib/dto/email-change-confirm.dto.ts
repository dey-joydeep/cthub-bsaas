
import { IsNotEmpty, IsString } from 'class-validator';

/**
 * DTO for confirming an email change.
 * Carries the token sent to the new email address.
 */
export class EmailChangeConfirmDto {
  /** Email change confirmation token */
  @IsString()
  @IsNotEmpty()
  token!: string;
}
