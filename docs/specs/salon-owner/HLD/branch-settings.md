# Branch Settings HLD

## Purpose

Branch Settings models each salon location and its operational calendar, service availability, and branch-level policies.

## Architecture Scope

- Owns the `Branch` aggregate, weekly hours, holiday overrides, and branch policy overrides.
- Supplies branch scope to staff assignments, appointment booking, POS, inventory stock, and dashboard reporting.
- Enforces that every branch belongs to exactly one salon business.

## Dependencies

- Business Settings provides tenant defaults.
- Staff uses branches for assignment and roster planning.
- Appointment uses branch hours, holidays, and booking policy.
- Inventory uses branch stock locations.

## Data Ownership

- Branch profile stores address, contact details, status, timezone override, and default tax display settings.
- Weekly schedule and holiday overrides are branch-owned.
- Historical appointment and invoice records store branch snapshots where legal or reporting integrity requires immutability.

## Integration Points

- API operations are listed in [API endpoint map](../API/endpoint-map.md#branch-settings).
- Detailed commands and transactions are defined in [Branch Settings LLD](../LLD/branch-settings.md).
- Screen behavior is defined in [Branch Settings Web LLD](../WEB/branch-settings.md).
- Validation rules are defined in [Branch Settings Validation](../VALIDATION/branch-settings-validation.md).

## Events

- `BranchCreated`
- `BranchProfileUpdated`
- `BranchHoursUpdated`
- `BranchHolidayUpdated`
- `BranchStatusChanged`

## Security And Consistency

- Branch mutations require owner, business admin, or branch manager permission within the same business.
- A branch cannot be archived while it has future confirmed appointments unless those appointments are moved or cancelled.
- Branch hours changes trigger availability recalculation for future appointment search.
