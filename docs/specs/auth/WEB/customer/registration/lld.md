# Customer — Registration — LLD

**Updated:** 2025-09-11

## Reference

This LLD implements the architecture defined in **/customer/registration/hld.md**. Any design drift found during implementation must be reflected back in the HLD.

## Components

- **Route component** `/customer/auth/registration` (standalone; OnPush where possible)
- **Form/component(s)**: inputs, validators, submit/secondary actions
- **Services**: `AuthHttpService`, `TelemetryService`, `ToastService`

## Route & Navigation

- Standalone route `/customer/auth/registration`
- Guards as applicable; success redirect for each app

## Data Models / DTOs

```ts
export interface RegisterDto {
  email: string;
  password: string;
  name: string;
}
export interface EmailVerifyDto {
  token?: string;
  email?: string;
  otp?: string;
}
```

## Service Contracts (API)

- **POST** `/auth/register`
- **POST** `/auth/email/verify/request`
- **POST** `/auth/email/verify/confirm`
- **GET** `/auth/oauth/:provider/start`
- **GET** `/auth/oauth/:provider/callback`

## Workflows

- Success path(s)
- Invalid input → inline field errors; focus first invalid
- Rate‑limited (429) → disable submit; show cooldown; telemetry with code
- Network fail → toast; retry affordance

## Validation

- Email (if applicable): required, RFC 5322, max 254
- Password: relaxed client checks (min 8, letter+number+symbol); server authoritative
- OTP (if present): 6 digits

## Error Handling

- Map `code` → i18n key; generic fallback
- Display policy: inline for validation; toast/dialog for system errors

## Security

- No tokens in JS‑accessible storage
- XSRF header via interceptor when token present
- WebAuthn feature-detect in browser

## Patterns & Conventions

- Standalone components; feature‑first folders; strict templates
- Smart vs presentational components; keep HTTP in `AuthHttpService`
- Signals for ephemeral UI state; avoid global store on auth pages
- Naming: kebab‑case routes; PascalCase components

## Telemetry Integration

- Call `TelemetryService.track()` for events listed in HLD; avoid PII

## SSR / Hydration

- Guard any `window` access behind platform checks
- Initialize timers/counters only on client

## i18n

- Use i18n keys for labels, errors, toasts; load locale on app boot

## Accessibility (A11y)

- Inputs use `<label>` and `aria-describedby` for errors; live region `aria-live="polite"`
- Keyboard: tab order matches reading order; submit on Enter; Escape closes dialog
- Focus: first invalid control gets focus; focus trap in dialogs; visible focus rings
- Contrast AA; states not conveyed by color alone

## Tests

- **Unit**: validators; error mapper; service interactions
- **Integration**: guard and interceptor paths; cookie‑set flows (mocked)
- **E2E**: happy path; invalid; rate‑limited; network fail

## Validation

- Email (if applicable): required, RFC 5322, max 254
- Password: relaxed client checks (min 8, letter+number+symbol); server authoritative
- OTP (if present): 6 digits

## Error Handling

- Map `code` → i18n key; generic fallback
- Display policy: inline for validation; toast/dialog for system errors

## Security

- No tokens in JS‑accessible storage
- XSRF header via interceptor when token present
- WebAuthn feature-detect in browser

## Patterns & Conventions

- Standalone components; feature‑first folders; strict templates
- Smart vs presentational components; keep HTTP in `AuthHttpService`
- Signals for ephemeral UI state; avoid global store on auth pages
- Naming: kebab‑case routes; PascalCase components

## Telemetry Integration

- Call `TelemetryService.track()` for events listed in HLD; avoid PII

## SSR / Hydration

- Guard any `window` access behind platform checks
- Initialize timers/counters only on client

## i18n

- Use i18n keys for labels, errors, toasts; load locale on app boot

## Accessibility (A11y)

- Inputs use `<label>` and `aria-describedby` for errors; live region `aria-live="polite"`
- Keyboard: tab order matches reading order; submit on Enter; Escape closes dialog
- Focus: first invalid control gets focus; focus trap in dialogs; visible focus rings
- Contrast AA; states not conveyed by color alone

## Tests

- **Unit**: validators; error mapper; service interactions
- **Integration**: guard and interceptor paths; cookie‑set flows (mocked)
- **E2E**: happy path; invalid; rate‑limited; network fail

## Registration Behaviors

### Timer State & Resend

- Maintain `sessionSecondsRemaining` and `otpSecondsRemaining` signals; hydrate from server response headers (e.g., `Retry-After`) or from the start time.
- Resend button state machine: `idle → sending → cooldown → enabled`.
- On cooldown, render remaining seconds via `aria-live="polite"` (avoid chatty updates: once per second).

### OTP Input A11y

- Six input boxes with auto-advance; backspace merges; numeric keypad on mobile (`inputmode="numeric"`).
- Error announcement via live region; first invalid box receives focus.

### Telemetry (registration)

- `registration.session_started|expired` { method: "email|social" }
- `otp.sent|resend|verified|failed` { reason? }
- `social.prefill|missing_verified_email`
