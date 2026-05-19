# Service Catalog LLD

## Backend Components

Visual flow reference:

- [Service Catalog Pricing And Availability Draw.io](../DIAGRAMS/drawio/service-catalog-pricing-availability-flow.drawio)

- `ServiceCatalogController`
- `ServiceCatalogService`
- `ServiceRepositoryPort`
- `ServiceCategoryRepositoryPort`
- `ServicePricingRepositoryPort`
- `AppointmentConflictPort`

## Commands And Queries

- `ListServiceCategoriesQuery`
- `CreateServiceCategoryCommand`
- `UpdateServiceCategoryCommand`
- `ListServicesQuery`
- `CreateServiceCommand`
- `UpdateServiceCommand`
- `UpdateServiceBranchAvailabilityCommand`
- `ArchiveServiceCommand`

## Transaction Rules

- Service writes persist category linkage, branch availability, price record, and audit entry together.
- Price changes create a new effective price record.
- Archive checks future confirmed appointments before status update.

## Validation Mapping

- DTO validation maps to [Service Catalog Validation](../VALIDATION/service-catalog-validation.md).
- Service validation verifies category ownership, positive duration, positive price, branch scope, unique display name per category, and archive blockers.

## Error Mapping

- `SERVICE_NOT_FOUND` returns `404`.
- `SERVICE_CATEGORY_NOT_FOUND` returns `404`.
- `SERVICE_NAME_DUPLICATE` returns `409`.
- `SERVICE_HAS_FUTURE_APPOINTMENTS` returns `409`.
- `SERVICE_VALIDATION_FAILED` returns `400`.

## Implementation Notes

- Appointments and invoices store service snapshots.
- Price uses decimal string DTOs and fixed decimal server math.
- Service status controls booking and POS selection without deleting history.
