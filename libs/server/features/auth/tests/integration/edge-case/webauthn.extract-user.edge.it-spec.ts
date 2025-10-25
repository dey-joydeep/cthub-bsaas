import { Test } from '@nestjs/testing';
import { WebauthnController } from '../../../src/lib/controllers/webauthn.controller';
import { WEB_AUTHN_PORT } from '@cthub-bsaas/server-contracts-auth';
import type { WebAuthnPort } from '@cthub-bsaas/server-contracts-auth';
import { AuthService } from '../../../src/lib/services/auth.service';
import { AuthCookiesService } from '../../../src/lib/services/auth-cookies.service';

/**
 * Edge-case coverage: exercise extractUserId() branches where OptionalUser provides only `id`
 * and where the candidate is not a valid non-empty string. This nudges IT branch coverage to 100%.
 */
describe('WebAuthn extractUserId edge cases (integration harness)', () => {
  let controller: WebauthnController;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [WebauthnController],
      providers: [
        { provide: WEB_AUTHN_PORT, useValue: {} as unknown as WebAuthnPort },
        { provide: AuthService, useValue: {} },
        { provide: AuthCookiesService, useValue: { issue: jest.fn() } },
      ],
    }).compile();

    controller = moduleRef.get(WebauthnController);
  });

  it('extracts `id` when `userId` is absent on OptionalUser', () => {
    const user = { id: 'user-xyz' } as unknown as import('@cthub-bsaas/shared').AuthenticatedUser;
    const extractor = (controller as unknown as { extractUserId: (u?: import('@cthub-bsaas/shared').AuthenticatedUser) => string | undefined }).extractUserId;
    const result = extractor.call(controller, user);
    expect(result).toBe('user-xyz');
  });

  it('returns undefined when candidate is not a non-empty string', () => {
    const user = { id: '' } as unknown as import('@cthub-bsaas/shared').AuthenticatedUser;
    const extractor = (controller as unknown as { extractUserId: (u?: import('@cthub-bsaas/shared').AuthenticatedUser) => string | undefined }).extractUserId;
    const result = extractor.call(controller, user);
    expect(result).toBeUndefined();
  });
});
