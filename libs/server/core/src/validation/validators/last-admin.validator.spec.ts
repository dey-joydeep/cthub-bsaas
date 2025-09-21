import { IsNotLastAdminConstraint, LastAdminValidationError } from './last-admin.validator';
import { UserRole } from '@cthub-bsaas/shared';
import { ValidationArguments } from 'class-validator';
import { ILastAdminValidatorDb } from '@cthub-bsaas/server-contracts-auth';
import { mock } from 'jest-mock-extended';

describe('IsNotLastAdminConstraint', () => {
  let constraint: IsNotLastAdminConstraint;
  let dbMock: jest.Mocked<ILastAdminValidatorDb>;

  beforeEach(() => {
    dbMock = mock<ILastAdminValidatorDb>();
    constraint = new IsNotLastAdminConstraint(dbMock);
  });

  const createMockArgs = (roleToSet?: UserRole, constraints?: any[]): ValidationArguments => ({
    value: 'user-id-123',
    constraints: constraints || [],
    targetName: '',
    object: { role: roleToSet },
    property: 'userId',
  });

  it('should return true if role is not being changed', async () => {
    const args = createMockArgs(undefined);
    await expect(constraint.validate('user-id-123', args)).resolves.toBeTruthy();
  });

  it('should return true if the user is not an admin', async () => {
    dbMock.getUserRoles.mockResolvedValue([]);
    const args = createMockArgs(UserRole.STAFF);
    await expect(constraint.validate('user-id-123', args)).resolves.toBeTruthy();
  });

  it('should return true if other admins exist', async () => {
    dbMock.getUserRoles.mockResolvedValue([{ role: { name: UserRole.ADMIN } }]);
    dbMock.getActiveStaffRecord.mockResolvedValue({ salonId: 'salon-1' });
    dbMock.countOtherActiveAdmins.mockResolvedValue(1);
    const args = createMockArgs(UserRole.STAFF);
    await expect(constraint.validate('user-id-123', args)).resolves.toBeTruthy();
  });

  it('should return true if user is an admin but not active staff', async () => {
    dbMock.getUserRoles.mockResolvedValue([{ role: { name: UserRole.ADMIN } }]);
    dbMock.getActiveStaffRecord.mockResolvedValue(null);
    const args = createMockArgs(UserRole.STAFF);
    await expect(constraint.validate('user-id-123', args)).resolves.toBeTruthy();
  });

  it('should throw an error if no other admins exist', async () => {
    dbMock.getUserRoles.mockResolvedValue([{ role: { name: UserRole.ADMIN } }]);
    dbMock.getActiveStaffRecord.mockResolvedValue({ salonId: 'salon-1' });
    dbMock.countOtherActiveAdmins.mockResolvedValue(0);
    const args = createMockArgs(UserRole.STAFF);
    await expect(constraint.validate('user-id-123', args)).rejects.toThrow();
  });

  it('should return a specific message for LastAdminValidationError', () => {
    const error = new LastAdminValidationError('Cannot remove the last admin');
    const args = createMockArgs(UserRole.STAFF, [error]);
    expect(constraint.defaultMessage(args)).toBe('Cannot remove the last admin');
  });

  it('should return a generic message for other errors', () => {
    const args = createMockArgs(UserRole.STAFF, [new Error('generic')]);
    expect(constraint.defaultMessage(args)).toBe('Validation failed while checking admin status');
  });
});
