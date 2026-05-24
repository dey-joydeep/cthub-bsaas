# Server Testing Utilities

This package contains helpers used by server tests (unit and integration). It is not shipped in production apps.

Common request helper conventions live under `libs/server/core/src/testing/` so feature tests can share cookie and authorization header handling without depending on Auth-specific harness internals.

## WebAuthn Stub Adapter (tests only)

`WebAuthnStubAdapter` is a minimal, deterministic implementation of the `WebAuthnPort` intended for tests. It does not perform any cryptographic checks, does not hit Redis, and is not wired in production. Use it to keep tests fast and predictable when you are not validating the SimpleWebAuthn crypto paths.

- Source: `src/lib/stubs/webauthn.stub.adapter.ts`
- Import path: `@cthub-bsaas/server-testing-utils`

### Example: Override in a Nest TestingModule

```ts
import { Test } from '@nestjs/testing';
import { WEB_AUTHN_PORT } from '@cthub-bsaas/server-contracts-auth';
import { WebAuthnStubAdapter } from '@cthub-bsaas/server-testing-utils';
import { WebAuthnModule } from '@cthub-bsaas/server-infrastructure';

describe('Auth flows with stubbed WebAuthn', () => {
  it('uses the stub for deterministic challenges', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [WebAuthnModule],
      providers: [
        // Override the port binding with the stub for this test module
        { provide: WEB_AUTHN_PORT, useClass: WebAuthnStubAdapter },
      ],
    }).compile();

    const webauthn = moduleRef.get(WEB_AUTHN_PORT);
    const reg = await webauthn.startRegistration('u1', 'user@example.com');
    expect(reg.challenge).toBe('reg-u1');
  });
});
```

### When to use

- Unit tests: to exercise controller/service branches that depend on the port without incurring SimpleWebAuthn crypto or device complexity.
- Integration tests: to validate DI wiring and downstream behavior with deterministic inputs.

### When not to use

- Production wiring (apps and modules). Keep the production adapter (`WebAuthnSimpleAdapter`) bound in modules.
- End‑to‑end browser/device validation. Prefer a Virtual Authenticator (e.g., Playwright) for happy‑path flows.
