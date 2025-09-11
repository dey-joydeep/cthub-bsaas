# Admin MFA Enroll — HLD
    **Surface:** Settings/Security

Enroll Passkey or TOTP; issue recovery codes (show once).

    ## Endpoints & Contracts
    **TOTP**:
- `POST /auth/mfa/totp/enroll` → 200/401/429/500
Response:
```json
{ "success":true, "data":{ "qrCodeDataUrl":"data:image/png;base64,...","issuer":"CTHub","label":"user@example.com" } }
```
- `POST /auth/mfa/totp/confirm` → 200/400/401/422/429/500
Request:
```json
{ "code":"123456" }
```
Response:
```json
{ "success":true, "data":{ "enrolled":true } }
```

**Passkey (WebAuthn)**:
- `POST /auth/mfa/webauthn/attestation/options` → 200/401/429/500
- `POST /auth/mfa/webauthn/attestation/result` → 200/400/401/422/429/500

**Recovery Codes**:
- `POST /auth/recovery-codes/issue` → 201/401/429/500
- `GET /auth/recovery-codes` → 200/401/500
- `POST /auth/recovery-codes/verify` → 200/401/422/429/500

## Cookies/Headers Effects
- After enroll: set flag; prompt to store recovery codes.
