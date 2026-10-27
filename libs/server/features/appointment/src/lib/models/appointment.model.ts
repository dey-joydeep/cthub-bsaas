import { Prisma } from '@prisma/client';
import { APPOINTMENT_INCLUDES } from './appointment.includes';

type PrismaAppointment = Prisma.AppointmentGetPayload<{
  include: typeof APPOINTMENT_INCLUDES;
}>;

// Define the base type for tenant salon service using the correct Prisma type
type TenantService = Prisma.TenantSalonServiceGetPayload<{
  include: {
    tenant: true;
    salonService: {
      include: {
        serviceCategory: true;
        salon: true;
        staff: true;
      };
    };
  };
}>;

import { AppointmentStatus } from '@cthub-bsaas/shared/enums/appointment-status.enum';

export const APPOINTMENT_STATUS_VALUES = Object.values(AppointmentStatus) as AppointmentStatus[];
export const VALID_APPOINTMENT_STATUSES = APPOINTMENT_STATUS_VALUES;

// Reusable include fragments
export const CUSTOMER_SELECT = {
  id: true,
  name: true,
  email: true,
  phone: true,
  isActive: true,
  tenantId: true,
  createdAt: true,
  updatedAt: true,
  lastLoginAt: true,
  isVerified: true,
  avatarUrl: true,
} as const;

