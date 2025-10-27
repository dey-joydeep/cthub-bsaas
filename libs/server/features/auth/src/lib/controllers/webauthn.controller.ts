import { BadRequestException, Body, Controller, HttpCode, HttpStatus, Post, Request, UseGuards, UseInterceptors, UnauthorizedException } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CsrfGuard, JwtAuthGuard, JwtOptionalAuthGuard, OptionalUser, Public, ResponseEnvelopeInterceptor, SkipCsrf, CookiesInterceptor } from '@cthub-bsaas/server-core';
import type { AuthenticatedUser } from '@cthub-bsaas/shared';
import { WEB_AUTHN_PORT, WebAuthnPort } from '@cthub-bsaas/server-contracts-auth';
import { Inject } from '@nestjs/common';
import { WebauthnRegisterStartDto } from '../dto/webauthn-register-start.dto';
import { WebauthnAttestationDto } from '../dto/webauthn-attestation.dto';
import { WebauthnAssertionDto } from '../dto/webauthn-assertion.dto';
import { AuthService } from '../services/auth.service';
import { AuthCookiesService } from '../services/auth-cookies.service';
import { COMMON_MESSAGE_KEYS } from '@cthub-bsaas/shared';
import { JwtService } from '@nestjs/jwt';

@Controller('auth')
@UseGuards(CsrfGuard, JwtOptionalAuthGuard)
@UseInterceptors(CookiesInterceptor, ResponseEnvelopeInterceptor)
export class WebauthnController {
  constructor(
    @Inject(WEB_AUTHN_PORT) private readonly webAuthn: WebAuthnPort,
    private readonly authService: AuthService,
    private readonly authCookies: AuthCookiesService,
    private readonly jwtService: JwtService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post('webauthn/register/start')
  @HttpCode(HttpStatus.OK)
  webauthnRegisterStart(
    @Body() body: WebauthnRegisterStartDto,
    @Request() req: { user: { userId: string } },
  ): Promise<Record<string, unknown>> {
    return this.webAuthn.startRegistration(req.user.userId, body.username);
  }

  @UseGuards(JwtAuthGuard)
  @Post('webauthn/register/finish')
  @HttpCode(HttpStatus.OK)
  webauthnRegisterFinish(@Body() response: WebauthnAttestationDto, @Request() req: { user: { userId: string } }) {
    return this.webAuthn
      .finishRegistration(req.user.userId, response.response as unknown as Record<string, unknown>)
      .then(() => ({ success: true as const }));
  }

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
      return this.authService.resolveUserIdByEmail(payload.email).then((userId) => this.webAuthn.startAuthentication(userId));
    }
    return Promise.reject(new BadRequestException(COMMON_MESSAGE_KEYS.ERROR.VALIDATION));
  }

  @Public()
  @Post('webauthn/login/finish')
  @HttpCode(HttpStatus.OK)
  @SkipCsrf()
  webauthnLoginFinish(@Body() response: WebauthnAssertionDto, @OptionalUser() user?: AuthenticatedUser) {
    const userId = this.extractUserId(user);
    if (!userId) {
      throw new UnauthorizedException();
    }
    return this.webAuthn
      .finishAuthentication(userId, response.response as unknown as Record<string, unknown>)
      .then(() => this.authService.issueTokensForUser(userId))
      .then((result) => {
        const decoded = this.jwtService.decode(result.accessToken) as { roles?: string[] } | null;
        const roles = decoded?.roles ?? [];
        const isCustomer = Array.isArray(roles) && roles.includes('CUSTOMER');
        this.authCookies.issue(
          {
            csrf: (Math.random().toString(36) + Math.random().toString(36)).slice(2),
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
          },
          { isCustomer },
        );
        return {} as const;
      });
  }

  private extractUserId(user?: AuthenticatedUser): string | undefined {
    if (!user) return undefined;
    const record = user as Record<string, unknown>;
    const candidate = record.userId ?? record.id;
    return typeof candidate === 'string' && candidate.length > 0 ? candidate : undefined;
  }
}
