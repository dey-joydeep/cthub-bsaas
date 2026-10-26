import { Prisma } from '@prisma/client';

/**
 * Basic service category fields
 */
export const SERVICE_CATEGORY_SELECT = {
  id: true,
  name: true,
  description: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const satisfies Prisma.ServiceCategorySelect;

/**
 * Basic salon service select with essential relations
 */
export const SALON_SERVICE_SELECT = {
  id: true,
  name: true,
  description: true,
  price: true,
  duration: true,
  isActive: true,
  salon: {
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      businessAddress: {
        select: {
          id: true,
          line1: true,
          line2: true,
          postalCode: true,
          city: true,
          state: true,
          country: true,
        },
      },
    },
  },
  serviceCategory: {
    select: SERVICE_CATEGORY_SELECT,
  },
  createdAt: true,
  updatedAt: true,
} as const satisfies Prisma.SalonServiceSelect;
