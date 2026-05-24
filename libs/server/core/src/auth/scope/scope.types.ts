import type { AuthenticatedUser } from '@cthub-bsaas/shared';

export type ScopeRequestSource = 'params' | 'query' | 'body';

export interface ScopeFieldRef {
  readonly source?: ScopeRequestSource;
  readonly field: string;
}

export interface ScopeRequirement {
  readonly tenant?: ScopeFieldRef;
  readonly business?: ScopeFieldRef;
  readonly branch?: ScopeFieldRef;
  readonly allowPlatformAdmin?: boolean;
}

export interface RequestScope {
  readonly tenantId?: string;
  readonly businessId?: string;
  readonly branchId?: string;
}

export type ScopeDenialReason = 'scope' | 'permission' | 'not_found';

export interface ScopeAccessDecision {
  readonly allowed: boolean;
  readonly reason?: ScopeDenialReason;
  readonly hideAsNotFound?: boolean;
}

export interface ScopeAccessEvaluator {
  canAccessScope(
    user: AuthenticatedUser,
    scope: RequestScope,
    requirement: ScopeRequirement,
  ): boolean | ScopeAccessDecision | Promise<boolean | ScopeAccessDecision>;
}

export interface ScopedRequest {
  readonly user?: AuthenticatedUser;
  scope?: RequestScope;
  readonly params?: Record<string, unknown>;
  readonly query?: Record<string, unknown>;
  readonly body?: unknown;
}

export const SCOPE_ACCESS_EVALUATOR = Symbol('SCOPE_ACCESS_EVALUATOR');
