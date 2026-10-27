import { TestBed } from '@angular/core/testing';
import { HttpClient, HttpContext } from '@angular/common/http';
import { PLATFORM_ID } from '@angular/core';
import { Subject, of, throwError } from 'rxjs';
import { StorageService } from '@cthub-bsaas/web-core-platform';
import { BYPASS_ERROR_INTERCEPTOR } from '@cthub-bsaas/web-core-common';
import { AuthService } from './auth.service';
import type { PartnerAuthUser } from '../models/auth.models';

describe('AuthService (Partner)', () => {
  let service: AuthService;
  let storageMock: jest.Mocked<StorageService>;

  beforeEach(() => {
    storageMock = {
      getItem$: jest.fn().mockReturnValue(of(null)),
      getItem: jest.fn().mockReturnValue(null),
      setItem$: jest.fn().mockReturnValue(of(true)),
      removeItem$: jest.fn().mockReturnValue(of(true)),
    } as unknown as jest.Mocked<StorageService>;

    TestBed.configureTestingModule({
      providers: [AuthService, { provide: PLATFORM_ID, useValue: 'browser' }, { provide: StorageService, useValue: storageMock }],
    });

    service = TestBed.inject(AuthService);
  });

  it('returns null from getCurrentUser when no user is logged in', () => {
    expect(service.getCurrentUser()).toBeNull();
  });

  it('stores and returns full PartnerAuthUser from getCurrentUser', () => {
    const user: PartnerAuthUser = {
      id: 'staff-1',
      name: 'Manager Staff',
      email: 'manager@example.com',
      role: 'staff',
      roles: ['staff'],
      managedBranchIds: ['branch-1', 'branch-2'],
    };

    service.setLoggedInUser(user);

    const current = service.getCurrentUser();
    expect(current).not.toBeNull();
    expect(current?.id).toBe('staff-1');
    expect(current?.name).toBe('Manager Staff');
    expect(current?.role).toBe('staff');
    expect(current?.managedBranchIds).toEqual(['branch-1', 'branch-2']);
    expect(current?.canManageBranches).toBe(true);
    expect(storageMock.setItem$).toHaveBeenCalledWith(
      'current_user',
      expect.objectContaining({
        id: 'staff-1',
        canManageBranches: true,
      }),
    );
  });

  it('extracts managedBranchIds and canManageBranches from accessToken when not present on user object', () => {
    const claims = {
      sub: 'staff-jwt',
      roles: ['staff'],
      managedBranchIds: ['branch-jwt-1'],
      canManageBranches: true,
      exp: Math.floor(Date.now() / 1000) + 3600,
    };
    const b64 = Buffer.from(JSON.stringify(claims)).toString('base64');
    const fakeToken = `header.${b64}.signature`;

    const user: PartnerAuthUser = {
      id: 'staff-jwt',
      name: 'JWT Staff',
      email: 'jwt@example.com',
      role: 'staff',
      accessToken: fakeToken,
    };

    service.setLoggedInUser(user);

    const current = service.getCurrentUser();
    expect(current?.managedBranchIds).toEqual(['branch-jwt-1']);
    expect(current?.canManageBranches).toBe(true);
  });

  it('derives canManageBranches as false for staff with empty managedBranchIds', () => {
    const user: PartnerAuthUser = {
      id: 'staff-2',
      name: 'Regular Staff',
      email: 'staff@example.com',
      role: 'staff',
      roles: ['staff'],
      managedBranchIds: [],
    };

    service.setLoggedInUser(user);

    const current = service.getCurrentUser();
    expect(current?.canManageBranches).toBe(false);
  });

  it('derives canManageBranches as true for owner role even with empty managedBranchIds', () => {
    const user: PartnerAuthUser = {
      id: 'owner-1',
      name: 'Salon Owner',
      email: 'owner@example.com',
      role: 'owner',
      roles: ['owner'],
      managedBranchIds: [],
    };

    service.setLoggedInUser(user);

    const current = service.getCurrentUser();
    expect(current?.canManageBranches).toBe(true);
  });

  it('clears user data on logout', async () => {
    service.setLoggedInUser({
      id: 'staff-1',
      name: 'Staff',
      email: 'staff@example.com',
      role: 'staff',
    });

    await service.logout();

    expect(service.getCurrentUser()).toBeNull();
    expect(storageMock.removeItem$).toHaveBeenCalledWith('current_user');
  });

  it('preserves browser-provided canManageBranches and managedBranchIds directly from login payload', () => {
    const user: PartnerAuthUser = {
      id: 'staff-direct-1',
      name: 'Direct Manager',
      email: 'mgr@example.com',
      role: 'staff',
      roles: ['staff'],
      managedBranchIds: ['b-direct-1'],
      canManageBranches: true,
    };

    service.setLoggedInUser(user);

    const current = service.getCurrentUser();
    expect(current?.canManageBranches).toBe(true);
    expect(current?.managedBranchIds).toEqual(['b-direct-1']);
  });

  it('hydrates user and capabilities from /api/auth/me when HttpClient is available', async () => {
    const httpMock = {
      get: jest.fn().mockReturnValue(
        of({
          success: true,
          data: {
            id: 'staff-hydrated',
            name: 'Hydrated Manager',
            email: 'hydrated@example.com',
            role: 'staff',
            roles: ['staff'],
            managedBranchIds: ['b-hydrated-1'],
            canManageBranches: true,
          },
        }),
      ),
    };

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: StorageService, useValue: storageMock },
        { provide: HttpClient, useValue: httpMock },
      ],
    });

    const httpService = TestBed.inject(AuthService);
    const hydrated = await httpService.hydrateCurrentUser();

    expect(httpMock.get).toHaveBeenCalledWith(
      '/api/auth/me',
      expect.objectContaining({
        context: expect.any(HttpContext),
      }),
    );
    const getOptions = httpMock.get.mock.calls[0][1] as { context: HttpContext };
    expect(getOptions.context.get(BYPASS_ERROR_INTERCEPTOR)).toBe(true);
    expect(hydrated?.id).toBe('staff-hydrated');
    expect(hydrated?.canManageBranches).toBe(true);
    expect(hydrated?.managedBranchIds).toEqual(['b-hydrated-1']);
  });

  it('isAuthenticated honors cookie-based session when user is in memory without JWT in storage', async () => {
    storageMock.getItem.mockReturnValue(null);

    expect(await service.isAuthenticated()).toBe(false);

    service.setLoggedInUser({
      id: 'staff-cookie',
      name: 'Cookie Staff',
      email: 'cookie@example.com',
      role: 'staff',
      canManageBranches: true,
    });

    expect(await service.isAuthenticated()).toBe(true);
  });

  it('logout sends POST /api/auth/logout to clear server session cookies when HttpClient is provided', async () => {
    const httpMock = {
      get: jest.fn().mockReturnValue(of({ success: false })),
      post: jest.fn().mockReturnValue(of({ ok: true })),
    };

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: StorageService, useValue: storageMock },
        { provide: HttpClient, useValue: httpMock },
      ],
    });

    const httpService = TestBed.inject(AuthService);
    httpService.setLoggedInUser({
      id: 'staff-to-logout',
      name: 'To Logout',
      email: 'logout@example.com',
      role: 'staff',
    });

    await httpService.logout();

    expect(httpMock.post).toHaveBeenCalledWith(
      '/api/auth/logout',
      {},
      expect.objectContaining({
        context: expect.any(HttpContext),
      }),
    );
    expect(httpService.getCurrentUser()).toBeNull();
    expect(storageMock.removeItem$).toHaveBeenCalledWith('current_user');
  });

  it('initialize loads cached user and hydrates fresh capability via /api/auth/me', async () => {
    const cachedUser: PartnerAuthUser = {
      id: 'staff-cached',
      name: 'Cached Staff',
      email: 'cached@example.com',
      role: 'staff',
      canManageBranches: false,
    };
    storageMock.getItem.mockImplementation((key) => {
      if (key === 'current_user') return cachedUser;
      return null;
    });

    const httpMock = {
      get: jest.fn().mockReturnValue(
        of({
          success: true,
          data: {
            id: 'staff-cached',
            name: 'Cached Staff',
            email: 'cached@example.com',
            role: 'staff',
            managedBranchIds: ['b-1'],
            canManageBranches: true,
          },
        }),
      ),
      post: jest.fn(),
    };

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: StorageService, useValue: storageMock },
        { provide: HttpClient, useValue: httpMock },
      ],
    });

    const httpService = TestBed.inject(AuthService);
    const initializedUser = await httpService.initialize();

    expect(httpMock.get).toHaveBeenCalledWith(
      '/api/auth/me',
      expect.objectContaining({
        context: expect.any(HttpContext),
      }),
    );
    const getOptions = httpMock.get.mock.calls[0][1] as { context: HttpContext };
    expect(getOptions.context.get(BYPASS_ERROR_INTERCEPTOR)).toBe(true);
    expect(initializedUser?.canManageBranches).toBe(true);
    expect(initializedUser?.managedBranchIds).toEqual(['b-1']);
  });

  it('does not repeatedly probe /api/auth/me when no user is signed in', async () => {
    const httpMock = {
      get: jest.fn().mockReturnValue(of({ success: false })),
      post: jest.fn(),
    };

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: StorageService, useValue: storageMock },
        { provide: HttpClient, useValue: httpMock },
      ],
    });

    const httpService = TestBed.inject(AuthService);
    await httpService.initialize();
    httpMock.get.mockClear();

    const authed = await httpService.isAuthenticated();
    expect(authed).toBe(false);
    expect(httpMock.get).not.toHaveBeenCalled();
  });

  it('normalizes role from roles array when role is missing on hydrated user', () => {
    const userWithoutRole: PartnerAuthUser = {
      id: 'staff-roles-only',
      name: 'Roles Staff',
      email: 'roles@example.com',
      roles: ['STAFF'],
      managedBranchIds: ['branch-1'],
    };

    service.setLoggedInUser(userWithoutRole);

    const current = service.getCurrentUser();
    expect(current?.role).toBe('staff');
    expect(current?.canManageBranches).toBe(true);
  });

  it('revalidates stale cookie session via /api/auth/me when session TTL expires', async () => {
    const httpMock = {
      get: jest.fn().mockReturnValue(
        of({
          success: true,
          data: {
            id: 'staff-revalidated',
            name: 'Revalidated Staff',
            email: 'reval@example.com',
            roles: ['STAFF'],
          },
        }),
      ),
      post: jest.fn(),
    };

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: StorageService, useValue: storageMock },
        { provide: HttpClient, useValue: httpMock },
      ],
    });

    const httpService = TestBed.inject(AuthService);
    httpService.setLoggedInUser({
      id: 'staff-1',
      name: 'Staff',
      email: 'staff@example.com',
      role: 'staff',
    });

    httpService.sessionTtlMs = 0;

    const authed = await httpService.isAuthenticated();
    expect(httpMock.get).toHaveBeenCalledWith(
      '/api/auth/me',
      expect.objectContaining({
        context: expect.any(HttpContext),
      }),
    );
    const getOptions = httpMock.get.mock.calls[0][1] as { context: HttpContext };
    expect(getOptions.context.get(BYPASS_ERROR_INTERCEPTOR)).toBe(true);
    expect(authed).toBe(true);
    expect(httpService.getCurrentUser()?.id).toBe('staff-revalidated');
  });

  it('clears cached auth state if stale session revalidation returns 401 error', async () => {
    const httpMock = {
      get: jest.fn().mockReturnValue(throwError(() => ({ status: 401, message: 'Unauthorized' }))),
      post: jest.fn(),
    };

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: StorageService, useValue: storageMock },
        { provide: HttpClient, useValue: httpMock },
      ],
    });

    const httpService = TestBed.inject(AuthService);
    httpService.setLoggedInUser({
      id: 'staff-expired',
      name: 'Expired Staff',
      email: 'expired@example.com',
      role: 'staff',
    });

    httpService.sessionTtlMs = 0;

    const authed = await httpService.isAuthenticated();
    expect(httpMock.get).toHaveBeenCalledWith(
      '/api/auth/me',
      expect.objectContaining({
        context: expect.any(HttpContext),
      }),
    );
    const getOptions = httpMock.get.mock.calls[0][1] as { context: HttpContext };
    expect(getOptions.context.get(BYPASS_ERROR_INTERCEPTOR)).toBe(true);
    expect(authed).toBe(false);
    expect(httpService.getCurrentUser()).toBeNull();
  });

  it('ignores hydration response started before logout', async () => {
    const responseSubject = new Subject<{ success: boolean; data: PartnerAuthUser }>();
    const httpMock = {
      get: jest.fn().mockReturnValue(responseSubject.asObservable()),
      post: jest.fn().mockReturnValue(of({})),
    };

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: StorageService, useValue: storageMock },
        { provide: HttpClient, useValue: httpMock },
      ],
    });

    const httpService = TestBed.inject(AuthService);
    httpService.setLoggedInUser({
      id: 'staff-logging-out',
      name: 'Logging Out',
      email: 'logging-out@example.com',
      role: 'staff',
    });

    // Start hydration while user is logged in
    const hydratePromise = httpService.hydrateCurrentUser();

    // User logs out while hydration is in flight
    await httpService.logout();
    expect(httpService.getCurrentUser()).toBeNull();

    // In-flight response arrives late
    responseSubject.next({
      success: true,
      data: {
        id: 'staff-logging-out',
        name: 'Logging Out',
        email: 'logging-out@example.com',
        role: 'staff',
      },
    });
    responseSubject.complete();

    const result = await hydratePromise;
    expect(result).toBeNull();
    expect(httpService.getCurrentUser()).toBeNull();
  });
});
