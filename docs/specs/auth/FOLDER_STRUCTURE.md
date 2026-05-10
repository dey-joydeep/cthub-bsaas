# Implementation Folder Structure — Cycle‑Safe Nx Layout (Ports in Contracts)

This version removes potential circular dependencies by moving all **ports/contracts** into a neutral library that both **features** and **infrastructure/data-access** can depend on, without importing each other.

Key rules:
- **Features do not import Infrastructure.** Composition happens in the app/root module.
- **Infrastructure** and **Data‑access** both depend on **Contracts** (ports) and **Core**, never on **Features**.
- **Contracts** lives alongside **Core** and exports only interface types + DI tokens.

```
libs/
  server/
    core/                              # cross-cutting
      project.json            # tags: ["scope:server","type:core"]
      src/
        index.ts
        lib/
          auth/               # shared guards/decorators if any
          common/errors/
          filters/
          i18n/{en,bn,jp}/
          interceptors/
            correlation-id.interceptor.ts
            audit.interceptor.ts
            rate-limit.interceptor.ts
          services/error/

    contracts-auth/                    # <— all ports/tokens live here
      project.json            # tags: ["scope:server","type:core","layer:contracts"]
      src/
        index.ts
        lib/
          ports/
            token.port.ts               # access/refresh issuing, rotation, revoke
            user-repo.port.ts
            session-repo.port.ts
            refresh-token-repo.port.ts
            webauthn.port.ts
            totp.port.ts
            email-sender.port.ts
            audit.port.ts
            ratelimit.port.ts
            crypto.port.ts

    data-access/                        # DB-only: Prisma + repositories (implement repo ports)
      project.json            # tags: ["scope:server","type:data-access"]
      prisma/
        schema.prisma
      src/
        index.ts
        lib/
          prisma.service.ts
          repositories/
            user.repository.ts          # implements UserRepoPort
            session.repository.ts       # implements SessionRepoPort
            refresh-token.repository.ts # implements RefreshTokenRepoPort
            email-verification.repository.ts
            password-reset.repository.ts
            recovery-code.repository.ts
            passkey.repository.ts
            totp.repository.ts

    infrastructure/                     # single infra lib (adapters implement infra ports)
      project.json            # tags: ["scope:server","type:infra"]
      src/
        index.ts
        lib/
          email/
            email.nodemailer.adapter.ts     # implements EmailSenderPort
            email.module.ts                 # providers: { provide: EMAIL_SENDER_PORT, useClass: ... }
          cache/
            redis.client.ts
            ratelimit.redis.adapter.ts      # implements RateLimitPort
          audit/
            audit.pino.adapter.ts           # implements AuditPort
          webauthn/
            webauthn.simplewebauthn.adapter.ts  # implements WebAuthnPort
          totp/
            totp.otplib.adapter.ts          # implements TotpPort
          crypto/
            crypto.aesgcm.service.ts        # implements CryptoPort (e.g., AES-GCM for secrets)

    features/
      auth/
        project.json              # tags: ["scope:server","type:feature"]
        src/
          index.ts
          lib/
            http/                 # thin Nest controllers only
              auth.controller.ts
              sessions.controller.ts
              totp.controller.ts
              webauthn.controller.ts
            application/          # use-cases (pure business logic) depend on Contracts ports
              login.usecase.ts
              refresh-session.usecase.ts
              enroll-passkey.usecase.ts
              login-passkey.usecase.ts
              enroll-totp.usecase.ts
              verify-totp.usecase.ts
              request-reset.usecase.ts
              confirm-reset.usecase.ts
              verify-email.usecase.ts
              revoke-session.usecase.ts
            domain/
              entities/
              policies/
            dto/
              requests/
              responses/
            validators/
            test/
              unit/
              integration/

  shared/
    project.json                 # tags: ["scope:shared","type:shared"]
    src/
      index.ts
      lib/
        enums/
        types/
```

> **Why this avoids cycles:** `features/auth` uses only **contracts** (interfaces/tokens). `infrastructure` and `data-access` implement those contracts. Neither imports the other or the feature.

---

## Allowed dependency directions

```
shared  ←  core  ←  contracts-auth
   ↑         ↑             ↑
   └─────────┴──────┐      │
                    │      │
              data-access  │
                    ↑      │
               infrastructure
                    ↑
                 features/auth
```

- **features/auth → contracts-auth, core, shared, data-access**
- **infrastructure → contracts-auth, core, shared**
- **data-access → contracts-auth, core, shared**
- **contracts-auth → core, shared (types only)**
- **core → shared**
- **No feature ↔ infra edges**

---

## Nx `depConstraints` (cycle-safe)

