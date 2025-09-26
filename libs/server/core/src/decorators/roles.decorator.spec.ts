import { Roles, ROLES_KEY } from './roles.decorator';
import { UserRole } from '@cthub-bsaas/shared';

describe('Roles Decorator', () => {
  it('should set the correct metadata', () => {
    class TestClass {
      @Roles(UserRole.ADMIN, UserRole.OWNER)
      public testMethod() {}
    }

    const roles = Reflect.getMetadata(ROLES_KEY, TestClass.prototype.testMethod) as UserRole[];

    expect(roles).toEqual([UserRole.ADMIN, UserRole.OWNER]);
  });

  it('should work with a single role', () => {
    class TestClass {
      @Roles(UserRole.STAFF)
      public testMethod() {}
    }

    const roles = Reflect.getMetadata(ROLES_KEY, TestClass.prototype.testMethod) as UserRole[];

    expect(roles).toEqual([UserRole.STAFF]);
  });

  it('should work with no roles', () => {
    class TestClass {
      @Roles()
      public testMethod() {}
    }

    const roles = Reflect.getMetadata(ROLES_KEY, TestClass.prototype.testMethod) as UserRole[];

    expect(roles).toEqual([]);
  });
});
