import { CredentialTotpRepository, RefreshTokenRepository, SessionRepository, UserRepository, PrismaModule, PasswordResetRepository, SocialAccountRepository, CredentialPasskeyRepository } from '@cthub-bsaas/server-data-access';
import { EncryptionModule } from '@cthub-bsaas/server-core';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { resolveAccessSecret } from './utils/jwt-secret.util';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './controllers/auth.controller';
import { TotpController } from './controllers/totp.controller';
import {
  CREDENTIAL_TOTP_REPOSITORY,
  CREDENTIAL_PASSKEY_REPOSITORY,
  REFRESH_TOKEN_REPOSITORY,
  SESSION_REPOSITORY,
  USER_REPOSITORY,
  SOCIAL_ACCOUNT_REPOSITORY,
} from '@cthub-bsaas/server-contracts-auth';
import { EMAIL_VERIFICATION_REPOSITORY } from '@cthub-bsaas/server-contracts-auth';
import { PASSWORD_RESET_REPOSITORY } from '@cthub-bsaas/server-contracts-auth';
import { EmailVerificationRepository } from '@cthub-bsaas/server-data-access';
import { AuthService } from './services/auth.service';
import { AuditService } from './services/audit.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { EmailModule, TotpModule, WebAuthnModule, RecoveryModule, OAuthModule, InviteModule } from '@cthub-bsaas/server-infrastructure';
import { CookieRegistry, CookiesInterceptor } from '@cthub-bsaas/server-core';
import { AuthCookiesService } from './services/auth-cookies.service';

const providers = [
  {
    provide: REFRESH_TOKEN_REPOSITORY,
    useClass: RefreshTokenRepository,
  },
  {
    provide: SESSION_REPOSITORY,
    useClass: SessionRepository,
  },
  {
    provide: USER_REPOSITORY,
    useClass: UserRepository,
  },
  {
    provide: CREDENTIAL_TOTP_REPOSITORY,
    useClass: CredentialTotpRepository,
  },
  {
    provide: EMAIL_VERIFICATION_REPOSITORY,
    useClass: EmailVerificationRepository,
  },
  {
    provide: PASSWORD_RESET_REPOSITORY,
    useClass: PasswordResetRepository,
  },
  {
    provide: SOCIAL_ACCOUNT_REPOSITORY,
    useClass: SocialAccountRepository,
  },
  {
    provide: CREDENTIAL_PASSKEY_REPOSITORY,
    useClass: CredentialPasskeyRepository,
  },
];

/**
 * @public
 * Authentication feature module providing controllers, services and strategies
 * for login, session management and MFA.
 */
@Module({
  imports: [
    PrismaModule,
    EncryptionModule,
    TotpModule,
    WebAuthnModule,
    RecoveryModule,
    OAuthModule,
    InviteModule,
    EmailModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: resolveAccessSecret(config),
        signOptions: {
          expiresIn: config.get<string>('JWT_ACCESS_EXPIRES_IN', '15m'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController, TotpController],
  providers: [AuthService, JwtStrategy, AuditService, AuthCookiesService, CookieRegistry, CookiesInterceptor, ...providers],
  exports: [AuthService, AuditService, AuthCookiesService, CookieRegistry, CookiesInterceptor, ...providers],
})
export class AuthModule {}

