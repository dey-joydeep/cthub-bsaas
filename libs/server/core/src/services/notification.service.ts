import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { Notification } from '../models/notification.model';

/**
 * Server-only NotificationService (NestJS)
 *
 * This implementation is intended for backend usage only and should not be
 * imported by Angular/web apps. Frontend clients must use the web version at:
 * `@cthub-bsaas/web-core/http` → `libs/web/core/http/src/lib/services/notification.service.ts`.
 *
 * Notes:
 * - Uses NestJS `@Injectable` and lifecycle hook `OnModuleDestroy`.
 * - Maintains in-memory notifications suitable for server-side flows.
 * - Not exported from `libs/core/src/index.ts` to avoid accidental web usage.
 */
@Injectable()
export class NotificationService implements OnModuleDestroy {
  private notifications: Notification[] = [];
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);

  // Public observables
  public readonly notifications$ = this.notificationsSubject.asObservable();
  public readonly unreadCount$ = this.notifications$.pipe(map((notifications) => notifications.filter((n) => !n.read).length));
  public readonly loading$ = this.loadingSubject.asObservable();
  public readonly hasUnread$ = this.unreadCount$.pipe(map((count) => count > 0));

  constructor() {}

  onModuleDestroy() {
    this.notificationsSubject.complete();
    this.loadingSubject.complete();
  }

  // Core notification methods
  async getNotifications(): Promise<Notification[]> {
    this.loadingSubject.next(true);
    try {
      // In a real app, you might fetch from an API here
      // For now, return the in-memory array
      return [...this.notifications];
    } finally {
      this.loadingSubject.next(false);
    }
  }

  async markAsRead(notificationId: string): Promise<Notification> {
    const notification = this.notifications.find((n) => n.id === notificationId);
    if (!notification) {
      throw new Error('Notification not found');
    }

    const updatedNotification = { ...notification, read: true };
    this.notifications = this.notifications.map((n) => (n.id === notificationId ? updatedNotification : n));

    this.notificationsSubject.next([...this.notifications]);
    return updatedNotification;
  }

  async markAllAsRead(): Promise<void> {
    this.notifications = this.notifications.map((notification) => ({
      ...notification,
      read: true,
    }));
    this.notificationsSubject.next([...this.notifications]);
  }

  addNotification(notification: Partial<Notification>): Notification {
    const newNotification: Notification = {
      id: Math.random().toString(36).substr(2, 9),
      title: notification.title || '',
      message: notification.message || '',
      type: notification.type || 'info',
      read: false,
      createdAt: new Date(),
      ...notification,
    };

    this.notifications = [newNotification, ...this.notifications];
    this.notificationsSubject.next([...this.notifications]);

    return newNotification;
  }

  /**
   * Show an error notification
   * @param message The error message to display
   * @param title Optional title for the notification (defaults to 'Error')
   */
  showError(message: string, title: string = 'Error'): void {
    this.addNotification({
      title,
      message,
      type: 'error',
    });
  }

  /**
   * Show a success notification
   * @param message The success message to display
   * @param title Optional title for the notification (defaults to 'Success')
   */
  showSuccess(message: string, title: string = 'Success'): void {
    this.addNotification({
      title,
      message,
      type: 'success',
    });
  }
}
