export enum UserRole {
  ADMIN = 'admin',
  OWNER = 'owner',
  STAFF = 'staff',
  CUSTOMER = 'customer',
  GUEST = 'guest',
}

export const UserRoleLabel: Record<UserRole, string> = {
  [UserRole.ADMIN]: 'Administrator',
  [UserRole.OWNER]: 'Salon Owner',
  [UserRole.STAFF]: 'Staff Member',
  [UserRole.CUSTOMER]: 'Customer',
  [UserRole.GUEST]: 'Guest',
};

export const StaffRoles = [UserRole.OWNER, UserRole.STAFF];

export const AdminRoles = [UserRole.ADMIN];
