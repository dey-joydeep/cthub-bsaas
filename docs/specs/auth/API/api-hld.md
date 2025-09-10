# Auth API — High-Level Design (HLD)
**Status:** Authoritative (merged; supersedes dated “Updates” entries)  
**Scope:** Non-registration authentication flows (Sign-in, MFA, Recovery Codes, Sessions/Devices, Password Reset, Email Change, Social).  
**Locales:** en/bn/hi

## Response Envelopes (Canonical)
- **Success**
```json
{
  "success": true,
  "data": {}
}
```
- **Error**
```json
{
  "success": false,
  "code": "auth.error.generic",
  "message": "Human readable message (localized on FE)",
  "details": [
    {
      "field": "email",
      "reason": "invalidFormat"
    }
  ],
  "meta": {
    "correlationId": "c-01HZZ..."
  }
}
```

## Cross-Cutting
- **Cookies:** AT/RT HttpOnly cookies (`bsaas_at`, `bsaas_rt`) and non-HttpOnly `XSRF-TOKEN`.  
  Flags: `HttpOnly` (AT/RT), `Secure`, `SameSite=Lax`, `Domain=.cthub.in` (configurable via `AUTH_COOKIE_DOMAIN`).  
  AT TTL 10–15m; RT TTL 14–30d with rotation (deny-list old jti).
- **CSRF:** Double-submit token (Angular sends `X-XSRF-TOKEN`).
- **Rate limiting:** Login and OTP/TOTP issue/verify endpoints; include `Retry-After` on `429`.
- **Audit:** login/logout/refresh, MFA enroll/verify, passkey register/login, recovery issue/verify, reset, email verify/change, OAuth link/unlink.

---

## Endpoints & Contracts (Authoritative)

### 1) Sign-in (Email + Password)
`POST /auth/login` → **200**, **401**, **422**, **429**, **500**

**Request**
```json
{
  "email": "user@example.com",
  "password": "S3curePass!",
  "rememberMe": true
}
```

**Responses**
- **200 (Password-only success; no MFA required)**
```json
{
  "success": true,
  "data": {
    "next": "signedIn",
    "user": {
      "id": "u_123",
      "email": "user@example.com",
      "fullName": "A B"
    }
  }
}
```
- **200 (MFA required)**
```json
{
  "success": true,
  "data": {
    "next": "mfa",
    "methods": [
      "webauthn",
      "totp",
      "recovery"
    ],
    "mfa": {
      "challengeId": "ch_abc",
      "allowed": "totp|webauthn|recovery"
    }
  }
}
```

**HTTP code usage**
- `200` valid credentials → either `next=signedIn` or `next=mfa`
- `401` invalid credentials (generic message; anti-enumeration)
- `422` input invalid
- `429` rate limited (per IP + per account)
- `500` unexpected

---

### 2) MFA — TOTP Verify (Sign-in challenge)
`POST /auth/mfa/totp/verify` → **200**, **400**, **401**, **410**, **422**, **429**, **500**

**Request**
```json
{
  "challengeId": "ch_abc",
  "code": "123456"
}
```

**Response**
```json
{
  "success": true,
  "data": {
    "next": "signedIn"
  }
}
```

**HTTP codes**
- `200` verified; proceed signed-in
- `400` malformed payload
- `401` wrong context/user
- `410` challenge expired
- `422` invalid code
- `429` attempts exhausted / cooldown
- `500` unexpected

---

### 3) MFA — Passkey (WebAuthn) Assertion (Sign-in)
- `POST /auth/mfa/webauthn/assertion/options` → **200**, **401**, **429**, **500**  
- `POST /auth/mfa/webauthn/assertion/result` → **200**, **400**, **401**, **410**, **422**, **429**, **500**

**Responses**
- **options**
```json
{
  "success": true,
  "data": {
    "publicKey": {
      "challenge": "base64url-challenge",
      "rpId": "cthub.in",
      "allowCredentials": [
        {
          "type": "public-key",
          "id": "base64url-cred-id"
        }
      ],
      "timeout": 60000,
      "userVerification": "preferred"
    },
    "challengeId": "ch_abc"
  }
}
```
- **result**
```json
{
  "success": true,
  "data": {
    "next": "signedIn"
  }
}
```

**HTTP codes**
- options: `200` ok; `401` unauthenticated context; `429` limited; `500` error  
- result: `200` ok; `400` payload invalid; `401` wrong context; `410` expired; `422` assertion invalid; `429` limited; `500` error

---

### 4) MFA — Enrollment (Security settings / first-run gate)
**TOTP**
- `POST /auth/mfa/totp/enroll` → **200**, **401**, **429**, **500**  
  **Response**
  ```json
  {
    "success": true,
    "data": {
      "qrCodeDataUrl": "data:image/png;base64,iVBOR...",
      "issuer": "CTHub",
      "label": "user@example.com"
    }
  }
  ```
- `POST /auth/mfa/totp/confirm` → **200**, **400**, **401**, **422**, **429**, **500**  
  **Request**
  ```json
  {
    "code": "123456"
  }
  ```
  **Response**
  ```json
  {
    "success": true,
    "data": {
      "enrolled": true
    }
  }
  ```

**Passkeys**
- `POST /auth/mfa/webauthn/attestation/options` → **200**, **401**, **429**, **500**  
  **Response**
  ```json
  {
    "success": true,
    "data": {
      "publicKey": {
        "challenge": "base64url-challenge",
        "rp": {
          "name": "CTHub",
          "id": "cthub.in"
        },
        "user": {
          "id": "base64url-user-id",
          "name": "user@example.com",
          "displayName": "A B"
        },
        "pubKeyCredParams": [
          { "type": "public-key", "alg": -7 }
        ],
        "timeout": 60000,
        "attestation": "none"
      }
    }
  }
  ```
