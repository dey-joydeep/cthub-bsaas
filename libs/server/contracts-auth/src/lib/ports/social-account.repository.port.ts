import type { SocialAccount } from '@prisma/client';

/**
 * @public
 * Injection token for {@link ISocialAccountRepository}.
 */
export const SOCIAL_ACCOUNT_REPOSITORY = 'SOCIAL_ACCOUNT_REPOSITORY';

/**
 * @public
 * Repository for linking/unlinking OAuth providers to users.
 */
export interface ISocialAccountRepository {
  findByProviderAccount(provider: string, providerUserId: string): Promise<SocialAccount | null>;
  link(userId: string, provider: string, providerUserId: string): Promise<SocialAccount>;
  findByUserId(userId: string): Promise<SocialAccount[]>;
  unlink(userId: string, provider: string): Promise<void>;
}

