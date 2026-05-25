import { SetMetadata } from '@nestjs/common';

import type { ScopeRequirement } from './scope.types';

export const SCOPE_REQUIREMENT_KEY = 'cthub:scope-requirement';

export const RequireScope = (requirement: ScopeRequirement): MethodDecorator & ClassDecorator =>
  SetMetadata(SCOPE_REQUIREMENT_KEY, requirement);
