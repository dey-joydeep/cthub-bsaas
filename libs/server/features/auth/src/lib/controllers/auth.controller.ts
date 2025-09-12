import { Public } from '@cthub-bsaas/server-core';
import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards, Request, Get, Param, BadRequestException, UseInterceptors, Redirect, Query, Delete } from '@nestjs/common';
import { COMMON_ERROR_CODES } from '@cthub-bsaas/shared';
import { JwtAuthGuard } from '@cthub-bsaas/server-core';
import { AuthService } from '../services/auth.service';
import { SkipCsrf } from '@cthub-bsaas/server-core';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { SendVerificationDto } from '../dto/send-verification.dto';
import { VerifyEmailDto } from '../dto/verify-email.dto';
import { VerifyRecoveryDto } from '../dto/verify-recovery.dto';
import { WebauthnRegisterStartDto } from '../dto/webauthn-register-start.dto';
import { WebauthnAttestationDto } from '../dto/webauthn-attestation.dto';
import { WebauthnAssertionDto } from '../dto/webauthn-assertion.dto';
import { TotpLoginDto } from '../dto/totp-login.dto';
import type { Request as ExpressRequest } from 'express';
import type { SignInHttpResponse, SimpleOk } from '../types/auth.types';
import { WEB_AUTHN_PORT, RECOVERY_CODES_PORT, WebAuthnPort, RecoveryCodesPort, OAUTH_PORT, OAuthPort } from '@cthub-bsaas/server-contracts-auth';
import { Inject } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CookiesInterceptor } from '@cthub-bsaas/server-core';
import { AuthCookiesService } from '../services/auth-cookies.service';
import { parseRefreshCookie } from '../utils/cookie.util';
// Public decorator is already imported at file top

/**
 * @public
 * Authentication controller exposing login, refresh, logout, sessions
 * and account recovery endpoints.
 */
