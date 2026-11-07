import type { Prisma, PrismaClient } from '@prisma/client';

export interface SystemPermissionDef {
  readonly code: string;
  readonly name: string;
  readonly category: string;
  readonly description: string;
}

export interface RolePresetDef {
  readonly code: string;
  readonly defaultName: string;
  readonly description: string;
  readonly permissions: readonly string[];
}

export const SYSTEM_PERMISSIONS: readonly SystemPermissionDef[] = [
  // Business
  {
    code: 'business.profile.manage',
    name: 'Manage salon business profile',
    category: 'Business',
    description: 'Update legal name, display name, and global settings.',
  },
  {
    code: 'business.registration.manage',
    name: 'Manage legal/tax registration',
    category: 'Business',
    description: 'Configure business tax ID and legal documents.',
  },
  // Branch
  {
    code: 'branch.profile.manage',
    name: 'Manage branch profile',
    category: 'Branch',
    description: 'Update branch location, contact info, and status.',
  },
  {
    code: 'branch.hours.manage',
    name: 'Manage branch hours/holidays',
    category: 'Branch',
    description: 'Edit operating hours and holiday schedules.',
  },
  {
    code: 'branch.policy.manage',
    name: 'Manage branch policies',
    category: 'Branch',
    description: 'Configure booking lead times, cancellation policies, and grace periods.',
  },
  // Staff
  {
    code: 'staff.profile.manage',
    name: 'Manage staff profile',
    category: 'Staff',
    description: 'Create and update staff details, branch assignments, and status.',
  },
  {
    code: 'staff.roles.manage',
    name: 'Manage staff roles',
    category: 'Staff',
    description: 'Configure business roles and assign them to staff members.',
  },
  {
    code: 'staff.shifts.manage',
    name: 'Manage staff shifts/leave',
    category: 'Staff',
    description: 'Schedule work shifts and record leave blocks.',
  },
  // Catalog
  {
    code: 'catalog.services.manage',
    name: 'Manage service catalog',
    category: 'Catalog',
    description: 'Create and edit service categories, services, and pricing.',
  },
  {
    code: 'catalog.overrides.manage',
    name: 'Manage service branch overrides',
    category: 'Catalog',
    description: 'Set branch-specific prices or duration for services.',
  },
  // Customer
  {
    code: 'customer.manage',
    name: 'Search/create customer',
    category: 'Customer',
    description: 'Search customer records, create profiles, and update details.',
  },
  {
    code: 'customer.notes.view',
    name: 'View restricted customer notes',
    category: 'Customer',
    description: 'View sensitive and clinical customer history.',
  },
  {
    code: 'customer.notes.manage',
    name: 'Create/update restricted notes',
    category: 'Customer',
    description: 'Record confidential formulas and allergy notes.',
  },
  { code: 'customer.merge', name: 'Merge customers', category: 'Customer', description: 'Deduplicate customer profiles.' },
  // Appointments
  {
    code: 'appointment.create',
    name: 'Create/reschedule appointments',
    category: 'Appointments',
    description: 'Book appointments and change timeslots.',
  },
  {
    code: 'appointment.override',
    name: 'Override booking conflict',
    category: 'Appointments',
    description: 'Book over double-booking warnings and exceptions.',
  },
  {
    code: 'appointment.cancel',
    name: 'Cancel/no-show appointments',
    category: 'Appointments',
    description: 'Mark cancellations and no-shows.',
  },
  {
    code: 'appointment.execute',
    name: 'Start/complete assigned service',
    category: 'Appointments',
    description: 'Check-in clients, begin services, and mark completed.',
  },
  // POS
  { code: 'invoice.create', name: 'Create invoice draft', category: 'POS', description: 'Generate checkout invoices and apply discounts.' },
  { code: 'invoice.finalize', name: 'Finalize invoice', category: 'POS', description: 'Lock invoices for payment.' },
  { code: 'payment.capture', name: 'Capture payment', category: 'POS', description: 'Process cash, card, and digital payments.' },
  {
    code: 'invoice.discount',
    name: 'Apply discount/price override',
    category: 'POS',
    description: 'Apply promotional coupons and custom manual discounts.',
  },
  // Reports
  {
    code: 'reports.financial.view',
    name: 'View financial reports',
    category: 'Reports',
    description: 'View daily register closures, reconciliation, and sales reports.',
  },
  // Inventory
  {
    code: 'catalog.products.manage',
    name: 'Manage product catalog',
    category: 'Inventory',
    description: 'Maintain retail product pricing and descriptions.',
  },
  {
    code: 'inventory.movement.record',
    name: 'Record stock movement',
    category: 'Inventory',
    description: 'Log stock receiving, adjustments, and salon usage.',
  },
  // Dashboard
  {
    code: 'dashboard.owner.view',
    name: 'View owner dashboard',
    category: 'Reports',
    description: 'View executive KPI dashboards and tenant-wide summaries.',
  },
] as const;

