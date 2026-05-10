import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { resolveAccessSecret } from '../utils/jwt-secret.util';
import type { JwtUserContext } from '../types/auth.types';

/**
 * @public
 * Passport strategy for validating access tokens on incoming requests.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: (req) => {
        // Prefer access token from cookie, fallback to Authorization header
        type CookieReq = { cookies?: Record<string, string | undefined> };
        const cookieToken = (req as unknown as CookieReq).cookies?.['bsaas_at'];
        if (typeof cookieToken === 'string' && cookieToken.length > 0) return cookieToken;
        return ExtractJwt.fromAuthHeaderAsBearerToken()(req);
      },
      ignoreExpiration: false,
      secretOrKey: resolveAccessSecret(configService),
    });
  }

  /**
   * Map JWT payload into the request user object.
   *
   * @param {{ sub: string; email: string; roles: string[]; sessionId: string; iat: number; exp: number }} payload - Decoded JWT payload.
   * @returns {{ userId: string; email: string; roles: string[]; sessionId: string }} Authenticated user context.
   */
  public validate(payload: { sub: string; email: string; roles: string[]; sessionId: string; iat: number; exp: number }): JwtUserContext {
    return { userId: payload.sub, email: payload.email, roles: payload.roles, sessionId: payload.sessionId };
  }
}
