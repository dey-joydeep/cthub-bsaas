import { CookiesInterceptor, CsrfGuard, JwtAuthGuard, JwtOptionalAuthGuard, ResponseEnvelopeInterceptor, SkipCsrf } from '@cthub-bsaas/server-core';
import { COMMON_MESSAGE_KEYS, AUTH_MESSAGE_KEYS } from '@cthub-bsaas/shared';
import { BadRequestException, Body, Controller, HttpCode, HttpStatus, Post, Request, UseGuards, UseInterceptors } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request as ExpressRequest } from 'express';
import { LoginDto } from '../dto/login.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { AuditService } from '../services/audit.service';
import { AuthCookiesService } from '../services/auth-cookies.service';
import { AuthService } from '../services/auth.service';
import type { SignInHttpResponse, SimpleOk } from '../types/auth.types';
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
  ) {}

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

  /** Complete TOTP challenge with a temp token and code */
  @SkipCsrf()
  @Throttle({ default: { limit: 5, ttl: 60 } })
  @HttpCode(HttpStatus.OK)
  @Post('login/totp')
  signInWithTotp(@Body() signInWithTotpDto: SignInTotpDto): Promise<Record<string, never>> {
    return this.authService.signInWithTotp(signInWithTotpDto.tempToken, signInWithTotpDto.totpCode).then((tokens) => {
      this.authCookies.issue({
        csrf: (Math.random().toString(36) + Math.random().toString(36)).slice(2),
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      });
      return {} as const;
    });
  }

  /** Rotate refresh token and issue a new access token */
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
      this.authCookies.rotateOnRefresh({
        csrf: (Math.random().toString(36) + Math.random().toString(36)).slice(2),
        accessToken: result!.accessToken,
        refreshToken: result!.refreshToken,
      });
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
