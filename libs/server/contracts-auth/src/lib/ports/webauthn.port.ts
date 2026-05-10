/**
 * @public
 * Injection token for {@link WebAuthnPort}.
 */
export const WEB_AUTHN_PORT = Symbol('WEB_AUTHN_PORT');

/**
 * @public
 * PublicKeyCredentialCreationOptions JSON shape (simplified) for registration.
 */
export type CreationOptionsJSON = Record<string, unknown>;

/**
 * @public
 * PublicKeyCredentialRequestOptions JSON shape (simplified) for authentication.
 */
export type RequestOptionsJSON = Record<string, unknown>;

/**
 * @public
 * WebAuthn abstraction for starting and finishing registration/authentication.
 */
export interface WebAuthnPort {
  /**
   * Begin registration by creating a challenge bound to the user.
   * @param {string} userId - User id.
   * @param {string} username - Display name/username.
   * @returns {Promise<CreationOptionsJSON>} Options for navigator.credentials.create.
   */
  startRegistration(userId: string, username: string): Promise<CreationOptionsJSON>;

  /**
   * Finish registration by verifying attestation response and storing credential metadata.
   * @param {string} userId - User id.
   * @param {Record<string, unknown>} response - Attestation response JSON.
   * @returns {Promise<{ credentialId: string; counter: number }>} Persisted credential info.
   */
  finishRegistration(userId: string, response: Record<string, unknown>): Promise<{ credentialId: string; counter: number }>;

  /**
   * Begin authentication by creating a challenge for an existing user.
   * @param {string} userId - User id.
   * @returns {Promise<RequestOptionsJSON>} Options for navigator.credentials.get.
   */
  startAuthentication(userId: string): Promise<RequestOptionsJSON>;

  /**
   * Finish authentication by verifying assertion response.
   * @param {string} userId - User id.
   * @param {Record<string, unknown>} response - Assertion response JSON.
   * @returns {Promise<{ credentialId: string; counter: number }>} Verified credential info.
   */
  finishAuthentication(userId: string, response: Record<string, unknown>): Promise<{ credentialId: string; counter: number }>;
}