export const TENANT_SERVICE_SELECT = {
  id: true,
  name: true,
  description: true,
  price: true,
  duration: true,
  tenantId: true,
  salonId: true,
  serviceCategoryId: true,
  isActive: true,
  taxRate: true,
  isTaxable: true,
  sku: true,
  barcode: true,
  quantityInStock: true,
  reorderPoint: true,
  metadata: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const SALON_SELECT: Prisma.SalonSelect = {
  id: true,
  name: true,
  description: true,
  businessAddress: {
    select: {
      id: true,
      line1: true,
      line2: true,
      buildingName: true,
      floor: true,
      landmark: true,
      postalCode: true,
      latitude: true,
      longitude: true,
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
    },
  },
  phone: true,
  email: true,
  website: true,
  logoUrl: true,
  coverImageUrl: true,
  isActive: true,
  isVerified: true,
  ownerId: true,
  tenantId: true,
  averageRating: true,
  reviewCount: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const TENANT_PRODUCT_SELECT = {
  id: true,
  name: true,
  description: true,
  price: true,
  sku: true,
  barcode: true,
  quantityInStock: true,
  reorderPoint: true,
  metadata: true,
  isActive: true,
  taxRate: true,
  isTaxable: true,
  createdAt: true,
  updatedAt: true,
  tenantId: true,
  salonId: true,
  productCategoryId: true,
  productType: true,
  productSubtype: true,
  productBrand: true,
  productModel: true,
  productSerialNumber: true,
  productWarranty: true,
  productWeight: true,
  productLength: true,
  productWidth: true,
  productHeight: true,
  productDepth: true,
  productColor: true,
  productMaterial: true,
  productPattern: true,
  productStyle: true,
  productCondition: true,
  productImage: true,
  productImageThumb: true,
  productVideo: true,
  productVideoThumb: true,
  product3DModel: true,
  product3DModelThumb: true,
  productARModel: true,
  productARModelThumb: true,
  productVRModel: true,
  productVRModelThumb: true,
  productManual: true,
  productManualThumb: true,
  productWarrantyDocument: true,
  productWarrantyDocumentThumb: true,
  productReturnPolicy: true,
  productReturnPolicyThumb: true,
  productAdditionalInfo: true,
  productAdditionalInfoThumb: true,
  productReviews: true,
  productRatings: true,
  productQuestions: true,
  productAnswers: true,
  productSpecs: true,
  productSpecsThumb: true,
  productCertifications: true,
  productCertificationsThumb: true,
  productAwards: true,
  productAwardsThumb: true,
  productPatents: true,
  productPatentsThumb: true,
  productTrademarks: true,
  productTrademarksThumb: true,
  productCopyrights: true,
  productCopyrightsThumb: true,
  productOther: true,
  productOtherThumb: true,
} as const;

export const REVIEW_SELECT = {
  id: true,
  rating: true,
  comment: true,
  isAnonymous: true,
  isApproved: true,
  response: true,
  responseDate: true,
  createdAt: true,
  updatedAt: true,
  tenantId: true,
  userId: true,
  salonId: true,
  appointmentId: true,
  staffId: true,
  adminComment: true,
} as const;

export const PRODUCT_SALE_SELECT = {
  id: true,
  appointmentId: true,
  productId: true,
  tenantProductId: true,
  tenantId: true,
  customerId: true,
  quantity: true,
  pricePerUnit: true,
  unitPrice: true,
  totalPrice: true,
  discount: true,
  taxRate: true,
  taxAmount: true,
  isRefunded: true,
  refundedAt: true,
  refundReason: true,
  notes: true,
  metadata: true,
  createdAt: true,
  updatedAt: true,
} as const;

// Base types for related entities
type BaseProductSale = {
  id: string;
  tenantId: string;
  tenantProductId: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number | null;
  taxAmount: number | null;
  totalAmount: number;
  saleDate: Date;
  soldById: string;
  soldBy: UserWithMinimalInfo;
  appointmentId: string | null;
  customerId: string | null;
  customerUser?: UserWithMinimalInfo | null;
  customerRef?: CustomerWithUser | null;
  notes: string | null;
  isRefunded: boolean;
  refundDate: Date | null;
  refundReason: string | null;
  metadata: Prisma.JsonValue | null;
  createdAt: Date;
  updatedAt: Date;
  product?: TenantProductWithDetails | null;
};

type CustomerWithUser = {
  customerId: string;
  userId: string;
  loyaltyPoints: number;
  preferredSalonId: string | null;
  registeredAt: Date;
  updatedAt: Date;
  user: UserWithMinimalInfo;
};

type BaseReview = {
  id: string;
  tenantId: string;
  customerId: string;
  userId: string;
  appointmentId: string | null;
  rating: number;
  comment: string | null;
  response: string | null;
  isApproved: boolean;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
  // Relations
  user?: UserWithMinimalInfo;
  customer?: CustomerWithUser;
  tenant?: {
    id: string;
    name: string;
  };
  appointment?: {
    id: string;
    startTime: Date;
    endTime: Date;
    status: string;
  };
};

type BaseAppointmentService = {
  id: string;
  appointmentId: string;
  tenantServiceId: string | null;
  staffId: string | null;
  price: number | Prisma.Decimal;
  duration: number;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  tenantService: TenantServiceWithDetails | null;
  staff?: StaffWithUser | null;
};

type TenantServiceWithDetails = TenantService & {
  // Additional properties can be added here if needed
  // The base TenantService already includes all necessary relations
  // through the Prisma include clause
};

type TenantProductWithDetails = Prisma.TenantProductGetPayload<{
  select: typeof TENANT_PRODUCT_SELECT;
}>;

export type RawAppointment = PrismaAppointment & {
  customer?: UserWithMinimalInfo | null;
  staff?: StaffWithUser | null;
  services: BaseAppointmentService[];
  salons: Array<Prisma.SalonGetPayload<{ select: typeof SALON_SELECT }>>;
  reviews: BaseReview[];
  productSales: BaseProductSale[];
};

export interface ServiceWithDetails {
  id: string;
  name: string;
  description: string | null;
  duration: number;
  price: Prisma.Decimal;
  isActive: boolean;
  metadata: Prisma.JsonValue;
  createdAt: Date;
  updatedAt: Date;
  // Relations
  salonService?: {
    id: string;
    salonId: string;
    serviceCategoryId: string;
    isActive: boolean;
    serviceCategory: {
      id: string;
      name: string;
    };
    staff: Array<{
      id: string;
      userId: string;
      salonId: string;
      position: string | null;
      isActive: boolean;
      user: UserWithMinimalInfo;
    }>;
  };
  // Additional properties from TenantSalonService
  tenantService?: {
    isActive: boolean;
    addedAt: Date;
    removedAt: Date | null;
    lastActiveAt: Date | null;
  };
}

export interface UserWithMinimalInfo {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  isActive: boolean;
  tenantId: string | null;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date | null;
  isVerified: boolean;
  avatarUrl?: string | null;
  passwordHash?: string;
}

export interface SalonWithMinimalInfo {
  id: string;
  name: string;
  description: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  logo: string | null;
  banner: string | null;
  isActive: boolean;
  isVerified: boolean;
  isDeleted: boolean;
  deletedAt: Date | null;
  ownerId: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
  businessAddress?: {
    id: string;
    line1: string;
    line2: string | null;
    buildingName: string | null;
    floor: string | null;
    landmark: string | null;
    latitude: number | null;
    longitude: number | null;
    postalCode: string;
    city: {
      id: string;
      name: string;
      state: {
        id: string;
        name: string;
        stateCode: string;
        country: {
          id: string;
          name: string;
          iso2: string;
          phoneCode: string | null;
        };
      };
      country: {
        id: string;
        name: string;
        iso2: string;
        phoneCode: string | null;
      };
    };
  } | null;
  services?: ServiceWithDetails[];
  salonStaff?: StaffWithUser[];
}

export interface StaffWithUser {
  id: string;
  userId: string;
  salonId: string;
  position: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  hireDate: Date | null;
  terminationDate: Date | null;
  user: UserWithMinimalInfo;
  salon: SalonWithMinimalInfo;
  services: ServiceWithDetails[];
}

export interface AppointmentServiceWithDetails {
  id: string;
  appointmentId: string;
  salonServiceId: string;
  staffId: string | null;
  scheduledAt: Date | null;
  status: string;
  price: Prisma.Decimal | null;
  duration: number | null;
  notes: string | null;
  startTime: Date | null;
  endTime: Date | null;
  createdAt: Date;
  updatedAt: Date;
  tenantService: {
    id: string;
    tenantId: string;
    salonServiceId: string;
    isActive: boolean;
    addedAt: Date;
    removedAt: Date | null;
    lastActiveAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    tenant: {
      id: string;
      name: string;
      email: string;
      phone: string | null;
    };
    salonService: {
      id: string;
      salonId: string;
      serviceCategoryId: string;
      isActive: boolean;
      serviceCategory: {
        id: string;
        name: string;
      };
      salon: {
        id: string;
        name: string;
      };
      staff: Array<{
        id: string;
        userId: string;
        salonId: string;
        position: string | null;
        isActive: boolean;
        user: UserWithMinimalInfo;
      }>;
    };
  } | null;
  staff: StaffWithUser | null;
}

// Corrected AppointmentWithDetails to match schema.prisma
export interface AppointmentWithDetails {
  id: string;
  tenantId: string;
  customerId: string | null;
  staffId: string | null;
  startTime: Date;
  endTime: Date;
  status: AppointmentStatus;
  notes: string | null;
  metadata: unknown | null;
  createdAt: Date;
  updatedAt: Date;
  cancelledAt: Date | null;
  cancellationReason: string | null;
  customerName: string | null;
  customerPhone: string | null;
  customerEmail: string | null;
  // Relations
  customerUser: UserWithMinimalInfo | null;
  customer: CustomerWithUser | null;
  staff: StaffWithUser | null;
  services: AppointmentServiceWithDetails[];
  salons: SalonWithMinimalInfo[];
  reviews: BaseReview[];
  productSales: BaseProductSale[];
  _count: {
    services: number;
    reviews: number;
    productSales: number;
  };
}
