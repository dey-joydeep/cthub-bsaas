# Salon Staff & Leave Management Requirements

## Overview

This document outlines the requirements and implementation details for all salon staff management features in Beauty SaaS, including leave management, staff CRUD, staff-service association, and related business rules.

## Features

- Staff CRUD (register, update, delete staff; owner can also be staff)
- Staff-service association (many-to-many)
- Staff leave request submission and approval workflow
- Staff profile management (see user.md for details)
- Owner/admin approval or rejection of staff and requests
- Staff can view their leave request status and assigned services

## API Endpoints

- `POST /salons/:salonId/staff` — Add a staff member (inactive by default; owner/admin only)
- `POST /salons/:salonId/staff/:staffId/activate` — Activate staff (owner/admin only)
- `POST /salons/:salonId/staff/:staffId/deactivate` — Deactivate staff (owner/admin only)
- `DELETE /salons/:salonId/staff/:staffId` — Remove staff (soft delete; owner/admin only)
- `GET /salons/:salonId/staff` — List staff for a salon (excludes deleted)
- `POST /api/staff-service` — Associate staff with services
- `GET /api/staff/:staffId/services` — List services assigned to staff
- `POST /api/staff-requests/leave` — Staff creates a leave request
- `POST /api/staff-requests/approve` — Owner/admin approves a leave request
- `POST /api/staff-requests/reject` — Owner/admin rejects a leave request
- `GET /api/staff-requests/staff/:staffId` — List all requests for a staff member
- `GET /api/staff-requests/pending` — List all pending leave requests

## Backend Implementation

- Uses Express controllers: `salon.controller.ts`, `salon-staff-request.controller.ts`
- Business logic in: `salon.service.ts`, `salon-staff-request.service.ts`
- Database: Prisma models with camelCase fields (mapped to snake_case DB columns)
- Only authenticated staff can submit requests; only authorized owners/admins can add, activate, deactivate, or remove staff
- All staff-service associations and leave requests are auditable

## Frontend Implementation

- Angular standalone components:
  - `staff-request-form.component.ts/html`: Leave request form
  - `staff-request-list.component.ts/html`: List and status of requests
  - `staff-list.component.ts/html`: List and manage staff
  - Integrated in `salon-profile.component.ts/html`
- Service: `staff-request.service.ts` and `staff.service.ts` handle API calls
- Uses Angular Reactive Forms and CommonModule

## Business Rules

- Staff can only request leave for themselves
- Owners/admins can only approve/reject requests for their own salon
- Staff-service relationships are many-to-many and must be validated
- Leave requests have statuses: `pending`, `approved`, `rejected`
- Only owners/admins can CRUD staff for their salon (see endpoints above for actual logic)
- All actions are logged for audit

## Testing

- Backend: Automated tests in `src/__tests__/salon-staff-request.controller.test.ts`, `src/__tests__/staff.controller.test.ts`
- Frontend: Component and service tests (see Angular test files)

## Developer Notes

- Follow naming conventions: camelCase in TypeScript, snake_case in DB (see project memory)
- Import all required Angular modules for standalone components
- Update documentation and requirements as features evolve
- See also: [user.md](./user.md) for user and staff profile requirements

---

_Last updated: 2025-04-22_
