import { Prisma } from '@prisma/client';
import { CUSTOMER_SELECT, SALON_SELECT, TENANT_PRODUCT_SELECT, TENANT_SERVICE_SELECT } from './appointment.model';
import { UserWithMinimalInfo } from './user-params.model';
import { PRODUCT_SALE_INCLUDE } from './includes/customer.includes';
import { REVIEW_INCLUDE } from './includes/review.includes';
import { SALON_SERVICE_SELECT } from './includes/service.includes';
import { STAFF_WITH_SALON_SELECT } from './includes/user.includes';

/**
 * Appointment with all related data
 */
export const APPOINTMENT_INCLUDES = {
  // Customer who booked the appointment
  customerUser: {
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      isActive: true,
    },
  },

  // Customer reference if available
  customer: {
    select: {
      customerId: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
    },
  },

  // Tenant/salon where the appointment is booked
  tenant: {
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
        },
      },
    },
  },

  // Services booked in this appointment
  services: {
    select: {
      id: true,
      salonService: {
        select: SALON_SERVICE_SELECT,
      },
      staff: {
        select: STAFF_WITH_SALON_SELECT,
      },
      price: true,
      duration: true,
      scheduledAt: true,
      status: true,
      notes: true,
      startTime: true,
      endTime: true,
      createdAt: true,
      updatedAt: true,
    },
  },

  // Reviews left for this appointment
  reviews: {
    select: {
      ...REVIEW_INCLUDE,
      id: true,
      rating: true,
      comment: true,
      response: true,
      isApproved: true,
      isFeatured: true,
      createdAt: true,
      updatedAt: true,
    },
  },

  // Products sold during this appointment
  productSales: {
    select: {
      ...PRODUCT_SALE_INCLUDE,
      id: true,
      quantity: true,
      unitPrice: true,
      discountAmount: true,
      taxAmount: true,
      totalAmount: true,
      notes: true,
      createdAt: true,
      updatedAt: true,
    },
  },
} as const satisfies Prisma.AppointmentInclude;

// Export types for type safety
export type AppointmentWithDetails = Prisma.AppointmentGetPayload<{
  include: typeof APPOINTMENT_INCLUDES;
}>;
