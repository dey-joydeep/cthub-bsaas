import { TestBed } from '@angular/core/testing';
import { HttpClient, HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { ResponseEnvelope, PagedEnvelope, BranchProfile } from '../features/salon-owner-settings/models/salon-owner-settings.models';
import type {
  Service,
  ServiceCategory,
  Staff,
  StaffLeaveBlock,
  StaffShiftInput,
} from '../features/staff-service-catalog/models/staff-service-catalog.models';
import { partnerDevMockInterceptor, resetPartnerDevMockState } from './partner-dev-mock.interceptor';

describe('partnerDevMockInterceptor', () => {
  let http: HttpClient;

  beforeEach(() => {
    resetPartnerDevMockState();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withInterceptors([partnerDevMockInterceptor]))],
    });
    http = TestBed.inject(HttpClient);
  });

  afterEach(() => {
    resetPartnerDevMockState();
  });

  it('intercepts /api/auth/me and returns current owner user', async () => {
    const res = await firstValueFrom(
      http.get<{ success: boolean; data: { id: string; roles: string[] } }>('/api/auth/me'),
    );

    expect(res.success).toBe(true);
    expect(res.data.id).toBe('staff-kenji');
    expect(res.data.roles).toContain('OWNER');
  });

  it('intercepts GET /branches and returns paged branch profiles', async () => {
    const res = await firstValueFrom(
      http.get<ResponseEnvelope<PagedEnvelope<BranchProfile>>>('http://localhost:3000/partner/branches?page=1&pageSize=100'),
    );

    expect(res.success).toBe(true);
    expect(res.data.items.length).toBeGreaterThanOrEqual(2);
    expect(res.data.items[0].name).toBe('Ginza Flagship');
    expect(res.data.page.total).toBe(res.data.items.length);
  });

  it('intercepts GET /api/partner/staff and supports filtering', async () => {
    const resAll = await firstValueFrom(
      http.get<ResponseEnvelope<PagedEnvelope<Staff>>>('/api/partner/staff'),
    );
    expect(resAll.success).toBe(true);
    expect(resAll.data.items.length).toBe(3);

    const resFiltered = await firstValueFrom(
      http.get<ResponseEnvelope<PagedEnvelope<Staff>>>('/api/partner/staff?branchId=branch-ginza'),
    );
    expect(resFiltered.success).toBe(true);
    expect(resFiltered.data.items.every((m) => m.branchIds.includes('branch-ginza'))).toBe(true);
  });

  it('creates and updates staff profile', async () => {
    const created = await firstValueFrom(
      http.post<ResponseEnvelope<Staff>>('/api/partner/staff', {
        displayName: 'Yuki Takahashi',
        phone: '+81-90-7777-8888',
        email: 'yuki@tokyosalon.jp',
        status: 'ACTIVE',
        branchIds: ['branch-ginza'],
      }),
    );
    expect(created.success).toBe(true);
    expect(created.data.displayName).toBe('Yuki Takahashi');
    expect(created.data.roles).toEqual(['STYLIST']);

    const updated = await firstValueFrom(
      http.patch<ResponseEnvelope<Staff>>(`/api/partner/staff/${created.data.id}`, {
        displayName: 'Yuki Takahashi Updated',
        phone: '+81-90-7777-8888',
        email: 'yuki@tokyosalon.jp',
        status: 'ACTIVE',
        branchIds: ['branch-ginza', 'branch-shibuya'],
      }),
    );
    expect(updated.success).toBe(true);
    expect(updated.data.displayName).toBe('Yuki Takahashi Updated');
    expect(updated.data.branchIds).toContain('branch-shibuya');
  });

  it('updates staff roles and enforces owner protection (BR-ST-06.1)', async () => {
    // Attempting to remove OWNER from staff-kenji (the only active owner) should fail with 409
    let conflictError: HttpErrorResponse | null = null;
    try {
      await firstValueFrom(
        http.put<ResponseEnvelope<Staff>>('/api/partner/staff/staff-kenji/roles', {
          roles: ['STYLIST'],
        }),
      );
    } catch (err) {
      conflictError = err as HttpErrorResponse;
    }

    expect(conflictError).not.toBeNull();
    expect(conflictError?.status).toBe(409);
    expect(conflictError?.error?.message).toContain('last active owner');

    // Updating roles on another staff member should succeed
    const res = await firstValueFrom(
      http.put<ResponseEnvelope<Staff>>('/api/partner/staff/staff-sarah/roles', {
        roles: ['STYLIST', 'RECEPTIONIST'],
      }),
    );
    expect(res.success).toBe(true);
    expect(res.data.roles).toEqual(['STYLIST', 'RECEPTIONIST']);
  });

  it('updates staff skills and shifts', async () => {
    const skillsRes = await firstValueFrom(
      http.put<ResponseEnvelope<Staff>>('/api/partner/staff/staff-sarah/skills', {
        serviceIds: ['svc-exec-cut', 'svc-scalp-ritual'],
      }),
    );
    expect(skillsRes.success).toBe(true);
    expect(skillsRes.data.skillServiceIds).toEqual(['svc-exec-cut', 'svc-scalp-ritual']);

    const shiftRes = await firstValueFrom(
      http.put<ResponseEnvelope<StaffShiftInput>>('/api/partner/staff/staff-sarah/shifts', {
        branchId: 'branch-ginza',
        timezone: 'Asia/Tokyo',
        days: [{ dayOfWeek: 1, intervals: [{ start: '10:00', end: '19:00' }] }],
      }),
    );
    expect(shiftRes.success).toBe(true);
    expect(shiftRes.data.timezone).toBe('Asia/Tokyo');
  });

  it('manages staff leave blocks', async () => {
    const listBefore = await firstValueFrom(
      http.get<ResponseEnvelope<PagedEnvelope<StaffLeaveBlock>>>('/api/partner/staff/staff-sarah/leave-blocks'),
    );
    expect(listBefore.data.items.length).toBe(2);

    const created = await firstValueFrom(
      http.post<ResponseEnvelope<StaffLeaveBlock>>('/api/partner/staff/staff-sarah/leave-blocks', {
        branchId: 'branch-ginza',
        startsAt: '2026-11-25T09:00:00Z',
        endsAt: '2026-11-25T17:00:00Z',
        reason: 'Training seminar',
      }),
    );
    expect(created.success).toBe(true);
    expect(created.data.reason).toBe('Training seminar');

    const deleted = await firstValueFrom(
      http.delete<ResponseEnvelope<{ success: boolean }>>(
        `/api/partner/staff/staff-sarah/leave-blocks/${created.data.id}`,
      ),
    );
    expect(deleted.success).toBe(true);
  });

  it('manages service categories and services', async () => {
    const categories = await firstValueFrom(
      http.get<ResponseEnvelope<PagedEnvelope<ServiceCategory>>>('/api/partner/service-categories'),
    );
    expect(categories.data.items.length).toBe(3);

    const newService = await firstValueFrom(
      http.post<ResponseEnvelope<Service>>('/api/partner/services', {
        categoryId: 'cat-hair-cut',
        name: 'Beard Trim & Shape',
        durationMinutes: 20,
        bufferMinutes: 5,
        basePrice: '25.00',
        taxRatePercent: '10.00',
        status: 'ACTIVE',
      }),
    );
    expect(newService.success).toBe(true);
    expect(newService.data.name).toBe('Beard Trim & Shape');

    const updatedStatus = await firstValueFrom(
      http.put<ResponseEnvelope<Service>>(`/api/partner/services/${newService.data.id}/status`, {
        status: 'INACTIVE',
      }),
    );
    expect(updatedStatus.data.status).toBe('INACTIVE');
  });
});
