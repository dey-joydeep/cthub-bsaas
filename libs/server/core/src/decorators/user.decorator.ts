import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedUser } from '@cthub-bsaas/shared';

/**
 * @deprecated Use AuthenticatedUser from @cthub-bsaas/shared instead
 */
export type AuthUser = AuthenticatedUser;

/**
 * Parameter decorator to get the authenticated user from the request
 */
export const User = createParamDecorator((_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
  const request = ctx.switchToHttp().getRequest<{ user: AuthenticatedUser }>();
  return request.user;
});
