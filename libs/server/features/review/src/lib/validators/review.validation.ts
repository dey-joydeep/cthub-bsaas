import { z } from 'zod';
import { isISODateString } from '../../utils/validators';

export const createReviewSchema = z.object({
  userId: z.string().min(1, 'userId is required'),
  salonId: z.string().min(1, 'salonId is required'),
  rating: z.number().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5'),
  comment: z.string().optional(),
  createdAt: z
    .string()
    .optional()
    .refine((val) => !val || isISODateString(val), {
      message: 'createdAt must be a valid ISO date string',
    }),
  updatedAt: z
    .string()
    .optional()
    .refine((val) => !val || isISODateString(val), {
      message: 'updatedAt must be a valid ISO date string',
    }),
});

export const updateReviewSchema = z
  .object({
    rating: z.number().min(1).max(5).optional(),
    comment: z.string().optional(),
    updatedAt: z
      .string()
      .optional()
      .refine((val) => !val || isISODateString(val), {
        message: 'updatedAt must be a valid ISO date string',
      }),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });
