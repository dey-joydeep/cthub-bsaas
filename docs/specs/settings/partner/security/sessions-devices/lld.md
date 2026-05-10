# Partner Sessions & Devices — LLD

    ## Components & Layout
    - SessionsTable
- RevokeDeviceDialog

    ## Fields & Validation
    - deviceId, ua, ip (masked), lastSeen, current

    ## i18n keys (en/bn/hi)
    - `settings.partner.sessions.title`
- `settings.shared.devices.revoked`
- `settings.shared.devices.logoutOthers`

    ## Accessibility & Mobile
    - Row actions keyboard operable
- Announce revoke result via live region

## Test Notes
- Integration: revoke own vs other device (404/401); E2E: logout-others removes other sessions.


    ## Reusable components (Angular placements)

- `DevicesApiService` — `libs/web/core/auth/src/lib/services/devices-api.service.ts`
- `SessionsTable` — `libs/web/ui/security/sessions/sessions-table.component.ts`
- `RevokeDeviceDialog` — `libs/web/ui/security/sessions/revoke-device-dialog.component.ts`
