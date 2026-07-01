import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthenticatedUser } from '@cthub-bsaas/shared';

/**
 * @OptionalUser()
 * Returns the authenticated user when present; otherwise undefined.
 * Intended for public endpoints that can personalize when a JWT is supplied.
 */
export const OptionalUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedUser | undefined => {
    const request = context.switchToHttp().getRequest<unknown>();
    if (!request || typeof request !== 'object') {
      return undefined;
    }

    const reqRecord = request as Record<string, unknown>;
    const userCandidate = reqRecord['user'];

    return userCandidate && typeof userCandidate === 'object' ? (userCandidate as AuthenticatedUser) : undefined;
  },
);
