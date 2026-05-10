# Registration Behaviors (WEB)
**Updated:** 2025-09-11

This note captures behaviors implied by registration requirements and DB flows so that FE/QA align without guesswork.

## Timers & Cooldowns
- Maintain session and OTP countdowns; hydrate from headers or server responses.
- Respect `Retry-After` strictly.

## Idempotency
- Re-requests should land in generic success states; do not alarm the user; avoid duplicate toasts.

## Partner Token States
- Invalid / expired / consumed tokens get separate neutral UIs with recovery CTAs; never reveal enumeration clues.

## Social During Registration
- Prefill verified email; prompt for OTP if not verified; handle cancel/error callbacks.

## Telemetry
- Use events documented in telemetry catalog; avoid PII.