export const ROLE_PRESETS: readonly RolePresetDef[] = [
  {
    code: 'OWNER',
    defaultName: 'Owner',
    description: 'Full business control within owned businesses.',
    permissions: SYSTEM_PERMISSIONS.map((p) => p.code),
  },
  {
    code: 'MANAGER',
    defaultName: 'Branch Manager',
    description: 'Operational control for assigned branch.',
    permissions: [
      'branch.profile.manage',
      'branch.hours.manage',
      'branch.policy.manage',
      'staff.profile.manage',
      'staff.roles.manage',
      'staff.shifts.manage',
      'catalog.services.manage',
      'catalog.overrides.manage',
      'customer.manage',
      'customer.notes.view',
      'customer.notes.manage',
      'customer.merge',
      'appointment.create',
      'appointment.override',
      'appointment.cancel',
      'appointment.execute',
      'invoice.create',
      'invoice.finalize',
      'payment.capture',
      'invoice.discount',
      'reports.financial.view',
      'catalog.products.manage',
      'inventory.movement.record',
      'dashboard.owner.view',
    ],
  },
  {
    code: 'RECEPTIONIST',
    defaultName: 'Front Desk',
    description: 'Booking, walk-in, customer lookup, and basic POS.',
    permissions: [
      'customer.manage',
      'customer.notes.view',
      'customer.notes.manage',
      'appointment.create',
      'appointment.override',
      'appointment.cancel',
      'appointment.execute',
      'invoice.create',
      'invoice.finalize',
      'payment.capture',
      'invoice.discount',
      'dashboard.owner.view',
    ],
  },
  {
    code: 'STYLIST',
    defaultName: 'Service Staff',
    description: 'Assigned services, appointment status, and notes.',
    permissions: [
      'staff.profile.manage',
      'staff.shifts.manage',
      'customer.manage',
      'customer.notes.view',
      'customer.notes.manage',
      'appointment.create',
      'appointment.cancel',
      'appointment.execute',
      'dashboard.owner.view',
    ],
  },
  {
    code: 'CASHIER',
    defaultName: 'Cashier',
    description: 'Checkout, invoice, and payment capture.',
    permissions: [
      'customer.manage',
      'invoice.create',
      'invoice.finalize',
      'payment.capture',
      'invoice.discount',
      'reports.financial.view',
      'dashboard.owner.view',
    ],
  },
  {
    code: 'INVENTORY_MANAGER',
    defaultName: 'Inventory Manager',
    description: 'Product stock and movement operations.',
    permissions: ['catalog.products.manage', 'inventory.movement.record', 'dashboard.owner.view'],
  },
] as const;

export async function seedGlobalRoleMaster(prisma: PrismaClient | Prisma.TransactionClient): Promise<void> {
  for (const perm of SYSTEM_PERMISSIONS) {
    await prisma.permissionMaster.upsert({
      where: { code: perm.code },
      update: { name: perm.name, category: perm.category, description: perm.description },
      create: { code: perm.code, name: perm.name, category: perm.category, description: perm.description },
    });
  }

  for (const role of ROLE_PRESETS) {
    await prisma.roleMaster.upsert({
      where: { code: role.code },
      update: { defaultName: role.defaultName, description: role.description },
      create: { code: role.code, defaultName: role.defaultName, description: role.description, isSystemRole: true },
    });

    for (const permissionCode of role.permissions) {
      await prisma.roleMasterPermission.upsert({
        where: {
          roleCode_permissionCode: {
            roleCode: role.code,
            permissionCode,
          },
        },
        update: {},
        create: {
          roleCode: role.code,
          permissionCode,
        },
      });
    }
  }
}

export async function cloneDefaultRolesForBusiness(prisma: PrismaClient | Prisma.TransactionClient, businessId: string): Promise<void> {
  let roleMasters = await prisma.roleMaster.findMany({
    include: {
      permissions: true,
    },
  });

  if (roleMasters.length === 0) {
    await seedGlobalRoleMaster(prisma);
    roleMasters = await prisma.roleMaster.findMany({
      include: {
        permissions: true,
      },
    });
  }

  for (const master of roleMasters) {
    const businessRole = await prisma.businessRole.upsert({
      where: {
        businessId_name: {
          businessId,
          name: master.defaultName,
        },
      },
      update: {
        roleCode: master.code,
        description: master.description,
        isSystemDefault: true,
      },
      create: {
        businessId,
        roleCode: master.code,
        name: master.defaultName,
        description: master.description,
        isSystemDefault: true,
        isActive: true,
      },
    });

    for (const perm of master.permissions) {
      await prisma.businessRolePermission.upsert({
        where: {
          businessRoleId_permissionCode: {
            businessRoleId: businessRole.id,
            permissionCode: perm.permissionCode,
          },
        },
        update: {},
        create: {
          businessRoleId: businessRole.id,
          permissionCode: perm.permissionCode,
        },
      });
    }
  }
}
