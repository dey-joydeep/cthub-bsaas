import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Notification } from '../models/notification.model';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private items: Notification[] = [];
  private readonly items$ = new BehaviorSubject<Notification[]>([]);

  readonly notifications$ = this.items$.asObservable();

  add(notification: Partial<Notification>): Notification {
    const item: Notification = {
      id: notification.id || Math.random().toString(36).substring(2, 9),
      title: notification.title ?? '',
      message: notification.message ?? '',
      type: notification.type ?? 'info',
      createdAt: new Date(),
      read: false,
    };
    this.items = [item, ...this.items];
    this.items$.next([...this.items]);
    return item;
  }

  showError(message: string, title: string = 'Error'): void {
    this.add({ title, message, type: 'error' });
  }

  showSuccess(message: string, title: string = 'Success'): void {
    this.add({ title, message, type: 'success' });
  }
}