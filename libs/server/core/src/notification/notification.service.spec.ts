import { Test } from '@nestjs/testing';
import { NotificationService } from './notification.service';
import { Notification } from '../models/notification.model';
import { firstValueFrom } from 'rxjs';

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [NotificationService],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should add a notification and update observables', async () => {
    const notificationData: Partial<Notification> = { title: 'Test', message: 'Test message' };
    service.addNotification(notificationData);

    const notifications = await firstValueFrom(service.notifications$);
    const unreadCount = await firstValueFrom(service.unreadCount$);

    expect(notifications).toHaveLength(1);
    expect(notifications[0].title).toBe('Test');
    expect(unreadCount).toBe(1);
  });

  it('should add a notification with default values', async () => {
    service.addNotification({});
    const notifications = await firstValueFrom(service.notifications$);
    expect(notifications[0].title).toBe('');
    expect(notifications[0].message).toBe('');
    expect(notifications[0].type).toBe('info');
  });

  it('should mark a notification as read', async () => {
    const notification = service.addNotification({ title: 'Test' });
    await service.markAsRead(notification.id);

    const notifications = await firstValueFrom(service.notifications$);
    const unreadCount = await firstValueFrom(service.unreadCount$);

    expect(notifications[0].read).toBe(true);
    expect(unreadCount).toBe(0);
  });

  it('should throw an error if notification to mark as read is not found', async () => {
    await expect(service.markAsRead('non-existent-id')).rejects.toThrow('Notification not found');
  });

  it('should mark all notifications as read', async () => {
    service.addNotification({ title: 'Test 1' });
    service.addNotification({ title: 'Test 2' });
    await service.markAllAsRead();

    const notifications = await firstValueFrom(service.notifications$);
    const unreadCount = await firstValueFrom(service.unreadCount$);

    expect(notifications.every(n => n.read)).toBe(true);
    expect(unreadCount).toBe(0);
  });

  it('should update loading state during getNotifications', async () => {
    const loadingValues: boolean[] = [];
    const sub = service.loading$.subscribe(v => loadingValues.push(v));

    await service.getNotifications();
    sub.unsubscribe();

    expect(loadingValues).toEqual([false, true, false]);
  });

  it('should show an error notification', async () => {
    service.showError('Error message');
    const notifications = await firstValueFrom(service.notifications$);
    expect(notifications[0].type).toBe('error');
    expect(notifications[0].title).toBe('Error');
  });

  it('should show a success notification', async () => {
    service.showSuccess('Success message');
    const notifications = await firstValueFrom(service.notifications$);
    expect(notifications[0].type).toBe('success');
    expect(notifications[0].title).toBe('Success');
  });

  it('should complete observables on module destroy', () => {
    const notificationsSpy = jest.fn();
    const loadingSpy = jest.fn();

    service.notifications$.subscribe({ complete: notificationsSpy });
    service.loading$.subscribe({ complete: loadingSpy });

    service.onModuleDestroy();

    expect(notificationsSpy).toHaveBeenCalled();
    expect(loadingSpy).toHaveBeenCalled();
  });
});
