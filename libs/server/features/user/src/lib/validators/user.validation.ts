import { z } from 'zod';
// Removed broken '../../utils/validators' import. Using Zod's built-ins and a safe phone regex.

export const registerUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  tenantId: z.string().min(1, 'tenantId is required'),
  phone: z
    .string()
    .optional()
    .refine((val) => !val || /^\+?[1-9]\d{6,14}$/.test(val), { message: 'Invalid phone number' }),
  roles: z.array(z.string()).optional(),
  isVerified: z.boolean().optional(),
  saasOwner: z.boolean().optional(),
  salonStaff: z.boolean().optional(),
  customer: z.boolean().optional(),
});

export const updateUserSchema = z
  .object({
    name: z.string().min(1).optional(),
    email: z
      .string()
      .email('Invalid email address')
      .optional()
      .refine((val) => !val || /.+@.+\..+/.test(val), { message: 'Invalid email format' }),
    password: z.string().min(6).optional(),
    phone: z
      .string()
      .optional()
      .refine((val) => !val || /^\+?[1-9]\d{6,14}$/.test(val), { message: 'Invalid phone number' }),
    roles: z.array(z.string()).optional(),
    isVerified: z.boolean().optional(),
    saasOwner: z.boolean().optional(),
    salonStaff: z.boolean().optional(),
    customer: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });
