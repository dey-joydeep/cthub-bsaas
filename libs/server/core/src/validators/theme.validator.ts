import { z } from 'zod';

export const updateThemeSchema = z.object({
  primary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, { message: 'validation.primary_color_valid' }),
  secondary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, { message: 'validation.secondary_color_valid' }),
  accent_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, { message: 'validation.accent_color_valid' }),
});
