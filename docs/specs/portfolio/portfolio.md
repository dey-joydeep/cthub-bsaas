# Portfolio API Requirements

## Functional Requirements

- Users (staff or salon owners) can create, update, and view portfolio items for their salon.
- Portfolio items must include:
  - id
  - tenant_id (salon or business id)
  - user_id (creator)
  - description (required, non-empty)
  - image (stored as URL or buffer, required)
- The system must validate:
  - Description is provided and not empty
  - Image is provided
  - Tenant and user exist
- Endpoints must support:
  - Creating a portfolio item
  - Updating a portfolio item
  - Viewing all portfolio items for a salon
  - Viewing a single portfolio item by id
- All portfolio logic must use PostgreSQL/MongoDB (no in-memory/demo data).

## API Parameters

### Create Portfolio Item

| Parameter    | Type   | Description                                  |
| ------------ | ------ | -------------------------------------------- |
| tenant_id    | string | Salon or business ID                         |
| user_id      | string | User creating the item                       |
| description  | string | Description (required, non-empty)            |
| image_buffer | Buffer | Image file (required, buffer or file upload) |

### Update Portfolio Item

| Parameter   | Type   | Description                               |
| ----------- | ------ | ----------------------------------------- |
| id          | string | ID of the portfolio item                  |
| description | string | Updated description (required, non-empty) |

## Notes

- All portfolio logic must use production databases (PostgreSQL/MongoDB).
- Interfaces must be in the `models` folder, one per file.
- Demo data is only allowed in tests/mocks.
