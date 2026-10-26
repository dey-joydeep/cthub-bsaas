# Shared LLD Patterns

**Framework:** Angular 20 · Material v3 · Tailwind v4 · Nx 21 · Jest 29 / Playwright  
**Locales:** en/bn/hi

## Validation (client + server aligned)

- **email**: RFC 5322, ≤ 254 chars.
- **password**: 8..128; show strength meter; allow paste & show/hide; perform breach check on server (message key: `auth.shared.validation.password.breached`).
- **otp**: 6 digits; support paste; timer + cooldown + resend with backoff and daily cap.
- **fullName**: Unicode letters + single spaces only; **no hyphens/punctuation**; prevent two consecutive spaces (client); server **collapses** double spaces; error on disallowed chars.
- **consent** (Customer reg): required boolean.
- All forms: realtime + server-side validation; consistent error mapping.

## Accessibility

- Dialogs: focus trap; return focus to opener; ESC closes only when safe.
- Live regions for async states (OTP countdown, passkey prompts, success banners).
- Error summary after submit; link each error to field.
- Keyboard operable tab/arrow navigation (OTP cells, tabbed MFA).

## Mobile

- Single column; min 48px touch targets; sticky primary action; content safe-areas.

## i18n Namespaces

- Customer: `auth.customer.*`
- Partner: `auth.partner.*`
- Admin: `auth.admin.*`
- Settings: `settings.<category>.*`
- Shared: `auth.shared.*` (validation, common messages)

## Reusable Angular placements

- Core services: `libs/web/core/auth/src/lib/services/*`
- Validators: `libs/web/core/auth/src/lib/validators/*`
- UI components: `libs/web/ui/auth/**` (entry flows), `libs/web/ui/security/**` (settings)
- Interceptors: `libs/web/core/http/src/lib/interceptors/*`
