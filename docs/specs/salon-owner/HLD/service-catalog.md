# Service Catalog HLD

## Purpose

Service Catalog defines sellable salon services, categories, durations, pricing, tax behavior, and staff eligibility.

## Architecture Scope

- Owns service categories, service definitions, branch availability, price history, and status.
- Feeds appointment booking, staff skill assignment, POS line items, and dashboard analytics.
- Maintains historical pricing integrity through snapshots.

## Dependencies

- Business Settings supplies tax and currency defaults.
- Branch Settings supplies branch availability scope.
- Staff uses service IDs for skill mapping.
- POS uses active service prices and tax configuration.

## Data Ownership

- `Service` belongs to one business.
- Branch-specific availability and pricing are explicit overrides.
- Invoice and appointment records store selected service name, duration, price, tax, and currency snapshot.

## Integration Points

- API operations are listed in [API endpoint map](../API/endpoint-map.md#service-catalog).
- Detailed commands and transactions are defined in [Service Catalog LLD](../LLD/service-catalog.md).
- Screen behavior is defined in [Service Catalog Web LLD](../WEB/service-catalog.md).
- Validation rules are defined in [Service Catalog Validation](../VALIDATION/service-catalog-validation.md).

## Events

- `ServiceCategoryCreated`
- `ServiceCreated`
- `ServiceUpdated`
- `ServicePriceChanged`
- `ServiceStatusChanged`

## Security And Consistency

- Services used by future appointments cannot be deleted; they can be archived.
- Price changes apply to new bookings and POS bills; existing confirmed appointment pricing remains governed by booking policy.
- Service duration changes trigger future availability recalculation.
