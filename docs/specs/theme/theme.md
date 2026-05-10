# Theme API Requirements

## Functional Requirements

- Tenants (businesses/salons) can customize their theme colors.
- Theme records must include:
  - id
  - tenant id
  - primary_color (hex)
  - secondary_color (hex)
  - accent_color (hex)
  - name (optional, for theme preset)
- The system must validate:
  - Colors are valid hex codes
  - Tenant exists
- Endpoints must support:
  - Getting a theme by tenant id
  - Updating a theme
  - Listing all themes (for admin or preset selection)
- All theme logic must use PostgreSQL/MongoDB (no in-memory/demo data).

## API Parameters

### Update Theme

| Parameter       | Type   | Description                     |
| --------------- | ------ | ------------------------------- |
| tenant_id       | string | Tenant/business/salon to update |
| primary_color   | string | New primary color (hex)         |
| secondary_color | string | New secondary color (hex)       |
| accent_color    | string | New accent color (hex)          |

## Notes

- All theme logic must use production databases (PostgreSQL/MongoDB).
- Interfaces must be in the `models` folder, one per file.
- Demo data is only allowed in tests/mocks.