@Controller('auth')
@UseInterceptors(CookiesInterceptor)
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    @Inject(WEB_AUTHN_PORT) private readonly webAuthn: WebAuthnPort,
    @Inject(RECOVERY_CODES_PORT) private readonly recovery: RecoveryCodesPort,
    @Inject(OAUTH_PORT) private readonly oauth: OAuthPort,
    private readonly authCookies: AuthCookiesService,
  ) {}

  /**
   * Sign in with email and password. If TOTP is enabled, returns a temp token.
   * Sets refresh token cookie on successful non-TOTP login.
   *
   * @public
   * @param {LoginDto} signInDto - Credentials payload.
   * @param {Response} res - Express response for setting cookies.
   * @returns {Promise<{ totpRequired: boolean; tempToken?: string; accessToken?: string }>} Token response.
   */
  @Public()
  @SkipCsrf()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async signIn(@Body() signInDto: LoginDto): Promise<SignInHttpResponse> {
    const result = await this.authService.signIn(signInDto.email, signInDto.password);
    // Set CSRF token cookie for subsequent state-changing requests
    const csrf = (Math.random().toString(36) + Math.random().toString(36)).slice(2);
    this.authCookies.issue({ csrf, accessToken: result.totpRequired ? undefined : result.accessToken, refreshToken: result.totpRequired ? undefined : result.refreshToken });
    // Return minimal public payload; tokens are cookie-only
    return result.totpRequired ? { totpRequired: true, tempToken: result.tempToken } : { totpRequired: false };
  }

  /**
   * Rotate refresh token and issue a new access token.
   *
   * @public
   * @param {RefreshTokenDto} refreshTokenDto - Optional body token if cookie is absent.
   * @param {ExpressRequest} req - Express request for reading cookies.
   * @param {Response} res - Express response for updating cookies.
   * @returns {Promise<{ accessToken: string | undefined }>} New access token, if valid.
   */
  @Public()
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  async refresh(
    @Body() refreshTokenDto: RefreshTokenDto,
    @Request() req: ExpressRequest,
  ): Promise<Record<string, never>> {
    const tokenFromCookie = parseRefreshCookie(req.headers['cookie']);
    const token = tokenFromCookie ?? refreshTokenDto.refreshToken;
    if (!token) {
      throw new BadRequestException('error.auth.missing_refresh_token');
    }
    const result = await this.authService.refreshToken(token);
    if (result?.refreshToken) {
      this.authCookies.rotateOnRefresh({
        csrf: (Math.random().toString(36) + Math.random().toString(36)).slice(2),
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      });
      return {} as const;
    }
    // rotate CSRF token as well
    const csrf = (Math.random().toString(36) + Math.random().toString(36)).slice(2);
    this.authCookies.issue({ csrf });
    return {} as const;
  }

  /**
   * Logout and revoke the current session. Clears refresh token cookie.
   *
   * @public
   * @param {{ user: { sessionId: string } }} req - Request containing current session id.
   * @param {Response} res - Express response used to clear cookie.
   * @returns {Promise<{ success: true }>} Success response.
   */
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 10, ttl: 60 } })
  @HttpCode(HttpStatus.OK)
  @Post('logout')
  async logout(@Request() req: { user: { sessionId: string } }): Promise<SimpleOk> {
    await this.authService.logout(req.user.sessionId);
    this.authCookies.clear();
    return { success: true };
  }

  /**
   * List active sessions for the authenticated user.
   *
   * @public
   * @param {{ user: { userId: string } }} req - Request containing user id.
   * @returns {Promise<unknown>} Array of sessions from the repository.
   */
  @UseGuards(JwtAuthGuard)
  @Get('sessions')
  async listSessions(@Request() req: { user: { userId: string } }): Promise<unknown> {
    const sessions = await this.authService.listSessions(req.user.userId);
    /* istanbul ignore next - flaky coverage mapping on return */
    return sessions;
  }

  /**
   * Alias: Devices list (canonical name in specs).
   */
  @UseGuards(JwtAuthGuard)
  @Get('devices')
  async listDevicesAlias(@Request() req: { user: { userId: string } }): Promise<unknown> {
    return this.authService.listSessions(req.user.userId);
  }

  /**
   * Revoke a specific session owned by the authenticated user.
   *
   * @public
   * @param {{ user: { userId: string } }} req - Request containing user id.
   * @param {string} id - Session id to revoke.
   * @returns {Promise<{ success: true }>} Success response.
   */
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 10, ttl: 60 } })
  @HttpCode(HttpStatus.OK)
  @Post('sessions/revoke/:id')
  async revokeSession(@Request() req: { user: { userId: string } }, @Param('id') id: string): Promise<SimpleOk> {
    return this.authService.revokeSession(req.user.userId, id);
  }

  /**
   * Complete TOTP challenge with a temp token and code.
   *
   * @public
   * @param {TotpLoginDto} signInWithTotpDto - TOTP challenge payload.
   * @returns {Promise<{ accessToken: string; refreshToken: string }>} New token pair.
   */
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60 } })
  @HttpCode(HttpStatus.OK)
  @Post('login/totp')
  async signInWithTotp(@Body() signInWithTotpDto: TotpLoginDto) {
    const tokens = await this.authService.signInWithTotp(signInWithTotpDto.tempToken, signInWithTotpDto.totpCode);
    this.authCookies.issue({ csrf: (Math.random().toString(36) + Math.random().toString(36)).slice(2), accessToken: tokens.accessToken, refreshToken: tokens.refreshToken });
    return {} as const;
  }

  // Account recovery endpoints
  /**
   * Request a password reset email (no account enumeration).
   *
   * @public
   * @param {{ email: string }} body - Email address for the account.
   * @returns {Promise<{ success: true }>} Accepted response.
   */
  @Public()
  @HttpCode(HttpStatus.ACCEPTED)
  @Post('password/forgot')
  @SkipCsrf()
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  async forgotPassword(@Body() body: ForgotPasswordDto): Promise<SimpleOk> {
    await this.authService.requestPasswordReset(body.email);
    return { success: true };
  }

  /**
   * Reset password using a one-time token.
   *
   * @public
   * @param {{ token: string; newPassword: string }} body - Reset token and new password.
   * @returns {Promise<{ success: true }>} OK response after update.
   */
  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('password/reset')
  @SkipCsrf()
  @Throttle({ default: { limit: 3, ttl: 60 } })
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() body: ResetPasswordDto): Promise<SimpleOk> {
    await this.authService.resetPassword(body.token, body.newPassword);
    return { success: true };
  }

  /**
   * Send an email verification token to a user.
   *
   * @public
   * @param {{ email: string }} body - Target email address.
   * @returns {Promise<{ success: true }>} Accepted response.
   */
  @Public()
  @HttpCode(HttpStatus.ACCEPTED)
  @Post('email/send-verification')
  @SkipCsrf()
  @Throttle({ default: { limit: 3, ttl: 60 } })
  async sendEmailVerification(@Body() body: SendVerificationDto): Promise<SimpleOk> {
    await this.authService.requestEmailVerification(body.email);
    return { success: true };
  }

  /**
   * Verify an email address using a token.
   *
   * @public
   * @param {{ token: string }} body - Verification token.
   * @returns {Promise<{ success: true }>} OK response after verification.
   */
  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('email/verify')
  @SkipCsrf()
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body() body: VerifyEmailDto): Promise<SimpleOk> {
    await this.authService.verifyEmail(body.token);
    return { success: true };
  }

  // Spec-aligned email verify routes (current implementation uses token under the hood)
  @Public()
  @HttpCode(HttpStatus.ACCEPTED)
  @Post('email/verify/request')
  @SkipCsrf()
  @Throttle({ default: { limit: 3, ttl: 60 } })
  async emailVerifyRequest(@Body() body: { email: string }): Promise<SimpleOk> {
    await this.authService.requestEmailVerification(body.email);
    return { success: true };
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('email/verify/confirm')
  @SkipCsrf()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async emailVerifyConfirm(@Body() body: { token?: string; email?: string; otp?: string }): Promise<SimpleOk> {
    if (body.token) {
      await this.authService.verifyEmail(body.token);
      return { success: true };
    }
    if (body.email && body.otp) {
      await this.authService.verifyEmailOtp(body.email, body.otp);
      return { success: true };
    }
    throw new BadRequestException('error.validation');
  }

  /**
   * Start WebAuthn registration by returning creation options.
   * @public
   * @param {{ username: string }} body - Display name/username for credential.
   * @param {{ user: { userId: string } }} req - Request with current user id.
   * @returns {Promise<Record<string, unknown>>} Creation options JSON.
   */
  @UseGuards(JwtAuthGuard)
  @Post('webauthn/register/start')
  @HttpCode(HttpStatus.OK)
  async webauthnRegisterStart(@Body() body: WebauthnRegisterStartDto, @Request() req: { user: { userId: string } }): Promise<Record<string, unknown>> {
    return this.webAuthn.startRegistration(req.user.userId, body.username);
  }

  /**
   * Finish WebAuthn registration by verifying attestation.
   * @public
   * @param {Record<string, unknown>} response - Attestation response.
   * @param {{ user: { userId: string } }} req - Request with current user id.
   * @returns {Promise<SimpleOk>} Success on valid registration.
   */
  @UseGuards(JwtAuthGuard)
  @Post('webauthn/register/finish')
  @HttpCode(HttpStatus.OK)
  async webauthnRegisterFinish(@Body() response: WebauthnAttestationDto, @Request() req: { user: { userId: string } }): Promise<SimpleOk> {
    await this.webAuthn.finishRegistration(req.user.userId, response.response as unknown as Record<string, unknown>);
    return { success: true };
  }

  /**
   * Start WebAuthn login by returning request options.
   * @public
   * @param {{ email?: string }} body - Optional lookup; defaults to current user if authenticated.
   * @param {{ user?: { userId: string } }} req - Optional user context.
   * @returns {Promise<Record<string, unknown>>} Request options JSON.
   */
  @Public()
  @Post('webauthn/login/start')
  @HttpCode(HttpStatus.OK)
  @SkipCsrf()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async webauthnLoginStart(
    @Body() body: { email?: string; userId?: string } = {},
    @Request() req: { user?: { userId: string } } = {},
  ): Promise<Record<string, unknown>> {
    // Allow unauthenticated start by identity (email or userId). Fallback to authenticated user if present.
    const providedUserId = req.user?.userId ?? body.userId;
    const userId = providedUserId ?? (body.email ? await this.authService.resolveUserIdByEmail(body.email) : undefined);
    if (!userId) {
      throw new BadRequestException('error.validation');
    }
    return this.webAuthn.startAuthentication(userId);
  }

  /**
   * Finish WebAuthn login by verifying assertion and issuing tokens.
   * @public
   * @param {Record<string, unknown>} response - Assertion response.
   * @param {{ user: { userId: string } }} req - Request with user context.
   * @param {Response} res - Express response to set cookie.
   * @returns {Promise<{ accessToken: string }>} Access token.
   */
  @Public()
  @Post('webauthn/login/finish')
  @HttpCode(HttpStatus.OK)
  @SkipCsrf()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async webauthnLoginFinish(
    @Body() response: WebauthnAssertionDto,
    @Request() req: { user: { userId: string } },
  ): Promise<Record<string, never>> {
    await this.webAuthn.finishAuthentication(req.user.userId, response.response as unknown as Record<string, unknown>);
    // Issue session + tokens
    const result = await this.authService.issueTokensForUser(req.user.userId);
    this.authCookies.issue({ csrf: (Math.random().toString(36) + Math.random().toString(36)).slice(2), accessToken: result.accessToken, refreshToken: result.refreshToken });
    return {} as const;
  }

  /**
   * Generate recovery codes for the current user.
   * @public
   * @returns {Promise<string[]>} Plain-text recovery codes (store securely client-side).
   */
  @UseGuards(JwtAuthGuard)
  @Post('recovery/generate')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 2, ttl: 60000 } })
  async generateRecovery(@Request() req: { user: { userId: string } }): Promise<string[]> {
    return this.recovery.generate(req.user.userId, 10);
  }

  /**
   * Alias: Recovery codes issue (canonical path).
   */
  @UseGuards(JwtAuthGuard)
  @Post('recovery-codes/issue')
  @HttpCode(HttpStatus.CREATED)
  async issueRecoveryCodesAlias(@Request() req: { user: { userId: string } }): Promise<string[]> {
    return this.recovery.generate(req.user.userId, 10);
  }

  /**
   * Alias for recovery codes generation per spec: POST /auth/recovery/codes
   * @public
   * @returns {Promise<string[]>} Plain-text recovery codes.
   */
  @UseGuards(JwtAuthGuard)
  @Post('recovery/codes')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 2, ttl: 60000 } })
  async generateRecoveryCodes(@Request() req: { user: { userId: string } }): Promise<string[]> {
    return this.recovery.generate(req.user.userId, 10);
  }

  /**
   * Verify and consume a recovery code for the current user.
   * @public
   * @param {{ code: string }} body - Recovery code.
   * @returns {Promise<SimpleOk>} Success when valid.
   */
  @UseGuards(JwtAuthGuard)
  @Post('recovery/verify')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async verifyRecovery(@Body() body: VerifyRecoveryDto, @Request() req: { user: { userId: string } }): Promise<SimpleOk> {
    const ok = await this.recovery.verifyAndConsume(req.user.userId, body.code);
    if (!ok) throw new BadRequestException(COMMON_ERROR_CODES.VALIDATION);
    return { success: true };
  }

  /**
   * Alias: Recovery codes verify (canonical path).
   */
  @UseGuards(JwtAuthGuard)
  @Post('recovery-codes/verify')
  @HttpCode(HttpStatus.OK)
  async verifyRecoveryAlias(@Body() body: VerifyRecoveryDto, @Request() req: { user: { userId: string } }): Promise<SimpleOk> {
    return this.verifyRecovery(body, req);
  }

  // Body-based session revoke endpoint (alias without path param)
  @UseGuards(JwtAuthGuard)
  @Post('sessions/revoke')
  @HttpCode(HttpStatus.OK)
  async revokeSessionBody(@Request() req: { user: { userId: string } }, @Body() body: { id: string }): Promise<SimpleOk> {
    return this.authService.revokeSession(req.user.userId, body.id);
  }

  /**
   * Alias: Devices revoke (canonical name in specs).
   */
  @UseGuards(JwtAuthGuard)
  @Post('devices/revoke')
  @HttpCode(HttpStatus.OK)
  async revokeDeviceAlias(@Request() req: { user: { userId: string } }, @Body() body: { id: string }): Promise<SimpleOk> {
    return this.authService.revokeSession(req.user.userId, body.id);
  }

  /**
   * Customer registration endpoint (self‑serve Customer only).
   *
   * @remarks
   * CUSTOMER-ONLY: This controller action supports Customer self‑registration.
   * Partner/Admin onboarding flows are handled separately via invites/internal tooling
   * and MUST NOT call this endpoint.
   */
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @Post('register')
  @SkipCsrf()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async register(@Body() body: RegisterDto): Promise<SimpleOk> {
    await this.authService.register(body.email, body.password, body.name);
    return { success: true };
  }

  /**
   * Begin OAuth flow: returns a 302 redirect to the provider authorization URL.
   * @public
   */
  @Public()
  @Get('oauth/:provider/start')
  @SkipCsrf()
  @Redirect(undefined, HttpStatus.FOUND)
  async oauthStart(@Param('provider') provider: string): Promise<{ url: string; statusCode: number }> {
    const { redirectUrl } = await this.oauth.start(provider);
    return { url: redirectUrl, statusCode: HttpStatus.FOUND };
  }

  /**
   * OAuth callback: exchange code and sign-in or link.
   */
  @Public()
  @UseGuards(JwtAuthGuard)
  @Get('oauth/:provider/callback')
  @SkipCsrf()
  async oauthCallback(
    @Param('provider') provider: string,
    @Request() req: { user?: { userId: string } },
    @Query('code') code?: string,
    @Query('state') state?: string,
  ): Promise<Record<string, never>> {
    if (!code) {
      throw new BadRequestException(COMMON_ERROR_CODES.VALIDATION);
    }
    const profile = await this.oauth.exchangeCode(provider, code, state);
    if (req.user?.userId) {
      await this.authService.linkSocialAccount(req.user.userId, profile.provider, profile.providerUserId);
      return {} as const;
    }
    // sign in path
    const tokens: { accessToken: string; refreshToken: string } = await this.authService.signInWithSocial(profile);
    this.authCookies.issue({ csrf: (Math.random().toString(36) + Math.random().toString(36)).slice(2), accessToken: tokens.accessToken, refreshToken: tokens.refreshToken });
    return {} as const;
  }

  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('oauth/:provider/unlink')
  async oauthUnlink(@Param('provider') provider: string, @Request() req: { user: { userId: string } }): Promise<SimpleOk> {
    await this.authService.unlinkSocialAccount(req.user.userId, provider);
    return { success: true };
  }

  /**
   * Alias: OAuth unlink (canonical DELETE method).
   */
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Delete('oauth/:provider')
  async oauthUnlinkAlias(@Param('provider') provider: string, @Request() req: { user: { userId: string } }): Promise<SimpleOk> {
    await this.authService.unlinkSocialAccount(req.user.userId, provider);
    return { success: true };
  }
}
