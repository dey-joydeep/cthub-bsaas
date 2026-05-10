export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatar?: string;
  preferences?: UserPreferences;
}

export interface UpdateProfileParams {
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatar?: string;
  preferences?: Partial<UserPreferences>;
}

export interface ChangePasswordParams {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface UserPreferences {
  language?: string;
  timezone?: string;
  theme?: 'light' | 'dark' | 'system';
  notifications?: {
    email?: boolean;
    sms?: boolean;
    push?: boolean;
    reminders?: boolean;
    promotions?: boolean;
    updates?: boolean;
  };
  privacy?: {
    showEmail?: boolean;
    showPhone?: boolean;
    showLastLogin?: boolean;
    showOnlineStatus?: boolean;
  };
  emailFrequency?: 'immediate' | 'daily' | 'weekly' | 'never';
  [key: string]: any;
}