import { z } from 'zod';

export const createSocialSchema = z.object({
  userId: z.string().min(1, 'userId is required'),
  platform: z.string().min(1, 'Platform is required'),
  handle: z.string().min(1, 'Handle is required'),
  url: z.string().url('URL must be valid'),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const updateSocialSchema = z
  .object({
    platform: z.string().min(1).optional(),
    handle: z.string().min(1).optional(),
    url: z.string().url().optional(),
    updatedAt: z.string().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });
