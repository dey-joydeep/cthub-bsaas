import { RegistrationController } from './registration.controller';
import { AuthService } from '../services/auth.service';
import { AuthCookiesService } from '../services/auth-cookies.service';
import type { RegistrationCompleteInput } from '@cthub-bsaas/server-contracts-auth';

const makeAuthService = () => ({
  validateOwnerInvite: jest.fn((_t: string) => Promise.resolve({ email: 'owner@example.com', salonId: 's1' })),
  validateStaffInvite: jest.fn((_t: string) => Promise.resolve({ email: 'staff@example.com', salonId: 's1' })),
  completeOwnerRegistration: jest.fn((_p: RegistrationCompleteInput) => Promise.resolve({ accessToken: 'OA', refreshToken: 'OR' })),
  completeStaffRegistration: jest.fn((_p: RegistrationCompleteInput) => Promise.resolve({ accessToken: 'SA', refreshToken: 'SR' })),
  register: jest.fn((_e: string, _p: string, _n?: string) => Promise.resolve(undefined)),
});

const makeCookies = () => ({ issue: jest.fn() });

describe('RegistrationController (unit)', () => {
  let controller: RegistrationController;
  let service: ReturnType<typeof makeAuthService>;
  let cookies: ReturnType<typeof makeCookies>;

  beforeEach(() => {
    service = makeAuthService();
    cookies = makeCookies();
    controller = new RegistrationController(service as unknown as AuthService, cookies as unknown as AuthCookiesService);
  });

  it('validateOwnerInvite returns normalized payload', async () => {
    const out = await controller.validateOwnerInvite('tok');
    expect(service.validateOwnerInvite).toHaveBeenCalledWith('tok');
    expect(out).toEqual({ valid: true, email: 'owner@example.com', salonId: 's1' });
  });

  it('completeOwnerRegistration branches: mfa next and token issuance', async () => {
    (service.completeOwnerRegistration as jest.Mock).mockResolvedValueOnce({ next: 'mfa' } as const);
    const mfa = await controller.completeOwnerRegistration({} as RegistrationCompleteInput);
    expect(mfa).toEqual({ next: 'mfa' });
    expect(cookies.issue).not.toHaveBeenCalled();

    (service.completeOwnerRegistration as jest.Mock).mockResolvedValueOnce({ accessToken: 'A', refreshToken: 'R' });
    const ok = await controller.completeOwnerRegistration({} as RegistrationCompleteInput);
    expect(ok).toEqual({});
    expect(cookies.issue).toHaveBeenCalledWith(expect.objectContaining({ accessToken: 'A', refreshToken: 'R' }));
  });

  it('validateStaffInvite returns normalized payload', async () => {
    const out = await controller.validateStaffInvite('tok2');
    expect(service.validateStaffInvite).toHaveBeenCalledWith('tok2');
    expect(out).toEqual({ valid: true, email: 'staff@example.com', salonId: 's1' });
  });

  it('completeStaffRegistration branches mirror owner', async () => {
    (service.completeStaffRegistration as jest.Mock).mockResolvedValueOnce({ next: 'mfa' } as const);
    const mfa = await controller.completeStaffRegistration({} as RegistrationCompleteInput);
    expect(mfa).toEqual({ next: 'mfa' });
    expect(cookies.issue).not.toHaveBeenCalled();

    (service.completeStaffRegistration as jest.Mock).mockResolvedValueOnce({ accessToken: 'A', refreshToken: 'R' });
    const ok = await controller.completeStaffRegistration({} as RegistrationCompleteInput);
    expect(ok).toEqual({});
    expect(cookies.issue).toHaveBeenCalledWith(expect.objectContaining({ accessToken: 'A', refreshToken: 'R' }));
  });

  it('register delegates to service and returns success', async () => {
    const out = await controller.register({ email: 'c@example.com', password: 'Pass#1', name: 'Name' });
    expect(service.register).toHaveBeenCalledWith('c@example.com', 'Pass#1', 'Name');
    expect(out).toEqual({ success: true });
  });
});
