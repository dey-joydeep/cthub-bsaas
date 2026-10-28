import {
  BRANCH_MANAGER_POSITIONS,
  hasManagerCapability,
  isBranchManagerPosition,
  normalizeBranchPosition,
} from './manager-capability.util';
import { UserRole } from '../enums/user-role.enum';

describe('manager-capability.util', () => {
  describe('normalizeBranchPosition', () => {
    it('returns null for empty, whitespace, or undefined/null values', () => {
      expect(normalizeBranchPosition(null)).toBeNull();
      expect(normalizeBranchPosition(undefined)).toBeNull();
      expect(normalizeBranchPosition('')).toBeNull();
      expect(normalizeBranchPosition('   ')).toBeNull();
    });

    it('trims and lowercases position titles', () => {
      expect(normalizeBranchPosition('  Branch Manager  ')).toBe('branch manager');
      expect(normalizeBranchPosition('MANAGER')).toBe('manager');
      expect(normalizeBranchPosition('Stylist')).toBe('stylist');
    });
  });

  describe('isBranchManagerPosition', () => {
    it('recognizes supported manager positions case-insensitively', () => {
      expect(BRANCH_MANAGER_POSITIONS.has('manager')).toBe(true);
      expect(isBranchManagerPosition('Branch Manager')).toBe(true);
      expect(isBranchManagerPosition('branch manager')).toBe(true);
      expect(isBranchManagerPosition('Manager')).toBe(true);
      expect(isBranchManagerPosition('MANAGER')).toBe(true);
    });

    it('rejects other positions or invalid inputs', () => {
      expect(isBranchManagerPosition('Stylist')).toBe(false);
      expect(isBranchManagerPosition('Receptionist')).toBe(false);
      expect(isBranchManagerPosition('Assistant')).toBe(false);
      expect(isBranchManagerPosition(null)).toBe(false);
      expect(isBranchManagerPosition(undefined)).toBe(false);
      expect(isBranchManagerPosition('')).toBe(false);
    });
  });

  describe('hasManagerCapability', () => {
    it('returns false for null or undefined user', () => {
      expect(hasManagerCapability(null)).toBe(false);
      expect(hasManagerCapability(undefined)).toBe(false);
    });

    it('returns true when canManageBranches is explicitly true', () => {
      expect(hasManagerCapability({ role: 'staff', canManageBranches: true })).toBe(true);
    });

    it('returns false when canManageBranches is explicitly false even with managedBranchIds', () => {
      expect(
        hasManagerCapability({
          role: 'staff',
          managedBranchIds: ['branch-1'],
          canManageBranches: false,
        }),
      ).toBe(false);
    });

    it('returns true for owner and admin roles regardless of managedBranchIds', () => {
      expect(hasManagerCapability({ role: 'owner' })).toBe(true);
      expect(hasManagerCapability({ role: 'ADMIN' })).toBe(true);
      expect(hasManagerCapability({ roles: [UserRole.OWNER] })).toBe(true);
      expect(hasManagerCapability({ roles: [{ name: 'ADMIN' }] })).toBe(true);
      expect(hasManagerCapability({ roles: [{ name: 'OWNER' }] })).toBe(true);
    });

    it('returns true for staff users who have managedBranchIds', () => {
      expect(
        hasManagerCapability({
          role: 'staff',
          managedBranchIds: ['branch-1'],
        }),
      ).toBe(true);
      expect(
        hasManagerCapability({
          roles: [UserRole.STAFF],
          managedBranchIds: ['branch-1', 'branch-2'],
        }),
      ).toBe(true);
      expect(
        hasManagerCapability({
          roles: [{ name: 'STAFF' }],
          managedBranchIds: ['branch-1'],
        }),
      ).toBe(true);
    });

    it('returns false for staff users without managedBranchIds or with empty array', () => {
      expect(hasManagerCapability({ role: 'staff', managedBranchIds: [] })).toBe(false);
      expect(hasManagerCapability({ role: 'staff' })).toBe(false);
      expect(hasManagerCapability({ roles: [UserRole.STAFF], managedBranchIds: [] })).toBe(false);
      expect(hasManagerCapability({ roles: [{ name: 'STAFF' }] })).toBe(false);
      expect(hasManagerCapability({ roles: [{ name: null }] })).toBe(false);
    });

    it('returns false for customer role even if non-empty managedBranchIds', () => {
      expect(hasManagerCapability({ role: 'customer' })).toBe(false);
      expect(hasManagerCapability({ role: 'customer', managedBranchIds: ['branch-1'] })).toBe(false);
    });
  });
});
