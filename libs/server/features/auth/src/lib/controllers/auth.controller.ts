import {
  CookiesInterceptor,
  CsrfGuard,
  JwtAuthGuard,
  JwtOptionalAuthGuard,
  Public,
  ResponseEnvelopeInterceptor,
  SkipCsrf,
} from '@cthub-bsaas/server-core';
import { COMMON_MESSAGE_KEYS, AUTH_MESSAGE_KEYS } from '@cthub-bsaas/shared';
import { BadRequestException, Body, Controller, Get, HttpCode, HttpStatus, Post, Request, UseGuards, UseInterceptors } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request as ExpressRequest } from 'express';
import { LoginDto } from '../dto/login.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { AuditService } from '../services/audit.service';
import { AuthCookiesService } from '../services/auth-cookies.service';
import { AuthService } from '../services/auth.service';
import type { AuthUserSummary, JwtUserContext, SignInHttpResponse, SimpleOk } from '../types/auth.types';
import { JwtService } from '@nestjs/jwt';
import { isCustomerFromAccessToken } from '../utils/is-customer.util';
import { parseRefreshCookie } from '../utils/cookie.util';
import { SignInTotpDto } from '../dto/signin-totp.dto';

@Controller('auth')
@UseGuards(CsrfGuard, JwtOptionalAuthGuard)
@UseInterceptors(CookiesInterceptor, ResponseEnvelopeInterceptor)
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly authCookies: AuthCookiesService,
    private readonly audit: AuditService,
    private readonly jwtService: JwtService,
  ) {}

  @SkipCsrf()
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @Post('login')
  signIn(@Body() signInDto: LoginDto): Promise<SignInHttpResponse> {
    return this.authService.signIn(signInDto.email, signInDto.password).then((result) => {
      const csrf = (Math.random().toString(36) + Math.random().toString(36)).slice(2);
      const isCustomer = !result.totpRequired && !!result.accessToken && this.isCustomerFromAccess(result.accessToken);
      this.authCookies.issue(
        {
          csrf,
          accessToken: result.totpRequired ? undefined : result.accessToken,
          refreshToken: result.totpRequired ? undefined : result.refreshToken,
        },
        { isCustomer },
      );
      return result.totpRequired
        ? { totpRequired: true, tempToken: result.tempToken }
        : { totpRequired: false, user: result.user };
    });
  }

  /** Complete TOTP challenge with a temp token and code */
  @SkipCsrf()
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60 } })
  @HttpCode(HttpStatus.OK)
  @Post('login/totp')
  signInWithTotp(@Body() signInWithTotpDto: SignInTotpDto): Promise<{ user?: AuthUserSummary }> {
    return this.authService.signInWithTotp(signInWithTotpDto.tempToken, signInWithTotpDto.totpCode).then((tokens) => {
      const isCustomer = this.isCustomerFromAccess(tokens.accessToken);
      const csrf = (Math.random().toString(36) + Math.random().toString(36)).slice(2);
      this.authCookies.issue(
        {
          csrf,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        },
        { isCustomer },
      );
      return { user: tokens.user };
    });
  }

  /** Get current authenticated user profile and capabilities */
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Get('me')
  me(@Request() req: { user: JwtUserContext }): AuthUserSummary {
    return {
      id: req.user.userId,
      email: req.user.email,
      roles: req.user.roles,
      tenantId: req.user.tenantId,
      managedBranchIds: req.user.managedBranchIds,
      canManageBranches: Boolean(req.user.canManageBranches),
    };
  }

  private isCustomerFromAccess(accessToken?: string): boolean {
    return isCustomerFromAccessToken(this.jwtService, accessToken);
  }

  /** Rotate refresh token and issue a new access token */
  @Public()
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  refresh(@Body() refreshTokenDto: RefreshTokenDto, @Request() req: ExpressRequest): Promise<Record<string, never>> {
    const tokenFromCookie = parseRefreshCookie(req.headers['cookie']);
    const bodyToken = refreshTokenDto.refreshToken?.trim();

    if (tokenFromCookie && bodyToken) {
      this.audit?.log?.('refresh_both_tokens_provided', { hasCookie: true, hasBody: true });
      return Promise.reject(new BadRequestException(COMMON_MESSAGE_KEYS.ERROR.VALIDATION));
    }

    const token = tokenFromCookie ?? (bodyToken ? bodyToken : undefined);
    if (!token) {
      return Promise.reject(new BadRequestException(AUTH_MESSAGE_KEYS.ERROR.MISSING_REFRESH_TOKEN));
    }
    return this.authService.refreshToken(token).then((result) => {
      const isCustomer = this.isCustomerFromAccess(result!.accessToken);
      this.authCookies.rotateOnRefresh(
        {
          csrf: (Math.random().toString(36) + Math.random().toString(36)).slice(2),
          accessToken: result!.accessToken,
          refreshToken: result!.refreshToken,
        },
        { isCustomer },
      );
      return {} as const;
    });
  }

  /** Logout and revoke current session */
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('logout')
  logout(@Request() req: { user: { sessionId: string } }): Promise<SimpleOk> {
    return this.authService.logout(req.user.sessionId).then(() => {
      this.authCookies.clear();
      return { success: true };
    });
  }
}
