import { BadRequestException, Controller, Get, HttpCode, HttpStatus, Param, Post, Query, Redirect, Request, UseGuards, UseInterceptors } from '@nestjs/common';
import { CsrfGuard, JwtAuthGuard, JwtOptionalAuthGuard, OptionalUser, Public, ResponseEnvelopeInterceptor, SkipCsrf } from '@cthub-bsaas/server-core';
import type { AuthenticatedUser } from '@cthub-bsaas/shared';
import { OAUTH_PORT, OAuthPort } from '@cthub-bsaas/server-contracts-auth';
import { Inject } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { AuthCookiesService } from '../services/auth-cookies.service';
import { COMMON_ERROR_CODES } from '@cthub-bsaas/shared';

@Controller('auth')
@UseGuards(CsrfGuard, JwtOptionalAuthGuard)
@UseInterceptors(ResponseEnvelopeInterceptor)
export class OauthController {
  constructor(
    @Inject(OAUTH_PORT) private readonly oauth: OAuthPort,
    private readonly authService: AuthService,
    private readonly authCookies: AuthCookiesService,
  ) {}

  @Public()
  @Get('oauth/:provider/start')
  @SkipCsrf()
  @Redirect(undefined, HttpStatus.FOUND)
  oauthStart(@Param('provider') provider: string): Promise<{ url: string; statusCode: number }> {
    return this.oauth.start(provider).then(({ redirectUrl }) => ({ url: redirectUrl, statusCode: HttpStatus.FOUND }));
  }

  @Public()
  @UseGuards(JwtOptionalAuthGuard)
  @Get('oauth/:provider/callback')
  @SkipCsrf()
  oauthCallback(
    @Param('provider') provider: string,
    @OptionalUser() user?: AuthenticatedUser,
    @Query('code') code?: string,
    @Query('state') state?: string,
  ) {
    if (!code) {
      throw new BadRequestException(COMMON_ERROR_CODES.VALIDATION);
    }
    return this.oauth.exchangeCode(provider, code, state).then((profile) => {
      const linkedUserId = this.extractUserId(user);
      if (linkedUserId) {
        return this.authService.linkSocialAccount(linkedUserId, profile.provider, profile.providerUserId).then(() => ({}) as const);
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
  oauthUnlink(@Param('provider') provider: string, @Request() req: { user: { userId: string } }) {
    return this.authService.unlinkSocialAccount(req.user.userId, provider).then(() => ({ success: true as const }));
  }

  private extractUserId(user?: AuthenticatedUser): string | undefined {
    if (!user) return undefined;
    const record = user as Record<string, unknown>;
    const candidate = record.userId ?? record.id;
    return typeof candidate === 'string' && candidate.length > 0 ? candidate : undefined;
  }
}

