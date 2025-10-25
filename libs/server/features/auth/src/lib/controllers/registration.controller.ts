import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, UseGuards, UseInterceptors } from '@nestjs/common';
import { CookiesInterceptor, CsrfGuard, JwtOptionalAuthGuard, Public, ResponseEnvelopeInterceptor, SkipCsrf } from '@cthub-bsaas/server-core';
import { RegistrationCompleteInput } from '@cthub-bsaas/server-contracts-auth';
import { AuthService } from '../services/auth.service';
import { AuthCookiesService } from '../services/auth-cookies.service';

@Controller('auth')
@UseGuards(CsrfGuard, JwtOptionalAuthGuard)
@UseInterceptors(CookiesInterceptor, ResponseEnvelopeInterceptor)
export class RegistrationController {
  constructor(private readonly authService: AuthService, private readonly authCookies: AuthCookiesService) {}

  // Owner
  @Public()
  @Get('owner/registration/:token')
  validateOwnerInvite(@Param('token') token: string): Promise<{ valid: true; email: string; salonId: string }> {
    return this.authService.validateOwnerInvite(token).then((res) => ({ valid: true, email: res.email, salonId: res.salonId }) as const);
  }

  @Public()
  @SkipCsrf()
  @HttpCode(HttpStatus.CREATED)
  @Post('owner/registration/complete')
  completeOwnerRegistration(@Body() body: RegistrationCompleteInput) {
    return this.authService.completeOwnerRegistration(body).then((result) => {
      if ('next' in result) return result;
      this.authCookies.issue({
        csrf: (Math.random().toString(36) + Math.random().toString(36)).slice(2),
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      });
      return {} as const;
    });
  }

  // Staff
  @Public()
  @Get('staff/registration/:token')
  validateStaffInvite(@Param('token') token: string): Promise<{ valid: true; email: string; salonId: string }> {
    return this.authService.validateStaffInvite(token).then((res) => ({ valid: true, email: res.email, salonId: res.salonId }) as const);
  }

  @Public()
  @SkipCsrf()
  @HttpCode(HttpStatus.CREATED)
  @Post('staff/registration/complete')
  completeStaffRegistration(@Body() body: RegistrationCompleteInput) {
    return this.authService.completeStaffRegistration(body).then((result) => {
      if ('next' in result) return result;
      this.authCookies.issue({
        csrf: (Math.random().toString(36) + Math.random().toString(36)).slice(2),
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      });
      return {} as const;
    });
  }

  /** Customer self‑serve registration */
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @Post('register')
  @SkipCsrf()
  register(@Body() body: { email: string; password: string; name?: string }) {
    return this.authService.register(body.email, body.password, body.name).then(() => ({ success: true as const }));
  }
}

