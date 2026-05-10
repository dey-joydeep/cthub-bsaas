import { Controller, Post, UseGuards, Request, Body, UnauthorizedException, Inject, HttpCode, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '@cthub-bsaas/server-core';
import { TOTP_PORT, TotpPort } from '@cthub-bsaas/server-contracts-auth';
import { VerifyTotpDto } from '../dto/verify-totp.dto';
import { Throttle } from '@nestjs/throttler';

/**
 * @public
 * Controller for TOTP MFA enrollment and verification.
 */
@Controller('auth/totp')
@UseGuards(JwtAuthGuard)
export class TotpController {
  constructor(@Inject(TOTP_PORT) private readonly totpService: TotpPort) {}

  /**
   * Generate a TOTP secret for the current user.
   *
   * @param {{ user: { id: string } }} req - Request containing authenticated user id.
   * @returns {Promise<{ qrCodeDataUrl: string }>} Data URL with a scannable QR code.
   */
  @Post('setup')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 60 } })
  public async setup(@Request() req: { user: { id: string } }): Promise<{ qrCodeDataUrl: string }> {
    const { qrCodeDataUrl } = await this.totpService.generateSecret(req.user.id);
    return { qrCodeDataUrl };
  }

  /**
   * Verify a TOTP token and mark the user's TOTP credential as verified.
   *
   * @param {{ user: { id: string } }} req - Request containing authenticated user id.
   * @param {VerifyTotpDto} verifyTotpDto - DTO holding the 6-digit TOTP code.
   * @returns {Promise<{ success: true }>} Success response upon valid verification.
   */
  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60 } })
  public async verify(@Request() req: { user: { id: string } }, @Body() verifyTotpDto: VerifyTotpDto): Promise<{ success: true }> {
    const isVerified = await this.totpService.verifyToken(req.user.id, verifyTotpDto.token);
    if (!isVerified) {
      throw new UnauthorizedException('Invalid TOTP token');
    }
    return { success: true };
  }

  // Aliases aligned with spec
  @HttpCode(HttpStatus.OK)
  @Post('enroll/start')
  @Throttle({ default: { limit: 3, ttl: 60 } })
  public async enrollStart(@Request() req: { user: { id: string } }): Promise<{ qrCodeDataUrl: string }> {
    const { qrCodeDataUrl } = await this.totpService.generateSecret(req.user.id);
    return { qrCodeDataUrl };
  }

  @HttpCode(HttpStatus.OK)
  @Post('enroll/finish')
  @Throttle({ default: { limit: 5, ttl: 60 } })
  public async enrollFinish(@Request() req: { user: { id: string } }, @Body() verifyTotpDto: VerifyTotpDto): Promise<{ success: true }> {
    const isVerified = await this.totpService.verifyToken(req.user.id, verifyTotpDto.token);
    if (!isVerified) {
      throw new UnauthorizedException('Invalid TOTP token');
    }
    return { success: true };
  }
}
