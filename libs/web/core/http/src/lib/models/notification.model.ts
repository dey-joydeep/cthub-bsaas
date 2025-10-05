export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'system' | 'promotion';

export interface NotificationAction {
  label: string;
  url?: string;
  handler?: () => void;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  icon?: string;
  read: boolean;
  createdAt: Date | string;
  metadata?: {
    [key: string]: any;
    source?: string;
    priority?: 'low' | 'medium' | 'high';
    relatedEntityType?: string;
    relatedEntityId?: string;
  };
  action?: NotificationAction;
  expiresAt?: Date | string;
}

export interface NotificationPreference {
  email: boolean;
  push: boolean;
  sms: boolean;
  inApp: boolean;
}

export interface NotificationSettings {
  global: NotificationPreference;
  types: {
    [key in NotificationType]?: NotificationPreference;
  };
}
