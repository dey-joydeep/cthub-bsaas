# Social API Requirements

## Functional Requirements

- Users can link and manage social accounts (e.g., Instagram, Facebook, etc.).
- Social account records must include:
  - id
  - user_id
  - platform (e.g., 'instagram', 'facebook')
  - handle (e.g., '@username')
  - url
- The system must validate:
  - Platform is supported
  - Handle and URL are provided
  - User exists
- Endpoints must support:
  - Adding a social account
  - Removing a social account
  - Listing all social accounts for a user
- All social logic must use PostgreSQL/MongoDB (no in-memory/demo data).

## API Parameters

### Add Social Account

| Parameter | Type   | Description                         |
| --------- | ------ | ----------------------------------- |
| user_id   | string | User to link the social account to  |
| platform  | string | Social platform (e.g., 'instagram') |
| handle    | string | Social handle (e.g., '@username')   |
| url       | string | Full URL to the social profile      |

## Notes

- All social logic must use production databases (PostgreSQL/MongoDB).
- Interfaces must be in the `models` folder, one per file.
- Demo data is only allowed in tests/mocks.
