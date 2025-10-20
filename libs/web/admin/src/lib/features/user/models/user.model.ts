import { UserRole } from '@cthub-bsaas/shared';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthUser extends Pick<User, 'id' | 'email' | 'fullName' | 'role' | 'avatar'> {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
}

export interface UserProfile extends Omit<User, 'password'> {
  // Additional profile-specific properties can be added here
  preferences?: {
    language?: string;
    timezone?: string;
    notifications?: {
      email?: boolean;
      push?: boolean;
      sms?: boolean;
    };
  };
}
