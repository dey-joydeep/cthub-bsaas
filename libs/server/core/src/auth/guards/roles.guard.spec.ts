import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { UserRole, AuthenticatedUser } from '@cthub-bsaas/shared';
import { RolesGuard, Roles, ROLES_KEY } from './roles.guard';

// Helper to create a mock ExecutionContext
const createMockExecutionContext = (
  user: Partial<AuthenticatedUser> | null,
  reflector: Reflector,
  requiredRoles: UserRole[] = [],
): ExecutionContext => {
  jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(requiredRoles);

  return {
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
    getHandler: () => null,
    getClass: () => null,
  } as unknown as ExecutionContext;
};

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [RolesGuard, Reflector],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should allow access if no roles are required', () => {
      const context = createMockExecutionContext({ roles: [UserRole.CUSTOMER] }, reflector);
      expect(guard.canActivate(context)).toBe(true);
    });

    it('should throw ForbiddenException if user is not authenticated', () => {
      const context = createMockExecutionContext(null, reflector, [UserRole.ADMIN]);
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should allow access for direct role match', () => {
      const context = createMockExecutionContext({ roles: [UserRole.STAFF] }, reflector, [UserRole.STAFF]);
      expect(guard.canActivate(context)).toBe(true);
    });

    it('should allow access for hierarchical role match (ADMIN checking for CUSTOMER)', () => {
      const context = createMockExecutionContext({ roles: [UserRole.ADMIN] }, reflector, [UserRole.CUSTOMER]);
      expect(guard.canActivate(context)).toBe(true);
    });

    it('should deny access for insufficient permissions', () => {
      const context = createMockExecutionContext({ roles: [UserRole.CUSTOMER] }, reflector, [UserRole.ADMIN]);
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should handle user roles as objects', () => {
      const user = { roles: [{ name: UserRole.OWNER }] };
      const context = createMockExecutionContext(user, reflector, [UserRole.STAFF]);
      expect(guard.canActivate(context)).toBe(true);
    });

    it('should deny access if user has no roles', () => {
      const context = createMockExecutionContext({ roles: [] }, reflector, [UserRole.CUSTOMER]);
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should ignore invalid roles in user object and still grant access', () => {
      const user = { roles: ['invalid-role', UserRole.STAFF] };
      const context = createMockExecutionContext(user, reflector, [UserRole.STAFF]);
      expect(guard.canActivate(context)).toBe(true);
    });

    it('should deny access if user has only invalid roles', () => {
        const user = { roles: ['invalid-role', 'another-invalid'] };
        const context = createMockExecutionContext(user, reflector, [UserRole.STAFF]);
        expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      });
  });

  describe('Roles Decorator', () => {
    it('should apply roles to a class', () => {
      @Roles(UserRole.ADMIN)
      class TestClass {}
      const roles = Reflect.getMetadata(ROLES_KEY, TestClass);
      expect(roles).toEqual([UserRole.ADMIN]);
    });

    it('should apply roles to a method', () => {
      class TestClass {
        @Roles(UserRole.CUSTOMER)
        testMethod() {}
      }
      const roles = Reflect.getMetadata(ROLES_KEY, TestClass.prototype.testMethod);
      expect(roles).toEqual([UserRole.CUSTOMER]);
    });
  });
});