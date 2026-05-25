import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  Optional,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AUTH_MESSAGE_KEYS, COMMON_MESSAGE_KEYS, UserRole } from '@cthub-bsaas/shared';

import { SCOPE_REQUIREMENT_KEY } from './scope.decorator';
import {
  RequestScope,
  ScopeAccessDecision,
  ScopeAccessEvaluator,
  ScopeFieldRef,
  ScopeRequirement,
  ScopedRequest,
  SCOPE_ACCESS_EVALUATOR,
} from './scope.types';

const platformAdminRole = String(UserRole.ADMIN);
const platformAdminRoleUpper = platformAdminRole.toUpperCase();

function readObjectValue(source: unknown, field: string): unknown {
  if (!source || typeof source !== 'object') {
    return undefined;
  }

  return (source as Record<string, unknown>)[field];
}

function readScopeValue(request: ScopedRequest, ref?: ScopeFieldRef): string | undefined {
  if (!ref) {
    return undefined;
  }

  const sourceName = ref.source ?? 'params';
  const value = readObjectValue(request[sourceName], ref.field);
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function hasPlatformRole(request: ScopedRequest): boolean {
  const roles = request.user?.roles ?? [];
  return roles.some((role) => {
    const name = typeof role === 'string' ? role : role.name;
    return name === platformAdminRole || name === platformAdminRoleUpper;
  });
}

function buildScope(request: ScopedRequest, requirement: ScopeRequirement): RequestScope {
  const tenantId = readScopeValue(request, requirement.tenant);
  const businessId = readScopeValue(request, requirement.business);
  const branchId = readScopeValue(request, requirement.branch);

  return {
    ...(tenantId ? { tenantId } : {}),
    ...(businessId ? { businessId } : {}),
    ...(branchId ? { branchId } : {}),
  };
}

function isDecision(value: boolean | ScopeAccessDecision): value is ScopeAccessDecision {
  return typeof value === 'object';
}

@Injectable()
export class ScopeGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Optional()
    @Inject(SCOPE_ACCESS_EVALUATOR)
    private readonly evaluator?: ScopeAccessEvaluator,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const requirement = this.reflector.getAllAndOverride<ScopeRequirement>(SCOPE_REQUIREMENT_KEY, [ctx.getHandler(), ctx.getClass()]);

    if (!requirement) {
      return true;
    }

    const request = ctx.switchToHttp().getRequest<ScopedRequest>();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException(AUTH_MESSAGE_KEYS.ERROR.UNAUTHENTICATED);
    }

    const scope = buildScope(request, requirement);
    this.assertRequiredValues(scope, requirement);
    request.scope = scope;

    if (requirement.allowPlatformAdmin && hasPlatformRole(request)) {
      return true;
    }

    if (scope.tenantId && user.tenantId !== scope.tenantId) {
      throw new ForbiddenException(COMMON_MESSAGE_KEYS.ERROR.FORBIDDEN_SCOPE);
    }

    if (!this.evaluator) {
      this.assertEvaluatorIsNotRequired(requirement);
      return true;
    }

    const decision = await this.evaluator.canAccessScope(user, scope, requirement);
    if (decision === true || (isDecision(decision) && decision.allowed)) {
      return true;
    }

    this.throwDenied(isDecision(decision) ? decision : { allowed: false, reason: 'scope' });
  }

  private assertRequiredValues(scope: RequestScope, requirement: ScopeRequirement): void {
    if (requirement.tenant && !scope.tenantId) {
      throw new BadRequestException(COMMON_MESSAGE_KEYS.ERROR.VALIDATION);
    }

    if (requirement.business && !scope.businessId) {
      throw new BadRequestException(COMMON_MESSAGE_KEYS.ERROR.VALIDATION);
    }

    if (requirement.branch && !scope.branchId) {
      throw new BadRequestException(COMMON_MESSAGE_KEYS.ERROR.VALIDATION);
    }
  }

  private assertEvaluatorIsNotRequired(requirement: ScopeRequirement): void {
    if (requirement.business || requirement.branch) {
      throw new ForbiddenException(COMMON_MESSAGE_KEYS.ERROR.FORBIDDEN_SCOPE);
    }
  }

  private throwDenied(decision: ScopeAccessDecision): never {
    if (decision.hideAsNotFound || decision.reason === 'not_found') {
      throw new NotFoundException(COMMON_MESSAGE_KEYS.ERROR.NOT_FOUND);
    }

    const key =
      decision.reason === 'permission' ? COMMON_MESSAGE_KEYS.ERROR.FORBIDDEN_PERMISSION : COMMON_MESSAGE_KEYS.ERROR.FORBIDDEN_SCOPE;
    throw new ForbiddenException(key);
  }
}
