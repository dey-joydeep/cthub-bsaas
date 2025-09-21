import { HasPermissionToAssignRoleConstraint, HasPermissionToAssignRole } from './has-permission.validator';
import { UserRole } from '@cthub-bsaas/shared';
import { ValidationArguments, validate } from 'class-validator';
import { AuthenticatedUser } from '@cthub-bsaas/shared';

describe('HasPermissionToAssignRoleConstraint', () => {
  let constraint: HasPermissionToAssignRoleConstraint;

  beforeEach(() => {
    constraint = new HasPermissionToAssignRoleConstraint();
  });

  const createMockArgs = (user: Partial<AuthenticatedUser> | null): ValidationArguments => ({
    value: UserRole.STAFF,
    constraints: [],
    targetName: '',
    object: { request: { user } },
    property: 'role',
  });

  it('should be defined', () => {
    expect(constraint).toBeDefined();
  });

  it('should return true if user has permission to assign role', () => {
    const args = createMockArgs({ roles: [{ name: UserRole.ADMIN }] });
    expect(constraint.validate(UserRole.OWNER, args)).toBeTruthy();
  });

  it('should return false if user does not have permission to assign role', () => {
    const args = createMockArgs({ roles: [{ name: UserRole.STAFF }] });
    expect(constraint.validate(UserRole.OWNER, args)).toBeFalsy();
  });

  it('should return false if user has no roles', () => {
    const args = createMockArgs({ roles: [] });
    expect(constraint.validate(UserRole.STAFF, args)).toBeFalsy();
  });

  it('should return false if user object is missing', () => {
    const args = createMockArgs(null);
    expect(constraint.validate(UserRole.STAFF, args)).toBeFalsy();
  });

  it('should filter out undefined roles', () => {
    const args = createMockArgs({ roles: [undefined, { name: UserRole.STAFF }] });
    expect(constraint.validate(UserRole.CUSTOMER, args)).toBeTruthy();
  });

  it('should return a default error message', () => {
    const args = createMockArgs({ roles: [{ name: UserRole.CUSTOMER }] });
    args.value = UserRole.STAFF;
    expect(constraint.defaultMessage(args)).toBe("You don't have permission to assign the role: staff");
  });

  it('should register the decorator', async () => {
    class TestDto {
      @HasPermissionToAssignRole()
      role: UserRole;
    }
    const dto = new TestDto();
    dto.role = UserRole.ADMIN;
    const errors = await validate(dto);
    expect(errors.length).toBe(1);
    expect(errors[0].constraints).toHaveProperty('hasPermissionToAssignRole');
  });
});
