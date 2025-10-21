import {
  CookiesInterceptor,
  JwtAuthGuard,
  JwtOptionalAuthGuard,
  OptionalUser,
  Public,
  ResponseEnvelopeInterceptor,
  SkipCsrf,
  CsrfGuard,
} from '@cthub-bsaas/server-core';
import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
  Request,
  Get,
  Param,
  BadRequestException,
  UseInterceptors,
  Redirect,
  Query,
  Delete,
  UnauthorizedException,
} from '@nestjs/common';
import { COMMON_ERROR_CODES, type AuthenticatedUser } from '@cthub-bsaas/shared';
import { AuthService } from '../services/auth.service';
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
import { PasswordChangeDto } from '../dto/password-change.dto';
import { EmailChangeRequestDto } from '../dto/email-change-request.dto';
import { EmailChangeConfirmDto } from '../dto/email-change-confirm.dto';
import type { Request as ExpressRequest } from 'express';
import type { SignInHttpResponse, SimpleOk } from '../types/auth.types';
import {
  WEB_AUTHN_PORT,
  RECOVERY_CODES_PORT,
  WebAuthnPort,
  RecoveryCodesPort,
  OAUTH_PORT,
  OAuthPort,
} from '@cthub-bsaas/server-contracts-auth';
import { RegistrationCompleteInput } from '@cthub-bsaas/server-contracts-auth';
import { Inject, Optional } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthCookiesService } from '../services/auth-cookies.service';
import { AuditService } from '../services/audit.service';
import { parseRefreshCookie } from '../utils/cookie.util';
// Public decorator is already imported at file top

/**
 * @public
 * Authentication controller exposing login, refresh, logout, sessions
 * and account recovery endpoints.
 */
@Controller('auth')
@UseGuards(CsrfGuard, JwtOptionalAuthGuard)
@UseInterceptors(CookiesInterceptor, ResponseEnvelopeInterceptor)
export class AuthController {
  private readonly authService: AuthService;
  private readonly webAuthn: WebAuthnPort;
  private readonly recovery: RecoveryCodesPort;
  private readonly oauth: OAuthPort;
  private readonly authCookies: AuthCookiesService;
  private readonly audit: AuditService;

  constructor(
    authService: AuthService,
    @Inject(WEB_AUTHN_PORT) webAuthn: WebAuthnPort,
    @Inject(RECOVERY_CODES_PORT) recovery: RecoveryCodesPort,
    @Inject(OAUTH_PORT) oauth: OAuthPort,
    authCookies: AuthCookiesService,
    @Optional() audit?: AuditService,
  ) {
    this.authService = authService;
    this.webAuthn = webAuthn;
    this.recovery = recovery;
    this.oauth = oauth;
    this.authCookies = authCookies;
    this.audit = audit as AuditService;
  }

  // Partner Registration — Owner
  @Public()
  @Get('owner/registration/:token')
  
  validateOwnerInvite(@Param('token') token: string): Promise<{ valid: true; email: string; salonId: string }> {
    return this.authService.validateOwnerInvite(token).then((res) => ({
      valid: true,
      email: res.email,
      salonId: res.salonId,
    } as const));
  }

