/**
 * @public
 * Injection token for {@link ICredentialPasskeyRepository}.
 */
export const CREDENTIAL_PASSKEY_REPOSITORY = 'CREDENTIAL_PASSKEY_REPOSITORY';

/**
 * @public
 * Repository contract for querying WebAuthn/passkey credentials for a user.
 */
export interface ICredentialPasskeyRepository {
  /** Returns true when the user has at least one registered passkey. */
  hasAny(userId: string): Promise<boolean>;
}

