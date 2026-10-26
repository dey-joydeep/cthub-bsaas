import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { LoginService } from './login.service';
import { AUTH_STATE_SETTER, LOGIN_API, type ApiResponse, type AuthResponse, type PartnerAuthUser } from '../../tokens/login.tokens';

describe('LoginService (Partner)', () => {
  let service: LoginService;
  let apiMock: {
    login: jest.Mock;
    initLogin: jest.Mock;
    verifyOtp: jest.Mock;
    socialLogin: jest.Mock;
    resendOtp: jest.Mock;
  };
  let authStateMock: {
    setLoggedInUser: jest.Mock;
  };

  beforeEach(() => {
    apiMock = {
      login: jest.fn(),
      initLogin: jest.fn(),
      verifyOtp: jest.fn(),
      socialLogin: jest.fn(),
      resendOtp: jest.fn(),
    };
    authStateMock = {
      setLoggedInUser: jest.fn(),
    };

    TestBed.configureTestingModule({
      providers: [LoginService, { provide: LOGIN_API, useValue: apiMock }, { provide: AUTH_STATE_SETTER, useValue: authStateMock }],
    });

    service = TestBed.inject(LoginService);
  });

  it('unpacks user from nested res.data.user when returned from login endpoint', (done) => {
    const userPayload: PartnerAuthUser = {
      id: 'staff-10',
      email: 'manager@example.com',
      name: 'Manager Staff',
      role: 'staff',
      roles: ['staff'],
      managedBranchIds: ['b-1'],
      canManageBranches: true,
    };

    const response: ApiResponse<AuthResponse> = {
      success: true,
      data: {
        totpRequired: false,
        user: userPayload,
      } as unknown as AuthResponse,
    };

    apiMock.login.mockReturnValue(of(response));

    service.login({ email: 'manager@example.com', password: 'password123' }).subscribe({
      next: (user) => {
        expect(authStateMock.setLoggedInUser).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 'staff-10',
            canManageBranches: true,
            managedBranchIds: ['b-1'],
          }),
        );
        expect(user.canManageBranches).toBe(true);
        done();
      },
    });
  });

  it('unpacks user from flat res.data when user property is not nested', (done) => {
    const flatUser: PartnerAuthUser = {
      id: 'staff-flat',
      email: 'flat@example.com',
      name: 'Flat Staff',
      role: 'staff',
      roles: ['staff'],
      canManageBranches: false,
    };

    const response: ApiResponse<AuthResponse> = {
      success: true,
      data: flatUser as AuthResponse,
    };

    apiMock.login.mockReturnValue(of(response));

    service.login({ email: 'flat@example.com', password: 'password123' }).subscribe({
      next: (user) => {
        expect(user.id).toBe('staff-flat');
        expect(authStateMock.setLoggedInUser).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 'staff-flat',
            canManageBranches: false,
          }),
        );
        done();
      },
    });
  });
});
