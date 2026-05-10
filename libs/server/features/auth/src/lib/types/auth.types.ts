/**
 * @public
 * A pair of JWT tokens used for authenticated API access.
 */
export type TokenPair = {
  /** Access token used for authorization header. */
  accessToken: string;
  /** Refresh token used to rotate credentials securely. */
  refreshToken: string;
};

/**
 * @public
 * Result of the primary login flow.
 * - If TOTP is enabled, a temporary token is returned to complete MFA.
 * - Otherwise, an access/refresh token pair is issued.
 */
export type AuthSignInResult =
  | {
      /** Indicates that the client must complete the TOTP challenge. */
      totpRequired: true;
      /** Temporary token bound to the TOTP flow. */
      tempToken: string;
    }
  | ({
      /** No TOTP flow is required; tokens are issued immediately. */
      totpRequired: false;
    } & TokenPair);

/**
 * @public
 * HTTP response body for the login endpoint.
 * Note: refreshToken is delivered via secure cookie and omitted here.
 */
export type SignInHttpResponse =
  | {
      /** Indicates that the client must complete the TOTP challenge. */
      totpRequired: true;
      /** Temporary token bound to the TOTP flow. */
      tempToken: string;
    }
  | {
      /** No TOTP flow is required. */
      totpRequired: false;
    };

/**
 * @public
 * Minimal success response used by various endpoints.
 */
export type SimpleOk = {
  /** Indicates a successful outcome. */
  success: true;
};

/**
 * @public
 * JWT user context attached to request after successful authentication.
 */
export type JwtUserContext = {
  /** Internal user id (subject). */
  userId: string;
  /** User email address. */
  email: string;
  /** List of role names for authorization checks. */
  roles: string[];
  /** Active session id bound to this access token. */
  sessionId: string;
};
