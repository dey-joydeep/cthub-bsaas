import { BadRequestException, Body, Controller, HttpCode, HttpStatus, Post, Request, UseGuards, UseInterceptors } from '@nestjs/common';
import { CsrfGuard, JwtAuthGuard, JwtOptionalAuthGuard, ResponseEnvelopeInterceptor, SkipCsrf } from '@cthub-bsaas/server-core';
import { AuthService } from '../services/auth.service';
import { EmailChangeRequestDto } from '../dto/email-change-request.dto';
import { EmailChangeConfirmDto } from '../dto/email-change-confirm.dto';

@Controller('auth')
@UseGuards(CsrfGuard, JwtOptionalAuthGuard)
@UseInterceptors(ResponseEnvelopeInterceptor)
export class EmailController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.ACCEPTED)
  @Post('email/change/request')
  requestEmailChange(@Body() body: EmailChangeRequestDto, @Request() req: { user: { userId: string } }) {
    return this.authService.requestEmailChange(req.user.userId, body.newEmail).then(() => ({ success: true as const }));
  }

  @HttpCode(HttpStatus.OK)
  @Post('email/change/confirm')
  @SkipCsrf()
  confirmEmailChange(@Body() body: EmailChangeConfirmDto) {
    return this.authService.confirmEmailChange(body.token).then(() => ({ success: true as const }));
  }

  @HttpCode(HttpStatus.ACCEPTED)
  @Post('email/verify/request')
  @SkipCsrf()
  emailVerifyRequest(@Body() body: { email: string }) {
    return this.authService.requestEmailVerification(body.email).then(() => ({ success: true as const }));
  }

  @HttpCode(HttpStatus.OK)
  @Post('email/verify/confirm')
  @SkipCsrf()
  emailVerifyConfirm(@Body() body: { token?: string; email?: string; otp?: string }) {
    if (body.token) {
      return this.authService.verifyEmail(body.token).then(() => ({ success: true as const }));
    }
    if (body.email && body.otp) {
      return this.authService.verifyEmailOtp(body.email, body.otp).then(() => ({ success: true as const }));
    }
    throw new BadRequestException('error.validation');
  }
}

