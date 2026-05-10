import { IsObject } from 'class-validator';

/**
 * @public
 * WebauthnAttestationDto represents the attestation response payload.
 * Shape is provider-specific; validated minimally as an object.
 */
export class WebauthnAttestationDto {
  /** Raw attestation response (provider-specific) */
  @IsObject()
  response!: Record<string, unknown>;
}
