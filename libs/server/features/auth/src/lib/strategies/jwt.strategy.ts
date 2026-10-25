import { Injectable } from '@nestjs/common';
import { ConfigService } from '@cthub-bsaas/server-core';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { JwtUserContext } from '../types/auth.types';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: (req) => {
        type CookieReq = { cookies?: Record<string, string | undefined> };
        const cookieToken = (req as unknown as CookieReq).cookies?.['bsaas_at'];
        if (typeof cookieToken === 'string' && cookieToken.length > 0) return cookieToken;
        return ExtractJwt.fromAuthHeaderAsBearerToken()(req);
      },
      ignoreExpiration: false,
      secretOrKey: configService.auth.jwtAccessSecret,
    });
  }

  public validate(payload: {
    sub: string;
    email: string;
    roles: string[];
    sessionId: string;
    tenantId?: string;
    managedBranchIds?: string[];
    canManageBranches?: boolean;
    iat: number;
    exp: number;
  }): JwtUserContext {
    const roles = payload.roles ?? [];
    const isOwnerOrAdmin = roles.some((r) => {
      const lower = String(r).toLowerCase();
      return lower === 'owner' || lower === 'admin';
    });
    const canManageBranches =
      payload.canManageBranches ??
      (isOwnerOrAdmin || (Array.isArray(payload.managedBranchIds) && payload.managedBranchIds.length > 0));

    return {
      id: payload.sub,
      userId: payload.sub,
      email: payload.email,
      roles: payload.roles,
      sessionId: payload.sessionId,
      tenantId: payload.tenantId,
      managedBranchIds: payload.managedBranchIds,
      canManageBranches,
    };
  }
}
