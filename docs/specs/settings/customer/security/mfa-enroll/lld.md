# Customer MFA Enroll — LLD

    ## Components & Layout
    - MfaEnrollWizard
- PasskeyEnrollPanel
- TotpEnrollPanel
- RecoveryCodesPanel

    ## Fields & Validation
    - passkey attestation; totp QR + 2 codes confirm; recovery codes show-once

    ## i18n keys (en/bn/hi)
    - `settings.customer.mfa.title`
- `settings.shared.mfa.totp.confirmed`
- `settings.shared.recovery.issued`

    ## Accessibility & Mobile
    - QR alt text; input labels; copy/download buttons accessible

## Test Notes
- E2E: passkey enroll; TOTP enroll; recovery codes downloaded.


    ## Reusable components (Angular placements)

- `MfaEnrollWizard` — `libs/web/ui/security/mfa-enroll/mfa-enroll-wizard.component.ts`
- `TotpEnrollPanel` — `libs/web/ui/security/mfa-enroll/totp-enroll-panel.component.ts`
- `PasskeyEnrollPanel` — `libs/web/ui/security/mfa-enroll/passkey-enroll-panel.component.ts`
- `RecoveryCodesPanel` — `libs/web/ui/security/mfa-enroll/recovery-codes-panel.component.ts`
- Services: `MfaService`, `RecoveryCodesApiService`
