import 'reflect-metadata';

import { BadRequestException, ExecutionContext, ForbiddenException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AUTH_MESSAGE_KEYS, COMMON_MESSAGE_KEYS, UserRole } from '@cthub-bsaas/shared';

import { RequireScope, SCOPE_REQUIREMENT_KEY } from './scope.decorator';
import { ScopeGuard } from './scope.guard';
import type { ScopeAccessEvaluator, ScopedRequest } from './scope.types';

const createContext = (
  request: ScopedRequest,
  handler: () => void = () => undefined,
  controller: new () => unknown = TestController,
): ExecutionContext =>
  ({
    getHandler: () => handler,
    getClass: () => controller,
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  }) as unknown as ExecutionContext;

@RequireScope({ tenant: { field: 'tenantId' } })
class TestController {}

class NoScopeController {}

describe('ScopeGuard', () => {
  it('allows routes without scope metadata', async () => {
    const reflector = new Reflector();
    const guard = new ScopeGuard(reflector);
    const request: ScopedRequest = {
      user: { id: 'u1', email: 'u@example.com', roles: [UserRole.CUSTOMER] },
      params: {},
    };

    await expect(guard.canActivate(createContext(request, function route() {}, NoScopeController))).resolves.toBe(true);
  });

  it('attaches tenant scope when the user belongs to the same tenant', async () => {
    const reflector = new Reflector();
    const guard = new ScopeGuard(reflector);
    const request: ScopedRequest = {
      user: { id: 'u1', email: 'u@example.com', roles: [UserRole.OWNER], tenantId: 'tenant-1' },
      params: { tenantId: 'tenant-1' },
    };

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);
    expect(request.scope).toEqual({ tenantId: 'tenant-1' });
  });

  it('rejects missing authenticated user', async () => {
    const guard = new ScopeGuard(new Reflector());
    const request: ScopedRequest = { params: { tenantId: 'tenant-1' } };

    await expect(guard.canActivate(createContext(request))).rejects.toThrow(
      new UnauthorizedException(AUTH_MESSAGE_KEYS.ERROR.UNAUTHENTICATED),
    );
  });

  it('rejects missing required tenant id', async () => {
    const guard = new ScopeGuard(new Reflector());
    const request: ScopedRequest = {
      user: { id: 'u1', email: 'u@example.com', roles: [UserRole.OWNER], tenantId: 'tenant-1' },
      params: {},
    };

    await expect(guard.canActivate(createContext(request))).rejects.toThrow(new BadRequestException(COMMON_MESSAGE_KEYS.ERROR.VALIDATION));
  });

  it('rejects cross-tenant access before evaluator checks', async () => {
    const evaluator: ScopeAccessEvaluator = { canAccessScope: jest.fn(() => true) };
    const guard = new ScopeGuard(new Reflector(), evaluator);
    const request: ScopedRequest = {
      user: { id: 'u1', email: 'u@example.com', roles: [UserRole.OWNER], tenantId: 'tenant-1' },
      params: { tenantId: 'tenant-2' },
    };

    await expect(guard.canActivate(createContext(request))).rejects.toThrow(
      new ForbiddenException(COMMON_MESSAGE_KEYS.ERROR.FORBIDDEN_SCOPE),
    );
    expect(evaluator.canAccessScope).not.toHaveBeenCalled();
  });

  it('allows platform admin when configured', async () => {
    const handler = () => undefined;
    Reflect.defineMetadata(SCOPE_REQUIREMENT_KEY, { tenant: { field: 'tenantId' }, allowPlatformAdmin: true }, handler);
    const guard = new ScopeGuard(new Reflector());
    const request: ScopedRequest = {
      user: { id: 'u1', email: 'u@example.com', roles: [UserRole.ADMIN] },
      params: { tenantId: 'tenant-2' },
    };

    await expect(guard.canActivate(createContext(request, handler))).resolves.toBe(true);
  });

  it('allows platform admin role objects with uppercase names', async () => {
    const handler = () => undefined;
    Reflect.defineMetadata(SCOPE_REQUIREMENT_KEY, { tenant: { field: 'tenantId' }, allowPlatformAdmin: true }, handler);
    const guard = new ScopeGuard(new Reflector());
    const request: ScopedRequest = {
      user: { id: 'u1', email: 'u@example.com', roles: [{ id: 1, name: 'ADMIN' }] },
      params: { tenantId: 'tenant-2' },
    };

    await expect(guard.canActivate(createContext(request, handler))).resolves.toBe(true);
  });

  it('resolves scope values from query and body sources', async () => {
    const handler = () => undefined;
    Reflect.defineMetadata(
      SCOPE_REQUIREMENT_KEY,
      {
        tenant: { source: 'query', field: 'tenantId' },
        business: { source: 'body', field: 'businessId' },
      },
      handler,
    );
    const evaluator: ScopeAccessEvaluator = { canAccessScope: jest.fn(() => true) };
    const guard = new ScopeGuard(new Reflector(), evaluator);
    const request: ScopedRequest = {
      user: { id: 'u1', email: 'u@example.com', roles: [UserRole.OWNER], tenantId: 'tenant-1' },
      query: { tenantId: ' tenant-1 ' },
      body: { businessId: 'business-1' },
    };

    await expect(guard.canActivate(createContext(request, handler))).resolves.toBe(true);
    expect(request.scope).toEqual({ tenantId: 'tenant-1', businessId: 'business-1' });
  });

  it('rejects missing required business and branch ids', async () => {
    const handler = () => undefined;
    Reflect.defineMetadata(SCOPE_REQUIREMENT_KEY, { business: { field: 'businessId' }, branch: { field: 'branchId' } }, handler);
    const guard = new ScopeGuard(new Reflector());
    const request: ScopedRequest = {
      user: { id: 'u1', email: 'u@example.com', roles: [UserRole.OWNER] },
      params: { businessId: 'business-1' },
    };

    await expect(guard.canActivate(createContext(request, handler))).rejects.toThrow(
      new BadRequestException(COMMON_MESSAGE_KEYS.ERROR.VALIDATION),
    );
  });

  it('requires an evaluator for business or branch scope', async () => {
    const handler = () => undefined;
    Reflect.defineMetadata(SCOPE_REQUIREMENT_KEY, { business: { field: 'businessId' } }, handler);
    const guard = new ScopeGuard(new Reflector());
    const request: ScopedRequest = {
      user: { id: 'u1', email: 'u@example.com', roles: [UserRole.OWNER] },
      params: { businessId: 'business-1' },
    };

    await expect(guard.canActivate(createContext(request, handler))).rejects.toThrow(
      new ForbiddenException(COMMON_MESSAGE_KEYS.ERROR.FORBIDDEN_SCOPE),
    );
  });

  it('delegates business scope to the evaluator', async () => {
    const handler = () => undefined;
    Reflect.defineMetadata(SCOPE_REQUIREMENT_KEY, { business: { field: 'businessId' } }, handler);
    const evaluator: ScopeAccessEvaluator = { canAccessScope: jest.fn(() => true) };
    const guard = new ScopeGuard(new Reflector(), evaluator);
    const request: ScopedRequest = {
      user: { id: 'u1', email: 'u@example.com', roles: [UserRole.OWNER] },
      params: { businessId: 'business-1' },
    };

    await expect(guard.canActivate(createContext(request, handler))).resolves.toBe(true);
    expect(evaluator.canAccessScope).toHaveBeenCalledWith(
      request.user,
      { businessId: 'business-1' },
      { business: { field: 'businessId' } },
    );
  });

  it('allows structured evaluator allow decisions', async () => {
    const handler = () => undefined;
    Reflect.defineMetadata(SCOPE_REQUIREMENT_KEY, { business: { field: 'businessId' } }, handler);
    const evaluator: ScopeAccessEvaluator = { canAccessScope: jest.fn(() => ({ allowed: true })) };
    const guard = new ScopeGuard(new Reflector(), evaluator);
    const request: ScopedRequest = {
      user: { id: 'u1', email: 'u@example.com', roles: [UserRole.OWNER] },
      params: { businessId: 'business-1' },
    };

    await expect(guard.canActivate(createContext(request, handler))).resolves.toBe(true);
  });

  it('maps evaluator not_found denials to not found responses', async () => {
    const handler = () => undefined;
    Reflect.defineMetadata(SCOPE_REQUIREMENT_KEY, { business: { field: 'businessId' } }, handler);
    const evaluator: ScopeAccessEvaluator = { canAccessScope: jest.fn(() => ({ allowed: false, reason: 'not_found' })) };
    const guard = new ScopeGuard(new Reflector(), evaluator);
    const request: ScopedRequest = {
      user: { id: 'u1', email: 'u@example.com', roles: [UserRole.OWNER] },
      params: { businessId: 'business-1' },
    };

    await expect(guard.canActivate(createContext(request, handler))).rejects.toThrow(
      new NotFoundException(COMMON_MESSAGE_KEYS.ERROR.NOT_FOUND),
    );
  });

  it('maps evaluator hidden denials to not found responses', async () => {
    const handler = () => undefined;
    Reflect.defineMetadata(SCOPE_REQUIREMENT_KEY, { business: { field: 'businessId' } }, handler);
    const evaluator: ScopeAccessEvaluator = { canAccessScope: jest.fn(() => ({ allowed: false, hideAsNotFound: true })) };
    const guard = new ScopeGuard(new Reflector(), evaluator);
    const request: ScopedRequest = {
      user: { id: 'u1', email: 'u@example.com', roles: [UserRole.OWNER] },
      params: { businessId: 'business-1' },
    };

    await expect(guard.canActivate(createContext(request, handler))).rejects.toThrow(
      new NotFoundException(COMMON_MESSAGE_KEYS.ERROR.NOT_FOUND),
    );
  });

  it('maps evaluator permission denials to permission errors', async () => {
    const handler = () => undefined;
    Reflect.defineMetadata(SCOPE_REQUIREMENT_KEY, { business: { field: 'businessId' } }, handler);
    const evaluator: ScopeAccessEvaluator = { canAccessScope: jest.fn(() => ({ allowed: false, reason: 'permission' })) };
    const guard = new ScopeGuard(new Reflector(), evaluator);
    const request: ScopedRequest = {
      user: { id: 'u1', email: 'u@example.com', roles: [UserRole.OWNER] },
      params: { businessId: 'business-1' },
    };

    await expect(guard.canActivate(createContext(request, handler))).rejects.toThrow(
      new ForbiddenException(COMMON_MESSAGE_KEYS.ERROR.FORBIDDEN_PERMISSION),
    );
  });

  it('maps boolean evaluator denials to scope errors', async () => {
    const handler = () => undefined;
    Reflect.defineMetadata(SCOPE_REQUIREMENT_KEY, { business: { field: 'businessId' } }, handler);
    const evaluator: ScopeAccessEvaluator = { canAccessScope: jest.fn(() => false) };
    const guard = new ScopeGuard(new Reflector(), evaluator);
    const request: ScopedRequest = {
      user: { id: 'u1', email: 'u@example.com', roles: [UserRole.OWNER] },
      params: { businessId: 'business-1' },
    };

    await expect(guard.canActivate(createContext(request, handler))).rejects.toThrow(
      new ForbiddenException(COMMON_MESSAGE_KEYS.ERROR.FORBIDDEN_SCOPE),
    );
  });
});
