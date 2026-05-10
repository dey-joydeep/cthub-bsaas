
# Frontend Service Contracts (Auth) — Reference to OpenAPI
Updated: 2025-09-11

For request/response shapes, see **openapi.yaml** `components/schemas` and `paths`.

## Core
- Login → **POST /auth/login**
- Forgot → **POST /auth/password/forgot**
- Reset → **POST /auth/password/reset**
- MFA TOTP → **POST /auth/mfa/totp/verify**
- Sessions → **GET /auth/sessions**, **DELETE /auth/sessions/:id**, **POST /auth/logout-others**
- Recovery codes → **POST /auth/recovery/issue**, **POST /auth/recovery/verify**
- Email change → **POST /auth/email/change/request**, **POST /auth/email/change/confirm**
- Passkeys → **GET/POST /auth/webauthn/attestation/***, **DELETE/POST /auth/passkeys/:id(/default)**
- Password change → **POST /auth/password/change**
- Social (customer) → **GET /auth/oauth/:provider/start**, **GET /auth/oauth/:provider/callback**, **DELETE /auth/oauth/:provider**

## Registration
- Customer → **POST /auth/register**, **POST /auth/email/verify/request**, **POST /auth/email/verify/confirm**, **POST /auth/register/complete**
- Partner → **GET /auth/owner/registration/:token**, **POST /auth/owner/registration/complete**, **GET /auth/staff/registration/:token**, **POST /auth/staff/registration/complete**, **POST /auth/otp/request**, **POST /auth/otp/confirm**
