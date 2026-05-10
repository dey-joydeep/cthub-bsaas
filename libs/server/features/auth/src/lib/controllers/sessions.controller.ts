import { Controller, Get, Post, Param, Request, UseGuards, HttpCode, HttpStatus, UseInterceptors } from '@nestjs/common';
import { CsrfGuard, JwtAuthGuard, JwtOptionalAuthGuard, ResponseEnvelopeInterceptor } from '@cthub-bsaas/server-core';
import { AuthService } from '../services/auth.service';

@Controller('auth')
@UseGuards(CsrfGuard, JwtOptionalAuthGuard)
@UseInterceptors(ResponseEnvelopeInterceptor)
export class SessionsController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(JwtAuthGuard)
  @Get('sessions')
  listSessions(@Request() req: { user: { userId: string } }): Promise<unknown> {
    return this.authService.listSessions(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('sessions/revoke/:id')
  revokeSession(@Request() req: { user: { userId: string } }, @Param('id') id: string) {
    return this.authService.revokeSession(req.user.userId, id);
  }
}

