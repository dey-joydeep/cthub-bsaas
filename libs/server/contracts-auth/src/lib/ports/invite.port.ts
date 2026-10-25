/**
 * @public
 * Injection token for {@link InvitePort}.
 */
export const INVITE_PORT = Symbol('INVITE_PORT');

/**
 * @public
 * Result of validating an invite/registration token.
 */
export interface InviteValidationResult {
  email: string;
  salonId: string;
  role?: string;
}

/**
 * @public
 * Input for completing a registration using an invite token.
 */
export interface RegistrationCompleteInput {
  token: string;
  password: string;
  totpCode?: string;
}

/**
 * @public
 * Output of completing registration.
 */
export interface RegistrationCompleteResult {
  userId: string;
  requireMfa?: boolean;
}

/**
 * @public
 * Partner registration/invite boundary.
 */
export interface InvitePort {
  validateOwner(token: string): Promise<InviteValidationResult>;
  completeOwner(input: RegistrationCompleteInput): Promise<RegistrationCompleteResult>;
  validateStaff(token: string): Promise<InviteValidationResult>;
  completeStaff(input: RegistrationCompleteInput): Promise<RegistrationCompleteResult>;
}
