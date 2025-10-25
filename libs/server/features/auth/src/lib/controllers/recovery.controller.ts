import { Body, Controller, HttpCode, HttpStatus, Post, Request, UseGuards, UseInterceptors, Inject, BadRequestException } from '@nestjs/common';
import { CsrfGuard, JwtAuthGuard, JwtOptionalAuthGuard, ResponseEnvelopeInterceptor } from '@cthub-bsaas/server-core';
import { VerifyRecoveryDto } from '../dto/verify-recovery.dto';
import { RECOVERY_CODES_PORT, RecoveryCodesPort } from '@cthub-bsaas/server-contracts-auth';
import { AuditService } from '../services/audit.service';
import { COMMON_ERROR_CODES } from '@cthub-bsaas/shared';

@Controller('auth')
@UseGuards(CsrfGuard, JwtOptionalAuthGuard)
@UseInterceptors(ResponseEnvelopeInterceptor)
export class RecoveryController {
  constructor(
    @Inject(RECOVERY_CODES_PORT) private readonly recovery: RecoveryCodesPort,
    private readonly audit: AuditService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post('recovery/generate')
  @HttpCode(HttpStatus.OK)
  generateRecovery(@Request() req: { user: { userId: string } }): Promise<string[]> {
    return this.recovery.generate(req.user.userId, 10).then((codes) => {
      this.audit?.log('recovery_codes_generated', { userId: req.user.userId, count: codes.length });
      return codes;
    });
  }

  @UseGuards(JwtAuthGuard)
  @Post('recovery/verify')
  @HttpCode(HttpStatus.OK)
  verifyRecovery(@Body() body: VerifyRecoveryDto, @Request() req: { user: { userId: string } }) {
    return this.recovery.verifyAndConsume(req.user.userId, body.code).then((ok) => {
      if (!ok) {
        this.audit?.log('recovery_code_verify_failure', { userId: req.user.userId });
        throw new BadRequestException(COMMON_ERROR_CODES.VALIDATION);
      }
      this.audit?.log('recovery_code_verify_success', { userId: req.user.userId });
      return { success: true as const };
    });
  }
}

