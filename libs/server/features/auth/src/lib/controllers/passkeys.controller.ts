import { Controller, Get, Delete, Param, UseGuards, UseInterceptors, HttpCode, HttpStatus, Request } from '@nestjs/common';
import { CsrfGuard, JwtAuthGuard, JwtOptionalAuthGuard, ResponseEnvelopeInterceptor } from '@cthub-bsaas/server-core';
import { PasskeysService } from '../services/passkeys.service';
import { Throttle } from '@nestjs/throttler';

@Controller('auth')
@UseGuards(CsrfGuard, JwtOptionalAuthGuard)
@UseInterceptors(ResponseEnvelopeInterceptor)
export class PasskeysController {
  constructor(private readonly svc: PasskeysService) {}

  @UseGuards(JwtAuthGuard)
  @Get('webauthn/devices')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  list(@Request() req: { user: { userId: string } }) {
    return this.svc.list(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('webauthn/devices/:id')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  delete(@Param('id') id: string, @Request() req: { user: { userId: string } }) {
    return this.svc.delete(req.user.userId, id);
  }
}
