# Authentication And Authorization User Stories

**Date:** 2026-05-11
**Status:** Current supporting source
**Scope:** Common Auth behavior for Admin, Partner, and Customer apps.

## Owner Outcome

As a platform operator and salon business, I want secure authentication, authorization, session management, recovery, and auditability so that users can access the right app safely without increasing operational risk.

## Actors

- Platform Admin
- Salon Owner
- Staff
- Customer
- Support Admin

## Product Context

- Backend: one NestJS API.
- Frontends: Admin, Partner, Customer.
- Auth model: secure cookie-based access and refresh tokens for first-party apps.
- API contracts: Auth HTTP behavior must be verified against `docs/specs/auth/API/openapi.yaml`.

## User Stories

### AUTH-US-001: Cookie-based sign-in

As a first-party web user, I want secure cookie-based sign-in so that I can use the app without handling bearer tokens manually.

### AUTH-US-002: Refresh rotation

As a platform operator, I want refresh token rotation and replay protection so that stolen or reused refresh tokens can be invalidated.

### AUTH-US-003: CSRF protection

As a platform operator, I want browser state-changing requests protected by CSRF controls so that cross-site attacks are blocked.

### AUTH-US-004: Role and tenant authorization

As a salon business, I want users restricted by role and tenant/branch scope so that staff cannot access unauthorized business data.

### AUTH-US-005: Strong authentication

As a high-risk user, I want passkey or TOTP MFA support so that account compromise risk is reduced.

### AUTH-US-006: Account recovery

As a user, I want safe password reset and recovery flows so that I can regain access without exposing account existence.

### AUTH-US-007: Active sessions

As a user, I want to view and revoke active sessions so that I can remove access from lost or shared devices.

### AUTH-US-008: Audit and correlation

As a platform operator, I want auth events logged with correlation IDs so that incidents can be investigated.

## Functional Requirements

- Issue short-lived access token and rotating refresh token through secure cookies.
- Support logout, logout other sessions, session listing, and session revocation.
- Enforce CSRF protection on browser state-changing requests.
- Support Admin, Partner, and Customer role policies.
- Support passkeys, TOTP, recovery codes, and email OTP where specified by persona flows.
- Return generic messages for reset and verification requests to avoid account enumeration.
- Include correlation ID in relevant response headers, error bodies, and logs.

## Business Rules And Edge Cases

- Admin MFA is mandatory.
- Partner Owner/Staff access is gated until required MFA enrollment is complete.
- Customer MFA is optional and should remain low-friction.
- Refresh-token replay must revoke the affected token chain according to policy.
- Password reset success should revoke other active sessions according to policy.
- Auth errors must use centralized error/message keys.
- Cookie policy must be environment-aware and secure-by-default.

## Acceptance Criteria

- Given valid credentials, when sign-in succeeds, then secure auth cookies and XSRF token are issued.
- Given a refresh token is used, when refresh succeeds, then a new token pair is issued and the old refresh token is invalidated.
- Given a replayed refresh token, when refresh is attempted, then access is denied and replay handling is audited.
- Given a browser state-changing request without valid CSRF token where CSRF applies, then the request is rejected.
- Given a user revokes a session, when that session tries to refresh, then refresh fails.
- Given an auth error occurs, then the response includes a stable code and correlation ID.

## Non-Functional Requirements

- Auth endpoints should be rate-limited.
- Sensitive cookies must be HttpOnly, Secure in production, and SameSite appropriate to deployment.
- Auth flows must be SSR-compatible.
- Auth logs must not expose secrets or raw tokens.
- Auth behavior must be covered by unit and integration tests.