  @Public()
  @SkipCsrf()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.CREATED)
  @Post('owner/registration/complete')
  
  completeOwnerRegistration(@Body() body: RegistrationCompleteInput): Promise<Record<string, never> | { next: 'mfa' }> {
    return this.authService.completeOwnerRegistration(body).then((result) => {
      if ('next' in result) {
        return result;
      }

      this.authCookies.issue({
        csrf: (Math.random().toString(36) + Math.random().toString(36)).slice(2),
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      });
      return {} as const;
    });
  }

  // Partner Registration — Staff
  @Public()
  @Get('staff/registration/:token')
  
  validateStaffInvite(@Param('token') token: string): Promise<{ valid: true; email: string; salonId: string }> {
    return this.authService.validateStaffInvite(token).then((res) => ({
      valid: true,
      email: res.email,
      salonId: res.salonId,
    } as const));
  }

  @Public()
  @SkipCsrf()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.CREATED)
  @Post('staff/registration/complete')
  
  completeStaffRegistration(@Body() body: RegistrationCompleteInput): Promise<Record<string, never> | { next: 'mfa' }> {
    return this.authService.completeStaffRegistration(body).then((result) => {
      if ('next' in result) {
        return result;
      }

      this.authCookies.issue({
        csrf: (Math.random().toString(36) + Math.random().toString(36)).slice(2),
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      });
      return {} as const;
    });
  }

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
  signIn(@Body() signInDto: LoginDto): Promise<SignInHttpResponse> {
    return this.authService.signIn(signInDto.email, signInDto.password).then((result) => {
      const csrf = (Math.random().toString(36) + Math.random().toString(36)).slice(2);
      this.authCookies.issue({
        csrf,
        accessToken: result.totpRequired ? undefined : result.accessToken,
        refreshToken: result.totpRequired ? undefined : result.refreshToken,
      });
      return result.totpRequired ? { totpRequired: true, tempToken: result.tempToken } : { totpRequired: false };
    });
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
  refresh(@Body() refreshTokenDto: RefreshTokenDto, @Request() req: ExpressRequest): Promise<Record<string, never>> {
    const tokenFromCookie = parseRefreshCookie(req.headers['cookie']);
    const bodyToken = refreshTokenDto.refreshToken?.trim();
    const token = tokenFromCookie ?? (bodyToken ? bodyToken : undefined);
    if (!token) {
      return Promise.reject(new BadRequestException('error.auth.missing_refresh_token'));
    }
    return this.authService.refreshToken(token).then((result) => {
      this.authCookies.rotateOnRefresh({
        csrf: (Math.random().toString(36) + Math.random().toString(36)).slice(2),
        accessToken: result!.accessToken,
        refreshToken: result!.refreshToken,
      });
      return {} as const;
    });
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
  logout(@Request() req: { user: { sessionId: string } }): Promise<SimpleOk> {
    return this.authService.logout(req.user.sessionId).then(() => {
      this.authCookies.clear();
      return { success: true };
    });
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
  listSessions(@Request() req: { user: { userId: string } }): Promise<unknown> {
    return this.authService.listSessions(req.user.userId);
  }

  /**
   * Alias: Devices list (canonical name in specs).
   */
  @UseGuards(JwtAuthGuard)
  @Get('devices')
  listDevicesAlias(@Request() req: { user: { userId: string } }): Promise<unknown> {
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
  revokeSession(@Request() req: { user: { userId: string } }, @Param('id') id: string): Promise<SimpleOk> {
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
  signInWithTotp(@Body() signInWithTotpDto: TotpLoginDto): Promise<Record<string, never>> {
    return this.authService
      .signInWithTotp(signInWithTotpDto.tempToken, signInWithTotpDto.totpCode)
      .then((tokens) => {
        this.authCookies.issue({
          csrf: (Math.random().toString(36) + Math.random().toString(36)).slice(2),
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        });
        return {} as const;
      });
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
  forgotPassword(@Body() body: ForgotPasswordDto): Promise<SimpleOk> {
    return this.authService.requestPasswordReset(body.email).then(() => ({ success: true }));
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
  resetPassword(@Body() body: ResetPasswordDto): Promise<SimpleOk> {
    return this.authService.resetPassword(body.token, body.newPassword).then(() => ({ success: true }));
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
  sendEmailVerification(@Body() body: SendVerificationDto): Promise<SimpleOk> {
    return this.authService.requestEmailVerification(body.email).then(() => ({ success: true }));
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
  verifyEmail(@Body() body: VerifyEmailDto): Promise<SimpleOk> {
    return this.authService.verifyEmail(body.token).then(() => ({ success: true }));
  }

  /**
   * Change password for the authenticated user.
   *
   * @public
   * @returns {Promise<{ success: true }>} OK response after update.
   */
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('password/change')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  changePassword(@Body() body: PasswordChangeDto, @Request() req: { user: { userId: string } }): Promise<SimpleOk> {
    return this.authService
      .changePassword(req.user.userId, body.currentPassword, body.newPassword)
      .then(() => ({ success: true }));
  }

  /**
   * Request an email change for the authenticated user.
   *
   * @public
   * @returns {Promise<{ success: true }>} Accepted response.
   */
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.ACCEPTED)
  @Post('email/change/request')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  requestEmailChange(@Body() body: EmailChangeRequestDto, @Request() req: { user: { userId: string } }): Promise<SimpleOk> {
    return this.authService.requestEmailChange(req.user.userId, body.newEmail).then(() => ({ success: true }));
  }

  /**
   * Confirm an email change using a one-time token.
   *
   * @public
   * @param {{ token: string }} body - Email change token.
   * @returns {Promise<{ success: true }>} OK response after update.
   */
  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('email/change/confirm')
  @SkipCsrf()
  @Throttle({ default: { limit: 3, ttl: 60 } })
  confirmEmailChange(@Body() body: EmailChangeConfirmDto): Promise<SimpleOk> {
    return this.authService.confirmEmailChange(body.token).then(() => ({ success: true }));
  }

  // Spec-aligned email verify routes (current implementation uses token under the hood)
  @Public()
  @HttpCode(HttpStatus.ACCEPTED)
  @Post('email/verify/request')
  @SkipCsrf()
  @Throttle({ default: { limit: 3, ttl: 60 } })
  emailVerifyRequest(@Body() body: { email: string }): Promise<SimpleOk> {
    return this.authService.requestEmailVerification(body.email).then(() => ({ success: true }));
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('email/verify/confirm')
  @SkipCsrf()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  emailVerifyConfirm(@Body() body: { token?: string; email?: string; otp?: string }): Promise<SimpleOk> {
    if (body.token) {
      return this.authService.verifyEmail(body.token).then(() => ({ success: true }));
    }
    if (body.email && body.otp) {
      return this.authService.verifyEmailOtp(body.email, body.otp).then(() => ({ success: true }));
    }
    return Promise.reject(new BadRequestException('error.validation'));
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
  webauthnRegisterStart(
    @Body() body: WebauthnRegisterStartDto,
    @Request() req: { user: { userId: string } },
  ): Promise<Record<string, unknown>> {
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
  webauthnRegisterFinish(@Body() response: WebauthnAttestationDto, @Request() req: { user: { userId: string } }): Promise<SimpleOk> {
    return this.webAuthn
      .finishRegistration(req.user.userId, response.response as unknown as Record<string, unknown>)
      .then(() => ({ success: true }));
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
  webauthnLoginStart(
    @Body() body: { email?: string; userId?: string },
    @OptionalUser() user?: AuthenticatedUser,
  ): Promise<Record<string, unknown>> {
    const payload = body ?? {};
    const providedUserId = this.extractUserId(user) ?? payload.userId;
    if (providedUserId) {
      return this.webAuthn.startAuthentication(providedUserId);
    }
    if (payload.email) {
      return this.authService
        .resolveUserIdByEmail(payload.email)
        .then((userId) => this.webAuthn.startAuthentication(userId));
    }
    return Promise.reject(new BadRequestException('error.validation'));
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
  webauthnLoginFinish(
    @Body() response: WebauthnAssertionDto,
    @OptionalUser() user?: AuthenticatedUser,
  ): Promise<Record<string, never>> {
    const userId = this.extractUserId(user);
    if (!userId) {
      return Promise.reject(new UnauthorizedException());
    }
    return this.webAuthn
      .finishAuthentication(userId, response.response as unknown as Record<string, unknown>)
      .then(() => this.authService.issueTokensForUser(userId))
      .then((result) => {
        this.authCookies.issue({
          csrf: (Math.random().toString(36) + Math.random().toString(36)).slice(2),
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        });
        return {} as const;
      });
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
  generateRecovery(@Request() req: { user: { userId: string } }): Promise<string[]> {
    return this.recovery.generate(req.user.userId, 10).then((codes) => {
      this.audit?.log('recovery_codes_generated', { userId: req.user.userId, count: codes.length });
      return codes;
    });
  }

  /**
   * Alias: Recovery codes issue (canonical path).
   */
  @UseGuards(JwtAuthGuard)
  @Post('recovery-codes/issue')
  @HttpCode(HttpStatus.CREATED)
  issueRecoveryCodesAlias(@Request() req: { user: { userId: string } }): Promise<string[]> {
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
  generateRecoveryCodes(@Request() req: { user: { userId: string } }): Promise<string[]> {
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
  verifyRecovery(@Body() body: VerifyRecoveryDto, @Request() req: { user: { userId: string } }): Promise<SimpleOk> {
    return this.recovery.verifyAndConsume(req.user.userId, body.code).then((ok) => {
      if (!ok) {
        this.audit?.log('recovery_code_verify_failure', { userId: req.user.userId });
        throw new BadRequestException(COMMON_ERROR_CODES.VALIDATION);
      }
      this.audit?.log('recovery_code_verify_success', { userId: req.user.userId });
      return { success: true };
    });
  }

  /**
   * Alias: Recovery codes verify (canonical path).
   */
  @UseGuards(JwtAuthGuard)
  @Post('recovery-codes/verify')
  @HttpCode(HttpStatus.OK)
  verifyRecoveryAlias(@Body() body: VerifyRecoveryDto, @Request() req: { user: { userId: string } }): Promise<SimpleOk> {
    return this.verifyRecovery(body, req);
  }

  // Body-based session revoke endpoint (alias without path param)
  @UseGuards(JwtAuthGuard)
  @Post('sessions/revoke')
  @HttpCode(HttpStatus.OK)
  revokeSessionBody(@Request() req: { user: { userId: string } }, @Body() body: { id: string }): Promise<SimpleOk> {
    return this.authService.revokeSession(req.user.userId, body.id);
  }

  /**
   * Alias: Devices revoke (canonical name in specs).
   */
  @UseGuards(JwtAuthGuard)
  @Post('devices/revoke')
  @HttpCode(HttpStatus.OK)
  revokeDeviceAlias(@Request() req: { user: { userId: string } }, @Body() body: { id: string }): Promise<SimpleOk> {
    return this.authService.revokeSession(req.user.userId, body.id);
  }

  /**
   * Alias: Idempotent session revoke via DELETE /auth/sessions/:id
   */
  @UseGuards(JwtAuthGuard)
  @Delete('sessions/:id')
  @HttpCode(HttpStatus.OK)
  revokeSessionDelete(@Request() req: { user: { userId: string } }, @Param('id') id: string): Promise<SimpleOk> {
    return this.authService.revokeSession(req.user.userId, id);
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
  register(@Body() body: RegisterDto): Promise<SimpleOk> {
    return this.authService.register(body.email, body.password, body.name).then(() => ({ success: true }));
  }

  /**
   * Begin OAuth flow: returns a 302 redirect to the provider authorization URL.
   * @public
   */
  @Public()
  @Get('oauth/:provider/start')
  @SkipCsrf()
  @Redirect(undefined, HttpStatus.FOUND)
  oauthStart(@Param('provider') provider: string): Promise<{ url: string; statusCode: number }> {
    return this.oauth.start(provider).then(({ redirectUrl }) => ({ url: redirectUrl, statusCode: HttpStatus.FOUND }));
  }

  /**
   * OAuth callback: exchange code and sign-in or link.
   */
  @Public()
  @UseGuards(JwtOptionalAuthGuard)
  @Get('oauth/:provider/callback')
  @SkipCsrf()
  oauthCallback(
    @Param('provider') provider: string,
    @OptionalUser() user?: AuthenticatedUser,
    @Query('code') code?: string,
    @Query('state') state?: string,
  ): Promise<Record<string, never>> {
    if (!code) {
      return Promise.reject(new BadRequestException(COMMON_ERROR_CODES.VALIDATION));
    }
    return this.oauth.exchangeCode(provider, code, state).then((profile) => {
      const linkedUserId = this.extractUserId(user);
      if (linkedUserId) {
        return this.authService
          .linkSocialAccount(linkedUserId, profile.provider, profile.providerUserId)
          .then(() => ({} as const));
      }
      return this.authService.signInWithSocial(profile).then((tokens) => {
        this.authCookies.issue({
          csrf: (Math.random().toString(36) + Math.random().toString(36)).slice(2),
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        });
        return {} as const;
      });
    });
  }

  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('oauth/:provider/unlink')
  oauthUnlink(@Param('provider') provider: string, @Request() req: { user: { userId: string } }): Promise<SimpleOk> {
    return this.authService.unlinkSocialAccount(req.user.userId, provider).then(() => ({ success: true }));
  }

  /**
   * Alias: OAuth unlink (canonical DELETE method).
   */
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Delete('oauth/:provider')
  oauthUnlinkAlias(@Param('provider') provider: string, @Request() req: { user: { userId: string } }): Promise<SimpleOk> {
    return this.authService.unlinkSocialAccount(req.user.userId, provider).then(() => ({ success: true }));
  }

  private extractUserId(user?: AuthenticatedUser): string | undefined {
    if (!user) {
      return undefined;
    }

    const record = user as Record<string, unknown>;
    const candidate = record.userId ?? record.id;
    return typeof candidate === 'string' && candidate.length > 0 ? candidate : undefined;
  }
}
