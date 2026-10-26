# Account And Profile Validation And Controls

**Date:** 2026-05-18
**Status:** Current planning baseline

## Forms

| Form ID                                   | Submit operation                   |
| ----------------------------------------- | ---------------------------------- |
| `account.profile.form`                    | `updateMyProfile`                  |
| `account.preferences.communication.form`  | `updateMyCommunicationPreferences` |
| `account.connectedAccounts.unlink.dialog` | `unlinkMyConnectedAccount`         |
| `account.privacy.request.form`            | `createMyPrivacyRequest`           |

## Field Rules

| Field                | Rule                                                                            | Error key                                                 |
| -------------------- | ------------------------------------------------------------------------------- | --------------------------------------------------------- |
| `displayName`        | 1 to 120 characters, normalized whitespace, no control characters.              | `account_profile.validation.display_name_invalid`         |
| `phone`              | E.164 preferred when verified, country-aware input allowed before verification. | `account_profile.validation.phone_invalid`                |
| `locale`             | Must be configured supported locale.                                            | `account_profile.validation.locale_unsupported`           |
| `timezone`           | Must be supported IANA timezone.                                                | `account_profile.validation.timezone_invalid`             |
| `marketingOptIn`     | Boolean, cannot disable transactional messages.                                 | `account_profile.validation.marketing_preference_invalid` |
| `privacyRequestType` | `export` or `delete`; duplicate pending request returns conflict.               | `account_profile.validation.privacy_request_type_invalid` |

## Control Rules

- Staff operational fields are readonly in self profile.
- Security operations may require recent authentication.
- Unlink button is disabled or rejected when provider is the last usable sign-in method.
- Delete request requires explicit confirmation.

## Backend Enforcement

Backend DTO and service validation is authoritative. Frontend validation must mirror field constraints and display server error keys.
