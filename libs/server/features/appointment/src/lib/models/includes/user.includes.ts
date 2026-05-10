import { Prisma } from '@prisma/client';

/**
 * Basic user fields included in most appointment-related queries
 * Only includes essential identification and contact information
 */
export const BASIC_USER_SELECT = {
  id: true,
  name: true,
  email: true,
  phone: true,
} as const satisfies Prisma.UserSelect;

/**
 * Staff user with salon information
 */
export const STAFF_WITH_SALON_SELECT = {
  id: true,
  userId: true,
  position: true,
  isActive: true,
  user: {
    select: {
      ...BASIC_USER_SELECT,
    },
  },
  salon: {
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
    },
  },
  createdAt: true,
  updatedAt: true,
} as const;
