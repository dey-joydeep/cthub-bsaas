import { Test } from '@nestjs/testing';
import { OauthController } from '../../../src/lib/controllers/oauth.controller';
import type { OAuthPort } from '@cthub-bsaas/server-contracts-auth';
import { OAUTH_PORT } from '@cthub-bsaas/server-contracts-auth';
import { AuthService } from '../../../src/lib/services/auth.service';
import { AuthCookiesService } from '../../../src/lib/services/auth-cookies.service';

/**
 * Edge-case coverage: exercise OauthController.extractUserId() branches
 * to ensure its private helper is covered for branch 100%.
 */
describe('OAuth extractUserId edge cases (integration harness)', () => {
  let controller: OauthController;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [OauthController],
      providers: [
        { provide: AuthService, useValue: {} },
        { provide: AuthCookiesService, useValue: { issue: jest.fn(), rotateOnRefresh: jest.fn(), clear: jest.fn() } },
        { provide: OAUTH_PORT, useValue: {} as unknown as OAuthPort },
      ],
    }).compile();

    controller = moduleRef.get(OauthController);
  });

  it('extracts `id` when `userId` is absent on OptionalUser', () => {
    const extractor = (controller as unknown as { extractUserId: (u?: import('@cthub-bsaas/shared').AuthenticatedUser) => string | undefined }).extractUserId;
    expect(extractor({ id: 'fallback-id' } as unknown as import('@cthub-bsaas/shared').AuthenticatedUser)).toBe('fallback-id');
  });

  it('returns undefined when candidate is not a non-empty string', () => {
    const extractor = (controller as unknown as { extractUserId: (u?: import('@cthub-bsaas/shared').AuthenticatedUser) => string | undefined }).extractUserId;
    expect(extractor({ id: '' } as unknown as import('@cthub-bsaas/shared').AuthenticatedUser)).toBeUndefined();
    expect(extractor(undefined)).toBeUndefined();
  });
});
