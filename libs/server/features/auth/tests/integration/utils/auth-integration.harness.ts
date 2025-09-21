import { randomUUID } from 'crypto';
import type { INestApplication } from '@nestjs/common';
import type { JwtService } from '@nestjs/jwt';
import type { User, PrismaClient } from '@prisma/client';
import type supertest from 'supertest';
import {
  createAuthTestUser,
  CreateAuthTestUserOptions,
  deleteTestUser,
  ensureAuthRoles,
} from '@cthub-bsaas/server-testing-utils';
import type { EmailPort } from '@cthub-bsaas/server-contracts-auth';
import { createAuthTestContext } from './auth-test-app';
import type { EncryptionService } from '@cthub-bsaas/server-core';
import { UserRole } from '@cthub-bsaas/shared';
import { ThrottlerStorageService } from '@nestjs/throttler';

export interface CapturedEmail {
  to: string;
  subject: string;
  body: string;
}

export interface AuthIntegrationHarness {
  app: INestApplication;
  prisma: PrismaClient;
  jwtService: JwtService;
  encryptionService: EncryptionService;
  sentEmails: CapturedEmail[];
  registerUser(options?: RegisterUserOptions): Promise<User>;
  trackUser(id: string): void;
  cleanupUsers(): Promise<void>;
  resetEmails(): void;
  toCookiesArray(raw: string[] | string | undefined): string[] | undefined;
  expectCookies(cookies: string[] | undefined, options?: { requireAuth?: boolean }): string[];
  extractCookieValue(cookies: string[], name: string): string | undefined;
  withAuth(test: supertest.Test, cookies: string[] | undefined): supertest.Test;
  resetThrottle(): Promise<void>;
  close(): Promise<void>;
}

export interface SetupAuthIntegrationHarnessOptions {
  /**
   * Optional delegate that will receive email events after they are captured.
   */
  emailDelegate?: EmailPort;
}

export interface RegisterUserOptions extends Omit<CreateAuthTestUserOptions, 'email'> {
  /** Optional explicit email address. Defaults to a random value when omitted. */
  readonly email?: string;
  /** Roles to assign to the user. Defaults to `[UserRole.CUSTOMER]`. */
  readonly roles?: UserRole[];
}

export async function setupAuthIntegrationHarness(
  options: SetupAuthIntegrationHarnessOptions = {},
): Promise<AuthIntegrationHarness> {
  const sentEmails: CapturedEmail[] = [];
  const emailPort: EmailPort = {
    async sendMail(to: string, subject: string, body: string) {
      sentEmails.push({ to, subject, body });
      if (options.emailDelegate) {
        await options.emailDelegate.sendMail(to, subject, body);
      }
    },
  };

  const context = await createAuthTestContext({ emailPort });
  await ensureAuthRoles(context.prisma);

  const createdUserIds: string[] = [];

  const trackUser = (id: string): void => {
    if (!createdUserIds.includes(id)) {
      createdUserIds.push(id);
    }
  };

  const registerUser = async (options: RegisterUserOptions = {}): Promise<User> => {
    const { roles = [UserRole.CUSTOMER], email, ...rest } = options;
    const resolvedEmail = email ?? `it-${randomUUID()}@example.com`;
    const user = await createAuthTestUser(context.prisma, roles.length ? roles : [UserRole.CUSTOMER], {
      ...rest,
      email: resolvedEmail,
    });
    trackUser(user.id);
    return user;
  };

  const cleanupUsers = async (): Promise<void> => {
    while (createdUserIds.length) {
      const id = createdUserIds.pop();
      if (!id) continue;
      const existing = await context.prisma.user.findUnique({ where: { id } });
      if (existing) {
        await deleteTestUser(context.prisma, existing);
      }
    }
  };

  const resetEmails = (): void => {
    sentEmails.length = 0;
  };

  // Integration specs reuse a single Nest app instance, so Nest's in-memory throttler stores
  // hit counts across cases. Clearing those Maps keeps the real guard active without leaking state.
  const resetThrottle = async (): Promise<void> => {
    try {
      const throttler = context.app.get(ThrottlerStorageService) as ThrottlerStorageService & {
        storage?: Map<unknown, unknown>;
        timeoutIds?: Map<string, NodeJS.Timeout[]>;
      };
      if (throttler.storage instanceof Map) {
        throttler.storage.clear();
      }
      if (throttler.timeoutIds instanceof Map) {
        throttler.timeoutIds.forEach((timeouts) => timeouts.forEach(clearTimeout));
        throttler.timeoutIds.clear();
      }
    } catch {
      // Guard not registered for this test context; ignore.
    }
  };

  const toCookiesArray = (raw: string[] | string | undefined): string[] | undefined => {
    if (!raw) {
      return undefined;
    }
    return Array.isArray(raw) ? raw : [raw];
  };

  const expectCookies = (cookies: string[] | undefined, options: { requireAuth?: boolean } = {}): string[] => {
    expect(cookies).toBeDefined();
    expect(cookies && cookies.length).toBeGreaterThan(0);
    if (options.requireAuth) {
      expect(cookies!.some((cookie) => cookie.startsWith('bsaas_at='))).toBe(true);
    }
    return cookies!;
  };

  const extractCookieValue = (cookies: string[], name: string): string | undefined => {
    const prefix = `${name}=`;
    const entry = cookies.find((cookie) => cookie.startsWith(prefix));
    return entry?.split(';')[0].slice(prefix.length);
  };

  const withAuth = (test: supertest.Test, cookies: string[] | undefined): supertest.Test => {
    if (!cookies || cookies.length === 0) {
      return test;
    }
    const xsrf = extractCookieValue(cookies, 'XSRF-TOKEN');
    if (xsrf) {
      test.set('X-XSRF-TOKEN', xsrf);
    }
    const accessToken = extractCookieValue(cookies, 'bsaas_at');
    if (accessToken) {
      test.set('Authorization', `Bearer ${accessToken}`);
    }
    const cookieHeader = cookies.map((cookie) => cookie.split(';')[0]).join('; ');
    return test.set('Cookie', cookieHeader);
  };

  const close = async (): Promise<void> => {
    await cleanupUsers();
    await context.close();
  };

  return {
    app: context.app,
    prisma: context.prisma,
    jwtService: context.jwtService,
    encryptionService: context.encryptionService,
    sentEmails,
    registerUser,
    trackUser,
    cleanupUsers,
    resetEmails,
    toCookiesArray,
    expectCookies,
    extractCookieValue,
    withAuth,
    resetThrottle,
    close,
  };
}
