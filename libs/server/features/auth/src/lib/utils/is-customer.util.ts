import type { JwtService } from '@nestjs/jwt';

export function isCustomerFromAccessToken(jwt: JwtService, accessToken?: string): boolean {
  if (!accessToken) return false;
  const payload: unknown = jwt.decode(accessToken);
  if (!payload || typeof payload !== 'object') return false;
  const rolesUnknown = (payload as Record<string, unknown>).roles;
  if (!Array.isArray(rolesUnknown)) return false;
  return rolesUnknown.map((r) => String(r)).includes('CUSTOMER');
}
