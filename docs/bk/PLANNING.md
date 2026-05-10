# Beauty SaaS Development Planning

## 1. Requirements Overview

### Salon Owner

- Register, update, delete salon
- Register, update, delete services
- Register, update, delete products
- Register, update, delete staff (owner can also be staff)
- Staff-service association (many-to-many)
- Appointment management (view appointments)
- Reply to reviews
- Highlight new services/products
- Announce vacancies
- Approve services/products
- Approve staff leaves
- Assign time to services
- Portfolio CRUD (add, update, delete)

### Staff

- View appointments
- View reviews
- Apply for leaves
- Request new services/products
- Set nickname, change profile picture, password, contact info (with approval)

### Customer

- View appointments, reviews
- Reply to reviews
- Appointment salon/services/products/staff/time
- Confirm, cancel, reschedule appointment
- Rate/review staff
- Rate/review salon (shop) they have bought the service from

### Review & Rating Logic

- Customers who have completed a appointment can rate and review both the salon (shop) and the staff they received the service from.
- System must validate that only eligible users (with completed appointments) can leave reviews/ratings.
- Reviews and ratings are stored in the production database (PostgreSQL and/or MongoDB).
- Salon and staff listings/search endpoints must return average rating and review count for each entity.
- No demo or in-memory data for reviews/ratings in production code (only in tests/mocks).

### Appointment Logic

- Slot availability based on service time
- Multi-service appointment: slot = sum of service times

### Home Page (User Facing)

- The home page is the landing page for end users (customers/guests).
- Displays the top 5 salons based on user location and ratings.
- If geolocation is enabled, only salons within a 2 km radius (±0.5 km) are shown, ranked by average rating and review count.
- If geolocation is not enabled, the top 5 salons globally are shown.
- This logic is implemented in the backend and triggered by the frontend home page.

### Dashboard (Business Owner/SaaS)

- The dashboard is for salon owners and business users.
- Shows business summaries, statistics, and management widgets (e.g., revenue, subscriptions, staff, products).
- Does NOT display the top salons for end users.

### Authentication & Authorization

- Role-based authentication and authorization is required for all backend features.
- Roles include at least: Customer, Staff, Salon Owner, Admin.
- Access to CRUD and management endpoints must be restricted based on user role.
- Only authorized users can perform actions (e.g., only salon owners can approve staff, only customers can leave reviews for appointments they completed, etc).
- Secure endpoints and follow best practices for session/token management.

### Salon Search & Listing (UPDATED)

- Users can search salons by any field: name, city, address, zip code, services (partial/case-insensitive match)
- Search query is applied immediately in a single DB query
- Pagination: default 10, user-selectable 15, 20, 25, 30 (max 30)
- Filters:
  - service: filter salons by specific service keyword
  - min_rating: only salons with average rating >= min_rating
  - max_rating: only salons with average rating <= max_rating
- Results sorted by average rating (desc), then name (asc)
- All logic uses PostgreSQL/MongoDB only (no demo/in-memory data in production)

### Review & Rating Logic (UPDATED)

- Only users with completed appointments can leave reviews/ratings for salons or staff
- Reviews must have: salon_id, user_id, rating (1-5), review text (required)
- Average rating and review count are aggregated from the DB
- Review endpoints: add, list, get average/count
- All validation and error handling as per requirements docs

### Appointment Logic (UPDATED)

- Appointments require: salonId, userId, serviceId(s), status, appointment time/date
- All appointment logic uses production DBs
- Only COMPLETED appointments make user eligible to review
- Endpoints: create, update, delete/cancel, view by user/salon/status

### Portfolio, User, Social, Theme, Auth (UPDATED)

- All requirements, validation, and endpoint expectations are now formalized per module in requirements MDs
- All modules use PostgreSQL/MongoDB only, interfaces in models folder, demo data only in tests/mocks

## Backend RBAC Enforcement

- All sensitive mutation endpoints (e.g., staff/service approval, portfolio management) are protected using the `requireRole(['owner', 'admin'])` middleware.
- Read-only endpoints remain public.
- See `src/middleware/requireRole.ts` for implementation details.

