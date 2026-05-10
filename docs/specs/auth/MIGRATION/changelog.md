# Changelog

## 2025-09-01
- Consolidated scattered specs into a single structure.
- Unified auth model to cookies (AT/RT) + rotation; removed Bearer for web flows.
- Added strong auth: **Passkeys (WebAuthn)** and **TOTP**; **Email OTP** fallback; **no SMS**.
- Added flexible reset with recovery codes.
- Added CSRF, rate-limit guidance, and audit schema.
- Separated **access log** and **application log**; clarified folder paths.
- Added API endpoint catalog and error codes.
- Added conceptual data schema and testing plans.
