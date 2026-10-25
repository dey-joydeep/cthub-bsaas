import { z } from 'zod';

export const registerUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
  phone: z.string().optional(),
  role: z.string().optional(),
});

export const updateUserSchema = z.object({
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
  name: z.string().min(1).optional(),
  phone: z.string().optional(),
  role: z.string().optional(),
});

export class UserValidator {
  static validateRegister(data: any) {
    return registerUserSchema.parse(data);
  }
  static validateUpdate(data: any) {
    return updateUserSchema.parse(data);
  }
}
