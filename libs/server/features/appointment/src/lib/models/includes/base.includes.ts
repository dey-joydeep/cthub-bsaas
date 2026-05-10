import { Prisma } from '@prisma/client';

/**
 * Base address include with city, state, and country
 */
export const ADDRESS_INCLUDE = {
  id: true,
  line1: true,
  line2: true,
  city: {
    select: {
      id: true,
      name: true,
      state: {
        select: {
          id: true,
          name: true,
          stateCode: true,
          country: {
            select: {
              id: true,
              name: true,
              iso2: true,
            },
          },
        },
      },
    },
  },
  postalCode: true,
} as const;
