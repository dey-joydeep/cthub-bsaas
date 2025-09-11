# Partner Email Change — LLD

    ## Components & Layout
    - EmailChangeRequestForm
- EmailChangeConfirmForm

    ## Fields & Validation
    - newEmail (unique)
- otp 6 digits

    ## i18n keys (en/bn/hi)
    - `settings.partner.emailChange.title`
- `settings.shared.emailChange.sent`
- `settings.shared.emailChange.completed`

    ## Accessibility & Mobile
    - Live countdown
- Generic messages to avoid enumeration

## Test Notes
- Integration: already-used email (409 from API layer if applicable); E2E: complete change.


    ## Reusable components (Angular placements)

- `EmailChangeApiService` — `libs/web/core/auth/src/lib/services/email-change-api.service.ts`
- `EmailChangeRequestForm` / `EmailChangeConfirmForm` — `libs/web/ui/security/email-change/*`
