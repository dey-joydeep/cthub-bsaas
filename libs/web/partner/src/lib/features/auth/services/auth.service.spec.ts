import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { of } from 'rxjs';
import { StorageService } from '@cthub-bsaas/web-core-platform';
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
      providers: [
        AuthService,
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: StorageService, useValue: storageMock },
      ],
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
});
