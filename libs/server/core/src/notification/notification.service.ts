import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { Notification } from '../models/notification.model';

/**
 * Server-only NotificationService (NestJS).
 *
 * This implementation is fully synchronous:
 * - No async/await and no Promises in public methods.
 * - Observables still emit changes to interested subscribers.
 *
 * Notes:
 * - This service is internal to the server layer; the web layer has its own notification service.
 * - Methods mutate an in-memory list and push next values on the corresponding subjects.
 */
@Injectable()
export class NotificationService implements OnModuleDestroy {
  private notifications: Notification[] = [];
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);

  /** Stream of notification arrays (latest first). */
  public readonly notifications$ = this.notificationsSubject.asObservable();

  /** Stream of the unread count derived from notifications$. */
  public readonly unreadCount$ = this.notifications$.pipe(map((notifications) => notifications.filter((n) => !n.read).length));

  /** Stream of a simple loading flag (toggled by getNotifications). */
  public readonly loading$ = this.loadingSubject.asObservable();

  /** Stream indicating whether any unread notifications exist. */
  public readonly hasUnread$ = this.unreadCount$.pipe(map((count) => count > 0));

  /** Complete subjects on module shutdown. */
  onModuleDestroy(): void {
    this.notificationsSubject.complete();
    this.loadingSubject.complete();
  }

  /**
   * Return current notifications synchronously.
   * Loading is toggled immediately (true → false) within the same tick.
   *
   * @returns {Notification[]} A shallow-copied array of current notifications.
   */
  getNotifications(): Notification[] {
    this.loadingSubject.next(true);
    const data = [...this.notifications];
    this.loadingSubject.next(false);
    return data;
  }

  /**
   * Mark a single notification as read.
   *
   * @param {string} notificationId The id of the notification to mark read.
   * @throws {Error} If the notification cannot be found.
   * @returns {Notification} The updated notification.
   */
  markAsRead(notificationId: string): Notification {
    const notification = this.notifications.find((n) => n.id === notificationId);
    if (!notification) {
      throw new Error('Notification not found');
    }

    const updated: Notification = { ...notification, read: true };
    this.notifications = this.notifications.map((n) => (n.id === notificationId ? updated : n));
    this.notificationsSubject.next([...this.notifications]);
    return updated;
  }

  /**
   * Mark all notifications as read.
   *
   * @returns {void}
   */
  markAllAsRead(): void {
    this.notifications = this.notifications.map((n) => ({ ...n, read: true }));
    this.notificationsSubject.next([...this.notifications]);
  }

  /**
   * Add a new notification and emit the updated list.
   *
   * @param {Partial<Notification>} notification A partial notification payload.
   * @returns {Notification} The created notification with generated id and defaults.
   */
  addNotification(notification: Partial<Notification>): Notification {
    const newNotification: Notification = {
      id: Math.random().toString(36).substr(2, 9),
      title: notification.title ?? '',
      message: notification.message ?? '',
      type: notification.type ?? 'info',
      read: false,
      createdAt: new Date(),
      ...notification,
    };
    this.notifications = [newNotification, ...this.notifications];
    this.notificationsSubject.next([...this.notifications]);
    return newNotification;
  }

  /**
   * Convenience: emit an "error" notification.
   *
   * @param {string} message The message body.
   * @param {string} [title='Error'] The headline/title.
   */
  showError(message: string, title: string = 'Error'): void {
    this.addNotification({ title, message, type: 'error' });
  }

  /**
   * Convenience: emit a "success" notification.
   *
   * @param {string} message The message body.
   * @param {string} [title='Success'] The headline/title.
   */
  showSuccess(message: string, title: string = 'Success'): void {
    this.addNotification({ title, message, type: 'success' });
  }
}
