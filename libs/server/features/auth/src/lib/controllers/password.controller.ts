import { Body, Controller, HttpCode, HttpStatus, Post, Request, UseGuards, UseInterceptors } from '@nestjs/common';
import { CsrfGuard, JwtAuthGuard, JwtOptionalAuthGuard, Public, ResponseEnvelopeInterceptor, SkipCsrf } from '@cthub-bsaas/server-core';
import { AuthService } from '../services/auth.service';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { PasswordChangeDto } from '../dto/password-change.dto';

@Controller('auth')
@UseGuards(CsrfGuard, JwtOptionalAuthGuard)
@UseInterceptors(ResponseEnvelopeInterceptor)
export class PasswordController {
  constructor(private readonly authService: AuthService) {}

  @HttpCode(HttpStatus.ACCEPTED)
  @Post('password/forgot')
  @SkipCsrf()
  @Public()
  forgotPassword(@Body() body: ForgotPasswordDto) {
    return this.authService.requestPasswordReset(body.email).then(() => ({ success: true as const }));
  }

  @HttpCode(HttpStatus.OK)
  @Post('password/reset')
  @SkipCsrf()
  @Public()
  resetPassword(@Body() body: ResetPasswordDto) {
    return this.authService.resetPassword(body.token, body.newPassword).then(() => ({ success: true as const }));
  }

  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('password/change')
  changePassword(@Body() body: PasswordChangeDto, @Request() req: { user: { userId: string } }) {
    return this.authService
      .changePassword(req.user.userId, body.currentPassword, body.newPassword)
      .then(() => ({ success: true as const }));
  }
}
