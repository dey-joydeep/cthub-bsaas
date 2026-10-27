import { Prisma } from '@prisma/client';
import { BASIC_USER_SELECT } from '@cthub-bsaas/features/appointment';

/**
 * Customer with user details
 */
export const CUSTOMER_WITH_USER = {
  customerId: true,
  userId: true,
  user: {
    select: {
      ...BASIC_USER_SELECT,
    },
  },
} as const satisfies Prisma.CustomerSelect;

/**
 * Product sale with related data
 */
export const PRODUCT_SALE_INCLUDE = {
  tenantProduct: {
    select: {
      id: true,
      name: true,
      price: true,
    },
  },
  customerRef: {
    select: CUSTOMER_WITH_USER,
  },
} as const satisfies Prisma.ProductSaleInclude;