---

## 2. Task Breakdown & User Stories

### Epic: Salon Management

- **US1:** As a salon owner, I want to register my salon so I can appear on the platform
- **US2:** As a salon owner, I want to update/delete my salon details
- **US3:** As a salon owner, I want to manage services/products/staff (CRUD)
- **US4:** As a salon owner, I want to approve new services/products/staff leaves
- **US5:** As a salon owner, I want to assign service times and manage appointments
- **US6:** As a salon owner, I want to highlight new services/products and announce vacancies
- **US7:** As a salon owner, I want to manage my portfolio

### Epic: Staff Experience

- **US8:** As staff, I want to view my appointments and reviews
- **US9:** As staff, I want to apply for leaves and request new services/products
- **US10:** As staff, I want to update my profile, nickname, and contact info

### Epic: Customer Experience

- **US11:** As a customer, I want to appointment services/products/staff/time
- **US12:** As a customer, I want to manage my appointments (cancel/reschedule)
- **US13:** As a customer, I want to rate and review staff and salons

### Epic: Appointment Engine

- **US14:** As a user, I want available slots calculated based on service times
- **US15:** As a user, I want multi-service appointments to sum service times for slot calculation

---

## 3. Acceptance Criteria (Sample)

- **US1:** Owner can register via portal after contact approval; registration form validates required fields; owner receives confirmation email
- **US3:** CRUD endpoints for services/products/staff exist and are covered by tests
- **US5:** Appointment calendar reflects real-time availability; cannot double-appointment a staff or slot
- **US7:** Portfolio CRUD is available and covered by comprehensive API and controller tests
- **US11:** Customer can select service(s), product(s), staff, and time, and confirm appointment; receives confirmation
- **US13:** Customer can leave a review/rating for both staff and salon only if they have completed a appointment; reviews/ratings are visible in listings and profiles

---

## 4. Technical/Architecture Notes

- Use monorepo with npm workspaces for backend/frontend
- Shared dev dependencies at root, project-specific in each workspace
- Linting, formatting, and testing scripts at root and per workspace
- Professional-level API and controller tests for all modules (see portfolio module as example)
- Use CI/CD (e.g., GitHub Actions) to run lint, test, and build on PRs
- Use Husky + lint-staged for pre-commit hooks

---

## 5. Task Tracking Table

| Epic                | User Story | Task/Feature                              | Status   | Owner | Sprint |
| ------------------- | ---------- | ----------------------------------------- | -------- | ----- | ------ |
| Salon Management    | US1        | Owner registration via portal             | Planned  |       |        |
| Salon Management    | US2        | Update/delete salon                       | Planned  |       |        |
| Salon Management    | US3        | CRUD for services/products/staff          | Planned  |       |        |
| Salon Management    | US4        | Approval flows (services/products/leaves) | Planned  |       |        |
| Salon Management    | US5        | Appointment calendar & logic              | Planned  |       |        |
| Salon Management    | US6        | Highlight/announce features               | Planned  |       |        |
| Salon Management    | US7        | Portfolio CRUD                            | Complete |       |        |
| Staff Experience    | US8        | Staff appointments/reviews                    | Planned  |       |        |
| Staff Experience    | US9        | Staff leave/service/product requests      | Planned  |       |        |
| Staff Experience    | US10       | Staff profile/nickname/contact mgmt       | Planned  |       |        |
| Customer Experience | US11       | Customer appointment flow                     | Planned  |       |        |
| Customer Experience | US12       | Appointment management (cancel/reschedule)| Planned  |       |        |
| Customer Experience | US13       | Rate/review staff and salons              | Planned  |       |        |
| Appointment Engine  | US14       | Slot calculation logic                    | Planned  |       |        |
| Appointment Engine  | US15       | Multi-service slot calculation            | Planned  |       |        |

---

## 6. Next Steps

- Review and prioritize tasks for upcoming sprint
- Assign owners and estimate timelines
- Begin implementation for top-priority user stories
- Continuously update this planning doc as features are delivered

---

_This file is auto-generated from your specs. Update as needed to track progress and communicate with your team._
