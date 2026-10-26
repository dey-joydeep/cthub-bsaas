/**
 * @public
 * A pair of JWT tokens used for authenticated API access.
 */
export type TokenPair = {
  /** Access token used for authorization header. */
  accessToken: string;
  /** Refresh token used to rotate credentials securely. */
  refreshToken: string;
  /** Browser-readable user profile and capabilities. */
  user?: AuthUserSummary;
};

/**
 * @public
 * Authenticated user profile and capabilities summary for browser client consumption.
 */
export type AuthUserSummary = {
  /** Internal user id. */
  id: string;
  /** User email address. */
  email: string;
  /** List of role names for authorization checks. */
  roles: string[];
  /** Optional salon tenant id. */
  tenantId?: string;
  /** List of branch IDs that the staff member is authorized to manage. */
  managedBranchIds?: string[];
  /** Explicit flag indicating whether the user can manage branch settings. */
  canManageBranches: boolean;
};

/**
 * @public
 * Result of the primary login flow.
 * - If TOTP is enabled, a temporary token is returned to complete MFA.
 * - Otherwise, an access/refresh token pair and user summary are issued.
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
      /** Browser-readable user profile and capabilities. */
      user: AuthUserSummary;
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
      /** Authenticated user summary with capabilities for browser consumption. */
      user: AuthUserSummary;
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
  /** Internal user id as expected by shared request-scope guards. */
  id?: string;
  /** Internal user id (subject). */
  userId: string;
  /** User email address. */
  email: string;
  /** List of role names for authorization checks. */
  roles: string[];
  /** Active session id bound to this access token. */
  sessionId: string;
  /** Tenant id used by shared scope guards for tenant-scoped APIs. */
  tenantId?: string;
  /** List of branch IDs that the staff member is authorized to manage. */
  managedBranchIds?: string[];
  /** Explicit flag indicating whether the user can manage branch settings. */
  canManageBranches?: boolean;
};
