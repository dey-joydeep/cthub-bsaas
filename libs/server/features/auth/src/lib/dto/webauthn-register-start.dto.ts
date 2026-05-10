import { IsNotEmpty, IsString } from 'class-validator';

/**
 * @public
 * WebauthnRegisterStartDto carries the display name/username for credential registration.
 */
export class WebauthnRegisterStartDto {
  /** Username/display name to embed in credential metadata */
  @IsString()
  @IsNotEmpty()
  username!: string;
}

