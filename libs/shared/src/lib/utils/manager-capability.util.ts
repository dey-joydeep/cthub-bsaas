import type { AuthenticatedUser } from '../types/user.types';

/**
 * Recognized position titles for branch managers.
 * @public
 */
export const BRANCH_MANAGER_POSITIONS: ReadonlySet<string> = new Set(['branch manager', 'manager']);

/**
 * Normalizes a position title by trimming whitespace and converting to lowercase.
 *
 * @param {string | null | undefined} value - Raw position string.
 * @returns {string | null} Normalized position or null if empty.
 * @public
 */
export function normalizeBranchPosition(value: string | null | undefined): string | null {
  const normalized = value?.trim().toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ');
  return normalized && normalized.length > 0 ? normalized : null;
}

/**
 * Checks whether a given position string corresponds to a branch manager position.
 *
 * @param {string | null | undefined} value - Position string to check.
 * @returns {boolean} True if the position qualifies as a branch manager.
 * @public
 */
export function isBranchManagerPosition(value: string | null | undefined): boolean {
  const normalized = normalizeBranchPosition(value);
  return normalized !== null && BRANCH_MANAGER_POSITIONS.has(normalized);
}

/**
 * User shape with role and manager authorization properties.
 * @public
 */
export interface ManagerCapabilityUser {
  /** Single role or primary role string. */
  readonly role?: string | null;
  /** Role collection supporting string or object format. */
  readonly roles?: readonly (string | { name?: string | null })[] | null;
  /** List of branch IDs that the user is authorized to manage. */
  readonly managedBranchIds?: readonly string[] | null;
  /** Explicit flag indicating whether the user can manage branch settings. */
  readonly canManageBranches?: boolean | null;
  /** Allow additional properties. */
  readonly [key: string]: unknown;
}

/**
 * Determines whether a user has branch manager capability.
 *
 * Owners and admins are inherently authorized to manage branches.
 * Staff members must either have an explicit `canManageBranches === true` or at least one managed branch ID.
 *
 * @param {ManagerCapabilityUser | AuthenticatedUser | null | undefined} user - User to check.
 * @returns {boolean} True if the user has branch manager capability.
 * @public
 */
export function hasManagerCapability(
  user?: ManagerCapabilityUser | AuthenticatedUser | null,
): boolean {
  if (!user) {
    return false;
  }

  if (user.canManageBranches === true) {
    return true;
  }

  const roleStr = typeof user.role === 'string' ? user.role.toLowerCase() : '';
  const roleNames = Array.isArray(user.roles)
    ? user.roles.map((r) => {
        if (typeof r === 'string') return r.toLowerCase();
        if (r && typeof r === 'object' && typeof r.name === 'string') return r.name.toLowerCase();
        return '';
      })
    : [];
  const allRoles = new Set([roleStr, ...roleNames].filter(Boolean));

  if (allRoles.has('owner') || allRoles.has('admin')) {
    return true;
  }

  if (Array.isArray(user.managedBranchIds) && user.managedBranchIds.length > 0) {
    return true;
  }

  return false;
}
