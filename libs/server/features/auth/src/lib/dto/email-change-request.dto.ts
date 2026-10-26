import { IsEmail, IsNotEmpty } from 'class-validator';

/**
 * DTO for email change requests.
 * Requires a new valid email address.
 */
export class EmailChangeRequestDto {
  /** New desired email address */
  @IsEmail()
  @IsNotEmpty()
  newEmail!: string;
}