```jsonc
// tools/eslint-rules/.eslintrc.json (example)
{
  "extends": ["plugin:@nx/typescript"],
  "overrides": [
    {
      "files": ["*.ts", "*.tsx", "*.js", "*.jsx"],
      "rules": {
        "@nx/enforce-module-boundaries": [
          "error",
          {
            "enforceBuildableLibDependency": true,
            "depConstraints": [
              { "sourceTag": "type:feature",     "onlyDependOnLibsWithTags": ["type:core","type:shared","type:data-access"] },
              { "sourceTag": "type:infra",       "onlyDependOnLibsWithTags": ["type:core","type:shared"] },
              { "sourceTag": "type:data-access", "onlyDependOnLibsWithTags": ["type:core","type:shared"] },
              { "sourceTag": "type:core",        "onlyDependOnLibsWithTags": ["type:core","type:shared"] },
              { "sourceTag": "type:shared",      "onlyDependOnLibsWithTags": ["type:shared"] }
            ]
          }
        ]
      }
    }
  ]
}
```

**Tags to add in `project.json`:**
```json
{ "name": "@cthub/server-core",            "tags": ["scope:server","type:core"] }
{ "name": "@cthub/server-contracts-auth",  "tags": ["scope:server","type:core","layer:contracts"] }
{ "name": "@cthub/server-data-access",     "tags": ["scope:server","type:data-access"] }
{ "name": "@cthub/server-infrastructure",  "tags": ["scope:server","type:infra"] }
{ "name": "@cthub/server-features-auth",   "tags": ["scope:server","type:feature"] }
{ "name": "@cthub/shared",                 "tags": ["scope:shared","type:shared"] }
```

> Because `contracts-auth` is tagged as `type:core`, both **infra** and **data-access** can depend on it without relaxing rules.

---

## Contract tokens (example)

```ts
// libs/server/contracts-auth/src/lib/ports/totp.port.ts
export const TOTP_PORT = Symbol('TOTP_PORT');
export interface TotpPort {
  generateSecret(): Promise<{ secret: string; uri: string }>;
  verify(opts: { secret: string; token: string; window?: number }): Promise<boolean>;
}
```

```ts
// libs/server/contracts-auth/src/lib/ports/webauthn.port.ts
export const WEBAUTHN_PORT = Symbol('WEBAUTHN_PORT');
export interface WebAuthnPort {
  startRegistration(user: { id: string; name: string; displayName: string }): Promise<PublicKeyCredentialCreationOptionsJSON>;
  finishRegistration(resp: RegistrationResponseJSON): Promise<{ credentialId: string; counter: number }>;
  startAuthentication(userId: string): Promise<PublicKeyCredentialRequestOptionsJSON>;
  finishAuthentication(resp: AuthenticationResponseJSON): Promise<{ credentialId: string; counter: number }>;
}
```

**Binding in Infrastructure:**
```ts
// libs/server/infrastructure/src/lib/totp/totp.module.ts
@Module({
  providers: [{ provide: TOTP_PORT, useClass: TotpOtplibAdapter }],
  exports:   [TOTP_PORT],
})
export class TotpInfraModule {}
```

**Using in Feature:**
```ts
// libs/server/features/auth/src/lib/application/verify-totp.usecase.ts
@Injectable()
export class VerifyTotpUseCase {
  constructor(@Inject(TOTP_PORT) private readonly totp: TotpPort) {}
  async execute(dto: { userId: string; token: string }) { /* ... */ }
}
```

**Composition in App (no feature→infra import):**
```ts
// apps/api/src/app.module.ts
@Module({
  imports: [TotpInfraModule, AuthModule /* ... */],
})
export class AppModule {}
```

---

## Barrel examples

```ts
// libs/server/contracts-auth/src/index.ts
export * from './lib/ports/token.port';
export * from './lib/ports/user-repo.port';
export * from './lib/ports/session-repo.port';
export * from './lib/ports/refresh-token-repo.port';
export * from './lib/ports/webauthn.port';
export * from './lib/ports/totp.port';
export * from './lib/ports/email-sender.port';
export * from './lib/ports/audit.port';
export * from './lib/ports/ratelimit.port';
export * from './lib/ports/crypto.port';
```

```ts
// libs/server/infrastructure/src/index.ts
export * from './lib/email/email.nodemailer.adapter';
export * from './lib/email/email.module';
export * from './lib/cache/redis.client';
export * from './lib/cache/ratelimit.redis.adapter';
export * from './lib/audit/audit.pino.adapter';
export * from './lib/webauthn/webauthn.simplewebauthn.adapter';
export * from './lib/totp/totp.otplib.adapter';
export * from './lib/crypto/crypto.aesgcm.service';
```

```ts
// libs/server/data-access/src/index.ts
export * from './lib/prisma.service';
export * from './lib/repositories/user.repository';
export * from './lib/repositories/session.repository';
export * from './lib/repositories/refresh-token.repository';
export * from './lib/repositories/email-verification.repository';
export * from './lib/repositories/password-reset.repository';
export * from './lib/repositories/recovery-code.repository';
export * from './lib/repositories/passkey.repository';
export * from './lib/repositories/totp.repository';
```

---

This layout is **cycle-safe** by design and still keeps the overhead low for a solo developer. If you want, I can also generate the corresponding `project.json` and skeleton `index.ts` barrels for each library to compile immediately.
