# Auth Traceability Matrix (UI ↔ API ↔ Tests)
**Updated:** 2025-09-11

| Screen | UI Action | API | Expected Codes | i18n Keys | Test IDs |
|---|---|---|---|---|---|
| Login | Submit credentials | POST /auth/login | 200, 401, 423, 429 | auth.errors.invalidCredentials, auth.errors.accountLocked | login-submit |
| Login | Use passkey | GET/POST webauthn/* | 200, 202, 401, 429 | auth.errors.passkey | login-passkey |
| Forgot | Request reset | POST /auth/password/forgot | 202, 429 | auth.messages.resetRequested | forgot-submit |
| Reset | Confirm password | POST /auth/password/reset | 200, 400, 410 | auth.errors.tokenInvalid, auth.errors.tokenExpired | reset-submit |
| MFA | Verify TOTP | POST /auth/mfa/totp/verify | 200, 401, 423 | auth.errors.totpInvalid, auth.errors.mfaLocked | mfa-submit |
| Customer Reg | Start | POST /auth/register | 202 | auth.messages.otpSent | reg-start |
| Customer Reg | Verify OTP | POST /auth/email/verify/confirm | 200, 400, 410 | auth.errors.otpInvalid, auth.errors.otpExpired | reg-otp |
| Customer Reg | Complete | POST /auth/register/complete | 200, 400 | auth.errors.weakPassword | reg-complete |
| Partner Reg | Start | POST /auth/partner/register | 200 | auth.messages.resumeToken | preg-start |
| Settings | Issue recovery codes | POST /auth/recovery/issue | 200 | auth.messages.recoveryIssued | rc-issue |
| Settings | Verify recovery code | POST /auth/recovery/verify | 200 | auth.errors.recoveryInvalid | rc-verify |
| Settings | List sessions | GET /auth/sessions | 200 | — | sess-list |
| Settings | Revoke session | DELETE /auth/sessions/:id | 200 | auth.messages.sessionRevoked | sess-revoke |
| Settings | Logout others | POST /auth/logout-others | 200 | auth.messages.logoutOthers | sess-logout-others |
| Settings | Request email change | POST /auth/email/change/request | 202 | auth.messages.emailChangeSent | email-change-req |
| Settings | Confirm email change | POST /auth/email/change/confirm | 200, 400 | auth.errors.emailChangeInvalid | email-change-conf |
| Settings | Enroll passkey | GET/POST webauthn/attestation/* | 200 | auth.messages.passkeyEnrolled | pk-enroll |
| Settings | Remove passkey | DELETE /auth/passkeys/:id | 200 | auth.messages.passkeyRemoved | pk-remove |
| Settings | Set default passkey | POST /auth/passkeys/:id/default | 200 | auth.messages.passkeyDefault | pk-default |
| Settings | Enroll TOTP | POST /auth/mfa/totp/enroll|verify | 200, 401 | auth.errors.totpInvalid | totp-enroll |
| Settings | Change password | POST /auth/password/change | 200, 400, 401 | auth.errors.weakPassword | pwd-change |
| Customer Settings | Link social | GET /auth/oauth/:provider/link | 200 | auth.messages.socialLinked | social-link |
| Customer Settings | Unlink social | DELETE /auth/oauth/:provider | 200 | auth.messages.socialUnlinked | social-unlink |

| Registration | Resend cooldown | POST /auth/email/verify/request | 202, 429 | auth.messages.resendCooldown | reg-resend |
| Registration | Session expired redirect | — | — | auth.messages.sessionExpired | reg-expired |
| Partner Reg | Invite invalid/expired/consumed | GET owner/staff registration | 400, 410, 409 | auth.errors.inviteInvalid | preg-token |
| Registration | Social prefill | GET /auth/oauth/:provider/callback | 200 | — | reg-social |
