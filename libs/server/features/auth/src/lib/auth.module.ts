import { CredentialTotpRepository, RefreshTokenRepository, SessionRepository, UserRepository, PrismaModule, PasswordResetRepository, SocialAccountRepository, CredentialPasskeyRepository } from '@cthub-bsaas/server-data-access';
import { Module } from '@nestjs/common';
import { ConfigService, CookieRegistry, CookiesInterceptor, EncryptionModule, LoggerModule } from '@cthub-bsaas/server-core';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './controllers/auth.controller';
import { SessionsController } from './controllers/sessions.controller';
import { PasswordController } from './controllers/password.controller';
import { EmailController } from './controllers/email.controller';
import { RecoveryController } from './controllers/recovery.controller';
import { WebauthnController } from './controllers/webauthn.controller';
import { OauthController } from './controllers/oauth.controller';
import { RegistrationController } from './controllers/registration.controller';
import { TotpController } from './controllers/totp.controller';
import { PasskeysController } from './controllers/passkeys.controller';
import { PasskeysService } from './services/passkeys.service';
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
import { EmailModule, TotpModule, WebAuthnModule, RecoveryModule, OAuthModule, InviteModule, PrismaLastAdminAdapter } from '@cthub-bsaas/server-infrastructure';
import { RateLimitModule } from '@cthub-bsaas/server-infrastructure';
import { LAST_ADMIN_VALIDATOR_PORT } from '@cthub-bsaas/server-contracts-auth';
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
  {
    provide: LAST_ADMIN_VALIDATOR_PORT,
    useClass: PrismaLastAdminAdapter,
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
    LoggerModule,
    TotpModule,
    WebAuthnModule,
    RecoveryModule,
    OAuthModule,
    InviteModule,
    EmailModule,
    RateLimitModule,
    PassportModule,
    JwtModule.registerAsync({
      useFactory: (config: ConfigService) => ({
        secret: config.auth.jwtAccessSecret,
        signOptions: {
          expiresIn: config.auth.jwtExpiresIn as import('ms').StringValue,
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [
    AuthController,
    TotpController,
    SessionsController,
    PasswordController,
    EmailController,
    RecoveryController,
    WebauthnController,
    OauthController,
    RegistrationController,
    PasskeysController,
  ],
  providers: [AuthService, PasskeysService, JwtStrategy, AuditService, AuthCookiesService, CookieRegistry, CookiesInterceptor, ...providers],
  exports: [AuthService, PasskeysService, AuditService, AuthCookiesService, CookieRegistry, CookiesInterceptor, ...providers],
})
export class AuthModule {}
