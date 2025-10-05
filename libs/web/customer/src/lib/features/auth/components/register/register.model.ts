import { UserRole } from '@cthub-bsaas/shared';

export interface UserParams {
  id?: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  role: UserRole;
  isActive?: boolean;
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
  lastLogin?: Date | string;
  preferences?: any;
  metadata?: Record<string, any>;
}

export interface CreateUserParams extends Omit<UserParams, 'id' | 'isActive' | 'isEmailVerified' | 'isPhoneVerified' | 'lastLogin'> {
  password: string;
  sendWelcomeEmail?: boolean;
  requireEmailVerification?: boolean;
  requirePasswordChange?: boolean;
}
