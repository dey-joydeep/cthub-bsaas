/**
 * @public
 * Injection token for {@link ICredentialPasskeyRepository}.
 */
export const CREDENTIAL_PASSKEY_REPOSITORY = 'CREDENTIAL_PASSKEY_REPOSITORY';

/**
 * @public
 * Lightweight DTO for exposing passkey metadata.
 */
export interface PasskeyRecord {
  /** Credential ID (base64url). */
  credentialId: string;
  /** When the credential was created (ISO). */
  createdAt?: string;
  /** When the credential was last used (ISO). */
  lastUsedAt?: string;
  /** Supported transports if known. */
  transports?: string[];
}

/**
 * @public
 * Repository contract for querying WebAuthn/passkey credentials for a user.
 */
export interface ICredentialPasskeyRepository {
  /** Returns true when the user has at least one registered passkey. */
  hasAny(userId: string): Promise<boolean>;
  /** Returns number of passkeys for the user. */
  countByUser(userId: string): Promise<number>;
  /** Lists passkeys for a user. */
  listByUser(userId: string): Promise<PasskeyRecord[]>;
  /** Deletes a passkey owned by the user. Returns true when deleted. */
  deleteForUser(userId: string, credentialId: string): Promise<boolean>;
}

