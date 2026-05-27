import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';

import { AppointmentSchedulingApi } from './appointment-scheduling.api';

describe('AppointmentSchedulingApi', () => {
  let api: AppointmentSchedulingApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    api = TestBed.inject(AppointmentSchedulingApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('unwraps day-board and slot envelopes', () => {
    api.getDayBoard('branch-1', '2026-05-26').subscribe();
    const board = http.expectOne('/api/partner/appointments/day-board?branchId=branch-1&date=2026-05-26');
    expect(board.request.method).toBe('GET');
    board.flush({ success: true, data: { branchId: 'branch-1', date: '2026-05-26', appointments: [] } });

    api.findSlots('branch-1', ['service-1'], '2026-05-26').subscribe();
    const slots = http.expectOne('/api/partner/appointments/slots?branchId=branch-1&date=2026-05-26&serviceIds=service-1');
    expect(slots.request.method).toBe('GET');
    slots.flush({ success: true, data: { items: [], page: { limit: 0, nextCursor: null, hasMore: false } } });
  });

  it('sends booking and lifecycle commands to documented endpoints', () => {
    const input = {
      branchId: 'branch-1',
      customerId: 'customer-1',
      lines: [{ serviceId: 'service-1', staffId: 'staff-1', startsAt: '2026-05-26T09:00:00.000Z' }],
    };

    api.createAppointment(input).subscribe();
    const create = http.expectOne('/api/partner/appointments');
    expect(create.request.method).toBe('POST');
    create.flush({ success: true, data: { id: 'appointment-1' } });

    api.createWalkInAppointment({ ...input, estimatedWaitMinutes: 10 }).subscribe();
    const walkIn = http.expectOne('/api/partner/appointments/walk-ins');
    expect(walkIn.request.method).toBe('POST');
    walkIn.flush({ success: true, data: { id: 'appointment-1' } });

    api.rescheduleAppointment('appointment-1', { lines: input.lines, reason: 'Customer request' }).subscribe();
    const reschedule = http.expectOne('/api/partner/appointments/appointment-1/reschedule');
    expect(reschedule.request.method).toBe('POST');
    reschedule.flush({ success: true, data: { id: 'appointment-1' } });

    api.confirmAppointment('appointment-1').subscribe();
    const confirm = http.expectOne('/api/partner/appointments/appointment-1/confirm');
    expect(confirm.request.method).toBe('POST');
    confirm.flush({ success: true, data: { id: 'appointment-1' } });

    api.cancelAppointment('appointment-1', 'Customer request').subscribe();
    const cancel = http.expectOne('/api/partner/appointments/appointment-1/cancel');
    expect(cancel.request.method).toBe('POST');
    expect(cancel.request.body).toEqual({ reason: 'Customer request' });
    cancel.flush({ success: true, data: { id: 'appointment-1' } });

    api.markAppointmentNoShow('appointment-1', 'Customer request').subscribe();
    const noShow = http.expectOne('/api/partner/appointments/appointment-1/no-show');
    expect(noShow.request.method).toBe('POST');
    expect(noShow.request.body).toEqual({ reason: 'Customer request' });
    noShow.flush({ success: true, data: { id: 'appointment-1' } });
  });
});
