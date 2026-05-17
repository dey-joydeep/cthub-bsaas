# Business Settings Web LLD

## Route And Screen

- Route: `/owner/settings/business`
- Primary screen: Business profile and policy settings.
- Secondary panels: registration, tax, currency, timezone, operational defaults, audit history.
- Wireframes: [Business Settings Wireframes](../WIREFRAMES/business-settings.md).

## User Goals

- Owner edits salon business profile and legal identifiers.
- Owner defines default policies reused by branches.
- Owner reviews who changed sensitive settings.

## Components

- `BusinessSettingsPage`
- `BusinessProfileForm`
- `BusinessPolicyForm`
- `BusinessAuditTimeline`
- `UnsavedChangesDialog`

## State And Data

- Initial data loads from `getBusinessSettings`.
- Save actions use independent commands for profile and policy sections.
- Dirty state is tracked per section so one failed save does not block unrelated clean sections.

## Controls And Validation

- Exact control behavior is defined in [Business Settings Validation](../VALIDATION/business-settings-validation.md).
- Currency and timezone controls are server-backed option sets.
- Legal fields are disabled when business status disallows self-edit.

## Error Handling

- Field errors bind to returned message keys.
- Conflict errors show an inline section banner and preserve unsaved values.
- Authorization errors route to the owner access-denied screen.

## Accessibility

- Each form section has a visible heading and programmatic landmark.
- Audit timeline entries expose actor, timestamp, and changed field labels.
