import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';

import { StaffServiceCatalogApi } from './staff-service-catalog.api';

describe('StaffServiceCatalogApi', () => {
  let api: StaffServiceCatalogApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(StaffServiceCatalogApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('unwraps staff lists and preserves branch filters', () => {
    let count = 0;
    api.listStaff('branch-1').subscribe((result) => {
      count = result.items.length;
    });

    const request = http.expectOne('/api/partner/staff?branchId=branch-1');
    expect(request.request.method).toBe('GET');
    request.flush({
      success: true,
      data: { items: [{ id: 'staff-1' }], page: { limit: 1, nextCursor: null, hasMore: false } },
    });
    expect(count).toBe(1);
  });

  it('sends staff replacement commands to documented endpoints', () => {
    api.replaceStaffRoles('staff-1', { roles: ['STYLIST'] }).subscribe();
    expect(http.expectOne('/api/partner/staff/staff-1/roles').request.method).toBe('PUT');

    api.replaceStaffSkills('staff-1', { serviceIds: ['service-1'] }).subscribe();
    expect(http.expectOne('/api/partner/staff/staff-1/skills').request.method).toBe('PUT');

    api
      .replaceStaffShifts('staff-1', {
        branchId: 'branch-1',
        timezone: 'Asia/Tokyo',
        days: [{ dayOfWeek: 1, intervals: [{ start: '09:00', end: '17:00' }] }],
      })
      .subscribe();
    expect(http.expectOne('/api/partner/staff/staff-1/shifts').request.method).toBe('PUT');
  });

  it('sends service catalog commands to documented endpoints', () => {
    api.createServiceCategory({ name: 'Hair', sortOrder: 1 }).subscribe();
    expect(http.expectOne('/api/partner/service-categories').request.method).toBe('POST');

    api.listServices('category-1').subscribe();
    expect(http.expectOne('/api/partner/services?categoryId=category-1').request.method).toBe('GET');

    api.updateServiceStatus('service-1', { status: 'INACTIVE' }).subscribe();
    expect(http.expectOne('/api/partner/services/service-1/status').request.method).toBe('PUT');

    api.replaceServiceStaffEligibility('service-1', { staffIds: ['staff-1'] }).subscribe();
    expect(http.expectOne('/api/partner/services/service-1/staff-eligibility').request.method).toBe('PUT');
  });

  it('manages staff leave blocks with documented endpoints and branch filters', () => {
    let leaveBlocksCount = 0;
    api.listStaffLeaveBlocks('staff-1').subscribe((result) => {
      leaveBlocksCount = result.items.length;
    });
    const listReqAll = http.expectOne('/api/partner/staff/staff-1/leave-blocks');
    expect(listReqAll.request.method).toBe('GET');
    listReqAll.flush({
      success: true,
      data: {
        items: [
          {
            id: 'leave-1',
            businessId: 'biz-1',
            staffId: 'staff-1',
            branchId: null,
            startsAt: '2026-06-01T09:00:00.000Z',
            endsAt: '2026-06-01T17:00:00.000Z',
            reason: 'Vacation',
            createdAt: '2026-05-26T00:00:00.000Z',
            updatedAt: '2026-05-26T00:00:00.000Z',
          },
        ],
        page: { limit: 10, nextCursor: null, hasMore: false },
      },
    });
    expect(leaveBlocksCount).toBe(1);

    api.listStaffLeaveBlocks('staff-1', 'branch-1').subscribe();
    const listReqBranch = http.expectOne('/api/partner/staff/staff-1/leave-blocks?branchId=branch-1');
    expect(listReqBranch.request.method).toBe('GET');
    listReqBranch.flush({
      success: true,
      data: { items: [], page: { limit: 10, nextCursor: null, hasMore: false } },
    });

    let createdId = '';
    api
      .createStaffLeaveBlock('staff-1', {
        branchId: null,
        startsAt: '2026-06-01T09:00:00.000Z',
        endsAt: '2026-06-01T17:00:00.000Z',
        reason: 'Personal',
      })
      .subscribe((res) => {
        createdId = res.id;
      });
    const createReq = http.expectOne('/api/partner/staff/staff-1/leave-blocks');
    expect(createReq.request.method).toBe('POST');
    expect(createReq.request.body).toEqual({
      branchId: null,
      startsAt: '2026-06-01T09:00:00.000Z',
      endsAt: '2026-06-01T17:00:00.000Z',
      reason: 'Personal',
    });
    createReq.flush({
      success: true,
      data: {
        id: 'leave-2',
        businessId: 'biz-1',
        staffId: 'staff-1',
        branchId: null,
        startsAt: '2026-06-01T09:00:00.000Z',
        endsAt: '2026-06-01T17:00:00.000Z',
        reason: 'Personal',
        createdAt: '2026-05-26T00:00:00.000Z',
        updatedAt: '2026-05-26T00:00:00.000Z',
      },
    });
    expect(createdId).toBe('leave-2');

    let deleteSuccess = false;
    api.deleteStaffLeaveBlock('staff-1', 'leave-2').subscribe((res) => {
      deleteSuccess = res.success;
    });
    const deleteReq = http.expectOne('/api/partner/staff/staff-1/leave-blocks/leave-2');
    expect(deleteReq.request.method).toBe('DELETE');
    deleteReq.flush({
      success: true,
      data: { success: true },
    });
    expect(deleteSuccess).toBe(true);
  });
});
