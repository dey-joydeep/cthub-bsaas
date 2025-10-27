import { Controller, Post, UseGuards, Request, Body, UnauthorizedException, Inject, HttpCode, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '@cthub-bsaas/server-core';
import { TOTP_PORT, TotpPort } from '@cthub-bsaas/server-contracts-auth';
import { VerifyTotpDto } from '../dto/verify-totp.dto';
import { Throttle } from '@nestjs/throttler';
import { AUTH_MESSAGE_KEYS } from '@cthub-bsaas/shared';

/**
 * @public
 * Controller for TOTP MFA enrollment and verification.
 */
@Controller('auth/totp')
@UseGuards(JwtAuthGuard)
export class TotpController {
  constructor(@Inject(TOTP_PORT) private readonly totpService: TotpPort) {}

  // Spec-aligned enrollment endpoints
  @HttpCode(HttpStatus.OK)
  @Post('enroll/start')
  @Throttle({ default: { limit: 3, ttl: 60 } })
  public async enrollStart(@Request() req: { user: { userId: string } }): Promise<{ qrCodeDataUrl: string }> {
    const { qrCodeDataUrl } = await this.totpService.generateSecret(req.user.userId);
    return { qrCodeDataUrl };
  }

  @HttpCode(HttpStatus.OK)
  @Post('enroll/finish')
  @Throttle({ default: { limit: 5, ttl: 60 } })
  public async enrollFinish(@Request() req: { user: { userId: string } }, @Body() verifyTotpDto: VerifyTotpDto): Promise<{ success: true }> {
    const isVerified = await this.totpService.verifyToken(req.user.userId, verifyTotpDto.token);
    if (!isVerified) {
      throw new UnauthorizedException(AUTH_MESSAGE_KEYS.ERROR.INVALID_TOTP_TOKEN);
    }
    return { success: true };
  }
}
