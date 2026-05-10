# Unit & Integration Tests (Jest 29)

- Use-cases: login, refresh, enroll passkey, verify TOTP, password reset, recovery verify.
- Ports/adapters: token service, webauthn adapter, totp adapter, email sender, rate limiter, audit logger.
- Guards/interceptors: CSRF validation, rate limit guard, correlation-id injector, roles/tenant guards.
- DTO validation: class-validator with strict whitelisting and transformation.