- `POST /auth/mfa/webauthn/attestation/result` → **200**, **400**, **401**, **422**, **429**, **500**  
  **Request (sample)**  
  ```json
  {
    "id": "base64url-cred-id",
    "rawId": "base64url-raw-id",
    "response": {
      "clientDataJSON": "base64url",
      "attestationObject": "base64url"
    },
    "type": "public-key"
  }
  ```
  **Response**
  ```json
  {
    "success": true,
    "data": {
      "enrolled": true
    }
  }
  ```

**HTTP codes (both)**
- `200` successful step
- `400` malformed body
- `401` not authenticated
- `422` invalid OTP/assertion
- `429` rate-limited
- `500` unexpected

---

### 5) Recovery Codes
- `POST /auth/recovery-codes/issue` → **201**, **401**, **429**, **500**  
  **Response**
  ```json
  {
    "success": true,
    "data": {
      "codes": [
        "abcd-efgh-ijkl",
        "mnop-qrst-uvwx",
        "yz12-3456-7890"
      ]
    }
  }
  ```
- `GET /auth/recovery-codes` → **200**, **401**, **500**  
  **Response (masked hints)**
  ```json
  {
    "success": true,
    "data": {
      "hints": [
        "a***-****-****",
        "m***-****-****"
      ]
    }
  }
  ```
- `POST /auth/recovery-codes/verify` → **200**, **401**, **422**, **429**, **500**  
  **Request**
  ```json
  {
    "code": "abcd-efgh-ijkl"
  }
  ```
  **Response**
  ```json
  {
    "success": true,
    "data": {
      "verified": true
    }
  }
  ```

---

### 6) Sessions / Devices
- `POST /auth/refresh` → **200**, **401**, **403**, **429**, **500**  
  **Response**
  ```json
  {
    "success": true,
    "data": {
      "refreshed": true
    }
  }
  ```
- `POST /auth/logout` → **200**, **401**, **500**  
  **Response**
  ```json
  {
    "success": true,
    "data": {
      "loggedOut": true
    }
  }
  ```
- `POST /auth/logout-others` → **200**, **401**, **500**  
  **Response**
  ```json
  {
    "success": true,
    "data": {
      "loggedOutOthers": true
    }
  }
  ```
- `GET /auth/devices` → **200**, **401**, **500**  
  **Response**
  ```json
  {
    "success": true,
    "data": {
      "devices": [
        {
          "id": "dev_1",
          "ua": "Chrome 126 / macOS",
          "ip": "203.0.113.5",
          "lastSeen": "2025-09-07T12:34:56Z",
          "current": true
        }
      ]
    }
  }
  ```
- `POST /auth/devices/revoke` → **200**, **401**, **404**, **500**  
  **Request**
  ```json
  {
    "deviceId": "dev_1"
  }
  ```
  **Response**
  ```json
  {
    "success": true,
    "data": {
      "revoked": true
    }
  }
  ```

---

### 7) Password Reset
- `POST /auth/password/reset/request` → **202**, **429**, **500**  
  **Request**
  ```json
  {
    "email": "user@example.com"
  }
  ```
  **Response**
  ```json
  {
    "success": true,
    "data": {
      "sent": true
    }
  }
  ```
- `POST /auth/password/reset/confirm` → **200**, **400**, **410**, **422**, **429**, **500**  
  **Request**
  ```json
  {
    "token": "reset_abc",
    "newPassword": "N3wS3curePass!"
  }
  ```
  **Response**
  ```json
  {
    "success": true,
    "data": {
      "reset": true
    }
  }
  ```

---

### 8) Email Change
- `POST /auth/email/change/request` → **202**, **401**, **429**, **500**  
  **Request**
  ```json
  {
    "newEmail": "new@example.com"
  }
  ```
  **Response**
  ```json
  {
    "success": true,
    "data": {
      "sent": true
    }
  }
  ```
- `POST /auth/email/change/confirm` → **200**, **400**, **410**, **422**, **401**, **429**, **500**  
  **Request**
  ```json
  {
    "otp": "654321"
  }
  ```
  **Response**
  ```json
  {
    "success": true,
    "data": {
      "changed": true
    }
  }
  ```

---

### 9) Social (Customer)
- `GET /auth/oauth/:provider/start` → **302** to provider  
- `GET /auth/oauth/:provider/callback` → **302** to app on success or **200** (link step)  
- `POST /auth/social/unlink` → **200**, **401**, **409**, **422**, **500**  
  **Request**
  ```json
  {
    "provider": "google"
  }
  ```
  **Response**
  ```json
  {
    "success": true,
    "data": {
      "unlinked": true
    }
  }
  ```

## Cookies & Headers Effects
- **Login/Challenge success:** set AT/RT; issue or rotate `XSRF-TOKEN`.  
- **Refresh:** rotate RT, set AT, rotate `XSRF-TOKEN`.  
- **Logout:** clear AT/RT.  
- **MFA (TOTP/Passkeys) success:** set/refresh AT/RT.

## i18n Codes
All error `code` values map to en/bn/hi translations: e.g., `auth.login.invalid`, `auth.mfa.required`, `auth.mfa.totp.invalid`, `auth.passwordReset.sent`, `auth.emailChange.sent`, `auth.error.rateLimited`, `auth.error.generic`.

## Compatibility Note
If current controllers expose different paths (e.g., `/auth/login/totp`, `/auth/sessions`), add **aliases** forwarding to these canonical routes, or migrate progressively. A small response-normalizing interceptor can enforce the success/error envelope.
