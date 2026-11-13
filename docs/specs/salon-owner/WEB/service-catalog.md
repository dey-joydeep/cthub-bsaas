# Service Catalog Web LLD

## Route And Screen

- Route: `/business/services`
- Primary screens: category list, service catalog list, service create/edit, branch availability, pricing.
- Wireframes: [Service Catalog Wireframes](../WIREFRAMES/service-catalog.md).

## User Goals

- Owner creates categories and services.
- Owner or manager controls branch availability and pricing.
- Staff uses active services for appointments and POS.

## Components

- `ServiceCatalogPage`
- `ServiceCategoryList`
- `ServiceForm`
- `ServicePricingPanel`
- `ServiceBranchAvailabilityPanel`
- `ArchiveServiceDialog`

## State And Data

- Catalog loads categories and services together for grouped rendering.
- Service form stores price as display string and submits decimal string.
- Branch availability changes remain draft until saved.

## Controls And Validation

- Exact control behavior is defined in [Service Catalog Validation](../VALIDATION/service-catalog-validation.md).
- Duration control uses minute stepper values accepted by the API.
- Archive dialog displays future appointment blockers returned by the backend.

## Error Handling

- Duplicate service name errors attach to service name and category selector.
- Price errors preserve user input and show the normalized expected format.
- Archive blockers include affected future appointment count.

## Accessibility

- Category and service lists expose active/archived status.
- Price and duration controls have accessible unit labels.
