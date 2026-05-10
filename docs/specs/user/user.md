# User API Requirements

## Functional Requirements

- Users can register, log in, update their profile, and be deleted.
- Users must include:
  - id
  - email
  - name
  - role (customer, business, admin, etc.)
  - tenant_id (business/salon association)
  - is_verified
  - is_active
- The system must validate:
  - Email is unique and valid
  - Password meets security requirements (if applicable)
  - Role is valid
- Endpoints must support:
  - Creating a user
  - Updating user profile
  - Retrieving user(s) by id or filter
  - Deleting a user
  - Getting user stats (counts by role, activity, etc.)
- All user logic must use PostgreSQL/MongoDB (no in-memory/demo data).

## API Parameters

### Create User

| Parameter | Type   | Description                                 |
| --------- | ------ | ------------------------------------------- |
| email     | string | User's email (must be unique)               |
| name      | string | User's name                                 |
| role      | string | User role (customer, business, admin, etc.) |
| tenant_id | string | Associated business/salon                   |

### Get User Stats

| Parameter | Type   | Description                        |
| --------- | ------ | ---------------------------------- |
| tenant_id | string | Business/salon id to get stats for |

## Notes

- All user logic must use production databases (PostgreSQL/MongoDB).
- Interfaces must be in the `models` folder, one per file.
- Demo data is only allowed in tests/mocks.
