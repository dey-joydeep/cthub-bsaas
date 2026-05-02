# Auth Traceability Matrix (UI - API - Tests)
**Updated:** 2026-05-02

Routes in this matrix must match `docs/specs/auth/API/openapi.yaml`.

| Screen | UI Action | API | Expected Codes | Primary UX Keys | Test IDs |
|---|---|---|---|---|---|
| Login | Submit credentials | `POST /auth/login` | 200, 401, 429 | `auth.errors.invalidCredentials` | `login-submit` |
| Login | Complete TOTP challenge | `POST /auth/login/totp` | 200, 410, 422, 429 | `auth.errors.totpInvalid` | `mfa-submit` |
| Login | Start WebAuthn login | `POST /auth/webauthn/login/start` | 200, 400, 429 | `auth.errors.passkey` | `login-passkey-start` |
| Login | Finish WebAuthn login | `POST /auth/webauthn/login/finish` | 200, 401, 410, 422 | `auth.errors.passkey` | `login-passkey-finish` |
| Forgot | Request reset | `POST /auth/password/forgot` | 202, 429 | `auth.messages.resetRequested` | `forgot-submit` |
| Reset | Confirm password | `POST /auth/password/reset` | 200, 400, 410 | `auth.errors.tokenInvalid` | `reset-submit` |
| Customer Reg | Register | `POST /auth/register` | 201, 400, 422, 429 | `auth.errors.weakPassword` | `reg-submit` |
| Registration | Request verification | `POST /auth/email/verify/request` | 202, 429 | `auth.messages.resendCooldown` | `reg-resend` |
| Registration | Confirm verification | `POST /auth/email/verify/confirm` | 200, 400, 410, 422, 429 | `auth.errors.otpInvalid` | `reg-otp` |
| Partner Reg | Validate owner invite | `GET /auth/owner/registration/{token}` | 200 | `auth.errors.inviteInvalid` | `owner-token` |
| Partner Reg | Complete owner invite | `POST /auth/owner/registration/complete` | 201, 400, 410, 422 | `auth.errors.weakPassword` | `owner-complete` |
| Partner Reg | Validate staff invite | `GET /auth/staff/registration/{token}` | 200 | `auth.errors.inviteInvalid` | `staff-token` |
| Partner Reg | Complete staff invite | `POST /auth/staff/registration/complete` | 201 | `auth.errors.weakPassword` | `staff-complete` |
| Settings | Generate recovery codes | `POST /auth/recovery/generate` | 200, 401, 403 | `auth.messages.recoveryIssued` | `rc-generate` |
| Settings | Verify recovery code | `POST /auth/recovery/verify` | 200, 400, 401, 403, 422 | `auth.errors.recoveryInvalid` | `rc-verify` |
| Settings | List sessions | `GET /auth/sessions` | 200, 401 | - | `sess-list` |
| Settings | Revoke session | `POST /auth/sessions/revoke/{id}` | 200, 401 | `auth.messages.sessionRevoked` | `sess-revoke` |
| Settings | Request email change | `POST /auth/email/change/request` | 202, 401, 403, 429 | `auth.messages.emailChangeSent` | `email-change-req` |
| Settings | Confirm email change | `POST /auth/email/change/confirm` | 200, 400, 410, 422, 429 | `auth.errors.emailChangeInvalid` | `email-change-conf` |
| Settings | Start passkey enrollment | `POST /auth/webauthn/register/start` | 200, 401, 403 | `auth.messages.passkeyEnrolled` | `pk-register-start` |
| Settings | Finish passkey enrollment | `POST /auth/webauthn/register/finish` | 200, 401, 403, 410, 422 | `auth.messages.passkeyEnrolled` | `pk-register-finish` |
| Settings | List passkeys | `GET /auth/webauthn/devices` | 200, 401, 403 | - | `pk-list` |
| Settings | Remove passkey | `DELETE /auth/webauthn/devices/{id}` | 200, 400, 401, 403 | `auth.messages.passkeyRemoved` | `pk-remove` |
| Settings | Start TOTP enrollment | `POST /auth/totp/enroll/start` | 200, 401, 403 | - | `totp-enroll-start` |
| Settings | Finish TOTP enrollment | `POST /auth/totp/enroll/finish` | 200, 401, 403, 422 | `auth.errors.totpInvalid` | `totp-enroll-finish` |
| Settings | Change password | `POST /auth/password/change` | 200, 401, 403, 429 | `auth.errors.weakPassword` | `pwd-change` |
| Customer Settings | Start social login/link | `GET /auth/oauth/{provider}/start` | 302 | - | `social-start` |
| Customer Settings | OAuth callback | `GET /auth/oauth/{provider}/callback` | 200 | - | `social-callback` |
| Customer Settings | Unlink social | `POST /auth/oauth/{provider}/unlink` | 200, 401, 403 | `auth.messages.socialUnlinked` | `social-unlink` |

