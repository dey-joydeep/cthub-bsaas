import { IsObject } from 'class-validator';

/**
 * @public
 * WebauthnAssertionDto represents the assertion (login) response payload.
 * Shape is provider-specific; validated minimally as an object.
 */
export class WebauthnAssertionDto {
  /** Raw assertion response (provider-specific) */
  @IsObject()
  response!: Record<string, unknown>;
}
