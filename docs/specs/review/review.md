# Review & Rating API Requirements

## Functional Requirements

- Users can add reviews for salons only if they have a completed appointment for that salon.
- Reviews must include:
  - appointment_service_id
  - rating (integer, 1-5)
  - review text (empty string allowed)
- The system must validate:
  - User is eligible (has completed appointment)
  - Rating is between 1 and 5
  - Review text is could be empty (only rating will work too)
- Anyone can view reviews for a salon, sorted by newest first.
- The system must provide endpoints to:
  - Add a review
  - Get all reviews for a salon
  - Get average rating and review count for a salon
- Average rating and review count must be aggregated from the database (PostgreSQL/MongoDB), not from demo/in-memory data.
- All error conditions (invalid input, ineligible user, etc.) must return appropriate error messages and codes.

## API Parameters

### Add Review

| Parameter | Type   | Description                       |
| --------- | ------ | --------------------------------- |
| salon_id  | string | ID of the salon being reviewed    |
| user_id   | string | ID of the user posting the review |
| rating    | number | Rating (integer, 1-5)             |
| review    | string | Review text (required, non-empty) |

### Get Reviews

| Parameter | Type   | Description                          |
| --------- | ------ | ------------------------------------ |
| salon_id  | string | ID of the salon to fetch reviews for |

### Get Average Rating

| Parameter | Type   | Description                                 |
| --------- | ------ | ------------------------------------------- |
| salon_id  | string | ID of the salon to get average rating/count |

## Notes

- All review and rating logic must use production databases (PostgreSQL/MongoDB).
- Interfaces must be in the `models` folder, one per file.
- Demo data is only allowed in tests/mocks.
