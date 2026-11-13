import { HttpErrorResponse, HttpEvent, HttpHandlerFn, HttpInterceptorFn, HttpRequest, HttpResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';

import { PHONE_NUMBER_PATTERN } from '@cthub-bsaas/web-core-common';
import { environment } from '@cthub-bsaas/web-config/environments/partner/environment';
import type { ResponseEnvelope, PagedEnvelope } from '../features/salon-owner-settings/models/salon-owner-settings.models';
import type {
  BusinessRole,
  BusinessRoleInput,
  Service,
  ServiceCategory,
  ServiceCategoryInput,
  ServiceInput,
  ServiceStatusInput,
  Staff,
  StaffEligibilityInput,
  StaffInput,
  StaffLeaveBlock,
  StaffLeaveBlockInput,
  StaffRolesInput,
  StaffShiftInput,
  StaffSkillsInput,
} from '../features/staff-service-catalog/models/staff-service-catalog.models';
import { PartnerDevMockState, createInitialPartnerDevMockData } from './partner-dev-mock.data';

let mockState: PartnerDevMockState = createInitialPartnerDevMockData();

export function resetPartnerDevMockState(): void {
  mockState = createInitialPartnerDevMockData();
}

export function isPartnerDevMockEnabled(): boolean {
  // Absolute production safeguard: never allow mock mode in production builds under any circumstances
  if (environment.production) {
    return false;
  }

  if (typeof window !== 'undefined') {
    const searchParams = new URLSearchParams(window.location.search);
    const mockParam = searchParams.get('mock');
    if (mockParam === 'false') return false;
    if (mockParam === 'true') return true;

    try {
      const stored = window.localStorage.getItem('CTHUB_DEV_MOCK_API');
      if (stored === 'false') return false;
      if (stored === 'true') return true;
    } catch {
      // Ignore localStorage access issues
    }
  }

  return true;
}

function okResponse<T>(data: T): Observable<HttpResponse<ResponseEnvelope<T>>> {
  const envelope: ResponseEnvelope<T> = {
    success: true,
    data,
  };
  return of(new HttpResponse({ status: 200, body: envelope })).pipe(delay(25));
}

function pagedResponse<T>(items: readonly T[], page = 1, pageSize = 100): Observable<HttpResponse<ResponseEnvelope<PagedEnvelope<T>>>> {
  const paged: PagedEnvelope<T> = {
    items,
    page: {
      page,
      pageSize,
      total: items.length,
    },
  };
  return okResponse(paged);
}

function errorResponse(status: number, message: string): Observable<never> {
  return throwError(
    () =>
      new HttpErrorResponse({
        status,
        statusText: status === 409 ? 'Conflict' : 'Error',
        error: { message, statusCode: status },
      }),
  );
}

export const partnerDevMockInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> => {
  if (!isPartnerDevMockEnabled()) {
    return next(req);
  }

  const url = req.url;
  const method = req.method;
  const urlObj = new URL(url, 'http://localhost');
  const getParam = (name: string): string | null => req.params.get(name) ?? urlObj.searchParams.get(name);

  // 1. Auth Current User
  if (url.includes('/api/auth/me')) {
    return of(new HttpResponse({ status: 200, body: { success: true, data: mockState.currentUser } })).pipe(delay(25));
  }

  // 2. Salon Businesses
  if (url.endsWith('/businesses') || url.includes('/businesses?')) {
    if (method === 'GET') {
      return pagedResponse(mockState.businesses);
    }
  }

  // 3. Branches
  if (url.endsWith('/branches') || url.includes('/branches?')) {
    if (method === 'GET') {
      return pagedResponse(mockState.branches);
    }
  }

  // 3a. Permissions Master (/permissions)
  if (url.endsWith('/permissions') || url.includes('/permissions?')) {
    if (method === 'GET') {
      return okResponse(mockState.permissions);
    }
  }

  // 3b. Business Roles Master & Semi-Master (/roles)
  const roleSingleMatch = url.match(/\/roles\/([^/?#]+)$/);
  if (roleSingleMatch) {
    const roleId = roleSingleMatch[1];
    const target = mockState.roles.find((r) => r.id === roleId);

    if (method === 'PUT') {
      if (!target) return errorResponse(404, 'Role not found');
      const input = req.body as BusinessRoleInput;
      const updated: BusinessRole = {
        ...target,
        name: input.name,
        description: input.description ?? target.description,
        permissions: [...input.permissions],
        isActive: input.isActive ?? target.isActive,
        updatedAt: new Date().toISOString(),
      };
      mockState.roles = mockState.roles.map((r) => (r.id === roleId ? updated : r));
      return okResponse(updated);
    }

    if (method === 'DELETE') {
      if (!target) return errorResponse(404, 'Role not found');
      if (target.isSystemDefault) {
        return errorResponse(409, 'System default roles cannot be deleted.');
      }
      mockState.roles = mockState.roles.filter((r) => r.id !== roleId);
      return okResponse({ success: true });
    }
  }

  if (url.endsWith('/roles') || url.includes('/roles?')) {
    if (method === 'GET') {
      const includeInactive = getParam('includeInactive') === 'true';
      const items = includeInactive ? mockState.roles : mockState.roles.filter((r) => r.isActive);
      return pagedResponse(items);
    }

    if (method === 'POST') {
      const input = req.body as BusinessRoleInput;
      const now = new Date().toISOString();
      const newRole: BusinessRole = {
        id: `role-${Date.now()}`,
        businessId: 'biz-tokyo-1',
        roleCode: null,
        name: input.name,
        description: input.description ?? null,
        permissions: [...input.permissions],
        isSystemDefault: false,
        isActive: input.isActive ?? true,
        createdAt: now,
        updatedAt: now,
      };
      mockState.roles = [...mockState.roles, newRole];
      return okResponse(newRole);
    }
  }

  // 4. Staff Leave Blocks (Sub-resource of staff: /staff/:staffId/leave-blocks)
  const leaveBlockMatch = url.match(/\/staff\/([^/]+)\/leave-blocks(?:\/([^/?#]+))?/);
  if (leaveBlockMatch) {
    const staffId = leaveBlockMatch[1];
    const leaveBlockId = leaveBlockMatch[2];

    if (method === 'GET') {
      const staffBlocks = mockState.leaveBlocks.filter((block) => block.staffId === staffId);
      return pagedResponse(staffBlocks);
    }

    if (method === 'POST') {
      const input = req.body as StaffLeaveBlockInput;
      const now = new Date().toISOString();
      const newBlock: StaffLeaveBlock = {
        id: `leave-${Date.now()}`,
        businessId: 'biz-tokyo-1',
        staffId,
        branchId: input.branchId ?? null,
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        reason: input.reason,
        createdAt: now,
        updatedAt: now,
      };
      mockState.leaveBlocks = [newBlock, ...mockState.leaveBlocks];
      return okResponse(newBlock);
    }

    if (method === 'DELETE' && leaveBlockId) {
      mockState.leaveBlocks = mockState.leaveBlocks.filter((b) => b.id !== leaveBlockId);
      return okResponse({ success: true });
    }
  }

  // 5. Staff Roles: /staff/:staffId/roles
  const rolesMatch = url.match(/\/staff\/([^/]+)\/roles/);
  if (rolesMatch && method === 'PUT') {
    const staffId = rolesMatch[1];
    const input = req.body as StaffRolesInput;
    const target = mockState.staff.find((m) => m.id === staffId);
    if (!target) return errorResponse(404, 'Staff not found');

    // Reconcile roleIds and roles
    let resolvedRoleIds = input.roleIds ? [...input.roleIds] : [];
    let resolvedRoles = input.roles ? [...input.roles] : [];

    if (resolvedRoleIds.length > 0 && resolvedRoles.length === 0) {
      resolvedRoles = mockState.roles.filter((r) => resolvedRoleIds.includes(r.id) && r.roleCode).map((r) => r.roleCode as string);
    } else if (resolvedRoles.length > 0 && resolvedRoleIds.length === 0) {
      resolvedRoleIds = mockState.roles.filter((r) => r.roleCode && resolvedRoles.includes(r.roleCode)).map((r) => r.id);
    }

    const isCurrentActiveOwner = (target.roles.includes('OWNER') || target.roleIds?.includes('role-owner')) && target.status === 'ACTIVE';
    const otherActiveOwners = mockState.staff.filter(
      (m) => m.id !== staffId && (m.roles.includes('OWNER') || m.roleIds?.includes('role-owner')) && m.status === 'ACTIVE',
    );
    const removesOwner = !resolvedRoles.includes('OWNER') && !resolvedRoleIds.includes('role-owner');
    if (isCurrentActiveOwner && otherActiveOwners.length === 0 && removesOwner) {
      return errorResponse(409, 'Cannot deactivate or remove the OWNER role from the last active owner of the business.');
    }

    const updated: Staff = {
      ...target,
      roleIds: resolvedRoleIds,
      roles: resolvedRoles,
      updatedAt: new Date().toISOString(),
    };
    mockState.staff = mockState.staff.map((m) => (m.id === staffId ? updated : m));
    return okResponse(updated);
  }

  // 6. Staff Skills: /staff/:staffId/skills
  const skillsMatch = url.match(/\/staff\/([^/]+)\/skills/);
  if (skillsMatch && method === 'PUT') {
    const staffId = skillsMatch[1];
    const input = req.body as StaffSkillsInput;
    const target = mockState.staff.find((m) => m.id === staffId);
    if (!target) return errorResponse(404, 'Staff not found');

    const updated: Staff = {
      ...target,
      skillServiceIds: [...input.serviceIds],
      updatedAt: new Date().toISOString(),
    };
    mockState.staff = mockState.staff.map((m) => (m.id === staffId ? updated : m));
    return okResponse(updated);
  }

  // 7. Staff Shifts: /staff/:staffId/shifts
  const shiftsMatch = url.match(/\/staff\/([^/]+)\/shifts/);
  if (shiftsMatch && method === 'PUT') {
    const staffId = shiftsMatch[1];
    const input = req.body as StaffShiftInput;
    mockState.shifts[staffId] = input;
    return okResponse(input);
  }

  // 8. Staff Individual: /staff/:staffId
  const staffSingleMatch = url.match(/\/staff\/([^/?#]+)$/);
  if (staffSingleMatch) {
    const staffId = staffSingleMatch[1];
    const target = mockState.staff.find((m) => m.id === staffId);

    if (method === 'PATCH') {
      if (!target) return errorResponse(404, 'Staff not found');
      const input = req.body as StaffInput;

      if (input.phone && !PHONE_NUMBER_PATTERN.test(input.phone.trim())) {
        return errorResponse(422, 'Phone number format is invalid.');
      }

      if (target.roles.includes('OWNER') && target.status === 'ACTIVE' && input.status === 'INACTIVE') {
        const otherActiveOwners = mockState.staff.filter((m) => m.id !== staffId && m.roles.includes('OWNER') && m.status === 'ACTIVE');
        if (otherActiveOwners.length === 0) {
          return errorResponse(409, 'Cannot deactivate or remove the OWNER role from the last active owner of the business.');
        }
      }

      const updated: Staff = {
        ...target,
        branchIds: [...input.branchIds],
        displayName: input.displayName,
        phone: input.phone,
        email: input.email,
        status: input.status,
        address: input.address !== undefined ? input.address : target.address,
        updatedAt: new Date().toISOString(),
      };
      mockState.staff = mockState.staff.map((m) => (m.id === staffId ? updated : m));
      return okResponse(updated);
    }
  }

  // 9. Staff Directory: /staff
  if (url.endsWith('/staff') || url.includes('/staff?')) {
    if (method === 'GET') {
      const branchId = getParam('branchId');
      const filtered = branchId ? mockState.staff.filter((m) => m.branchIds.includes(branchId)) : mockState.staff;
      return pagedResponse(filtered);
    }

    if (method === 'POST') {
      const input = req.body as StaffInput;

      if (input.phone && !PHONE_NUMBER_PATTERN.test(input.phone.trim())) {
        return errorResponse(422, 'Phone number format is invalid.');
      }

      const now = new Date().toISOString();
      const newStaff: Staff = {
        id: `staff-${Date.now()}`,
        displayName: input.displayName,
        phone: input.phone,
        email: input.email,
        status: input.status,
        branchIds: [...input.branchIds],
        roleIds: ['role-stylist'],
        roles: ['STYLIST'],
        skillServiceIds: [],
        address: input.address,
        createdAt: now,
        updatedAt: now,
      };
      mockState.staff = [newStaff, ...mockState.staff];
      return okResponse(newStaff);
    }
  }

  // 10. Service Categories
  if (url.endsWith('/service-categories') || url.includes('/service-categories?')) {
    if (method === 'GET') {
      return pagedResponse(mockState.categories);
    }

    if (method === 'POST') {
      const input = req.body as ServiceCategoryInput;
      const newCategory: ServiceCategory = {
        id: `cat-${Date.now()}`,
        name: input.name,
        sortOrder: input.sortOrder,
      };
      mockState.categories = [...mockState.categories, newCategory];
      return okResponse(newCategory);
    }
  }

  // 11. Service Status: /services/:serviceId/status
  const serviceStatusMatch = url.match(/\/services\/([^/]+)\/status/);
  if (serviceStatusMatch && method === 'PUT') {
    const serviceId = serviceStatusMatch[1];
    const input = req.body as ServiceStatusInput;
    const target = mockState.services.find((s) => s.id === serviceId);
    if (!target) return errorResponse(404, 'Service not found');

    const updated: Service = {
      ...target,
      status: input.status,
    };
    mockState.services = mockState.services.map((s) => (s.id === serviceId ? updated : mService(s, updated)));
    return okResponse(updated);
  }

  // 12. Service Staff Eligibility: /services/:serviceId/staff-eligibility
  const eligibilityMatch = url.match(/\/services\/([^/]+)\/staff-eligibility/);
  if (eligibilityMatch && method === 'PUT') {
    const serviceId = eligibilityMatch[1];
    const input = req.body as StaffEligibilityInput;
    const target = mockState.services.find((s) => s.id === serviceId);
    if (!target) return errorResponse(404, 'Service not found');

    const updated: Service = {
      ...target,
      eligibleStaffIds: [...input.staffIds],
    };
    mockState.services = mockState.services.map((s) => (s.id === serviceId ? updated : mService(s, updated)));
    return okResponse(updated);
  }

  // 13. Service Individual: /services/:serviceId
  const serviceSingleMatch = url.match(/\/services\/([^/?#]+)$/);
  if (serviceSingleMatch) {
    const serviceId = serviceSingleMatch[1];
    const target = mockState.services.find((s) => s.id === serviceId);

    if (method === 'PATCH') {
      if (!target) return errorResponse(404, 'Service not found');
      const input = req.body as ServiceInput;
      const updated: Service = {
        ...target,
        categoryId: input.categoryId,
        name: input.name,
        durationMinutes: input.durationMinutes,
        bufferMinutes: input.bufferMinutes ?? target.bufferMinutes ?? 0,
        basePrice: input.basePrice,
        taxRatePercent: input.taxRatePercent,
        status: input.status,
      };
      mockState.services = mockState.services.map((s) => (s.id === serviceId ? updated : mService(s, updated)));
      return okResponse(updated);
    }
  }

  // 14. Service Catalog List & Create
  if (url.endsWith('/services') || url.includes('/services?')) {
    if (method === 'GET') {
      const categoryId = getParam('categoryId');
      const filtered = categoryId ? mockState.services.filter((s) => s.categoryId === categoryId) : mockState.services;
      return pagedResponse(filtered);
    }

    if (method === 'POST') {
      const input = req.body as ServiceInput;
      const newService: Service = {
        id: `svc-${Date.now()}`,
        categoryId: input.categoryId,
        name: input.name,
        durationMinutes: input.durationMinutes,
        bufferMinutes: input.bufferMinutes ?? 0,
        basePrice: input.basePrice,
        taxRatePercent: input.taxRatePercent,
        status: input.status,
        eligibleStaffIds: [],
      };
      mockState.services = [newService, ...mockState.services];
      return okResponse(newService);
    }
  }

  return next(req);
};

function mService(original: Service, updated: Service): Service {
  return original.id === updated.id ? updated : original;
}
