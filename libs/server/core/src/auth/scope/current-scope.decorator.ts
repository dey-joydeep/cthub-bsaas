import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import type { RequestScope, ScopedRequest } from './scope.types';

export const CurrentScope = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): RequestScope | undefined => ctx.switchToHttp().getRequest<ScopedRequest>().scope,
);
