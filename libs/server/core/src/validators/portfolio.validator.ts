import { z } from 'zod';

export const createPortfolioSchema = z.object({
  tenant_id: z.string().min(1, { message: 'validation.tenant_id_required' }),
  user_id: z.string().min(1, { message: 'validation.user_id_required' }),
  // No image_url, validation handled by multer/sharp in controller
  description: z.string().min(1, { message: 'validation.description_required' }),
});

export const updatePortfolioSchema = z.object({
  // No image_url, validation handled by multer/sharp in controller
  description: z.string().min(1, { message: 'validation.description_required' }).optional(),
});
