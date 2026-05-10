# Beauty SaaS

## Staff Leave Management Feature

### Leave Management Backend

- Staff leave/profile requests are managed via `/api/staff-requests` endpoints.
- Endpoints:
  - `POST /api/staff-requests/leave` — Create a leave request
  - `GET /api/staff-requests/staff/:staffId` — Get requests for a staff member
  - `GET /api/staff-requests/pending` — List all pending requests
- See `src/controllers/salon-staff-request.controller.ts` and `src/services/salon-staff-request.service.ts` for logic.

## Staff Management (2025-04)

### Staff Management Backend

- Staff are managed via `/salons/:salonId/staff` endpoints.
- Endpoints:
  - `POST /salons/:salonId/staff` — Add staff (defaults to inactive)
  - `POST /salons/:salonId/staff/:staffId/activate` — Activate staff
  - `POST /salons/:salonId/staff/:staffId/deactivate` — Deactivate staff
  - `DELETE /salons/:salonId/staff/:staffId` — Remove staff (soft delete)
- Only owners/admins can add, activate, deactivate, or remove staff.
- See `src/controllers/salon.controller.ts` and `src/services/salon.service.ts` for logic.

### Frontend

- Use the leave request form and request list in the salon profile page.
- Components:
  - `staff-request-form.component.ts/html` — Submit leave requests
  - `staff-request-list.component.ts/html` — View request status
- Service: `staff-request.service.ts` handles API calls.
- Integrated in `salon-profile.component.ts/html`.
- Staff management UI uses the above endpoints for all actions.
- Components:
  - `staff-management.component.ts/html` — Add, activate, deactivate, or remove staff
- Service: `staff.service.ts` handles API calls.

### Testing

- Backend tests: `src/__tests__/salon-staff-request.controller.test.ts` covers API endpoints.
- Backend tests: `src/__tests__/salon/staff-management.service.test.ts` covers API endpoints and service logic.

### Developer Notes

- Make sure to import `CommonModule` and `ReactiveFormsModule` for Angular standalone components.
- All naming conventions follow project rules: camelCase for TypeScript, snake_case for DB columns.
