import { Prisma } from '@prisma/client';
import { BASIC_USER_SELECT } from '@cthub-bsaas/features/appointment';

/**
 * Review with user and customer details
 */
export const REVIEW_INCLUDE = {
  user: {
    select: {
      ...BASIC_USER_SELECT,
    },
  },
  customer: {
    select: {
      customerId: true,
      loyaltyPoints: true,
      registeredAt: true,
      user: {
        select: {
          ...BASIC_USER_SELECT,
        },
      },
      preferredSalonId: true,
    },
  },
} as const satisfies Prisma.ReviewSelect;
